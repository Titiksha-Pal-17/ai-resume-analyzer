import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter';

// Importing our custom UI components to display the analysis
import ATS from '~/components/ATS';
import Details from '~/components/Details';
import Summary from '~/components/Summary';

// --- 1. Browser Tab Settings ---
export const meta = () => ([
    { title: 'Resume Analysis | Resume Analysis' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    // --- 2. Setup Tools & State ---
    // Get access to the database (kv), file system (fs), and auth info
    const { auth, isLoading, fs, kv } = usePuterStore();
    
    // Get the ID from the URL (e.g., if URL is /resume/123, id is "123")
    const { id } = useParams();
    const navigate = useNavigate();

    // "Memory" slots to store data once we fetch it
    const [imageUrl, setImageUrl] = useState('');      // Link to the image preview of the resume
    const [resumeUrl, setResumeUrl] = useState('');    // Link to the actual PDF file
    const [feedback, setFeedback] = useState<Feedback | null>(null); // The AI text/scores

    // --- 3. Security Check ---
    // Runs automatically. If user isn't logged in, send them to login page.
    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])


    // --- 4. Data Fetching (The Heavy Lifting) ---
    useEffect(() => {
        const loadResume = async () => {
            // A. Get the resume details from the Database using the ID
            const resume = await kv.get(`resume:${id}`);
            if (!resume) return;

            const data = JSON.parse(resume);

            // B. Read the actual PDF file from the File System
            const resumeBlob = await fs.read(data.resumePath);
            if (!resumeBlob) return;

            // Convert raw file data into a clickable URL
            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            // C. Read the Image preview from the File System
            const imageBlob = await fs.read(data.imagePath);
            if (!imageBlob) return;
            
            // Convert raw image data into a viewable URL
            const imageBlobUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageBlobUrl);
            
            // D. Save the AI feedback to state so we can display it
            setFeedback(data.feedback);

            console.log({ imageUrl, resumeUrl, feedback: data.feedback });
        }
        
        loadResume();
    }, [id]); // Rerun this if the 'id' in the URL changes

    // --- 5. The Visual Layout ---
    return (
        <main className='!pt-0'>
            
            {/* Top Navigation Bar */}
            <nav className="resume-nav">
                <Link className="back-button" to="/">
                    {/* Fixed: Added '/' to make path absolute */}
                    <img src='/icons/back.svg' alt='logo' className='w-2.5 h-2.5 ' />
                    <span className='text-gray-800 text-sm font-semibold'>Back to Homepage</span>
                </Link>
            </nav>

            <div className='flex flex-row w-full max-lg:flex-col-reverse'>
                
                {/* LEFT SIDE: Resume Image Preview */}
                {/* Fixed: Added closing bracket ] in CSS */}
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {/* Only show the image box if we have the URLs ready */}
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>

                {/* RIGHT SIDE: The AI Analysis */}
                <section className='feedback-section'>
                    <h2 className='text-4xl font-bold text-black '>Resume Review</h2>

                    {/* Conditional Rendering:
                        IF we have feedback -> Show the scores and details.
                        ELSE -> Show the loading GIF.
                    */}
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            {/* If score/tips are missing, default to 0 or empty list to prevent crash */}
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>

            </div>
        </main>
    )
}

export default Resume