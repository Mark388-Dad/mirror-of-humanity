import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  email: string;
  type: "submission" | "achievement" | "challenge" | "approval";
  title: string;
  message: string;
  achievement_level?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, email, type, title, message, achievement_level }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${email}`);

    const resend = new Resend(RESEND_API_KEY);

    // Build email HTML based on type
    let emailHtml = "";
    let subject = "";

    switch (type) {
      case "submission":
        subject = "📚 Book Submitted Successfully!";
        emailHtml = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFDF7;">
            <div style="background: #1a2744; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">📚 45-Book Reading Challenge</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1a2744; margin-top: 0;">${title}</h2>
              <p style="color: #555; line-height: 1.6;">${message}</p>
              <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #D4AF37; font-weight: bold; margin: 0;">+3 Points Earned! 🎉</p>
              </div>
              <p style="color: #888; font-size: 14px;">Keep up the great reading journey!</p>
            </div>
          </div>
        `;
        break;

      case "achievement":
        const levelEmoji = achievement_level === "gold" ? "🥇" : achievement_level === "silver" ? "🥈" : "🥉";
        const levelColor = achievement_level === "gold" ? "#D4AF37" : achievement_level === "silver" ? "#C0C0C0" : "#CD7F32";
        subject = `${levelEmoji} Congratulations! You've reached ${achievement_level?.toUpperCase()} Level!`;
        emailHtml = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFDF7;">
            <div style="background: #1a2744; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 24px;">📚 45-Book Reading Challenge</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px; text-align: center;">
              <div style="font-size: 72px; margin: 20px 0;">${levelEmoji}</div>
              <h2 style="color: ${levelColor}; font-size: 32px; margin: 10px 0;">${achievement_level?.toUpperCase()} LEVEL ACHIEVED!</h2>
              <p style="color: #555; line-height: 1.6; font-size: 18px;">${message}</p>
              <div style="background: linear-gradient(135deg, #1a2744, #2a3754); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #D4AF37; font-size: 16px; margin: 0;">You're an incredible reader! 📖✨</p>
              </div>
            </div>
          </div>
        `;
        break;

      default:
        subject = title;
        emailHtml = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>${title}</h2>
            <p>${message}</p>
          </div>
        `;
    }

    let emailSent = false;
    try {
      const { error: emailError } = await resend.emails.send({
        from: "45-Book Challenge <noreply@resend.dev>",
        to: [email],
        subject,
        html: emailHtml,
      });

      if (emailError) {
        console.error("Email send warning (non-fatal):", emailError);
      } else {
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("Email delivery failed (non-fatal):", emailErr);
    }

    // Always store in-app notification regardless of email outcome
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("notifications").insert({
        user_id,
        type,
        title,
        message,
        email_sent: emailSent,
      });
    }

    console.log(`Notification sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-notification:", error);
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
