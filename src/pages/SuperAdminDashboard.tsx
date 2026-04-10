import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Shield, Users, BookOpen, Trophy, Activity, Settings, Database,
  Search, UserCog, Trash2, Edit, Eye, BarChart3, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Download,
  Zap, Globe, Lock, Unlock, Crown, Loader2
} from 'lucide-react';
import { HOUSES, YEAR_GROUPS, CLASSES } from '@/lib/constants';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { VibrantDashboardCard } from '@/components/VibrantDashboardCard';
import DashboardCountdown from '@/components/DashboardCountdown';

interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalStaff: number;
  totalSubmissions: number;
  totalChallenges: number;
  activeChallenges: number;
  totalPoints: number;
  pendingReviews: number;
}

interface UserRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  year_group: string | null;
  class_name: string | null;
  house: string | null;
  created_at: string;
}

interface ChallengeRecord {
  id: string;
  title: string;
  challenge_type: string;
  is_active: boolean | null;
  is_featured: boolean | null;
  start_date: string;
  end_date: string;
  target_books: number | null;
  created_at: string;
  participant_count?: number;
  submission_count?: number;
}

interface ActivityLog {
  type: 'submission' | 'signup' | 'challenge';
  description: string;
  timestamp: string;
  user_name?: string;
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
}

const SuperAdminDashboard = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalStudents: 0, totalStaff: 0,
    totalSubmissions: 0, totalChallenges: 0, activeChallenges: 0,
    totalPoints: 0, pendingReviews: 0
  });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const isLibrarian = profile?.role === 'librarian';

  useEffect(() => {
    if (!authLoading && !isLibrarian) {
      navigate('/dashboard');
    }
  }, [authLoading, isLibrarian, navigate]);

  useEffect(() => {
    if (isLibrarian) fetchAllData();
  }, [isLibrarian]);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const [
        { count: userCount },
        { count: studentCount },
        { count: staffCount },
        { count: submissionCount },
        { data: challengeData },
        { count: pendingCount },
        { data: submissionPoints },
        { data: profileData },
        { data: recentSubmissions },
        { data: participantData },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'student'),
        supabase.from('book_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('book_submissions').select('*', { count: 'exact', head: true }).eq('approval_status', 'flagged'),
        supabase.from('book_submissions').select('points_earned'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('book_submissions').select('title, created_at, profiles!book_submissions_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(20),
        supabase.from('challenge_participants').select('challenge_id'),
        supabase.from('system_settings').select('*')
      ]);

      setSettings((settingsData || []) as unknown as SystemSetting[]);

      const totalPoints = submissionPoints?.reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0;
      const activeChallenges = challengeData?.filter(c => c.is_active).length || 0;

      setStats({
        totalUsers: userCount || 0,
        totalStudents: studentCount || 0,
        totalStaff: staffCount || 0,
        totalSubmissions: submissionCount || 0,
        totalChallenges: challengeData?.length || 0,
        activeChallenges,
        totalPoints,
        pendingReviews: pendingCount || 0
      });

      setUsers((profileData || []) as UserRecord[]);

      // Enrich challenges with participant/submission counts
      const participantCounts: Record<string, number> = {};
      participantData?.forEach(p => {
        participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1;
      });

      const enrichedChallenges = (challengeData || []).map(c => ({
        ...c,
        participant_count: participantCounts[c.id] || 0,
      })) as ChallengeRecord[];
      setChallenges(enrichedChallenges);

      // Build activity feed
      const activityFeed: ActivityLog[] = [];
      recentSubmissions?.forEach(s => {
        activityFeed.push({
          type: 'submission',
          description: `submitted "${s.title}"`,
          timestamp: s.created_at,
          user_name: (s as any).profiles?.full_name || 'Unknown'
        });
      });
      activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activityFeed.slice(0, 30));

    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleChallengeStatus = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase.from('challenges').update({ is_active: !currentStatus }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(currentStatus ? 'Challenge deactivated' : 'Challenge activated');
    fetchAllData();
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean | null) => {
    const { error } = await supabase.from('challenges').update({ is_featured: !currentFeatured }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(currentFeatured ? 'Removed from featured' : 'Marked as featured');
    fetchAllData();
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole as any }).eq('user_id', userId);
    if (error) { toast.error('Failed to update role'); return; }
    toast.success('User role updated');
    fetchAllData();
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const exportUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Year Group', 'Class', 'House', 'Joined'];
    const rows = filteredUsers.map(u => [
      u.full_name, u.email, u.role, u.year_group || '', u.class_name || '',
      u.house || '', format(new Date(u.created_at), 'yyyy-MM-dd')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'platform_users.csv';
    link.click();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLibrarian) return null;

  const roleColors: Record<string, string> = {
    student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    librarian: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    homeroom_tutor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    head_of_year: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    house_patron: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    staff: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Super Admin Control Center
                </h1>
                <p className="text-muted-foreground">Full platform oversight & management</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllData()}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <DashboardCountdown />

        {/* Top-level Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <VibrantDashboardCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} color="blue" delay={0} />
          <VibrantDashboardCard title="Total Submissions" value={stats.totalSubmissions} icon={<BookOpen className="h-5 w-5" />} color="green" delay={0.05} />
          <VibrantDashboardCard title="Active Challenges" value={stats.activeChallenges} icon={<Zap className="h-5 w-5" />} color="purple" delay={0.1} />
          <VibrantDashboardCard title="Total Points" value={stats.totalPoints.toLocaleString()} icon={<Trophy className="h-5 w-5" />} color="gold" delay={0.15} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <VibrantDashboardCard title="Students" value={stats.totalStudents} icon={<Users className="h-5 w-5" />} color="blue" delay={0.2} />
          <VibrantDashboardCard title="Staff" value={stats.totalStaff} icon={<Shield className="h-5 w-5" />} color="orange" delay={0.25} />
          <VibrantDashboardCard title="All Challenges" value={stats.totalChallenges} icon={<Globe className="h-5 w-5" />} color="purple" delay={0.3} />
          <VibrantDashboardCard title="Flagged" value={stats.pendingReviews} icon={<AlertTriangle className="h-5 w-5" />} color="red" delay={0.35} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" />Overview</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><UserCog className="w-4 h-4" />User Management</TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2"><Trophy className="w-4 h-4" />Challenge Control</TabsTrigger>
            <TabsTrigger value="activity" className="gap-2"><Activity className="w-4 h-4" />Activity Feed</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" />System Settings</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* House Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> House Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {HOUSES.map(house => {
                      const count = users.filter(u => u.house === house && u.role === 'student').length;
                      const pct = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;
                      return (
                        <div key={house} className="flex items-center justify-between">
                          <span className="font-medium">{house}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full bg-primary rounded-full"
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Role Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Role Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['student', 'librarian', 'homeroom_tutor', 'head_of_year', 'house_patron', 'staff'].map(role => {
                      const count = users.filter(u => u.role === role).length;
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <Badge className={roleColors[role]}>{role.replace(/_/g, ' ')}</Badge>
                          <span className="font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Year Group Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Year Group Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {YEAR_GROUPS.map(yg => {
                      const count = users.filter(u => u.year_group === yg).length;
                      const pct = stats.totalStudents > 0 ? Math.round((count / stats.totalStudents) * 100) : 0;
                      return (
                        <div key={yg} className="flex items-center justify-between">
                          <span className="font-medium">{yg}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="h-full bg-green-500 rounded-full"
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Latest Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[260px]">
                    <div className="space-y-3">
                      {activities.slice(0, 10).map((act, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="mt-1">
                            {act.type === 'submission' && <BookOpen className="h-4 w-4 text-green-500" />}
                            {act.type === 'signup' && <Users className="h-4 w-4 text-blue-500" />}
                            {act.type === 'challenge' && <Trophy className="h-4 w-4 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{act.user_name}</span>{' '}
                            <span className="text-muted-foreground">{act.description}</span>
                            <div className="text-xs text-muted-foreground">{format(new Date(act.timestamp), 'MMM d, h:mm a')}</div>
                          </div>
                        </motion.div>
                      ))}
                      {activities.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">No recent activity</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USER MANAGEMENT TAB */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> User Management</CardTitle>
                    <CardDescription>{filteredUsers.length} users found</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportUsers} className="gap-2">
                    <Download className="h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                      <SelectItem value="homeroom_tutor">Tutor</SelectItem>
                      <SelectItem value="head_of_year">Head of Year</SelectItem>
                      <SelectItem value="house_patron">House Patron</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.slice(0, 100).map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={roleColors[user.role] || ''}>{user.role.replace(/_/g, ' ')}</Badge>
                          </TableCell>
                          <TableCell>{user.house || '—'}</TableCell>
                          <TableCell>{user.year_group || '—'}</TableCell>
                          <TableCell className="text-sm">{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Select onValueChange={(val) => updateUserRole(user.user_id, val)}>
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="librarian">Librarian</SelectItem>
                                <SelectItem value="homeroom_tutor">Tutor</SelectItem>
                                <SelectItem value="head_of_year">Head of Year</SelectItem>
                                <SelectItem value="house_patron">House Patron</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredUsers.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground py-4">Showing first 100 of {filteredUsers.length} users</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHALLENGE CONTROL TAB */}
          <TabsContent value="challenges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Challenge Control Panel</CardTitle>
                <CardDescription>Manage all challenges across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {challenges.map((challenge, i) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="border">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{challenge.title}</h3>
                                  {challenge.is_active && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>}
                                  {!challenge.is_active && <Badge variant="secondary">Inactive</Badge>}
                                  {challenge.is_featured && <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">⭐ Featured</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                                  <span>Type: <strong>{challenge.challenge_type}</strong></span>
                                  <span>Target: <strong>{challenge.target_books || '—'} books</strong></span>
                                  <span>Participants: <strong>{challenge.participant_count || 0}</strong></span>
                                  <span>{format(new Date(challenge.start_date), 'MMM d')} → {format(new Date(challenge.end_date), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Active</span>
                                  <Switch checked={!!challenge.is_active} onCheckedChange={() => toggleChallengeStatus(challenge.id, challenge.is_active)} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Featured</span>
                                  <Switch checked={!!challenge.is_featured} onCheckedChange={() => toggleFeatured(challenge.id, challenge.is_featured)} />
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate('/librarian')} className="gap-1">
                                  <Edit className="h-3 w-3" /> Edit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {challenges.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No challenges found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY FEED TAB */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Platform Activity Feed</CardTitle>
                <CardDescription>Real-time view of all platform actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {activities.map((act, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                          {act.type === 'submission' && <BookOpen className="h-5 w-5 text-green-500" />}
                          {act.type === 'signup' && <Users className="h-5 w-5 text-blue-500" />}
                          {act.type === 'challenge' && <Trophy className="h-5 w-5 text-purple-500" />}
                        </div>
                        <div className="flex-1">
                          <p>
                            <span className="font-semibold">{act.user_name}</span>{' '}
                            <span className="text-muted-foreground">{act.description}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(act.timestamp), 'EEEE, MMM d, yyyy · h:mm a')}</p>
                        </div>
                      </motion.div>
                    ))}
                    {activities.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
