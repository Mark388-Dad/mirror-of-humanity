import { useState, useRef } from 'react';
import { Upload, Download, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParsedStudent {
  full_name: string;
  email: string;
  year_group: string;
  class_name: string;
  house: string;
  password: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const VALID_HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'];
const VALID_YEARS = ['MYP5', 'DP1', 'DP2', 'G10', 'G11', 'G12'];

const BulkStudentImport = () => {
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csv = 'full_name,email,year_group,class_name,house,password\nJohn Doe,john@school.com,DP1,10A,Kenya,TempPass123!\nJane Smith,jane@school.com,MYP5,9B,Elgon,TempPass456!';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedStudent[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    return lines.slice(1).map(line => {
      const values = splitCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => row[h] = (values[i] || '').trim());

      return {
        full_name: row['full_name'] || row['name'] || row['student name'] || '',
        email: row['email'] || row['email address'] || '',
        year_group: row['year_group'] || row['year group'] || row['grade'] || '',
        class_name: row['class_name'] || row['class'] || row['class name'] || '',
        house: row['house'] || '',
        password: row['password'] || row['temp_password'] || 'ReadChallenge2025!',
      };
    }).filter(s => s.full_name && s.email);
  };

  const splitCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else current += char;
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const students = parseCSV(text);
      setParsedStudents(students);
      if (students.length === 0) toast.error('No valid student rows found in CSV');
      else toast.success(`Parsed ${students.length} students from CSV`);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedStudents.length === 0) return;
    setImporting(true);
    const errors: string[] = [];
    let success = 0;

    for (const student of parsedStudents) {
      try {
        // Validate fields
        if (!student.email.includes('@')) {
          errors.push(`${student.full_name}: Invalid email`);
          continue;
        }
        if (student.house && !VALID_HOUSES.includes(student.house)) {
          errors.push(`${student.full_name}: Invalid house "${student.house}"`);
          continue;
        }
        if (student.year_group && !VALID_YEARS.includes(student.year_group)) {
          errors.push(`${student.full_name}: Invalid year group "${student.year_group}"`);
          continue;
        }

        // Sign up the student
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: student.email,
          password: student.password,
          options: {
            data: {
              full_name: student.full_name,
              role: 'student',
              year_group: student.year_group || null,
              class_name: student.class_name || null,
              house: student.house || null,
            },
          },
        });

        if (authError) {
          errors.push(`${student.full_name}: ${authError.message}`);
          continue;
        }

        if (authData.user) {
          success++;
        }
      } catch (err) {
        errors.push(`${student.full_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setResult({ success, failed: errors.length, errors });
    setImporting(false);
    if (success > 0) toast.success(`Successfully created ${success} student accounts`);
    if (errors.length > 0) toast.error(`${errors.length} students failed to import`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Bulk Student Import
        </CardTitle>
        <CardDescription>
          Upload a CSV file to create multiple student accounts at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
          <Download className="w-4 h-4" />
          Download CSV Template
        </Button>

        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            {fileName || 'Click to select a CSV file'}
          </p>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            Select CSV File
          </Button>
        </div>

        {parsedStudents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{parsedStudents.length} students ready to import</Badge>
              <Button onClick={handleImport} disabled={importing} className="gap-2">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing...' : 'Import Students'}
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Year</th>
                    <th className="p-2 text-left">House</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStudents.slice(0, 20).map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{s.full_name}</td>
                      <td className="p-2 text-muted-foreground">{s.email}</td>
                      <td className="p-2">{s.year_group}</td>
                      <td className="p-2">{s.house}</td>
                    </tr>
                  ))}
                  {parsedStudents.length > 20 && (
                    <tr><td colSpan={4} className="p-2 text-center text-muted-foreground">...and {parsedStudents.length - 20} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{result.success} created</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{result.failed} failed</span>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                {result.errors.map((err, i) => <p key={i}>• {err}</p>)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkStudentImport;
