import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ✅ Published CSV URL (correct format)
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlLWsu_KyDIjAGkvedtKJSxYvqinjrbX0TzUKh_DFL6G2oxK4yAduOdfMFjg1WH0iKbiUcAdNB-zNU/pub?gid=0&single=true&output=csv";

interface SheetRow {
  email: string;
  studentName: string;
  yearGroup: string;
  className: string;
  house: string;
  categoryNumber: number;
  categoryName: string;
  title: string;
  author: string;
  dateStarted: string;
  dateFinished: string;
  reflection: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ✅ FIXED FETCH (Google requires headers in Edge runtime)
    console.log("Fetching CSV from:", CSV_URL);

    const res = await fetch(CSV_URL, {
      method: "GET",
      headers: {
        "accept": "text/csv, */*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Google returned:", res.status, text);
      throw new Error(`Failed to fetch Google Sheet: ${res.status}`);
    }

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    let recordsSynced = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const { data: existing } = await supabase
          .from("pending_submissions")
          .select("id")
          .eq("email", row.email)
          .eq("title", row.title)
          .eq("date_finished", row.dateFinished)
          .maybeSingle();

        if (existing) continue;

        const { error } = await supabase
          .from("pending_submissions")
          .insert({
            student_name: row.studentName,
            email: row.email,
            year_group: row.yearGroup,
            class_name: row.className,
            house: row.house,
            category_number: row.categoryNumber,
            category_name: row.categoryName,
            title: row.title,
            author: row.author,
            date_started: row.dateStarted,
            date_finished: row.dateFinished,
            reflection: row.reflection,
          });

        if (error) errors.push(error.message);
        else recordsSynced++;
      } catch (e) {
        errors.push(String(e));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: recordsSynced,
        errors: errors.length ? errors : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SYNC ERROR:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/* ================= CSV HELPERS ================= */

function parseCSV(csv: string): SheetRow[] {
  const lines = csv.split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim()
  );

  return lines
    .slice(1)
    .map((line) => {
      const values = splitCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] || ""));

      return {
        email: row["email"] || "",
        studentName: row["student name"] || row["name"] || "",
        yearGroup: row["year group"] || "",
        className: row["class"] || "",
        house: row["house"] || "",
        categoryNumber: Number(row["category number"] || 15),
        categoryName: row["category name"] || "Free Choice",
        title: row["title"] || "",
        author: row["author"] || "Unknown",
        dateStarted: parseDate(row["date started"]),
        dateFinished: parseDate(row["date finished"]),
        reflection: row["reflection"] || "",
      };
    })
    .filter((r) => r.email && r.title);
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }

  result.push(current.trim());
  return result;
}

function parseDate(value?: string) {
  if (!value) return new Date().toISOString().split("T")[0];
  const d = new Date(value);
  return isNaN(d.getTime())
    ? new Date().toISOString().split("T")[0]
    : d.toISOString().split("T")[0];
}
