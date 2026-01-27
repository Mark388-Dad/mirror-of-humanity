import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  challenge_type: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { challenge_type, description }: GenerateRequest = await req.json();

    console.log(`Generating ${challenge_type} challenge with description: ${description}`);

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
            content: `You are a creative librarian designing reading challenges for secondary school students (ages 14-18). 
Create engaging, achievable challenges that motivate students to read more.

The 30 reading categories are:
1. Leadership, 2. Country Never Visited, 3. Friend Recommendation, 4. Movie Adaptation, 5. Never Finished, 
6. Opposite Gender Protagonist, 7. Made You Cry, 8. Graphic Novel, 9. True Events, 10. Set in Kenya,
11. New Genre, 12. Memoir, 13. Part of Series, 14. School Setting, 15. Free Choice,
16. Sci-Fi, 17. Number in Title, 18. Fantasy, 19. Strong Female Lead, 20. Friendship,
21. Different Continent, 22. Made You Laugh, 23. Plot Twist, 24. Poetry, 25. Happy Ending,
26. Chose for Cover, 27. Moral Lesson, 28. Overcoming Challenges, 29. Diverse Characters, 30. Sports

Respond in JSON format ONLY:
{
  "title": "Catchy challenge title",
  "description": "Engaging description (2-3 sentences)",
  "target_books": number (1-10),
  "target_categories": [array of category IDs if applicable] or null,
  "points_reward": number (5-20),
  "suggested_duration_days": number (7-30)
}`
          },
          {
            role: "user",
            content: `Create a ${challenge_type} reading challenge. ${description ? `Additional context: ${description}` : "Make it fun and engaging!"}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    console.log("AI generated challenge:", content);

    let challenge;
    try {
      challenge = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response");
    }

    return new Response(
      JSON.stringify({ success: true, challenge }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in generate-challenge:", error);
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
