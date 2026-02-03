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
    const { file_id, file_url, file_type, action = "summarize" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch file content if it's a text-based file
    let fileContent = "";
    const textTypes = ["txt", "csv", "json", "md", "html", "xml"];
    const isTextFile = textTypes.some(t => file_type?.toLowerCase().includes(t));

    if (isTextFile && file_url) {
      try {
        const response = await fetch(file_url);
        fileContent = await response.text();
        fileContent = fileContent.slice(0, 10000); // Limit content size
      } catch (e) {
        console.log("Could not fetch file content:", e);
      }
    }

    let prompt = "";
    
    switch (action) {
      case "summarize":
        prompt = `Analyze this uploaded file and provide:
1. A concise summary (2-3 paragraphs)
2. Key themes or topics covered
3. Important data points or insights
4. How this could be useful for a school reading challenge program

${fileContent ? `File content:\n${fileContent}` : `File type: ${file_type}\nNote: This is a binary file. Provide general guidance on what kind of content might be in a ${file_type} file and how it could be used in an educational context.`}`;
        break;
        
      case "extract_data":
        prompt = `Extract structured data from this file content:

${fileContent}

Return as JSON with relevant fields like names, dates, numbers, categories, etc.`;
        break;
        
      case "generate_quiz":
        prompt = `Based on this content, create 5 comprehension questions suitable for secondary school students:

${fileContent || `File type: ${file_type}`}

Format each question with:
- The question
- 4 multiple choice options (A, B, C, D)
- The correct answer
- A brief explanation`;
        break;
        
      case "find_themes":
        prompt = `Identify the main themes, topics, and key messages in this content:

${fileContent || `File type: ${file_type}`}

List each theme with a brief explanation of its relevance.`;
        break;
        
      default:
        prompt = `Provide helpful insights about this ${file_type} file for an educational reading challenge program.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are an AI assistant helping librarians manage a school reading challenge. Provide clear, educational, and actionable insights." 
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI processing failed");
    }

    const aiData = await aiResponse.json();
    const result = aiData.choices?.[0]?.message?.content || "Unable to process file.";

    // Update the file record with AI summary
    if (file_id) {
      await supabase
        .from("librarian_files")
        .update({ 
          ai_summary: result,
          ai_extracted_text: fileContent || null
        })
        .eq("id", file_id);
    }

    return new Response(
      JSON.stringify({ success: true, result, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process file error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
