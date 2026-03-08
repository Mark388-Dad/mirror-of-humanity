import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Trophy, Calendar, Pencil, Copy, Loader2, Search, Users, BookOpen, Target, Clock, Star, Filter, BarChart3, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, isPast, isFuture, isWithinInterval } from 'date-fns';
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

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  reading: { label: 'Reading', emoji: '📚', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  genre_explorer: { label: 'Genre Explorer', emoji: '🗺️', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  reflection: { label: 'Read & Reflect', emoji: '✍️', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' },
  performance: { label: 'Perform', emoji: '🎭', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20' },
  house_competition: { label: 'House', emoji: '🏠', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  ai_buddy: { label: 'AI Buddy', emoji: '🤖', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' },
  creative_response: { label: 'Creative', emoji: '🎨', color: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20' },
  daily_streak: { label: 'Streak', emoji: '🔥', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  classic_modern: { label: 'Classic vs Modern', emoji: '📖', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20' },
  book_to_life: { label: 'Book-to-Life', emoji: '🌍', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  timed_sprint: { label: 'Sprint', emoji: '⏱️', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' },
  category: { label: 'Category', emoji: '🏷️', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
  custom: { label: 'Custom', emoji: '⚡', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-500/10 text-green-700 dark:text-green-400', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', icon: '⚡' },
  advanced: { label: 'Advanced', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', icon: '🔥' },
  expert: { label: 'Expert', color: 'bg-red-500/10 text-red-700 dark:text-red-400', icon: '💎' },
};

const ChallengesManager = ({ challenges, loading, onEdit, onDuplicate, onToggleStatus, onRefresh }: ChallengesManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

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

  const getChallengeStatus = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    if (!challenge.is_active) return { label: 'Paused', color: 'bg-muted text-muted-foreground', icon: '⏸️' };
    if (isFuture(start)) return { label: 'Upcoming', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: '🕐' };
    if (isPast(end)) return { label: 'Ended', color: 'bg-muted text-muted-foreground', icon: '✅' };
    return { label: 'Live', color: 'bg-green-500/10 text-green-700 dark:text-green-400', icon: '🟢' };
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
    if (statusFilter === 'live') {
      const s = getChallengeStatus(c);
      if (s.label !== 'Live') return false;
    }
    if (statusFilter === 'ended') {
      const s = getChallengeStatus(c);
      if (s.label !== 'Ended') return false;
    }
    if (typeFilter !== 'all' && c.challenge_type !== typeFilter) return false;
    return true;
  });

  const summaryStats = {
    total: challenges.length,
    live: challenges.filter(c => {
      const s = getChallengeStatus(c);
      return s.label === 'Live';
    }).length,
    totalParticipants: Object.values(participantCounts).reduce((a, b) => a + b, 0),
    totalSubmissions: Object.values(submissionCounts).reduce((a, b) => a + b, 0),
  };

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Challenges', value: summaryStats.total, icon: <Trophy className="h-4 w-4 text-purple-500" />, bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Currently Live', value: summaryStats.live, icon: <Zap className="h-4 w-4 text-green-500" />, bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Total Participants', value: summaryStats.totalParticipants, icon: <Users className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Total Submissions', value: summaryStats.totalSubmissions, icon: <BookOpen className="h-4 w-4 text-amber-500" />, bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border ${stat.bg}`}>
              <CardContent className="pt-4 pb-3 px-4 text-center">
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
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
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
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

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filtered.length} of {challenges.length} challenges</span>
        {searchQuery && <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>}
      </div>

      {/* Challenge Cards */}
      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {challenges.length === 0 ? 'No challenges created yet.' : 'No challenges match your filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`h-full flex flex-col transition-all hover:shadow-md ${
                    challenge.is_featured ? 'border-2 border-yellow-500/40 bg-yellow-500/5' : ''
                  } ${status.label === 'Live' ? 'ring-1 ring-green-500/30' : ''}`}>
                    <CardHeader className="pb-2 space-y-2">
                      {/* Top row: type badge + status */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`text-xs ${catInfo.color}`}>
                          {catInfo.emoji} {catInfo.label}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {challenge.is_featured && (
                            <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-xs">
                              <Star className="w-3 h-3 mr-0.5" />Featured
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${status.color}`}>
                            {status.icon} {status.label}
                          </Badge>
                        </div>
                      </div>

                      <CardTitle className="text-base leading-tight">{challenge.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-xs">{challenge.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between gap-3">
                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Users className="w-3 h-3 text-blue-500" />
                          </div>
                          <div className="text-sm font-bold">{participants}</div>
                          <div className="text-[10px] text-muted-foreground">Joined</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <BookOpen className="w-3 h-3 text-green-500" />
                          </div>
                          <div className="text-sm font-bold">{submissions}</div>
                          <div className="text-[10px] text-muted-foreground">Submissions</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Target className="w-3 h-3 text-purple-500" />
                          </div>
                          <div className="text-sm font-bold">{challenge.target_books || 1}</div>
                          <div className="text-[10px] text-muted-foreground">Target</div>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(challenge.start_date), 'MMM d')} – {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                          </span>
                          <span className="font-medium">{daysLeft}</span>
                        </div>

                        {/* Time progress bar */}
                        <div className="space-y-1">
                          <Progress value={timeProgress} className="h-1.5" />
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{Math.round(timeProgress)}% elapsed</span>
                            <span>+{challenge.points_reward || 5} pts reward</span>
                          </div>
                        </div>

                        {/* Tags row */}
                        <div className="flex flex-wrap gap-1">
                          {diffInfo && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${diffInfo.color}`}>
                              {diffInfo.icon} {diffInfo.label}
                            </Badge>
                          )}
                          {challenge.participation_type && challenge.participation_type !== 'all' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {challenge.participation_type}
                            </Badge>
                          )}
                          {challenge.allowed_year_groups && challenge.allowed_year_groups.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {challenge.allowed_year_groups.join(', ')}
                            </Badge>
                          )}
                          {challenge.allowed_houses && challenge.allowed_houses.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              🏠 {challenge.allowed_houses.length} houses
                            </Badge>
                          )}
                          {challenge.is_independent && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-500/10 text-indigo-600">
                              Independent
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => onEdit(challenge)}>
                          <Pencil className="w-3 h-3 mr-1" />Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => onDuplicate(challenge)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 ${challenge.is_active ? 'hover:bg-red-500/10' : 'hover:bg-green-500/10'}`}
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
