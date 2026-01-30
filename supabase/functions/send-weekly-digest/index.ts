import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentDigest {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  house: string | null;
  year_group: string | null;
  class_name: string | null;
  books_this_week: number;
  total_books: number;
  total_points: number;
  current_streak: number;
  achievement_level: string;
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
      console.log("RESEND_API_KEY not configured, skipping digest");
      return new Response(
        JSON.stringify({ success: false, message: "Email not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = new Resend(RESEND_API_KEY);

    // Get date range for this week
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all profiles with their progress
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) throw profilesError;

    // Fetch submissions from last week
    const { data: recentSubmissions, error: submissionsError } = await supabase
      .from('book_submissions')
      .select('user_id, title, author, points_earned, created_at')
      .gte('created_at', weekAgo.toISOString());

    if (submissionsError) throw submissionsError;

    // Fetch student progress
    const { data: progressData, error: progressError } = await supabase
      .from('student_progress')
      .select('*');

    if (progressError) throw progressError;

    // Fetch reading streaks
    const { data: streaksData, error: streaksError } = await supabase
      .from('reading_streaks')
      .select('*');

    if (streaksError) throw streaksError;

    // Build digest for each user
    const digests: StudentDigest[] = profiles?.map(profile => {
      const userSubmissions = recentSubmissions?.filter(s => s.user_id === profile.user_id) || [];
      const userProgress = progressData?.find(p => p.user_id === profile.user_id);
      const userStreak = streaksData?.find(s => s.user_id === profile.user_id);

      return {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        house: profile.house,
        year_group: profile.year_group,
        class_name: profile.class_name,
        books_this_week: userSubmissions.length,
        total_books: userProgress?.books_read || 0,
        total_points: userProgress?.total_points || 0,
        current_streak: userStreak?.current_streak || 0,
        achievement_level: userProgress?.achievement_level || 'none',
      };
    }) || [];

    // Send emails to students
    let sentCount = 0;
    const errors: string[] = [];

    for (const digest of digests.filter(d => d.role === 'student')) {
      try {
        const levelEmoji = digest.achievement_level === 'gold' ? '🥇' : 
                           digest.achievement_level === 'silver' ? '🥈' : 
                           digest.achievement_level === 'bronze' ? '🥉' : '📚';

        const emailHtml = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFDF7;">
            <div style="background: #1a2744; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">📚 Weekly Reading Digest</h1>
              <p style="color: #FFFDF7; margin-top: 10px; opacity: 0.9;">Your 45-Book Challenge Progress</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e5e5;">
              <h2 style="color: #1a2744; margin-top: 0;">Hi ${digest.full_name.split(' ')[0]}! 👋</h2>
              
              <p style="color: #555; line-height: 1.6;">Here's your reading progress for the past week:</p>
              
              <div style="background: linear-gradient(135deg, #f8f8f8, #fffdf7); padding: 20px; border-radius: 12px; margin: 20px 0;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 32px; font-weight: bold; color: #D4AF37;">${digest.books_this_week}</div>
                    <div style="color: #888; font-size: 12px;">Books This Week</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 32px; font-weight: bold; color: #1a2744;">${digest.total_books}/45</div>
                    <div style="color: #888; font-size: 12px;">Total Progress</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 32px; font-weight: bold; color: #D4AF37;">${digest.total_points}</div>
                    <div style="color: #888; font-size: 12px;">Total Points</div>
                  </div>
                  <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-size: 32px; font-weight: bold; color: #FF6B35;">🔥 ${digest.current_streak}</div>
                    <div style="color: #888; font-size: 12px;">Week Streak</div>
                  </div>
                </div>
              </div>
              
              <div style="background: #1a2744; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">Current Level</p>
                <p style="margin: 5px 0; font-size: 24px;">${levelEmoji} ${digest.achievement_level.toUpperCase()}</p>
                ${digest.total_books < 45 ? `
                  <p style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
                    ${45 - digest.total_books} more books to complete the challenge!
                  </p>
                ` : `
                  <p style="margin-top: 10px; font-size: 12px; color: #D4AF37;">
                    🎉 You've completed the challenge! Amazing!
                  </p>
                `}
              </div>
              
              ${digest.books_this_week === 0 ? `
                <div style="background: #FFF3CD; padding: 15px; border-radius: 8px; border-left: 4px solid #FFD93D;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                    📖 No books submitted this week. Keep reading and don't forget to log your progress!
                  </p>
                </div>
              ` : `
                <div style="background: #D4EDDA; padding: 15px; border-radius: 8px; border-left: 4px solid #28A745;">
                  <p style="margin: 0; color: #155724; font-size: 14px;">
                    🎉 Great job! You submitted ${digest.books_this_week} book${digest.books_this_week > 1 ? 's' : ''} this week!
                  </p>
                </div>
              `}
            </div>
            
            <div style="background: #f8f8f8; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e5e5; border-top: none;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                Keep reading! Every book brings you closer to your goals. 📚✨
              </p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: "45-Book Challenge <noreply@resend.dev>",
          to: [digest.email],
          subject: `📚 Weekly Digest: ${digest.books_this_week} books this week | ${digest.total_books}/45 total`,
          html: emailHtml,
        });

        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${digest.email}:`, emailError);
        errors.push(digest.email);
      }
    }

    // Send summary to tutors (aggregated class data)
    const tutors = digests.filter(d => d.role === 'homeroom_tutor' || d.role === 'head_of_year');
    
    for (const tutor of tutors) {
      try {
        // Get students in tutor's class/year
        const tutorStudents = digests.filter(d => 
          d.role === 'student' && 
          (d.class_name === tutor.class_name || d.year_group === tutor.year_group)
        );

        const totalBooksThisWeek = tutorStudents.reduce((sum, s) => sum + s.books_this_week, 0);
        const activeReaders = tutorStudents.filter(s => s.books_this_week > 0).length;

        const tutorEmailHtml = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFDF7;">
            <div style="background: #1a2744; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">📊 Weekly Class Report</h1>
              <p style="color: #FFFDF7; margin-top: 10px; opacity: 0.9;">45-Book Reading Challenge</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1a2744; margin-top: 0;">Hi ${tutor.full_name.split(' ')[0]}!</h2>
              
              <p style="color: #555;">Here's how your ${tutor.class_name || tutor.year_group || 'class'} performed this week:</p>
              
              <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 36px; font-weight: bold; color: #D4AF37;">${totalBooksThisWeek}</div>
                    <div style="color: #888; font-size: 12px;">Books Submitted</div>
                  </div>
                  <div>
                    <div style="font-size: 36px; font-weight: bold; color: #1a2744;">${activeReaders}</div>
                    <div style="color: #888; font-size: 12px;">Active Readers</div>
                  </div>
                  <div>
                    <div style="font-size: 36px; font-weight: bold; color: #28A745;">${tutorStudents.length}</div>
                    <div style="color: #888; font-size: 12px;">Total Students</div>
                  </div>
                </div>
              </div>
              
              <p style="color: #888; font-size: 14px; text-align: center;">
                Log in to the dashboard for detailed student progress.
              </p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: "45-Book Challenge <noreply@resend.dev>",
          to: [tutor.email],
          subject: `📊 Weekly Class Report: ${totalBooksThisWeek} books | ${activeReaders} active readers`,
          html: tutorEmailHtml,
        });

        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send tutor digest to ${tutor.email}:`, emailError);
        errors.push(tutor.email);
      }
    }

    console.log(`Weekly digest sent to ${sentCount} users. Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        errors: errors.length,
        errorEmails: errors 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-weekly-digest:", error);
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
