import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

export function AuthPage() {
  const navigate = useNavigate();
  // State for the 3-Step Wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  
  // Step 1: Auth State
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: FLEX Details State
  const [flexYear, setFlexYear] = useState("");
  const [hostState, setHostState] = useState("");

  // Step 3: CV Upload State
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setStep(2);
      }
    });
  }, []);

  const handleLinkedInLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: window.location.origin + '/auth' },
    });
  };

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          setUserId(data.user.id);
          setStep(2);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUserId(data.user.id);
          setStep(2);
        }
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFlexDetails(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (!userId) throw new Error("No user found");
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          flex_year: parseInt(flexYear), 
          host_state: hostState 
        } as any);

      if (error) throw error;
      setStep(3);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCVUpload(e: any) {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile); 
      setUploading(true);

      try {
        // TypeScript safety check applied here!
        if (!userId) throw new Error("User session not found.");

        const formData = new FormData();
        formData.append('file', uploadedFile);

        const { data, error } = await supabase.functions.invoke('parse-resume', {
          body: formData,
        });

        if (error) throw error;

        const { error: dbError } = await supabase
          .from('profiles')
          .update({
            education_history: data.education_history,
            work_experience: data.work_experience
          } as any)
          .eq('id', userId); // TypeScript knows this is safe now

        if (dbError) throw dbError;

        navigate({ to: "/dashboard", replace: true });
        
      } catch (error) {
        console.error("Parser Error:", error);
        alert("Could not parse the document.");
      } finally {
        setUploading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 1 && (mode === "signup" ? "Create your FLEX Bridge account" : "Sign in to FLEX Bridge")}
          {step === 2 && "FLEX Program Details"}
          {step === 3 && "Fast-Track Your Profile"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {step === 1 && (
            <>
              <form className="space-y-6" onSubmit={handleAuth}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <button type="submit" disabled={busy} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  {busy ? "Processing..." : (mode === "signup" ? "Sign up" : "Sign in")}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={handleLinkedInLogin} className="w-full flex justify-center py-2 px-4 mb-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0a66c2] hover:bg-[#084e96]">
                  Sign in with LinkedIn
                </button>
                <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-sm text-blue-600 hover:text-blue-500">
                  {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <form className="space-y-6" onSubmit={handleFlexDetails}>
              <div>
                <label className="block text-sm font-medium text-gray-700">FLEX Year (e.g. 2022)</label>
                <input type="number" required value={flexYear} onChange={(e) => setFlexYear(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Host State (e.g. Texas)</label>
                <input type="text" required value={hostState} onChange={(e) => setHostState(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <button type="submit" disabled={busy} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                {busy ? "Saving..." : "Continue"}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 text-center mb-4">
                Upload your CV or Resume to automatically extract your education and work experience (just like LinkedIn).
              </p>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-blue-600 font-semibold">
                    {file ? file.name : (uploading ? "Extracting deep CV data..." : "Click to upload Resume/CV (PDF)")}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVUpload} disabled={uploading} />
              </label>
              
              <button onClick={() => navigate({ to: "/dashboard", replace: true })} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Skip for now
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}