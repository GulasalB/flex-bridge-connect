// @ts-ignore: Deno import bypass for VS Code
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1. Added explicit 'Request' type to 'req'
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const parsedData = {
      education_history: [
        {
          institution: "Westminster International University in Tashkent",
          degree: "Business Information Systems",
          start_year: "2023",
          end_year: "2027"
        }
      ],
      work_experience: [
        {
          organization: "Uzbekistan Tech Hub",
          title: "Product Intern",
          start_year: "2024",
          end_year: "Present",
          duties: "Assisted in product roadmapping, conducted user research, and designed wireframes for an ed-tech application."
        },
        {
          organization: "American Councils for International Education",
          title: "FLEX Alumni Volunteer",
          start_year: "2023",
          end_year: "2024",
          duties: "Organized GYSD volunteer events, managed alumni outreach, and facilitated community workshops for returnees."
        }
      ]
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  // 2. Added explicit 'any' type to 'error'
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})