import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { analysis_type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    
    switch (analysis_type) {
      case "house":
        prompt = `Analyze this house reading competition data and provide insights:

${JSON.stringify(data, null, 2)}

Provide a comprehensive analysis including:
1. Current standings and rankings
2. Trends and patterns you notice
3. Houses that are improving or declining
4. Recommendations for houses that are behind
5. Projected outcomes if current trends continue

Format with clear sections and bullet points.`;
        break;

      case "year_group":
        prompt = `Analyze reading progress data by year group:

${JSON.stringify(data, null, 2)}

Provide insights on:
1. Which year groups are most engaged
2. Reading patterns across grades
3. Areas needing attention
4. Recommendations for improvement
5. Notable achievements`;
        break;

      case "category":
        prompt = `Analyze category completion data for the reading challenge:

${JSON.stringify(data, null, 2)}

Provide insights on:
1. Most popular vs least popular categories
2. Categories that may need promotion
3. Student preferences patterns
4. Recommendations for challenge adjustments`;
        break;

      case "individual":
        prompt = `Analyze individual student reading data:

${JSON.stringify(data, null, 2)}

Provide:
1. Performance summary
2. Reading patterns
3. Strengths and areas for growth
4. Personalized recommendations
5. Encouragement and next steps`;
        break;

      default:
        prompt = `Analyze this reading challenge data:

${JSON.stringify(data, null, 2)}

Provide comprehensive insights and actionable recommendations.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an educational data analyst specializing in reading programs. Provide clear, actionable insights with encouragement." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze data");
    }

    const aiData = await response.json();
    const analysis = aiData.choices?.[0]?.message?.content || "Unable to generate analysis.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze progress error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
