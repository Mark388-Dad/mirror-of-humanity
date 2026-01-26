import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Users, BookOpen, Trophy, Filter } from 'lucide-react';
import { HOUSES, YEAR_GROUPS, CLASSES } from '@/lib/constants';
import { format } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState<'submissions' | 'pending'>('submissions');

  const isStaff = profile?.role && profile.role !== 'student';

  useEffect(() => {
    if (!authLoading && !isStaff) {
      navigate('/dashboard');
    }
  }, [authLoading, isStaff, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isStaff) return;

      // Fetch all submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('book_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, year_group, class_name, house');

      if (!submissionsError && submissionsData && profilesData) {
        // Join submissions with profiles manually
        const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
        const enrichedSubmissions = submissionsData.map(sub => ({
          ...sub,
          profiles: profileMap.get(sub.user_id) || null
        }));
        setSubmissions(enrichedSubmissions as unknown as SubmissionWithProfile[]);
      }

      // Fetch pending submissions
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
    const dataToExport = activeTab === 'submissions' ? filteredSubmissions : filteredPending;
    
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
    } else {
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
            View and manage all student submissions.
          </p>
        </div>

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

        {/* Filters */}
        <Card className="mb-6">
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

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === 'submissions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('submissions')}
          >
            Registered Submissions ({filteredSubmissions.length})
          </Button>
          <Button 
            variant={activeTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pending')}
          >
            Pending Import ({filteredPending.length})
          </Button>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'submissions' ? 'All Submissions' : 'Pending Submissions (From CSV Import)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {activeTab === 'submissions' ? (
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
                    {filteredSubmissions.map((sub) => (
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
              ) : (
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
                    {filteredPending.map((sub) => (
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
              )}
              {(activeTab === 'submissions' ? filteredSubmissions : filteredPending).length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  No submissions found matching your filters.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
