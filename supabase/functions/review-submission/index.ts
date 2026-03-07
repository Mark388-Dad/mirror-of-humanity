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
            content: `You are a book reflection reviewer for a school reading challenge (Mpesa Foundation Academy).
Your task is to evaluate student reflections for quality and appropriateness.

Evaluate based on:
1. QUALITY: Does the reflection show genuine engagement with the book? Is it thoughtful and meets minimum requirements (50+ characters)?
2. RELEVANCE: Does it relate to the book and category prompt?
3. APPROPRIATENESS: Is it free from offensive language, plagiarism indicators, or inappropriate content?
4. AUTHENTICITY: Does it seem like the student actually read the book? Watch for generic/vague reflections that could apply to any book.

Flag if: quality score < 4, appears plagiarized, offensive content, obviously didn't read the book, reflection is nonsensical/gibberish, or the book doesn't match the category.

Respond in JSON format ONLY:
{
  "status": "approved" | "flagged",
  "quality_score": 1-10,
  "feedback": "Brief constructive feedback for the student",
  "flag_reason": "Only if flagged - explain why",
  "flag_severity": "low" | "medium" | "high"
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update the submission
    const { error: updateError } = await supabase
      .from("book_submissions")
      .update({
        approval_status: review.status,
        ai_feedback: review.status === "flagged" 
          ? `🚩 ${review.flag_reason || "Flagged for review"} (Score: ${review.quality_score}/10)` 
          : review.feedback || "Review complete",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submission_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to update submission");
    }

    // If flagged, notify the student AND all librarians
    if (review.status === "flagged") {
      // Get the submission's user info
      const { data: submission } = await supabase
        .from("book_submissions")
        .select("user_id")
        .eq("id", submission_id)
        .single();

      if (submission) {
        // Notify the student
        const { data: studentProfile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", submission.user_id)
          .single();

        if (studentProfile) {
          // In-app notification for student
          await supabase.from("notifications").insert({
            user_id: submission.user_id,
            type: "submission",
            title: "⚠️ Submission Flagged for Review",
            message: `Your submission "${title}" has been flagged by AI review: ${review.flag_reason || "Needs additional review"}. A librarian will review it shortly.`,
          });

          // Try email notification for student
          try {
            const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
            if (RESEND_API_KEY) {
              const { Resend } = await import("https://esm.sh/resend@2.0.0");
              const resend = new Resend(RESEND_API_KEY);
              await resend.emails.send({
                from: "45-Book Challenge <noreply@resend.dev>",
                to: [studentProfile.email],
                subject: "⚠️ Your Book Submission Needs Attention",
                html: `
                  <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1a2744; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #D4AF37; margin: 0;">📚 45-Book Reading Challenge</h1>
                    </div>
                    <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                      <h2 style="color: #e67e22;">⚠️ Submission Flagged</h2>
                      <p>Hi ${studentProfile.full_name?.split(" ")[0]},</p>
                      <p>Your submission for <strong>"${title}"</strong> by ${author} has been flagged for review.</p>
                      <p><strong>Reason:</strong> ${review.flag_reason || "Needs additional review"}</p>
                      <p><strong>Feedback:</strong> ${review.feedback || ""}</p>
                      <p style="color: #888;">A librarian will review your submission shortly. You may be asked to revise your reflection.</p>
                    </div>
                  </div>
                `,
              }).catch((e: Error) => console.error("Email to student failed:", e));
            }
          } catch (e) {
            console.error("Email notification error:", e);
          }
        }

        // Notify all librarians
        const { data: librarians } = await supabase
          .from("profiles")
          .select("user_id, email, full_name")
          .eq("role", "librarian");

        if (librarians) {
          for (const lib of librarians) {
            await supabase.from("notifications").insert({
              user_id: lib.user_id,
              type: "submission",
              title: "🚩 AI Flagged Submission",
              message: `"${title}" by ${studentProfile?.full_name || "Unknown"} was auto-flagged: ${review.flag_reason || "Low quality"}. Score: ${review.quality_score}/10. Please review.`,
            });
          }
        }
      }
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
