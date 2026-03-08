import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Trophy, Target, Star, Medal, Award, Crown, Zap, Users, TrendingUp, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ReadingStreak from '@/components/ReadingStreak';
import BookRecommendations from '@/components/BookRecommendations';
import NotificationBell from '@/components/NotificationBell';
import XPProgressBar, { getXPLevel } from '@/components/XPProgressBar';
import VibrantDashboardCard, { FollettLibraryButton, QuickStats } from '@/components/VibrantDashboardCard';
import { HOUSE_COLORS, MAX_BOOKS } from '@/lib/constants';
import DashboardCountdown from '@/components/DashboardCountdown';
import confetti from 'canvas-confetti';

const FOLLETT_LIBRARY_URL = 'https://mfa.follettdestiny.com';

interface StudentProgress {
  books_read: number;
  total_points: number;
  achievement_level: 'none' | 'bronze' | 'silver' | 'gold';
}

interface HouseLeaderboard {
  house: string;
  total_readers: number;
  total_books: number;
  total_points: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  end_date: string;
  points_reward: number;
}

interface SchoolStats {
  total_students: number;
  total_books: number;
  total_points: number;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<HouseLeaderboard[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentRank, setStudentRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      if (profile.role === 'student') {
        const { data: allStudents } = await supabase
          .from('student_progress')
          .select('*')
          .order('total_points', { ascending: false });
        
        if (allStudents) {
          const myProgress = allStudents.find(s => s.user_id === profile.user_id);
          if (myProgress) {
            setProgress(myProgress as unknown as StudentProgress);
            const rank = allStudents.findIndex(s => s.user_id === profile.user_id) + 1;
            setStudentRank(rank);
          }
        }
      }

      const { data: leaderboardData } = await supabase
        .from('house_leaderboard')
        .select('*')
        .order('total_points', { ascending: false });
      
      if (leaderboardData) {
        setLeaderboard(leaderboardData as unknown as HouseLeaderboard[]);
        const stats = {
          total_students: leaderboardData.reduce((sum, h: any) => sum + (h.total_readers || 0), 0),
          total_books: leaderboardData.reduce((sum, h: any) => sum + (h.total_books || 0), 0),
          total_points: leaderboardData.reduce((sum, h: any) => sum + (h.total_points || 0), 0),
        };
        setSchoolStats(stats);
      }

      const { data: challengeData } = await supabase
        .from('challenges')
        .select('id, title, description, end_date, points_reward')
        .eq('is_active', true)
        .order('end_date', { ascending: true })
        .limit(3);

      if (challengeData) {
        setActiveChallenges(challengeData as Challenge[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-8 h-8 text-amber-700" />;
      case 'silver': return <Award className="w-8 h-8 text-slate-400" />;
      case 'gold': return <Crown className="w-8 h-8 text-yellow-500" />;
      default: return <Target className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getRoleWelcome = () => {
    switch (profile?.role) {
      case 'librarian': return 'Manage challenges and review submissions.';
      case 'homeroom_tutor': return 'Track your class\'s reading progress.';
      case 'head_of_year': return 'Monitor year group achievements.';
      case 'house_patron': return 'Lead your house to reading glory!';
      default: return 'Keep reading! You\'re doing great.';
    }
  };

  const triggerCelebration = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const xpLevel = progress ? getXPLevel(progress.total_points) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start justify-between"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              Welcome back, {profile?.full_name?.split(' ')[0]}! 
              <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>👋</motion.span>
            </h1>
            <p className="text-muted-foreground">{getRoleWelcome()}</p>
          </div>
          <NotificationBell />
        </motion.div>

        <DashboardCountdown />

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <FollettLibraryButton className="w-full sm:w-auto" />
        </motion.div>

        {schoolStats && (
          <QuickStats
            stats={[
              { label: 'Active Readers', value: schoolStats.total_students, icon: <Users className="w-8 h-8 text-blue-500" />, color: 'bg-blue-500/10' },
              { label: 'Books Read', value: schoolStats.total_books, icon: <BookOpen className="w-8 h-8 text-green-500" />, color: 'bg-green-500/10' },
              { label: 'Total XP', value: schoolStats.total_points, icon: <Sparkles className="w-8 h-8 text-yellow-500" />, color: 'bg-yellow-500/10' },
              { label: 'Challenges Active', value: activeChallenges.length, icon: <Zap className="w-8 h-8 text-purple-500" />, color: 'bg-purple-500/10' },
            ]}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {profile?.role === 'student' && progress && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
              <Card className="relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${xpLevel?.color || 'from-blue-500/10 to-purple-500/10'} opacity-10`} />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gold" />
                    Your Reading Progress
                    {studentRank && studentRank <= 10 && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">#{studentRank} in School</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center gap-6 mb-6">
                    <motion.div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center cursor-pointer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={triggerCelebration}>
                      {getAchievementIcon(progress.achievement_level || 'none')}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-display font-bold text-foreground">{progress.books_read || 0}</span>
                        <span className="text-muted-foreground">/ {MAX_BOOKS} books</span>
                      </div>
                      <Progress value={Math.min(((progress.books_read || 0) / MAX_BOOKS) * 100, 100)} className="h-3" />
                    </div>
                  </div>

                  <XPProgressBar currentXP={progress.total_points || 0} />

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-xl bg-secondary cursor-pointer">
                      <div className="text-2xl font-display font-bold text-foreground">{progress.total_points || 0}</div>
                      <div className="text-sm text-muted-foreground">Total XP</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-xl bg-secondary cursor-pointer">
                      <div className="text-2xl font-display font-bold text-foreground capitalize">{progress.achievement_level || 'None'}</div>
                      <div className="text-sm text-muted-foreground">Level</div>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} className="text-center p-4 rounded-xl bg-secondary cursor-pointer">
                      <div className="text-2xl font-display font-bold text-foreground">{profile?.house || '-'}</div>
                      <div className="text-sm text-muted-foreground">House</div>
                    </motion.div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <Button asChild className="bg-gradient-to-r from-gold to-amber-500 text-navy hover:from-gold-light hover:to-amber-400 flex-1 shadow-lg shadow-gold/25">
                      <Link to="/submit"><Sparkles className="w-4 h-4 mr-2" />Submit a Book</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/progress">View Full Progress</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {profile?.role === 'student' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <ReadingStreak />
            </motion.div>
          )}

          {/* House Leaderboard - using HOUSE_COLORS */}
          <VibrantDashboardCard
            title="House Leaderboard"
            icon={<Trophy className="w-5 h-5 text-gold" />}
            gradient="from-gold/10 to-amber-500/10"
            action={{ label: 'View All', href: '/leaderboard' }}
            showFollettLink
            delay={0.4}
            className={profile?.role === 'student' ? '' : 'lg:col-span-2'}
          >
            <div className="space-y-4">
              {leaderboard.map((house, index) => {
                const config = HOUSE_COLORS[house.house] || { gradient: 'from-slate-400 to-slate-500', icon: '🏠' };
                const isMyHouse = profile?.house === house.house;
                
                return (
                  <motion.div 
                    key={house.house}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] ${
                      isMyHouse ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                      'bg-background'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <span className="text-2xl">{config.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {house.house}
                        {isMyHouse && <Badge variant="outline" className="text-xs">You</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {house.total_readers} readers • {house.total_books} books
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-display font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                        {house.total_points}
                      </div>
                      <div className="text-xs text-muted-foreground">XP</div>
                    </div>
                  </motion.div>
                );
              })}
              {leaderboard.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No data yet. Be the first to submit a book!</p>
              )}
            </div>
          </VibrantDashboardCard>

          {/* Active Challenges */}
          <VibrantDashboardCard
            title="Active Challenges"
            icon={<Zap className="w-5 h-5 text-yellow-500" />}
            gradient="from-yellow-500/10 to-orange-500/10"
            action={{ label: 'View All', href: '/challenges' }}
            delay={0.5}
          >
            {activeChallenges.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active challenges right now.</p>
            ) : (
              <div className="space-y-3">
                {activeChallenges.map((challenge, index) => (
                  <motion.div key={challenge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}
                    className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{challenge.title}</span>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">+{challenge.points_reward} XP</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{challenge.description}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </VibrantDashboardCard>

          {profile?.role === 'student' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <BookRecommendations />
            </motion.div>
          )}

          {profile?.role !== 'student' && (
            <VibrantDashboardCard
              title="Quick Actions"
              icon={<Star className="w-5 h-5 text-gold" />}
              gradient="from-purple-500/10 to-pink-500/10"
              delay={0.6}
            >
              <div className="space-y-3">
                {profile?.role === 'librarian' && (
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/librarian"><BookOpen className="w-4 h-4 mr-2" />Manage Challenges</Link>
                  </Button>
                )}
                {(profile?.role === 'homeroom_tutor' || profile?.role === 'head_of_year') && (
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/tutor"><Users className="w-4 h-4 mr-2" />View Class Progress</Link>
                  </Button>
                )}
                {profile?.role === 'house_patron' && (
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/house"><Trophy className="w-4 h-4 mr-2" />View House Progress</Link>
                  </Button>
                )}
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/admin"><TrendingUp className="w-4 h-4 mr-2" />Admin Dashboard</Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/gallery"><BookOpen className="w-4 h-4 mr-2" />Browse Book Gallery</Link>
                </Button>
                <Button asChild className="w-full justify-start bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
                  <a href={FOLLETT_LIBRARY_URL} target="_blank" rel="noopener noreferrer">
                    <Sparkles className="w-4 h-4 mr-2" />Open Library Catalog<ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </VibrantDashboardCard>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
