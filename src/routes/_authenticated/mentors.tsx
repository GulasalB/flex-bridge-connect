import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

// @ts-ignore
export const Route = createFileRoute('/_authenticated/mentors')({
  component: Mentors,
});

function Mentors() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      // 1. Get the currently logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Call your custom PostgreSQL function (bypassing strict TS checks)
        const { data, error } = await (supabase as any).rpc('get_mentor_matches', {
          current_user_id: user.id
        });
        
        if (!error && data) {
          setMentors(data as any[]);
        }
        
        if (!error && data) {
          setMentors(data);
        }
      }
      setLoading(false);
    }
    
    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Mentor Matches</h1>
          <p className="text-gray-500 mt-1">Algorithmically ranked based on your FLEX year, host state, and career data.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-blue-600 font-semibold animate-pulse">Calculating compatibility scores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                    {mentor.match_score} Points Match
                  </div>
                  <span className="text-sm font-semibold text-gray-500">FLEX '{mentor.flex_year}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900">{mentor.job_title || "FLEX Alumnus"}</h3>
                <p className="text-sm text-gray-600 mb-4">{mentor.current_workplace || "Organization unlisted"}</p>
                
                <div className="mt-auto space-y-2">
                  <p className="text-xs text-gray-500">📍 Host State: <span className="font-medium text-gray-700">{mentor.host_state}</span></p>
                  <button className="w-full mt-4 py-2 bg-blue-50 text-blue-600 font-medium rounded hover:bg-blue-100 transition-colors">
                    Request Mentorship
                  </button>
                </div>
              </div>
            ))}
            
            {mentors.length === 0 && (
              <div className="col-span-full bg-white p-8 text-center rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No other alumni are in the database yet to match with you!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
