import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

// @ts-ignore
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate(); 
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      // 1. Get the currently logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Fetch their complete profile, including the AI-extracted JSONB arrays
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setProfile(data);
      }
      setLoading(false);
    }
    
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-blue-600 font-semibold animate-pulse">Loading your FLEX profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 1. Profile Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to FLEX Bridge!</h1>
            <p className="text-gray-500 mt-1">
              FLEX Year: <span className="font-semibold text-blue-600">{profile?.flex_year || "N/A"}</span> | 
              Host State: <span className="font-semibold text-blue-600">{profile?.host_state || "N/A"}</span>
            </p>
          </div>
          <button 
            onClick={() => navigate({ to: "/mentors" })} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            Find a Mentor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2. AI-Extracted Work Experience */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              💼 Professional Experience
            </h2>
            {profile?.work_experience?.length > 0 ? (
              <div className="space-y-4">
                {profile.work_experience.map((job: any, index: number) => (
                  <div key={index} className="pb-4 border-b last:border-0 border-gray-100">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-blue-600 font-medium">{job.organization}</p>
                    <p className="text-xs text-gray-500 mt-1">{job.start_year} - {job.end_year}</p>
                    <p className="text-sm text-gray-700 mt-2">{job.duties}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No work experience extracted yet.</p>
            )}
          </div>

          {/* 3. AI-Extracted Education */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎓 Education History
            </h2>
            {profile?.education_history?.length > 0 ? (
              <div className="space-y-4">
                {profile.education_history.map((edu: any, index: number) => (
                  <div key={index} className="pb-4 border-b last:border-0 border-gray-100">
                    <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                    <p className="text-sm text-blue-600 font-medium">{edu.institution}</p>
                    <p className="text-xs text-gray-500 mt-1">{edu.start_year} - {edu.end_year}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No education history extracted yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}