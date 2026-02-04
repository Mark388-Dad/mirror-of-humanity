import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const body = await req.json().catch(() => ({}));
    const { sync_type = "full", user_id } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1️⃣ Fetch the sheet as CSV from Google
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
    console.log("Fetching CSV from:", csvUrl);

    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReadingChallenge/1.0)",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch sheet (status ${response.status})`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Empty sheet or no data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = parseCSV(csvText);
    console.log(`Parsed ${rows.length} rows`);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No rows to sync", records_synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ Sync into pending_submissions
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

        const { error } = await supabase.from("pending_submissions").insert({
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
          errors.push(`Row ${row.email} - ${row.title}: ${error.message}`);
        } else {
          recordsSynced++;
        }
      } catch (err) {
        errors.push(`Row error: ${(err as Error).message}`);
      }
    }

    // 3️⃣ Log sync attempt
    await supabase.from("sheet_sync_logs").insert({
      sync_type,
      records_synced: recordsSynced,
      errors: errors.length ? errors : null,
      synced_by: user_id || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        records_synced: recordsSynced,
        errors: errors.length ? errors : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Sync Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseCSV(csvText: string): SheetRow[] {
  const lines = csvText.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((h, idx) => row[h] = values[idx] || "");
    rows.push({
      timestamp: row["timestamp"] || "",
      email: row["email"] || "",
      studentName: row["name"] || "",
      yearGroup: row["year group"] || "",
      className: row["class"] || "",
      house: row["house"] || "",
      categoryNumber: parseInt(row["category number"] || "0") || 0,
      categoryName: row["category name"] || "",
      title: row["title"] || "",
      author: row["author"] || "",
      dateStarted: row["date started"] || "",
      dateFinished: row["date finished"] || "",
      reflection: row["reflection"] || "",
    });
  }
  return rows.filter(r => r.email && r.title);
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}
