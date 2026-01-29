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
    const { completed_categories, interests } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const completedList = completed_categories?.join(", ") || "none";
    const interestsList = interests?.join(", ") || "various topics";

    const prompt = `You are a book recommendation expert for middle and high school students. Based on the student's reading history and interests, suggest 5 books they might enjoy.

Completed reading categories: ${completedList}
Student interests: ${interestsList}

For each recommendation, provide:
1. Book title
2. Author
3. Category it would fit (from our 30 categories)
4. A brief reason why they'd like it (1-2 sentences)
5. Reading level (Easy, Medium, Challenging)

Format as JSON array with keys: title, author, category_number, category_name, reason, reading_level

Categories available:
1. A Book About Leadership
2. A Book Set in a Country You Have Never Visited
3. A Book Recommended by a Friend
4. A Book Adapted into a Movie or TV Show
5. A Book You Started But Never Finished
6. A Book with a Protagonist of the Opposite Gender
7. A Book That Made You Cry
8. A Graphic Novel or Comic Book
9. A Book Based on True Events
10. A Book Set in Kenya
11. A Book in A Genre You Never Read
12. A Memoir
13. A Book That is Part of a Series
14. A Book Set in a School
15. Free Choice
16. A Sci-Fi or Futuristic Book
17. A Book with a Number in the Title
18. A Fantasy Book
19. A Book with a Strong Female Lead
20. A Book About Friendship
21. A Book Set on a Different Continent
22. A Book That Made You Laugh
23. A Book with a Plot Twist
24. A Collection of Poems
25. A Book with a Happy Ending
26. A Book You Chose for Its Cover
27. A Book with a Moral Lesson
28. A Book About Overcoming Challenges
29. A Book Featuring Diverse Characters
30. A Book About Sports`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a helpful book recommendation assistant. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get recommendations from AI");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response
    let recommendations;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", content);
      recommendations = [];
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Recommend books error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
