import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2, Trophy, Calendar, CheckCircle, XCircle, AlertCircle, Home, Key, Upload, Cloud, Sparkles, Settings, Users, Tag, Award, Pencil, Copy, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import HomepageEditor from '@/components/HomepageEditor';
import AccessCodeManager from '@/components/AccessCodeManager';
import FileUploadManager from '@/components/FileUploadManager';
import GoogleSheetSync from '@/components/GoogleSheetSync';
import EnhancedChallengeCreator from '@/components/EnhancedChallengeCreator';
import MemberManagement from '@/components/MemberManagement';
import LibrarianUserManager from '@/components/LibrarianUserManager';
import CategoryManager from '@/components/CategoryManager';
import CertificateManager from '@/components/CertificateManager';
import ChallengesManager from '@/components/ChallengesManager';
import CountdownEditor from '@/components/CountdownEditor';
import { VibrantDashboardCard, FollettLibraryButton } from '@/components/VibrantDashboardCard';
import DashboardCountdown from '@/components/DashboardCountdown';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_books: number | null;
  points_reward: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  is_independent: boolean;
  created_at: string;
  category: string | null;
  difficulty_level: string | null;
  participation_type: string | null;
  allowed_year_groups: string[] | null;
  allowed_houses: string[] | null;
  allowed_classes: string[] | null;
  requires_submission: boolean | null;
  evidence_type: string | null;
  leaderboard_type: string | null;
  badge_name: string | null;
}

interface FlaggedSubmission {
  id: string;
  title: string;
  author: string;
  reflection: string;
  approval_status: string | null;
  ai_feedback: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    year_group: string | null;
    class_name: string | null;
  } | null;
}

interface Stats {
  totalStudents: number;
  totalSubmissions: number;
  activeChallenges: number;
  pendingReviews: number;
}

const LibrarianDashboard = () => {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [flaggedSubmissions, setFlaggedSubmissions] = useState<FlaggedSubmission[]>([]);
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, totalSubmissions: 0, activeChallenges: 0, pendingReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState('submissions');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: challengeData } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
    setChallenges((challengeData as Challenge[]) || []);

    const { data: flaggedData } = await supabase
      .from('book_submissions')
      .select(`id, title, author, reflection, approval_status, ai_feedback, created_at,
        profiles!book_submissions_user_id_fkey (full_name, year_group, class_name)`)
      .eq('approval_status', 'flagged')
      .order('created_at', { ascending: false });
    setFlaggedSubmissions((flaggedData as unknown as FlaggedSubmission[]) || []);

    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: submissionCount } = await supabase.from('book_submissions').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('pending_submissions').select('*', { count: 'exact', head: true }).is('imported_to_user_id', null);

    setStats({
      totalStudents: studentCount || 0,
      totalSubmissions: submissionCount || 0,
      activeChallenges: challengeData?.filter(c => c.is_active).length || 0,
      pendingReviews: (flaggedData?.length || 0) + (pendingCount || 0),
    });
    setLoading(false);
  };

  const handleSubmissionAction = async (submissionId: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase.from('book_submissions')
      .update({ approval_status: action, reviewed_at: new Date().toISOString() })
      .eq('id', submissionId);
    if (error) toast.error('Failed to update');
    else { toast.success(`Submission ${action}`); fetchData(); }
  };

  const toggleChallengeStatus = async (challengeId: string, isActive: boolean | null) => {
    const { error } = await supabase.from('challenges').update({ is_active: !isActive }).eq('id', challengeId);
    if (error) toast.error('Failed to update');
    else { toast.success(isActive ? 'Deactivated' : 'Activated'); fetchData(); }
  };

  if (profile?.role !== 'librarian') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">Only librarians can access this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Librarian Command Center 📚
              </h1>
              <p className="text-muted-foreground">Full control over challenges, content, and the reading program</p>
            </div>
            <FollettLibraryButton />
          </div>
        </motion.div>

        <DashboardCountdown />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <VibrantDashboardCard title="Total Students" value={stats.totalStudents} icon={<BookOpen className="h-5 w-5" />} color="blue" />
          <VibrantDashboardCard title="Book Submissions" value={stats.totalSubmissions} icon={<Trophy className="h-5 w-5" />} color="green" />
          <VibrantDashboardCard title="Active Challenges" value={stats.activeChallenges} icon={<Sparkles className="h-5 w-5" />} color="purple" />
          <VibrantDashboardCard title="Pending Reviews" value={stats.pendingReviews} icon={<AlertCircle className="h-5 w-5" />} color="orange" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="submissions" className="flex items-center gap-2"><BookOpen className="w-4 h-4" />All Submissions</TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />Flagged ({flaggedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2"><Trophy className="w-4 h-4" />Challenges</TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2"><Sparkles className="w-4 h-4" />{editingChallenge ? 'Edit Challenge' : 'Create New'}</TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2"><Tag className="w-4 h-4" />Categories</TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2"><Award className="w-4 h-4" />Certificates</TabsTrigger>
            <TabsTrigger value="homepage" className="flex items-center gap-2"><Home className="w-4 h-4" />Homepage</TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2"><Cloud className="w-4 h-4" />Google Sync</TabsTrigger>
            <TabsTrigger value="codes" className="flex items-center gap-2"><Key className="w-4 h-4" />Access Codes</TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2"><Upload className="w-4 h-4" />Files</TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2"><Users className="w-4 h-4" />Members</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions"><LibrarianUserManager /></TabsContent>

          <TabsContent value="flagged">
            {flaggedSubmissions.length === 0 ? (
              <Card className="py-12 text-center"><CardContent>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No flagged submissions to review.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {flaggedSubmissions.map((submission, index) => (
                  <motion.div key={submission.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{submission.title}</h3>
                              <span className="text-muted-foreground">by {submission.author}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Submitted by: {submission.profiles?.full_name} ({submission.profiles?.year_group})</p>
                            {submission.ai_feedback && (
                              <div className="bg-background p-3 rounded-lg border">
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">AI Feedback:</p>
                                <p className="text-sm text-muted-foreground">{submission.ai_feedback}</p>
                              </div>
                            )}
                            <div className="bg-secondary p-3 rounded-lg">
                              <p className="text-sm font-medium mb-1">Reflection:</p>
                              <p className="text-sm text-muted-foreground">{submission.reflection}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleSubmissionAction(submission.id, 'approved')}>
                              <CheckCircle className="w-4 h-4 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleSubmissionAction(submission.id, 'rejected')}>
                              <XCircle className="w-4 h-4 mr-1" />Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesManager
              challenges={challenges}
              loading={loading}
              onEdit={(challenge) => { setEditingChallenge(challenge); setActiveTab('create'); }}
              onDuplicate={(challenge) => {
                const dup = { ...challenge, id: '', title: challenge.title + ' (copy)' };
                setEditingChallenge(null);
                setActiveTab('create');
                setTimeout(() => setEditingChallenge({ ...dup, id: '' } as any), 100);
              }}
              onToggleStatus={toggleChallengeStatus}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="create">
            <EnhancedChallengeCreator
              editingChallenge={editingChallenge}
              onSaved={() => { setEditingChallenge(null); fetchData(); setActiveTab('challenges'); }}
              onCancel={editingChallenge ? () => { setEditingChallenge(null); setActiveTab('challenges'); } : undefined}
            />
          </TabsContent>
          <TabsContent value="categories"><CategoryManager /></TabsContent>
          <TabsContent value="certificates"><CertificateManager /></TabsContent>
          <TabsContent value="homepage"><HomepageEditor /></TabsContent>
          <TabsContent value="sync"><GoogleSheetSync /></TabsContent>
          <TabsContent value="codes"><AccessCodeManager /></TabsContent>
          <TabsContent value="files"><FileUploadManager /></TabsContent>
          <TabsContent value="members"><MemberManagement /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LibrarianDashboard;
