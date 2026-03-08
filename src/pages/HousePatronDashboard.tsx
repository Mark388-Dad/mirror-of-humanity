import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Trophy, TrendingUp, Medal, Award, Crown, Sparkles, Zap, Target, Flame, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import XPProgressBar, { getXPLevel } from '@/components/XPProgressBar';
import VibrantDashboardCard, { FollettLibraryButton, QuickStats } from '@/components/VibrantDashboardCard';
import DashboardCountdown from '@/components/DashboardCountdown';
import confetti from 'canvas-confetti';

const FOLLETT_LIBRARY_URL = 'https://mfa.follettdestiny.com/portal/portal?app=Destiny%20Discover&appId=destiny-B896-BHZF&siteGuid=8A7E2238-818E-42A2-AFD1-33425ECB934C&nav=https:%2F%2Fmfa.follettdestiny.com%2Fmetasearch%2Fui%2F54793';

interface HouseStudent {
  user_id: string;
  full_name: string;
  year_group: string;
  class_name: string;
  books_read: number;
  total_points: number;
  achievement_level: string;
}

interface HouseStats {
  total_members: number;
  total_books: number;
  total_points: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  rank: number;
}

interface HouseLeaderboard {
  house: string;
  total_readers: number;
  total_books: number;
  total_points: number;
}

interface YearBreakdown {
  year_group: string;
  students: number;
  books: number;
  points: number;
}

const houseConfig: Record<string, { gradient: string; gradientFull: string; icon: string; bg: string }> = {
  Kenya: { 
    gradient: 'from-red-500 to-orange-500', 
    gradientFull: 'from-red-600 via-orange-500 to-yellow-500',
    icon: '🦁',
    bg: 'bg-red-500'
  },
  Longonot: { 
    gradient: 'from-blue-500 to-cyan-500', 
    gradientFull: 'from-blue-600 via-cyan-500 to-teal-500',
    icon: '🌋',
    bg: 'bg-blue-500'
  },
  Kilimanjaro: { 
    gradient: 'from-green-500 to-emerald-500', 
    gradientFull: 'from-green-600 via-emerald-500 to-teal-500',
    icon: '🏔️',
    bg: 'bg-green-500'
  },
  Elgon: { 
    gradient: 'from-purple-500 to-violet-500', 
    gradientFull: 'from-purple-600 via-violet-500 to-pink-500',
    icon: '🐘',
    bg: 'bg-purple-500'
  },
};

const HousePatronDashboard = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<HouseStudent[]>([]);
  const [stats, setStats] = useState<HouseStats | null>(null);
  const [allHouses, setAllHouses] = useState<HouseLeaderboard[]>([]);
  const [yearBreakdown, setYearBreakdown] = useState<YearBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.house) {
      fetchHouseData();
      fetchAllHouses();
    }
  }, [profile?.house]);

  const fetchHouseData = async () => {
    if (!profile?.house) return;

    const { data: studentData, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('house', profile.house)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching house data:', error);
      setLoading(false);
      return;
    }

    const studentsList = (studentData || []) as HouseStudent[];
    setStudents(studentsList);

    const totalMembers = studentsList.length;
    const totalBooks = studentsList.reduce((sum, s) => sum + (s.books_read || 0), 0);
    const totalPoints = studentsList.reduce((sum, s) => sum + (s.total_points || 0), 0);
    const bronzeCount = studentsList.filter(s => s.achievement_level === 'bronze').length;
    const silverCount = studentsList.filter(s => s.achievement_level === 'silver').length;
    const goldCount = studentsList.filter(s => s.achievement_level === 'gold').length;

    // Calculate year breakdown
    const yearMap = new Map<string, YearBreakdown>();
    studentsList.forEach(student => {
      const key = student.year_group || 'Unknown';
      const existing = yearMap.get(key) || { year_group: key, students: 0, books: 0, points: 0 };
      existing.students += 1;
      existing.books += student.books_read || 0;
      existing.points += student.total_points || 0;
      yearMap.set(key, existing);
    });
    setYearBreakdown(Array.from(yearMap.values()).sort((a, b) => b.points - a.points));

    setStats({
      total_members: totalMembers,
      total_books: totalBooks,
      total_points: totalPoints,
      bronze_count: bronzeCount,
      silver_count: silverCount,
      gold_count: goldCount,
      rank: 0, // Will be set after fetching all houses
    });

    setLoading(false);
  };

  const fetchAllHouses = async () => {
    const { data: houseData } = await supabase
      .from('house_leaderboard')
      .select('*')
      .order('total_points', { ascending: false });

    if (houseData) {
      setAllHouses(houseData as unknown as HouseLeaderboard[]);
      const myRank = houseData.findIndex((h: any) => h.house === profile?.house) + 1;
      setStats(prev => prev ? { ...prev, rank: myRank } : null);
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-5 h-5 text-amber-700" />;
      case 'silver': return <Award className="w-5 h-5 text-slate-400" />;
      case 'gold': return <Crown className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  if (profile?.role !== 'house_patron' && profile?.role !== 'staff' && profile?.role !== 'librarian') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">Only house patrons can access this page.</p>
        </main>
      </div>
    );
  }

  const config = houseConfig[profile?.house || ''] || { gradient: 'from-slate-500 to-slate-600', gradientFull: 'from-slate-600 to-slate-700', icon: '🏠', bg: 'bg-slate-500' };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* House Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl bg-gradient-to-r ${config.gradientFull} p-8 mb-8 text-white relative overflow-hidden`}
          onClick={triggerCelebration}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.span 
                className="text-6xl"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {config.icon}
              </motion.span>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
                  House {profile?.house}
                </h1>
                <p className="text-white/80">
                  Lead your house to reading glory!
                </p>
              </div>
            </div>
            
            {stats && (
              <div className="flex items-center gap-4">
                <div className="text-center px-6 py-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="text-3xl font-bold">{stats.rank ? `#${stats.rank}` : '-'}</div>
                  <div className="text-sm text-white/80">Rank</div>
                </div>
                <FollettLibraryButton className="bg-white/20 hover:bg-white/30 backdrop-blur-sm" />
              </div>
            )}
          </div>
          
          {/* Animated sparkles */}
          <motion.div 
            className="absolute top-4 right-4"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-white/50" />
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <QuickStats
            stats={[
              { label: 'Members', value: stats.total_members, icon: <Users className="w-8 h-8 text-blue-500" />, color: 'bg-blue-500/10' },
              { label: 'Total Books', value: stats.total_books, icon: <BookOpen className="w-8 h-8 text-green-500" />, color: 'bg-green-500/10' },
              { label: 'House XP', value: stats.total_points, icon: <Sparkles className="w-8 h-8 text-yellow-500" />, color: 'bg-yellow-500/10' },
              { label: 'School Rank', value: `#${stats.rank || '-'}`, icon: <Trophy className="w-8 h-8 text-purple-500" />, color: 'bg-purple-500/10' },
            ]}
          />
        )}

        {/* Achievement Summary */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card className={`bg-gradient-to-r ${config.gradient} bg-opacity-10`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-8">
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="text-4xl mb-1">🥉</div>
                    <div className="text-3xl font-bold text-amber-700">{stats.bronze_count}</div>
                    <div className="text-sm text-muted-foreground">Bronze</div>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="text-4xl mb-1">🥈</div>
                    <div className="text-3xl font-bold text-slate-400">{stats.silver_count}</div>
                    <div className="text-sm text-muted-foreground">Silver</div>
                  </motion.div>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="text-4xl mb-1">🥇</div>
                    <div className="text-3xl font-bold text-yellow-500">{stats.gold_count}</div>
                    <div className="text-sm text-muted-foreground">Gold</div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* House Leaderboard */}
          <VibrantDashboardCard
            title="House Leaderboard"
            icon={<Trophy className="w-5 h-5 text-gold" />}
            gradient={`${config.gradient.replace('from-', 'from-').replace('to-', 'to-')}/10`}
            showFollettLink
            delay={0.3}
            className="lg:col-span-2"
          >
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No readers in your house yet.
              </div>
            ) : (
              <div className="space-y-4">
                {students.slice(0, 20).map((student, index) => {
                  const xpLevel = getXPLevel(student.total_points);
                  
                  return (
                    <motion.div 
                      key={student.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${
                        index < 3 ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30' : 
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 
                        'bg-background'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{student.full_name}</span>
                          {getAchievementIcon(student.achievement_level)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{student.year_group}</Badge>
                          <Badge variant="outline" className="text-xs">{student.class_name}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            Lv.{xpLevel.level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center px-4">
                        <div className="font-semibold">{student.books_read}</div>
                        <div className="text-xs text-muted-foreground">books</div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xl font-display font-bold bg-gradient-to-r ${xpLevel.color} bg-clip-text text-transparent`}>
                          {student.total_points}
                        </div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </VibrantDashboardCard>

          <div className="space-y-6">
            {/* Year Group Breakdown */}
            <VibrantDashboardCard
              title="By Year Group"
              icon={<Target className="w-5 h-5 text-blue-500" />}
              gradient="from-blue-500/10 to-cyan-500/10"
              delay={0.4}
            >
              <div className="space-y-3">
                {yearBreakdown.map((year, index) => (
                  <motion.div 
                    key={year.year_group}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{year.year_group}</span>
                      <span className="text-lg font-bold text-blue-500">{year.points} XP</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {year.students} students • {year.books} books
                    </div>
                  </motion.div>
                ))}
              </div>
            </VibrantDashboardCard>

            {/* All Houses Comparison */}
            <VibrantDashboardCard
              title="House Competition"
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              gradient="from-orange-500/10 to-red-500/10"
              delay={0.5}
            >
              <div className="space-y-3">
                {allHouses.map((house, index) => {
                  const hConfig = houseConfig[house.house] || { gradient: 'from-slate-400 to-slate-500', icon: '🏠' };
                  const isMyHouse = house.house === profile?.house;
                  const maxPoints = allHouses[0]?.total_points || 1;
                  
                  return (
                    <motion.div 
                      key={house.house}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg ${isMyHouse ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{hConfig.icon}</span>
                        <span className={`font-bold ${isMyHouse ? 'text-gold' : ''}`}>{house.house}</span>
                        {isMyHouse && <Badge className="bg-gold text-navy text-xs">You</Badge>}
                        <span className="ml-auto font-bold">{house.total_points} XP</span>
                      </div>
                      <Progress 
                        value={(house.total_points / maxPoints) * 100} 
                        className="h-2"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </VibrantDashboardCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HousePatronDashboard;
