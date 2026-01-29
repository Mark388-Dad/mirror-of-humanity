import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { csv_content, preview_only } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to intelligently parse and map the CSV data
    const prompt = `Parse this CSV data and extract book submission records. Map columns to our required format.

CSV Data:
${csv_content.slice(0, 5000)}

Extract and return a JSON array where each object has:
- student_name: Full name of student
- email: Student email (if available, otherwise construct from name like firstname.lastname@school.edu)
- year_group: One of MYP5, DP1, DP2, G10
- class_name: One of Swara, Chui, Duma, Nyati, Twiga, Kifaru
- house: One of Kenya, Longonot, Kilimanjaro, Elgon
- category_number: 1-30
- category_name: The category description
- title: Book title
- author: Book author
- date_started: YYYY-MM-DD format
- date_finished: YYYY-MM-DD format
- reflection: Student's reflection text

If a field is missing or unclear, use reasonable defaults or null.
Return ONLY the JSON array, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a data extraction expert. Parse CSV data and return clean JSON. Only output valid JSON arrays." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to extract data from sheet");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    let extractedData;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", content);
      extractedData = [];
    }

    // If preview only, return the extracted data for review
    if (preview_only) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: extractedData,
        count: extractedData.length 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into pending_submissions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const insertData = extractedData.map((item: Record<string, unknown>) => ({
      student_name: item.student_name || "Unknown",
      email: item.email || "unknown@school.edu",
      year_group: item.year_group || null,
      class_name: item.class_name || null,
      house: item.house || null,
      category_number: item.category_number || 15,
      category_name: item.category_name || "Free Choice",
      title: item.title || "Unknown Title",
      author: item.author || "Unknown Author",
      date_started: item.date_started || new Date().toISOString().split("T")[0],
      date_finished: item.date_finished || new Date().toISOString().split("T")[0],
      reflection: item.reflection || "No reflection provided",
    }));

    const { data, error } = await supabase
      .from("pending_submissions")
      .insert(insertData)
      .select();

    if (error) {
      console.error("Insert error:", error);
      throw new Error("Failed to save extracted data");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      inserted: data?.length || 0,
      data: extractedData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract sheet data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
