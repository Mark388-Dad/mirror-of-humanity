import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewRequest {
  submission_id: string;
  title: string;
  author: string;
  category_name: string;
  reflection: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { submission_id, title, author, category_name, reflection }: ReviewRequest = await req.json();

    console.log(`Reviewing submission ${submission_id}: ${title} by ${author}`);

    // Use AI to review the reflection
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
            content: `You are a book reflection reviewer for a school reading challenge. 
Your task is to evaluate student reflections for quality and appropriateness.

Evaluate based on:
1. QUALITY: Does the reflection show genuine engagement with the book? Is it thoughtful and meets minimum requirements (50+ characters)?
2. RELEVANCE: Does it relate to the book and category prompt?
3. APPROPRIATENESS: Is it free from offensive language, plagiarism indicators, or inappropriate content?

Respond in JSON format ONLY:
{
  "status": "approved" | "flagged",
  "quality_score": 1-10,
  "feedback": "Brief constructive feedback for the student",
  "flag_reason": "Only if flagged - explain why"
}`
          },
          {
            role: "user",
            content: `Review this book reflection:

BOOK: "${title}" by ${author}
CATEGORY: ${category_name}
REFLECTION: ${reflection}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("AI review failed");
    }

    const aiData = await aiResponse.json();
    const reviewContent = aiData.choices?.[0]?.message?.content;
    
    console.log("AI Review result:", reviewContent);

    let review;
    try {
      review = JSON.parse(reviewContent);
    } catch {
      console.error("Failed to parse AI response:", reviewContent);
      review = { status: "approved", quality_score: 7, feedback: "Review complete." };
    }

    // Update the submission in the database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from("book_submissions")
      .update({
        approval_status: review.status,
        ai_feedback: review.feedback || review.flag_reason || "Review complete",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to update submission");
    }

    console.log(`Submission ${submission_id} reviewed: ${review.status}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: review.status,
        feedback: review.feedback,
        quality_score: review.quality_score,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in review-submission:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
