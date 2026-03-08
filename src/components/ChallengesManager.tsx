import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Calendar, Pencil, Copy, Loader2, Search, Users, BookOpen, Target, Clock, Star, Filter, BarChart3, Zap, ArrowLeft, Eye, ChevronDown, Award, Flame, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ChallengesManagerProps {
  challenges: Challenge[];
  loading: boolean;
  onEdit: (challenge: Challenge) => void;
  onDuplicate: (challenge: Challenge) => void;
  onToggleStatus: (challengeId: string, isActive: boolean | null) => void;
  onRefresh: () => void;
}

interface DetailParticipant {
  id: string;
  user_id: string;
  joined_at: string;
  books_completed: number | null;
  completed_at: string | null;
  profile?: { full_name: string; year_group: string | null; house: string | null; class_name: string | null };
}

interface DetailSubmission {
  id: string;
  user_id: string;
  title: string;
  author: string;
  category_name: string;
  points_earned: number;
  reflection: string;
  created_at: string;
  profile?: { full_name: string; year_group: string | null; house: string | null };
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string; glow: string }> = {
  reading: { label: 'Reading', emoji: '📚', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30', glow: 'shadow-blue-500/20' },
  genre_explorer: { label: 'Genre Explorer', emoji: '🗺️', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  reflection: { label: 'Read & Reflect', emoji: '✍️', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30', glow: 'shadow-violet-500/20' },
  performance: { label: 'Perform', emoji: '🎭', color: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30', glow: 'shadow-pink-500/20' },
  house_competition: { label: 'House', emoji: '🏠', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', glow: 'shadow-amber-500/20' },
  ai_buddy: { label: 'AI Buddy', emoji: '🤖', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30', glow: 'shadow-indigo-500/20' },
  creative_response: { label: 'Creative', emoji: '🎨', color: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30', glow: 'shadow-fuchsia-500/20' },
  daily_streak: { label: 'Streak', emoji: '🔥', color: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30', glow: 'shadow-red-500/20' },
  classic_modern: { label: 'Classic vs Modern', emoji: '📖', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30', glow: 'shadow-slate-500/20' },
  book_to_life: { label: 'Book-to-Life', emoji: '🌍', color: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30', glow: 'shadow-green-500/20' },
  timed_sprint: { label: 'Sprint', emoji: '⏱️', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  category: { label: 'Category', emoji: '🏷️', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30', glow: 'shadow-sky-500/20' },
  custom: { label: 'Custom', emoji: '⚡', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30', glow: 'shadow-orange-500/20' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-500/15 text-green-700 dark:text-green-300', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300', icon: '⚡' },
  advanced: { label: 'Advanced', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-300', icon: '🔥' },
  expert: { label: 'Expert', color: 'bg-red-500/15 text-red-700 dark:text-red-300', icon: '💎' },
};

const HOUSE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Kenya: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  Longonot: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  Elgon: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  Kilimanjaro: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

const ChallengesManager = ({ challenges, loading, onEdit, onDuplicate, onToggleStatus, onRefresh }: ChallengesManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [detailParticipants, setDetailParticipants] = useState<DetailParticipant[]>([]);
  const [detailSubmissions, setDetailSubmissions] = useState<DetailSubmission[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'participants' | 'submissions'>('submissions');

  useEffect(() => {
    fetchChallengeStats();
  }, [challenges]);

  const fetchChallengeStats = async () => {
    if (challenges.length === 0) return;
    const ids = challenges.map(c => c.id);
    const [{ data: participants }, { data: submissions }] = await Promise.all([
      supabase.from('challenge_participants').select('challenge_id').in('challenge_id', ids),
      supabase.from('challenge_submissions').select('challenge_id').in('challenge_id', ids),
    ]);
    const pCounts: Record<string, number> = {};
    const sCounts: Record<string, number> = {};
    participants?.forEach(p => { pCounts[p.challenge_id] = (pCounts[p.challenge_id] || 0) + 1; });
    submissions?.forEach(s => { sCounts[s.challenge_id] = (sCounts[s.challenge_id] || 0) + 1; });
    setParticipantCounts(pCounts);
    setSubmissionCounts(sCounts);
  };

  const openDetailView = async (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setDetailLoading(true);
    setDetailTab('submissions');

    const [{ data: parts }, { data: subs }] = await Promise.all([
      supabase.from('challenge_participants').select('*').eq('challenge_id', challenge.id).order('joined_at', { ascending: false }),
      supabase.from('challenge_submissions').select('*').eq('challenge_id', challenge.id).order('created_at', { ascending: false }),
    ]);

    const allUserIds = [...(parts || []).map(p => p.user_id), ...(subs || []).map(s => s.user_id)];
    const uniqueIds = [...new Set(allUserIds)];
    
    const { data: profiles } = uniqueIds.length > 0
      ? await supabase.from('profiles').select('user_id, full_name, year_group, house, class_name').in('user_id', uniqueIds)
      : { data: [] };

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = p; });

    setDetailParticipants((parts || []).map(p => ({ ...p, profile: profileMap[p.user_id] })));
    setDetailSubmissions((subs || []).map(s => ({ ...s, profile: profileMap[s.user_id] })));
    setDetailLoading(false);
  };

  const getChallengeStatus = (challenge: Challenge) => {
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    if (!challenge.is_active) return { label: 'Paused', color: 'bg-muted text-muted-foreground', icon: '⏸️' };
    if (isFuture(start)) return { label: 'Upcoming', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300', icon: '🕐' };
    if (isPast(end)) return { label: 'Ended', color: 'bg-muted text-muted-foreground', icon: '✅' };
    return { label: 'Live', color: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30', icon: '🟢' };
  };

  const getTimeProgress = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const total = differenceInDays(end, start) || 1;
    const elapsed = differenceInDays(now, start);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getDaysRemaining = (challenge: Challenge) => {
    const now = new Date();
    const end = new Date(challenge.end_date);
    const days = differenceInDays(end, now);
    if (days < 0) return 'Ended';
    if (days === 0) return 'Last day!';
    return `${days}d left`;
  };

  const filtered = challenges.filter(c => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && !c.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'active' && !c.is_active) return false;
    if (statusFilter === 'inactive' && c.is_active) return false;
    if (statusFilter === 'featured' && !c.is_featured) return false;
    if (statusFilter === 'live') { if (getChallengeStatus(c).label !== 'Live') return false; }
    if (statusFilter === 'ended') { if (getChallengeStatus(c).label !== 'Ended') return false; }
    if (typeFilter !== 'all' && c.challenge_type !== typeFilter) return false;
    return true;
  });

  const summaryStats = {
    total: challenges.length,
    live: challenges.filter(c => getChallengeStatus(c).label === 'Live').length,
    totalParticipants: Object.values(participantCounts).reduce((a, b) => a + b, 0),
    totalSubmissions: Object.values(submissionCounts).reduce((a, b) => a + b, 0),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-lg text-muted-foreground font-medium">Loading challenges...</p>
      </div>
    );
  }

  // ==================== DETAIL VIEW ====================
  if (selectedChallenge) {
    const ch = selectedChallenge;
    const status = getChallengeStatus(ch);
    const catInfo = CATEGORY_LABELS[ch.challenge_type] || CATEGORY_LABELS.custom;
    const diffInfo = DIFFICULTY_CONFIG[ch.difficulty_level || 'intermediate'];
    const timeProgress = getTimeProgress(ch);
    const daysLeft = getDaysRemaining(ch);
    const totalSubmissionPoints = detailSubmissions.reduce((sum, s) => sum + s.points_earned, 0);

    const timelineMap: Record<string, number> = {};
    detailSubmissions.forEach(s => {
      const day = format(new Date(s.created_at), 'MMM d');
      timelineMap[day] = (timelineMap[day] || 0) + 1;
    });
    const timelineEntries = Object.entries(timelineMap);
    const maxTimeline = Math.max(...Object.values(timelineMap), 1);

    const houseBreakdown: Record<string, { participants: number; submissions: number }> = {};
    detailParticipants.forEach(p => {
      const h = p.profile?.house || 'Unknown';
      if (!houseBreakdown[h]) houseBreakdown[h] = { participants: 0, submissions: 0 };
      houseBreakdown[h].participants++;
    });
    detailSubmissions.forEach(s => {
      const h = s.profile?.house || 'Unknown';
      if (!houseBreakdown[h]) houseBreakdown[h] = { participants: 0, submissions: 0 };
      houseBreakdown[h].submissions++;
    });

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-2 border-primary/20 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedChallenge(null)} className="gap-2 hover:bg-primary/10">
                  <ArrowLeft className="w-4 h-4" /> Back to Challenges
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="text-3xl lg:text-4xl font-display font-bold tracking-tight"
                  >
                    {ch.title}
                  </motion.h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${catInfo.color}`}>{catInfo.emoji} {catInfo.label}</Badge>
                  <Badge variant="outline" className={`text-sm px-3 py-1 ${status.color}`}>{status.icon} {status.label}</Badge>
                  {ch.is_featured && <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 text-sm px-3 py-1"><Star className="w-4 h-4 mr-1" />Featured</Badge>}
                  {diffInfo && <Badge variant="outline" className={`text-sm px-3 py-1 ${diffInfo.color}`}>{diffInfo.icon} {diffInfo.label}</Badge>}
                </div>
                <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">{ch.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => onEdit(ch)} className="gap-2 h-12 px-6">
                <Pencil className="w-5 h-5" /> Edit Challenge
              </Button>
              <Button 
                variant={ch.is_active ? "destructive" : "default"} 
                size="lg" 
                onClick={() => onToggleStatus(ch.id, ch.is_active)}
                className="gap-2 h-12 px-6"
              >
                {ch.is_active ? '⏸️ Pause' : '▶️ Activate'}
              </Button>
            </div>
          </div>
        </div>

        {/* Big stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Participants', value: detailParticipants.length, icon: <Users className="h-7 w-7 text-blue-500" />, bg: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10', glow: 'hover:shadow-blue-500/10' },
            { label: 'Submissions', value: detailSubmissions.length, icon: <BookOpen className="h-7 w-7 text-green-500" />, bg: 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10', glow: 'hover:shadow-green-500/10' },
            { label: 'Total Points', value: totalSubmissionPoints, icon: <Trophy className="h-7 w-7 text-amber-500" />, bg: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10', glow: 'hover:shadow-amber-500/10' },
            { label: 'Target Books', value: ch.target_books || 1, icon: <Target className="h-7 w-7 text-purple-500" />, bg: 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10', glow: 'hover:shadow-purple-500/10' },
            { label: 'Reward', value: `${ch.points_reward || 5} pts`, icon: <Award className="h-7 w-7 text-pink-500" />, bg: 'border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10', glow: 'hover:shadow-pink-500/10' },
            { label: 'Completion', value: `${detailParticipants.filter(p => p.completed_at).length}/${detailParticipants.length}`, icon: <Star className="h-7 w-7 text-yellow-500" />, bg: 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10', glow: 'hover:shadow-yellow-500/10' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={`border-2 transition-all duration-300 hover:shadow-lg ${stat.bg} ${stat.glow}`}>
                <CardContent className="pt-6 pb-5 px-5 text-center">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ delay: i * 0.06 + 0.15, type: 'spring', stiffness: 200 }}
                    className="flex justify-center mb-3"
                  >
                    {stat.icon}
                  </motion.div>
                  <div className="text-3xl font-display font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Timeline & metadata bar */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-5 text-sm mb-5">
              <span className="flex items-center gap-2 text-muted-foreground text-base">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium">{format(new Date(ch.start_date), 'MMM d, yyyy')}</span>
                <span className="text-muted-foreground/60">→</span>
                <span className="font-medium">{format(new Date(ch.end_date), 'MMM d, yyyy')}</span>
              </span>
              <Badge variant="outline" className={`text-base px-4 py-1.5 font-semibold ${
                daysLeft === 'Ended' ? 'bg-muted' : daysLeft === 'Last day!' ? 'bg-red-500/15 text-red-600 border-red-500/30 animate-pulse' : 'bg-primary/10 text-primary border-primary/30'
              }`}>
                <Clock className="w-4 h-4 mr-1.5" /> {daysLeft}
              </Badge>
              {ch.badge_name && <Badge variant="outline" className="text-sm px-3 py-1">🏅 {ch.badge_name}</Badge>}
              {ch.allowed_year_groups?.length ? <Badge variant="outline" className="text-sm px-3 py-1">📚 {ch.allowed_year_groups.join(', ')}</Badge> : null}
              {ch.allowed_houses?.length ? <Badge variant="outline" className="text-sm px-3 py-1">🏠 {ch.allowed_houses.join(', ')}</Badge> : null}
              {ch.is_independent && <Badge variant="outline" className="text-sm px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Independent</Badge>}
            </div>
            <div>
              <Progress value={timeProgress} className="h-3 rounded-full" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span className="font-medium">{Math.round(timeProgress)}% time elapsed</span>
                <span>Created {format(new Date(ch.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* House breakdown + Submission timeline */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-xl flex items-center gap-3 font-display">
                <span className="text-2xl">🏠</span> House Breakdown
              </CardTitle>
              <CardDescription>Participation and submissions by house</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {Object.keys(houseBreakdown).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No data yet</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(houseBreakdown).sort((a, b) => b[1].submissions - a[1].submissions).map(([house, data], i) => {
                    const hc = HOUSE_COLORS[house] || { text: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' };
                    return (
                      <motion.div 
                        key={house} 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border-2 ${hc.bg} ${hc.border}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-display font-bold text-lg ${hc.text}`}>{house}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {data.participants} joined</span>
                            <span className="flex items-center gap-1 font-bold"><BookOpen className="w-4 h-4" /> {data.submissions} submitted</span>
                          </div>
                        </div>
                        <Progress value={detailSubmissions.length > 0 ? (data.submissions / detailSubmissions.length) * 100 : 0} className="h-3 rounded-full" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-xl flex items-center gap-3 font-display">
                <span className="text-2xl">📊</span> Submission Timeline
              </CardTitle>
              <CardDescription>Daily submission activity over time</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {timelineEntries.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEntries.map(([day, count], i) => (
                    <motion.div 
                      key={day} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <span className="text-sm font-medium text-muted-foreground min-w-[60px]">{day}</span>
                      <div className="flex-1 flex items-center gap-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(15, (count / maxTimeline) * 100)}%` }}
                          transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                          className="h-8 rounded-lg bg-gradient-to-r from-primary/60 to-primary flex items-center justify-end pr-3 transition-all shadow-sm"
                        >
                          <span className="text-xs font-bold text-primary-foreground">{count}</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-3 border-b-2 border-border pb-0">
          <button
            onClick={() => setDetailTab('submissions')}
            className={`flex items-center gap-2 px-6 py-4 text-base font-semibold border-b-3 transition-all ${
              detailTab === 'submissions' 
                ? 'border-b-[3px] border-primary text-primary' 
                : 'border-b-[3px] border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-5 h-5" /> Submissions 
            <Badge variant="secondary" className="ml-1 text-sm">{detailSubmissions.length}</Badge>
          </button>
          <button
            onClick={() => setDetailTab('participants')}
            className={`flex items-center gap-2 px-6 py-4 text-base font-semibold transition-all ${
              detailTab === 'participants' 
                ? 'border-b-[3px] border-primary text-primary' 
                : 'border-b-[3px] border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-5 h-5" /> Participants 
            <Badge variant="secondary" className="ml-1 text-sm">{detailParticipants.length}</Badge>
          </button>
        </div>

        {detailLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading challenge data...</p>
          </div>
        ) : detailTab === 'submissions' ? (
          <Card className="border-2 overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-2xl font-display flex items-center gap-3">
                📖 All Submissions
              </CardTitle>
              <CardDescription className="text-base">{detailSubmissions.length} book submissions for this challenge</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {detailSubmissions.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xl text-muted-foreground">No submissions yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Students haven't submitted books for this challenge</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px] font-bold text-sm">#</TableHead>
                        <TableHead className="font-bold text-sm">Student</TableHead>
                        <TableHead className="font-bold text-sm">House</TableHead>
                        <TableHead className="font-bold text-sm">Year</TableHead>
                        <TableHead className="font-bold text-sm">Book Title</TableHead>
                        <TableHead className="font-bold text-sm">Author</TableHead>
                        <TableHead className="font-bold text-sm">Category</TableHead>
                        <TableHead className="font-bold text-sm text-right">Points</TableHead>
                        <TableHead className="font-bold text-sm">Date</TableHead>
                        <TableHead className="font-bold text-sm">Reflection</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailSubmissions.map((sub, idx) => {
                        const hc = HOUSE_COLORS[sub.profile?.house || ''] || { text: 'text-muted-foreground', bg: '', border: '' };
                        return (
                          <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-bold text-muted-foreground text-base">{idx + 1}</TableCell>
                            <TableCell className="font-semibold text-base">{sub.profile?.full_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${hc.text} ${hc.bg} ${hc.border} font-semibold`}>
                                {sub.profile?.house || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{sub.profile?.year_group || '—'}</TableCell>
                            <TableCell className="max-w-[250px] font-semibold">{sub.title}</TableCell>
                            <TableCell className="text-muted-foreground">{sub.author}</TableCell>
                            <TableCell><Badge variant="outline">{sub.category_name}</Badge></TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-lg text-primary">{sub.points_earned}</span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(sub.created_at), 'MMM d, h:mm a')}</TableCell>
                            <TableCell className="max-w-[300px]">
                              <p className="text-sm text-muted-foreground line-clamp-2 italic">{sub.reflection || '—'}</p>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-2xl font-display flex items-center gap-3">
                👥 All Participants
              </CardTitle>
              <CardDescription className="text-base">{detailParticipants.length} students joined this challenge</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              {detailParticipants.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xl text-muted-foreground">No participants yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">No students have joined this challenge</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px] font-bold text-sm">#</TableHead>
                        <TableHead className="font-bold text-sm">Student</TableHead>
                        <TableHead className="font-bold text-sm">House</TableHead>
                        <TableHead className="font-bold text-sm">Year</TableHead>
                        <TableHead className="font-bold text-sm">Class</TableHead>
                        <TableHead className="font-bold text-sm text-right">Books Done</TableHead>
                        <TableHead className="font-bold text-sm min-w-[180px]">Progress</TableHead>
                        <TableHead className="font-bold text-sm">Status</TableHead>
                        <TableHead className="font-bold text-sm">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailParticipants.map((p, idx) => {
                        const target = ch.target_books || 1;
                        const done = p.books_completed || 0;
                        const pct = Math.min(100, (done / target) * 100);
                        const hc = HOUSE_COLORS[p.profile?.house || ''] || { text: 'text-muted-foreground', bg: '', border: '' };
                        return (
                          <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-bold text-muted-foreground text-base">{idx + 1}</TableCell>
                            <TableCell className="font-semibold text-base">{p.profile?.full_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${hc.text} ${hc.bg} ${hc.border} font-semibold`}>
                                {p.profile?.house || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{p.profile?.year_group || '—'}</TableCell>
                            <TableCell>{p.profile?.class_name || '—'}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-lg">{done} <span className="text-muted-foreground font-normal text-sm">/ {target}</span></span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Progress value={pct} className="h-3 flex-1 rounded-full" />
                                <span className="text-sm font-semibold min-w-[45px] text-right">{Math.round(pct)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {p.completed_at ? (
                                <Badge className="bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 text-sm px-3 py-1">✅ Complete</Badge>
                              ) : (
                                <Badge variant="outline" className="text-sm px-3 py-1">In Progress</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{format(new Date(p.joined_at), 'MMM d, h:mm a')}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  // ==================== LIST VIEW ====================
  return (
    <div className="space-y-8">
      {/* Summary Stats - BIG & BOLD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Challenges', value: summaryStats.total, icon: <Trophy className="h-8 w-8 text-purple-500" />, bg: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15', glow: 'hover:shadow-purple-500/15' },
          { label: 'Currently Live', value: summaryStats.live, icon: <Zap className="h-8 w-8 text-green-500" />, bg: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15', glow: 'hover:shadow-green-500/15' },
          { label: 'Total Participants', value: summaryStats.totalParticipants, icon: <Users className="h-8 w-8 text-blue-500" />, bg: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15', glow: 'hover:shadow-blue-500/15' },
          { label: 'Total Submissions', value: summaryStats.totalSubmissions, icon: <BookOpen className="h-8 w-8 text-amber-500" />, bg: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15', glow: 'hover:shadow-amber-500/15' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className={`border-2 transition-all duration-300 hover:shadow-lg cursor-default ${stat.bg} ${stat.glow}`}>
              <CardContent className="pt-8 pb-7 px-6 text-center">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: i * 0.08 + 0.15, type: 'spring', stiffness: 180 }}
                  className="flex justify-center mb-3"
                >
                  {stat.icon}
                </motion.div>
                <div className="text-4xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters - spacious */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search challenges by name or description..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-12 h-12 text-base" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-12 text-base">
                <Filter className="h-5 w-5 mr-2" /><SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="live">🟢 Live</SelectItem>
                <SelectItem value="active">✅ Active</SelectItem>
                <SelectItem value="inactive">⏸️ Inactive</SelectItem>
                <SelectItem value="featured">⭐ Featured</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px] h-12 text-base"><SelectValue placeholder="Challenge Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-base text-muted-foreground px-1">
        <span className="font-medium">Showing <span className="text-foreground font-bold">{filtered.length}</span> of {challenges.length} challenges</span>
        {searchQuery && <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-base">Clear search</Button>}
      </div>

      {/* Challenge Cards - BIGGER & BOLDER */}
      {filtered.length === 0 ? (
        <Card className="py-20 text-center border-2 border-dashed">
          <CardContent>
            <Trophy className="w-16 h-16 text-muted-foreground/40 mx-auto mb-5" />
            <p className="text-xl text-muted-foreground font-medium">{challenges.length === 0 ? 'No challenges created yet.' : 'No challenges match your filters.'}</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((challenge, index) => {
              const status = getChallengeStatus(challenge);
              const catInfo = CATEGORY_LABELS[challenge.challenge_type] || CATEGORY_LABELS.custom;
              const diffInfo = DIFFICULTY_CONFIG[challenge.difficulty_level || 'intermediate'];
              const participants = participantCounts[challenge.id] || 0;
              const submissions = submissionCounts[challenge.id] || 0;
              const timeProgress = getTimeProgress(challenge);
              const daysLeft = getDaysRemaining(challenge);

              return (
                <motion.div 
                  key={challenge.id} 
                  layout 
                  initial={{ opacity: 0, y: 25 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  transition={{ delay: index * 0.04 }}
                >
                  <Card 
                    className={`h-full flex flex-col transition-all duration-300 hover:shadow-xl cursor-pointer border-2 group ${
                      challenge.is_featured ? 'border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60' : 'hover:border-primary/30'
                    } ${status.label === 'Live' ? 'ring-2 ring-green-500/20' : ''}`}
                    onClick={() => openDetailView(challenge)}
                  >
                    <CardHeader className="pb-3 p-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`text-sm px-3 py-1 ${catInfo.color}`}>{catInfo.emoji} {catInfo.label}</Badge>
                        <div className="flex items-center gap-2">
                          {challenge.is_featured && (
                            <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 text-sm px-2.5 py-0.5">
                              <Star className="w-3.5 h-3.5 mr-1" />Featured
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-sm px-2.5 py-0.5 ${status.color}`}>{status.icon} {status.label}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl leading-snug font-display group-hover:text-primary transition-colors">{challenge.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed">{challenge.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between gap-5 p-6 pt-0">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: <Users className="w-5 h-5 text-blue-500" />, val: participants, label: 'Joined', bg: 'bg-blue-500/8' },
                          { icon: <BookOpen className="w-5 h-5 text-green-500" />, val: submissions, label: 'Submissions', bg: 'bg-green-500/8' },
                          { icon: <Target className="w-5 h-5 text-purple-500" />, val: challenge.target_books || 1, label: 'Target', bg: 'bg-purple-500/8' },
                        ].map(s => (
                          <div key={s.label} className={`p-3 rounded-xl ${s.bg} text-center`}>
                            <div className="flex justify-center mb-1">{s.icon}</div>
                            <div className="text-lg font-bold">{s.val}</div>
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(challenge.start_date), 'MMM d')} – {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                          </span>
                          <Badge variant="outline" className={`text-sm font-semibold ${
                            daysLeft === 'Last day!' ? 'bg-red-500/10 text-red-600 border-red-500/30' : ''
                          }`}>{daysLeft}</Badge>
                        </div>
                        <Progress value={timeProgress} className="h-2.5 rounded-full" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{Math.round(timeProgress)}% elapsed</span>
                          <span className="font-semibold text-primary">+{challenge.points_reward || 5} pts reward</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {diffInfo && <Badge variant="outline" className={`text-xs px-2 py-0.5 ${diffInfo.color}`}>{diffInfo.icon} {diffInfo.label}</Badge>}
                          {challenge.allowed_year_groups?.length ? <Badge variant="outline" className="text-xs px-2 py-0.5">{challenge.allowed_year_groups.join(', ')}</Badge> : null}
                          {challenge.allowed_houses?.length ? <Badge variant="outline" className="text-xs px-2 py-0.5">🏠 {challenge.allowed_houses.length} houses</Badge> : null}
                          {challenge.is_independent && <Badge variant="outline" className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Independent</Badge>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                        <Button variant="default" size="sm" className="flex-1 h-10 text-sm gap-2" onClick={() => openDetailView(challenge)}>
                          <Eye className="w-4 h-4" /> View Details
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => onEdit(challenge)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" className="h-10 w-10 p-0" onClick={() => onDuplicate(challenge)}><Copy className="w-4 h-4" /></Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-10 w-10 p-0 ${challenge.is_active ? 'hover:bg-red-500/10 hover:border-red-500/30' : 'hover:bg-green-500/10 hover:border-green-500/30'}`} 
                          onClick={() => onToggleStatus(challenge.id, challenge.is_active)}
                        >
                          {challenge.is_active ? '⏸️' : '▶️'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ChallengesManager;
