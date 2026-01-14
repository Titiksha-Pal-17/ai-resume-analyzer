import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

// --- 1. Tab Settings ---
export const meta = () => ([
    { title: 'Resumind | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    // --- 2. Setup Tools ---
    const { isLoading, auth } = usePuterStore();
    const navigate = useNavigate();
    
    // --- 3. The "Return Ticket" Logic ---
    const location = useLocation();
    // This looks at the URL for "next=". 
    // Example: if URL is "/auth?next=/resume", then 'next' becomes "/resume".
    // It tells us where to send the user after they successfully login.
    const next = location.search.split('next=')[1]; 

    // --- 4. Auto-Redirect (The Bouncer) ---
    // This runs whenever the login status changes.
    // If the user IS logged in, immediately send them to the 'next' page.
    useEffect(() => {
        if (auth.isAuthenticated) navigate(next || '/'); // Default to '/' if no next link
    }, [auth.isAuthenticated, next])

    // --- 5. The Visuals ---
    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log In to Continue Your Job Journey</h2>
                    </div>

                    {/* --- 6. Button Logic --- */}
                    <div>
                        {isLoading ? (
                            // STATE A: We are checking if they are logged in...
                            // Show a pulsing button so they know something is happening
                            <button className="auth-button animate-pulse">
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    // STATE B: Already Logged In? 
                                    // Show Logout (Rarely seen because the useEffect above redirects them fast)
                                    <button className="auth-button" onClick={auth.signOut}>
                                        <p>Log Out</p>
                                    </button>
                                ) : (
                                    // STATE C: Not Logged In?
                                    // Show the normal Login button
                                    <button className="auth-button" onClick={auth.signIn}>
                                        <p>Log In</p>
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                </section>
            </div>
        </main>
    )
}

export default Auth