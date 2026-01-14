import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

// --- 1. SEO & Tab Settings ---
// This function tells the browser what title to show on the tab
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

// --- 2. Main Component Logic ---
export default function Home() {
  // Connect to our backend (Puter) and navigation tools
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();

  // --- State Variables (Memory) ---
  // 'resumes': Stores the list of resumes we fetch
  // 'loadingResumes': A simple true/false switch to show the loading spinner
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);


  // --- Effect 1: Security Check ---
  // This runs immediately. If the user isn't logged in, kick them to the login page.
  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated]);

  // --- Effect 2: Fetch Data ---
  // This runs once when the page loads to get the user's data.
  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true); // Turn on "Loading..." mode

      // 1. Get the list of items starting with "resume:" from the database
      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      // 2. The database gives us strings (JSON), so we convert them back into Objects
      const parsedResumes = resumes?.map((resume) => (
          JSON.parse(resume.value) as Resume
      ));

      // 3. Save the data to our state and turn off "Loading..." mode
      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    }

    loadResumes();
  }, []); // The empty [] means "run this only once"



  // --- 3. The Visuals (JSX) ---
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          
          {/* Dynamic Heading: Shows different text if the list is empty or full */}
          {!loadingResumes && resumes?.length === 0 ? (
              <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
        </div>

        {/* Loading State: Shows a GIF while we wait for data */}
        {loadingResumes && (
            <div className="flex flex-col items-center justify-center">
              <img src="/images/resume-scan-2.gif" className="w-[200px]" />
            </div>
        )}

        {/* Data Loaded: Loops through the 'resumes' list and creates a Card for each one */}
        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {/* Empty State: Shows a big "Upload" button if there are no resumes */}
        {!loadingResumes && resumes?.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 gap-4">
              <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                Upload Resume
              </Link>
            </div>
        )}

        

      </section>
    </main>
  );
}