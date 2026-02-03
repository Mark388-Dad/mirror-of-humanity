import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// The Google Sheet ID from the provided URL
const SHEET_ID = "1QMquWqbvB7OAhyry0YpS5hCJ7KpVsa6MPHgEbERKTKw";

interface SheetRow {
  timestamp: string;
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
    const { sync_type = "full", user_id } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the Google Sheet as CSV (publicly shared sheet)
    // The sheet must be shared as "Anyone with the link can view"
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    
    console.log("Fetching Google Sheet from:", csvUrl);
    
    const response = await fetch(csvUrl, {
      headers: {
        'Accept': 'text/csv',
      },
    });
    
    if (!response.ok) {
      // Check if it's an auth issue
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Google Sheet is not publicly accessible. Please share the sheet with 'Anyone with the link can view' permissions.",
            help: "Go to Google Sheets → Share → Change 'General access' to 'Anyone with the link'"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    console.log(`Parsed ${rows.length} rows from Google Sheet`);
    
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No data to sync", records_synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errors: string[] = [];
    let recordsSynced = 0;

    // Process each row and insert into pending_submissions
    for (const row of rows) {
      try {
        // Check if this submission already exists (by email + title + date)
        const { data: existing } = await supabase
          .from("pending_submissions")
          .select("id")
          .eq("email", row.email)
          .eq("title", row.title)
          .eq("date_finished", row.dateFinished)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping duplicate: ${row.email} - ${row.title}`);
          continue;
        }

        // Insert new pending submission
        const { error } = await supabase.from("pending_submissions").insert({
          student_name: row.studentName,
          email: row.email,
          year_group: row.yearGroup,
          class_name: row.className,
          house: row.house,
          category_number: row.categoryNumber || 15,
          category_name: row.categoryName || "Free Choice",
          title: row.title,
          author: row.author || "Unknown",
          date_started: row.dateStarted || new Date().toISOString().split("T")[0],
          date_finished: row.dateFinished || new Date().toISOString().split("T")[0],
          reflection: row.reflection || "Synced from Google Form",
        });

        if (error) {
          errors.push(`Row ${row.studentName}: ${error.message}`);
        } else {
          recordsSynced++;
        }
      } catch (err) {
        errors.push(`Row processing error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // Log the sync
    await supabase.from("sheet_sync_logs").insert({
      sync_type,
      records_synced: recordsSynced,
      errors: errors.length > 0 ? errors : null,
      synced_by: user_id || null,
    });

    // Try to auto-import submissions to registered users
    const { data: pendingSubmissions } = await supabase
      .from("pending_submissions")
      .select("*")
      .is("imported_to_user_id", null);

    let autoImported = 0;
    
    for (const pending of pendingSubmissions || []) {
      // Find matching profile by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", pending.email)
        .maybeSingle();

      if (profile) {
        // Create book submission
        const { error: insertError } = await supabase.from("book_submissions").insert({
          user_id: profile.user_id,
          title: pending.title,
          author: pending.author,
          category_number: pending.category_number,
          category_name: pending.category_name,
          date_started: pending.date_started,
          date_finished: pending.date_finished,
          reflection: pending.reflection,
          points_earned: 3,
          approval_status: "approved",
        });

        if (!insertError) {
          // Mark as imported
          await supabase
            .from("pending_submissions")
            .update({ 
              imported_to_user_id: profile.user_id,
              imported_at: new Date().toISOString()
            })
            .eq("id", pending.id);
          autoImported++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed`,
        records_synced: recordsSynced,
        auto_imported: autoImported,
        errors: errors.length > 0 ? errors : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Sync failed",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseCSV(csvText: string): SheetRow[] {
  const lines = csvText.split("\n").filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const rows: SheetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });

    // Map common column variations
    rows.push({
      timestamp: row["timestamp"] || row["date"] || "",
      email: row["email"] || row["email address"] || row["student email"] || "",
      studentName: row["name"] || row["student name"] || row["full name"] || row["student"] || "",
      yearGroup: row["year group"] || row["year"] || row["grade"] || "",
      className: row["class"] || row["class name"] || row["tutor group"] || "",
      house: row["house"] || row["house name"] || "",
      categoryNumber: parseInt(row["category number"] || row["category"] || "15") || 15,
      categoryName: row["category name"] || row["challenge category"] || "Free Choice",
      title: row["title"] || row["book title"] || row["book"] || "",
      author: row["author"] || row["book author"] || "",
      dateStarted: parseDate(row["date started"] || row["start date"] || ""),
      dateFinished: parseDate(row["date finished"] || row["end date"] || row["completion date"] || ""),
      reflection: row["reflection"] || row["thoughts"] || row["review"] || "",
    });
  }

  return rows.filter(r => r.email && r.title);
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  
  try {
    // Try various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    
    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsed = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  return new Date().toISOString().split("T")[0];
}
