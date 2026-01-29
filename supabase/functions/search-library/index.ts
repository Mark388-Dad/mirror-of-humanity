import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// This function provides book suggestions using AI-generated recommendations
// since direct Follett API access requires authentication
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryContext = category ? `for the category "${category}"` : "";
    
    const prompt = `Suggest 5 real books that match the search query "${query}" ${categoryContext}. These should be appropriate for middle/high school students.

Return a JSON array where each object has:
- title: exact book title
- author: author name
- year: publication year
- description: one sentence description

Only return the JSON array, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a library assistant. Suggest real, well-known books. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search library error:", error);
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
