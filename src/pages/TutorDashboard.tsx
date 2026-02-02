import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Trophy, TrendingUp, Medal, Award, Crown, ExternalLink, Sparkles, Zap, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CLASSES, YEAR_GROUPS } from '@/lib/constants';
import XPProgressBar, { getXPLevel } from '@/components/XPProgressBar';
import VibrantDashboardCard, { FollettLibraryButton, QuickStats } from '@/components/VibrantDashboardCard';

const FOLLETT_LIBRARY_URL = 'https://mfa.follettdestiny.com/portal/portal?app=Destiny%20Discover&appId=destiny-B896-BHZF&siteGuid=8A7E2238-818E-42A2-AFD1-33425ECB934C&nav=https:%2F%2Fmfa.follettdestiny.com%2Fmetasearch%2Fui%2F54793';

interface ClassStudent {
  user_id: string;
  full_name: string;
  house: string;
  books_read: number;
  total_points: number;
  achievement_level: string;
}

interface ClassStats {
  total_students: number;
  total_books: number;
  average_books: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  total_points: number;
}

interface YearGroupStats {
  year_group: string;
  total_students: number;
  total_books: number;
  total_points: number;
}

const houseConfig: Record<string, { gradient: string; icon: string }> = {
  Kenya: { gradient: 'from-red-500 to-orange-500', icon: '🦁' },
  Longonot: { gradient: 'from-blue-500 to-cyan-500', icon: '🌋' },
  Kilimanjaro: { gradient: 'from-green-500 to-emerald-500', icon: '🏔️' },
  Elgon: { gradient: 'from-purple-500 to-violet-500', icon: '🐘' },
};

const TutorDashboard = () => {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>(profile?.class_name || '');
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>(profile?.year_group || 'all');
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [yearGroupStats, setYearGroupStats] = useState<YearGroupStats[]>([]);
  const [allClasses, setAllClasses] = useState<{ class_name: string; year_group: string; student_count: number; total_points: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
    fetchYearGroupData();
    fetchAllClassesData();
  }, [selectedClass]);

  useEffect(() => {
    if (profile?.class_name) {
      setSelectedClass(profile.class_name);
    }
  }, [profile]);

  const fetchClassData = async () => {
    setLoading(true);

    const { data: studentData, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('class_name', selectedClass)
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error fetching class data:', error);
      setLoading(false);
      return;
    }

    const studentsList = (studentData || []) as ClassStudent[];
    setStudents(studentsList);

    const totalStudents = studentsList.length;
    const totalBooks = studentsList.reduce((sum, s) => sum + (s.books_read || 0), 0);
    const totalPoints = studentsList.reduce((sum, s) => sum + (s.total_points || 0), 0);
    const bronzeCount = studentsList.filter(s => s.achievement_level === 'bronze').length;
    const silverCount = studentsList.filter(s => s.achievement_level === 'silver').length;
    const goldCount = studentsList.filter(s => s.achievement_level === 'gold').length;

    setStats({
      total_students: totalStudents,
      total_books: totalBooks,
      average_books: totalStudents > 0 ? Math.round((totalBooks / totalStudents) * 10) / 10 : 0,
      bronze_count: bronzeCount,
      silver_count: silverCount,
      gold_count: goldCount,
      total_points: totalPoints,
    });

    setLoading(false);
  };

  const fetchYearGroupData = async () => {
    const { data: studentData } = await supabase
      .from('student_progress')
      .select('year_group, books_read, total_points');

    if (studentData) {
      const yearMap = new Map<string, YearGroupStats>();
      studentData.forEach((student: any) => {
        const key = student.year_group || 'Unknown';
        const existing = yearMap.get(key) || {
          year_group: key,
          total_students: 0,
          total_books: 0,
          total_points: 0
        };
        existing.total_students += 1;
        existing.total_books += student.books_read || 0;
        existing.total_points += student.total_points || 0;
        yearMap.set(key, existing);
      });
      setYearGroupStats(Array.from(yearMap.values()).sort((a, b) => b.total_points - a.total_points));
    }
  };

  const fetchAllClassesData = async () => {
    const { data: studentData } = await supabase
      .from('student_progress')
      .select('class_name, year_group, total_points');

    if (studentData) {
      const classMap = new Map<string, { class_name: string; year_group: string; student_count: number; total_points: number }>();
      studentData.forEach((student: any) => {
        const key = student.class_name || 'Unknown';
        const existing = classMap.get(key) || {
          class_name: key,
          year_group: student.year_group || 'Unknown',
          student_count: 0,
          total_points: 0
        };
        existing.student_count += 1;
        existing.total_points += student.total_points || 0;
        classMap.set(key, existing);
      });
      setAllClasses(Array.from(classMap.values()).sort((a, b) => b.total_points - a.total_points));
    }
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-5 h-5 text-amber-700" />;
      case 'silver': return <Award className="w-5 h-5 text-slate-400" />;
      case 'gold': return <Crown className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  if (profile?.role !== 'homeroom_tutor' && profile?.role !== 'head_of_year' && profile?.role !== 'staff' && profile?.role !== 'librarian') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">Only tutors can access this page.</p>
        </main>
      </div>
    );
  }

  const filteredClasses = selectedYearGroup === 'all' 
    ? allClasses 
    : allClasses.filter(c => c.year_group === selectedYearGroup);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              Homeroom Dashboard 
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                👩‍🏫
              </motion.span>
            </h1>
            <p className="text-muted-foreground">
              Track your students' reading progress, view class rankings, and monitor achievements.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <FollettLibraryButton />
          </div>
        </motion.div>

        {/* Quick Stats */}
        {stats && (
          <QuickStats
            stats={[
              { label: 'Students', value: stats.total_students, icon: <Users className="w-8 h-8 text-blue-500" />, color: 'bg-blue-500/10' },
              { label: 'Total Books', value: stats.total_books, icon: <BookOpen className="w-8 h-8 text-green-500" />, color: 'bg-green-500/10' },
              { label: 'Avg/Student', value: stats.average_books, icon: <Target className="w-8 h-8 text-purple-500" />, color: 'bg-purple-500/10' },
              { label: 'Class XP', value: stats.total_points, icon: <Sparkles className="w-8 h-8 text-yellow-500" />, color: 'bg-yellow-500/10' },
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
            <Card className="bg-gradient-to-r from-amber-500/10 via-slate-500/10 to-yellow-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🥉</div>
                    <div className="text-2xl font-bold">{stats.bronze_count}</div>
                    <div className="text-sm text-muted-foreground">Bronze</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">🥈</div>
                    <div className="text-2xl font-bold">{stats.silver_count}</div>
                    <div className="text-sm text-muted-foreground">Silver</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">🥇</div>
                    <div className="text-2xl font-bold">{stats.gold_count}</div>
                    <div className="text-sm text-muted-foreground">Gold</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Class Leaderboard */}
          <VibrantDashboardCard
            title={`Class ${selectedClass} Leaderboard`}
            icon={<Trophy className="w-5 h-5 text-gold" />}
            gradient="from-gold/10 to-amber-500/10"
            showFollettLink
            delay={0.3}
            className="lg:col-span-2"
          >
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found in this class yet.
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student, index) => {
                  const xpLevel = getXPLevel(student.total_points);
                  const houseConf = houseConfig[student.house] || { gradient: 'from-slate-400 to-slate-500', icon: '🏠' };
                  
                  return (
                    <motion.div 
                      key={student.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] ${
                        index < 3 ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 
                        'bg-background'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      
                      <span className="text-xl">{houseConf.icon}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{student.full_name}</span>
                          {getAchievementIcon(student.achievement_level)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{student.house}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            Lv.{xpLevel.level} {xpLevel.title}
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

          {/* Year Group Comparison */}
          <VibrantDashboardCard
            title="Year Group Rankings"
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
            gradient="from-purple-500/10 to-pink-500/10"
            delay={0.4}
          >
            <div className="space-y-3">
              {yearGroupStats.map((year, index) => {
                const colors = [
                  'from-pink-500 to-rose-500',
                  'from-blue-500 to-cyan-500',
                  'from-green-500 to-emerald-500',
                  'from-purple-500 to-violet-500'
                ];
                const color = colors[index % colors.length];
                
                return (
                  <motion.div 
                    key={year.year_group}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                        {year.year_group}
                      </span>
                      <span className="text-lg font-bold">{year.total_points} XP</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {year.total_students} students • {year.total_books} books
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </VibrantDashboardCard>
        </div>

        {/* All Classes Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-500" />
                  All Classes Ranking
                </CardTitle>
                <Select value={selectedYearGroup} onValueChange={setSelectedYearGroup}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {YEAR_GROUPS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls, index) => {
                  const isMyClass = profile?.class_name === cls.class_name;
                  
                  return (
                    <motion.div 
                      key={cls.class_name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl ${
                        isMyClass ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {cls.class_name}
                            {isMyClass && <Badge className="bg-green-500 text-white text-xs">Your Class</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{cls.year_group}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cls.student_count} students</span>
                        <span className="font-bold text-green-500">{cls.total_points} XP</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default TutorDashboard;
