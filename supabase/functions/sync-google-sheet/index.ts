import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// The user's Google Sheet ID
const SHEET_ID = "1QMquWqbvB7OAhyry0YpS5hCJ7KpVsa6MPHgEbERKTKw";

// Multiple URL formats to try
const getSheetUrls = (sheetId: string) => [
  // Published to web format (most reliable when published)
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vQlLWsu_KyDIjAGkvedtKJSxYvqinjrbX0TzUKh_DFL6G2oxK4yAduOdfMFjg1WH0iKbiUcAdNB-zNU/pub?gid=0&single=true&output=csv`,
  // Direct export format (works if sheet is shared publicly - "Anyone with the link can view")
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=0`,
  // Alternative export format
  `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
];

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

async function fetchSheetData(sheetId: string): Promise<string> {
  const urls = getSheetUrls(sheetId);
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      console.log("Trying to fetch from:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/csv, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (res.ok) {
        const text = await res.text();
        // Verify it looks like CSV (not HTML error page)
        if (text && !text.startsWith("<!DOCTYPE") && !text.startsWith("<html")) {
          console.log("Successfully fetched CSV data, length:", text.length);
          return text;
        } else {
          console.log("Response was HTML, not CSV - trying next URL");
        }
      } else {
        console.log(`URL returned status ${res.status}, trying next...`);
      }
    } catch (e) {
      console.log("Fetch error for URL:", url, e);
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(
    `Could not access Google Sheet. Please ensure the sheet is either:
    1. Published to the web (File → Share → Publish to web → CSV)
    2. OR shared publicly (Share → Anyone with the link can view)
    Original error: ${lastError?.message || "Unknown error"}`
  );
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

    // Fetch CSV data with fallback URLs
    const csvText = await fetchSheetData(SHEET_ID);
    const rows = parseCSV(csvText);
    
    console.log("Parsed", rows.length, "rows from CSV");

    let recordsSynced = 0;
    let autoImported = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        if (!row.email || !row.title) {
          continue; // Skip rows without required fields
        }

        // Case-insensitive dedup check in pending_submissions
        const { data: existing } = await supabase
          .from("pending_submissions")
          .select("id")
          .ilike("email", row.email)
          .ilike("title", row.title)
          .maybeSingle();

        if (existing) continue;
 
        // Case-insensitive dedup check in book_submissions (email via profile lookup + title)
        const { data: existingBook } = await supabase
          .from("book_submissions")
          .select("id")
          .ilike("title", row.title)
          .ilike("author", row.author)
          .maybeSingle();
 
        if (existingBook) {
          console.log(`Skipping already imported book: ${row.title}`);
          continue;
        }

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

        if (error) {
          errors.push(`Row ${row.email}: ${error.message}`);
        } else {
          recordsSynced++;
          
          // Try to auto-import for registered users
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", row.email.toLowerCase())
            .maybeSingle();
          
          if (profile) {
            const { error: importError } = await supabase
              .from("book_submissions")
              .insert({
                user_id: profile.user_id,
                title: row.title,
                author: row.author,
                category_number: row.categoryNumber,
                category_name: row.categoryName,
                date_started: row.dateStarted,
                date_finished: row.dateFinished,
                reflection: row.reflection,
                 points_earned: 3,
                approval_status: "approved",
              });
            
            if (!importError) {
              autoImported++;
              // Mark as imported
              await supabase
                .from("pending_submissions")
                .update({
                  imported_at: new Date().toISOString(),
                  imported_to_user_id: profile.user_id,
                })
                .eq("email", row.email)
                .eq("title", row.title);
            }
          }
        }
      } catch (e) {
        errors.push(String(e));
      }
    }

    // Log the sync
    await supabase.from("sheet_sync_logs").insert({
      sync_type: "manual",
      records_synced: recordsSynced,
      errors: errors.length > 0 ? errors : null,
    });

    console.log(`Sync complete: ${recordsSynced} synced, ${autoImported} auto-imported`);

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: recordsSynced,
        auto_imported: autoImported,
        total_rows: rows.length,
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
        instructions: "Please ensure your Google Sheet is shared publicly (Share → Anyone with the link can view) or published to the web (File → Share → Publish to web).",
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
  if (lines.length < 2) {
    console.log("CSV has less than 2 lines, nothing to parse");
    return [];
  }

  const headers = splitCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim()
  );
  
  console.log("CSV Headers found:", JSON.stringify(headers));

  return lines
    .slice(1)
    .map((line) => {
      const values = splitCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] || ""));

      // Try multiple variations of column names (Google Forms often has "Email Address" etc)
      const email = row["email"] || row["email address"] || row["student email"] || row["e-mail"] || "";
      const studentName = row["student name"] || row["name"] || row["full name"] || row["student"] || row["your name"] || "";
      const title = row["title"] || row["book title"] || row["book"] || row["what book did you read?"] || "";
      const author = row["author"] || row["book author"] || row["author name"] || row["who wrote this book?"] || "Unknown";

      return {
        email: email,
        studentName: studentName,
        yearGroup: row["year group"] || row["year"] || row["grade"] || row["grade level"] || "",
        className: row["class"] || row["class name"] || row["tutor group"] || row["form"] || "",
        house: row["house"] || row["house name"] || "",
        categoryNumber: Number(row["category number"] || row["category"] || row["category #"] || 15),
        categoryName: row["category name"] || row["category"] || row["reading category"] || "Free Choice",
        title: title,
        author: author,
        dateStarted: parseDate(row["date started"] || row["start date"] || row["when did you start reading?"]),
        dateFinished: parseDate(row["date finished"] || row["finish date"] || row["date completed"] || row["completion date"] || row["when did you finish?"]),
        reflection: row["reflection"] || row["review"] || row["comments"] || row["what did you think of the book?"] || row["your reflection"] || "",
      };
    })
    .filter((r) => {
      const valid = r.email && r.title;
      return valid;
    });
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
