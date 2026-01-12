import { type FormEvent, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        try {
            setIsProcessing(true);

            // 1. Upload Original PDF
            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file]);
            if (!uploadedFile) throw new Error('Failed to upload file to Puter.io');

            // 2. Convert PDF to Image
            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            
            if (imageFile.error) throw new Error(`PDF Conversion failed: ${imageFile.error}`);
            if (!imageFile.file) throw new Error('PDF Conversion returned no file.');

            // 3. Upload Image
            setStatusText('Uploading the image...');
            const uploadedImage = await fs.upload([imageFile.file]);
            if (!uploadedImage) throw new Error('Failed to upload the converted image.');

            // 4. Prepare Data
            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: {} as any, 
            }
            // Save initial state to KV
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            // 5. AI Analysis
            setStatusText('Analyzing...');
            const feedback = await ai.feedback(
                uploadedImage.path,
                prepareInstructions({ jobTitle, jobDescription })
            )
            
            if (!feedback) throw new Error('AI Analysis failed to return a response.');

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            console.log("Raw AI Response:", feedbackText); // <--- CHECK THIS IN CONSOLE

            // ✅ SAFE PARSING: Handle cases where AI returns text instead of JSON
            try {
                // Remove markdown code blocks if AI added them (common issue)
                const cleanJson = feedbackText.replace(/```json/g, '').replace(/```/g, '').trim();
                data.feedback = JSON.parse(cleanJson);
            } catch (jsonError) {
                console.warn("AI did not return JSON. Falling back to raw text.");
                
                // Create a "fake" feedback object so the results page doesn't break
                data.feedback = {
                    summary: "The AI could not strictly follow the JSON format. Here is the raw response:",
                    strengths: ["See raw response below"],
                    weaknesses: ["See raw response below"],
                    score: 0,
                    rawResponse: feedbackText // We save the text here
                };
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Analysis complete, redirecting...');
            console.log("Final Data Saved:", data);
            navigate(`/resume/${uuid}`);

        } catch (error: any) {
            console.error("Detailed Error:", error);
            setStatusText(`Error: ${error.message || "Something went wrong"}`);
            // Optional: setIsProcessing(false) to let user retry
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if (!file) {
            alert("Please select a file first");
            return;
        }

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <h2 className="text-xl font-semibold text-center px-4">{statusText}</h2>
                            {!statusText.startsWith("Error") && (
                                <img src="/images/resume-scan.gif" className="w-full max-w-md rounded-lg" alt="Processing" />
                            )}
                            {statusText.startsWith("Error") && (
                                <button 
                                    onClick={() => setIsProcessing(false)} 
                                    className="primary-button mt-4"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" required />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" required />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" required />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader id="uploader" onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload