import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Search, Users, BookOpen, Trophy, Filter, Upload, Brain, Loader2, BarChart3, FileSpreadsheet, Sparkles } from 'lucide-react';
import { HOUSES, YEAR_GROUPS, CLASSES } from '@/lib/constants';
import { format } from 'date-fns';
import { toast } from 'sonner';
import DashboardCountdown from '@/components/DashboardCountdown';

interface Submission {
  id: string;
  user_id: string;
  title: string;
  author: string;
  category_number: number;
  category_name: string;
  date_started: string;
  date_finished: string;
  reflection: string;
  points_earned: number;
  created_at: string;
}

interface Profile {
  full_name: string;
  email: string;
  year_group: string;
  class_name: string;
  house: string;
}

interface SubmissionWithProfile extends Submission {
  profiles: Profile;
}

interface PendingSubmission {
  id: string;
  email: string;
  student_name: string;
  year_group: string;
  class_name: string;
  house: string;
  category_number: number;
  category_name: string;
  title: string;
  author: string;
  date_started: string;
  date_finished: string;
  reflection: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionWithProfile[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHouse, setFilterHouse] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('submissions');
  
  // AI Analyzer
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<string>('house');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  
  // Bulk Import
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStaff = profile?.role && profile.role !== 'student';

  useEffect(() => {
    if (!authLoading && !isStaff) {
      navigate('/dashboard');
    }
  }, [authLoading, isStaff, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isStaff) return;

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('book_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, year_group, class_name, house');

      if (!submissionsError && submissionsData && profilesData) {
        const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
        const enrichedSubmissions = submissionsData.map(sub => ({
          ...sub,
          profiles: profileMap.get(sub.user_id) || null
        }));
        setSubmissions(enrichedSubmissions as unknown as SubmissionWithProfile[]);
      }

      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pendingError && pendingData) {
        setPendingSubmissions(pendingData as PendingSubmission[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [isStaff]);

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHouse = filterHouse === 'all' || sub.profiles?.house === filterHouse;
    const matchesYear = filterYear === 'all' || sub.profiles?.year_group === filterYear;
    const matchesClass = filterClass === 'all' || sub.profiles?.class_name === filterClass;

    return matchesSearch && matchesHouse && matchesYear && matchesClass;
  });

  const filteredPending = pendingSubmissions.filter(sub => {
    const matchesSearch = 
      sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHouse = filterHouse === 'all' || sub.house === filterHouse;
    const matchesYear = filterYear === 'all' || sub.year_group === filterYear;

    return matchesSearch && matchesHouse && matchesYear;
  });

  const exportToCSV = () => {
    if (activeTab === 'submissions') {
      const headers = ['Student Name', 'Email', 'Year Group', 'Class', 'House', 'Category', 'Book Title', 'Author', 'Date Started', 'Date Finished', 'Points', 'Reflection'];
      const rows = filteredSubmissions.map(sub => [
        sub.profiles?.full_name || '',
        sub.profiles?.email || '',
        sub.profiles?.year_group || '',
        sub.profiles?.class_name || '',
        sub.profiles?.house || '',
        `${sub.category_number}. ${sub.category_name}`,
        sub.title,
        sub.author,
        sub.date_started,
        sub.date_finished,
        sub.points_earned,
        sub.reflection.replace(/"/g, '""'),
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      downloadCSV(csv, 'book_submissions.csv');
    } else if (activeTab === 'pending') {
      const headers = ['Student Name', 'Email', 'Year Group', 'Class', 'House', 'Category', 'Book Title', 'Author', 'Date Started', 'Date Finished', 'Reflection'];
      const rows = filteredPending.map(sub => [
        sub.student_name,
        sub.email,
        sub.year_group,
        sub.class_name,
        sub.house,
        `${sub.category_number}. ${sub.category_name}`,
        sub.title,
        sub.author,
        sub.date_started,
        sub.date_finished,
        sub.reflection.replace(/"/g, '""'),
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      downloadCSV(csv, 'pending_submissions.csv');
    }
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // AI Analysis
  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisResult('');
    
    try {
      let analysisData: Record<string, unknown> = {};
      
      switch (analysisType) {
        case 'house':
          const houseStats = HOUSES.map(house => {
            const houseSubmissions = submissions.filter(s => s.profiles?.house === house);
            const students = new Set(houseSubmissions.map(s => s.user_id)).size;
            return {
              house,
              total_books: houseSubmissions.length,
              unique_students: students,
              total_points: houseSubmissions.reduce((sum, s) => sum + s.points_earned, 0),
              avg_per_student: students > 0 ? (houseSubmissions.length / students).toFixed(1) : 0,
            };
          });
          analysisData = { houses: houseStats };
          break;
          
        case 'year_group':
          const yearStats = YEAR_GROUPS.map(year => {
            const yearSubmissions = submissions.filter(s => s.profiles?.year_group === year);
            const students = new Set(yearSubmissions.map(s => s.user_id)).size;
            return {
              year_group: year,
              total_books: yearSubmissions.length,
              unique_students: students,
              total_points: yearSubmissions.reduce((sum, s) => sum + s.points_earned, 0),
            };
          });
          analysisData = { year_groups: yearStats };
          break;
          
        case 'category':
          const categoryStats: Record<number, number> = {};
          submissions.forEach(s => {
            categoryStats[s.category_number] = (categoryStats[s.category_number] || 0) + 1;
          });
          analysisData = { categories: categoryStats, total_submissions: submissions.length };
          break;
      }

      const { data, error } = await supabase.functions.invoke('analyze-progress', {
        body: { analysis_type: analysisType, data: analysisData },
      });

      if (error) throw error;
      setAnalysisResult(data.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  // File Import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportPreview([]);

    try {
      let csvContent = '';
      
      if (file.name.endsWith('.csv')) {
        csvContent = await file.text();
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast.error('Excel files require conversion. Please export as CSV first.');
        setImporting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('extract-sheet-data', {
        body: { csv_content: csvContent, preview_only: true },
      });

      if (error) throw error;

      setImportPreview(data.data || []);
      toast.success(`Found ${data.count} records to import`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (importPreview.length === 0) return;

    setImporting(true);
    try {
      const insertData = importPreview.map(item => ({
        student_name: item.student_name || 'Unknown',
        email: item.email || 'unknown@school.edu',
        year_group: item.year_group || null,
        class_name: item.class_name || null,
        house: item.house || null,
        category_number: item.category_number || 15,
        category_name: item.category_name || 'Free Choice',
        title: item.title || 'Unknown Title',
        author: item.author || 'Unknown Author',
        date_started: item.date_started || new Date().toISOString().split('T')[0],
        date_finished: item.date_finished || new Date().toISOString().split('T')[0],
        reflection: item.reflection || 'No reflection provided',
      }));

      const { data, error } = await supabase
        .from('pending_submissions')
        .insert(insertData)
        .select();

      if (error) throw error;

      toast.success(`Imported ${data.length} records to pending submissions`);
      setPendingSubmissions(prev => [...data, ...prev]);
      setImportPreview([]);
    } catch (error) {
      console.error('Confirm import error:', error);
      toast.error('Failed to import records');
    } finally {
      setImporting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (!isStaff) {
    return null;
  }

  const totalBooks = submissions.length;
  const totalPending = pendingSubmissions.length;
  const uniqueStudents = new Set(submissions.map(s => s.user_id)).size;
  const totalPoints = submissions.reduce((sum, s) => sum + s.points_earned, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Admin Dashboard 📊
          </h1>
          <p className="text-muted-foreground">
            View, analyze, and manage all student submissions.
          </p>
        </div>

        <DashboardCountdown />

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalBooks}</div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{uniqueStudents}</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalPending}</div>
                  <div className="text-sm text-muted-foreground">Pending Import</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="submissions" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Filter className="w-4 h-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="gap-2">
              <Brain className="w-4 h-4" />
              AI Analyzer
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Filters - shown for submissions and pending tabs */}
          {(activeTab === 'submissions' || activeTab === 'pending') && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, book title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterHouse} onValueChange={setFilterHouse}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue placeholder="House" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Houses</SelectItem>
                      {HOUSES.map(house => (
                        <SelectItem key={house} value={house}>{house}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {YEAR_GROUPS.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {CLASSES.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={exportToCSV} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>All Submissions ({filteredSubmissions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Year/Class</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.slice(0, 100).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sub.profiles?.full_name}</div>
                              <div className="text-xs text-muted-foreground">{sub.profiles?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {sub.profiles?.year_group} {sub.profiles?.class_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.profiles?.house}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-[200px] truncate">
                              #{sub.category_number} {sub.category_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium max-w-[200px] truncate">{sub.title}</div>
                              <div className="text-xs text-muted-foreground">{sub.author}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(sub.date_finished), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gold">+{sub.points_earned}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Submissions ({filteredPending.length})</CardTitle>
                <CardDescription>Submissions from CSV import awaiting user registration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Year/Class</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.slice(0, 100).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sub.student_name}</div>
                              <div className="text-xs text-muted-foreground">{sub.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{sub.year_group} {sub.class_name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.house}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-[200px] truncate">
                              #{sub.category_number} {sub.category_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium max-w-[200px] truncate">{sub.title}</div>
                              <div className="text-xs text-muted-foreground">{sub.author}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(sub.date_finished), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analyzer Tab */}
          <TabsContent value="analyzer">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    AI Progress Analyzer
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered insights on reading progress across different dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Analysis Type</label>
                    <Select value={analysisType} onValueChange={setAnalysisType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            House Competition Analysis
                          </div>
                        </SelectItem>
                        <SelectItem value="year_group">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Year Group Progress
                          </div>
                        </SelectItem>
                        <SelectItem value="category">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Category Popularity
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={runAnalysis} disabled={analyzing} className="w-full gap-2">
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {analysisResult ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                        {analysisResult}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                        <Brain className="w-12 h-12 mb-4 opacity-50" />
                        <p>Select an analysis type and click "Run Analysis" to get AI-powered insights</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" />
                    Bulk Import
                  </CardTitle>
                  <CardDescription>
                    Upload CSV files with book submissions. AI will extract and map the data automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a CSV file with student book submissions
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      variant="outline"
                      className="gap-2"
                    >
                      {importing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Select File
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Expected columns (AI will map automatically):</p>
                    <p>Student Name, Email, Year Group, Class, House, Category, Book Title, Author, Date Started, Date Finished, Reflection</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Import Preview ({importPreview.length} records)</CardTitle>
                </CardHeader>
                <CardContent>
                  {importPreview.length > 0 ? (
                    <>
                      <ScrollArea className="h-[300px] mb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Book</TableHead>
                              <TableHead>Category</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importPreview.slice(0, 20).map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <div className="text-sm">{item.student_name}</div>
                                  <div className="text-xs text-muted-foreground">{item.email}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{item.title}</div>
                                  <div className="text-xs text-muted-foreground">{item.author}</div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  #{item.category_number}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button onClick={confirmImport} disabled={importing} className="flex-1 gap-2">
                          {importing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          Import {importPreview.length} Records
                        </Button>
                        <Button variant="outline" onClick={() => setImportPreview([])}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                      <FileSpreadsheet className="w-12 h-12 mb-4 opacity-50" />
                      <p>Upload a file to preview the data before importing</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
