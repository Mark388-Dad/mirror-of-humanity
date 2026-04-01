import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, BookOpen, CheckCircle, XCircle, AlertCircle,
  Flag, Loader2, User, Mail, Home, GraduationCap, Award, Trophy
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateTotalPoints, POINTS_PER_BOOK } from '@/lib/milestonePoints';

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  house: string | null;
  year_group: string | null;
  class_name: string | null;
  role: string;
}

interface Submission {
  id: string;
  title: string;
  author: string;
  category_name: string;
  category_number: number;
  points_earned: number;
  approval_status: string | null;
  created_at: string;
  reflection: string;
  ai_feedback: string | null;
  date_started: string;
  date_finished: string;
}

const StudentDetailView = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [houseFilter, setHouseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, house, year_group, class_name, role')
      .eq('role', 'student')
      .order('full_name');
    setStudents((data as Profile[]) || []);
    setLoading(false);
  };

  const selectStudent = async (student: Profile) => {
    setSelectedStudent(student);
    setSubLoading(true);
    const { data } = await supabase
      .from('book_submissions')
      .select('id, title, author, category_name, category_number, points_earned, approval_status, created_at, reflection, ai_feedback, date_started, date_finished')
      .eq('user_id', student.user_id)
      .order('created_at', { ascending: false });
    setSubmissions((data as Submission[]) || []);
    setSubLoading(false);
  };

  const updateStatus = async (subId: string, status: string) => {
    setActionLoading(subId);
    const { error } = await supabase
      .from('book_submissions')
      .update({ approval_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', subId);
    if (error) toast.error('Failed to update');
    else {
      toast.success(`Submission ${status}`);
      if (selectedStudent) selectStudent(selectedStudent);
    }
    setActionLoading(null);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500 text-white">✅ Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">❌ Rejected</Badge>;
      case 'flagged': return <Badge className="bg-orange-500 text-white">🚩 Flagged</Badge>;
      default: return <Badge variant="secondary">⏳ Pending</Badge>;
    }
  };

  const getAchievementLevel = (books: number) => {
    if (books >= 45) return { label: 'Gold 🥇', color: 'text-yellow-500' };
    if (books >= 30) return { label: 'Silver 🥈', color: 'text-slate-400' };
    if (books >= 15) return { label: 'Bronze 🥉', color: 'text-amber-700' };
    return { label: 'Getting Started', color: 'text-muted-foreground' };
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHouse = houseFilter === 'all' || s.house === houseFilter;
    const matchesYear = yearFilter === 'all' || s.year_group === yearFilter;
    return matchesSearch && matchesHouse && matchesYear;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Student detail view
  if (selectedStudent) {
    const totalBooks = submissions.length;
    const totalPoints = calculateTotalPoints(totalBooks);
    const achievement = getAchievementLevel(totalBooks);
    const approved = submissions.filter(s => s.approval_status === 'approved').length;
    const pending = submissions.filter(s => !s.approval_status || s.approval_status === 'pending').length;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedStudent(null)} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
        </Button>

        {/* Student Info Card */}
        <Card className="border-2 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 space-y-1 min-w-[200px]">
                <h2 className="text-2xl font-bold">{selectedStudent.full_name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" /> {selectedStudent.email}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {selectedStudent.house && (
                    <Badge variant="outline"><Home className="w-3 h-3 mr-1" />{selectedStudent.house}</Badge>
                  )}
                  {selectedStudent.year_group && (
                    <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{selectedStudent.year_group}</Badge>
                  )}
                  {selectedStudent.class_name && (
                    <Badge variant="outline">{selectedStudent.class_name}</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold">{totalBooks}</div>
                  <div className="text-xs text-muted-foreground">Books</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className={`text-lg font-bold ${achievement.color}`}>{achievement.label}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold">{approved}/{totalBooks}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions */}
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Submissions ({submissions.length})
          {pending > 0 && <Badge className="bg-yellow-500 text-white">{pending} pending</Badge>}
        </h3>

        {subLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : submissions.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent><p className="text-muted-foreground">No submissions yet.</p></CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub, i) => (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{sub.title}</h4>
                          <span className="text-sm text-muted-foreground">by {sub.author}</span>
                          {getStatusBadge(sub.approval_status)}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>📂 {sub.category_name}</span>
                          <span>⭐ {sub.points_earned} pts</span>
                          <span>📅 {format(new Date(sub.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        {sub.reflection && (
                          <p className="text-sm text-muted-foreground mt-2 bg-secondary p-2 rounded line-clamp-2">
                            {sub.reflection}
                          </p>
                        )}
                        {sub.ai_feedback && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 italic">
                            AI: {sub.ai_feedback}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600"
                          disabled={actionLoading === sub.id}
                          onClick={() => updateStatus(sub.id, 'approved')}
                          title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600"
                          disabled={actionLoading === sub.id}
                          onClick={() => updateStatus(sub.id, 'rejected')}
                          title="Reject">
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600"
                          disabled={actionLoading === sub.id}
                          onClick={() => updateStatus(sub.id, 'flagged')}
                          title="Flag">
                          <Flag className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Student list view
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Student Profiles</h2>
          <p className="text-muted-foreground">Click a student to view all their submissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={houseFilter} onValueChange={setHouseFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="House" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Houses</SelectItem>
            {['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'].map(h => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {['MYP5', 'G10', 'G11', 'G12', 'DP1', 'DP2'].map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filteredStudents.length} students</p>

      {/* Student Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStudents.map((student, i) => (
          <motion.div key={student.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.5) }}>
            <Card className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all"
              onClick={() => selectStudent(student)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {student.house && <Badge variant="outline" className="text-xs">{student.house}</Badge>}
                  {student.year_group && <Badge variant="outline" className="text-xs">{student.year_group}</Badge>}
                  {student.class_name && <Badge variant="outline" className="text-xs">{student.class_name}</Badge>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StudentDetailView;
