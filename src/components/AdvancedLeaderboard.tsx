import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Users, BookOpen, Medal, Award, Crown, 
  Building2, GraduationCap, Sparkles,
  Zap, Target
} from 'lucide-react';
import { HOUSES, YEAR_GROUPS, CLASSES, HOUSE_COLORS, MAX_BOOKS } from '@/lib/constants';
import confetti from 'canvas-confetti';

interface HouseLeaderboard {
  house: string;
  total_readers: number;
  total_books: number;
  total_points: number;
}

interface StudentProgress {
  user_id: string;
  full_name: string;
  house: string;
  year_group: string;
  class_name: string;
  books_read: number;
  total_points: number;
  achievement_level: 'none' | 'bronze' | 'silver' | 'gold';
}

interface ClassRanking {
  class_name: string;
  year_group: string;
  total_students: number;
  total_books: number;
  total_points: number;
  avg_books: number;
}

interface YearGroupRanking {
  year_group: string;
  total_students: number;
  total_books: number;
  total_points: number;
  avg_books: number;
}

const houseConfig = HOUSE_COLORS;

const AdvancedLeaderboard = () => {
  const { profile } = useAuth();
  const [houseLeaderboard, setHouseLeaderboard] = useState<HouseLeaderboard[]>([]);
  const [studentLeaderboard, setStudentLeaderboard] = useState<StudentProgress[]>([]);
  const [classRankings, setClassRankings] = useState<ClassRanking[]>([]);
  const [yearGroupRankings, setYearGroupRankings] = useState<YearGroupRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('years');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    const { data: houseData } = await supabase
      .from('house_leaderboard')
      .select('*')
      .order('total_points', { ascending: false });

    if (houseData) {
      setHouseLeaderboard(houseData as unknown as HouseLeaderboard[]);
    }

    const { data: studentData } = await supabase
      .from('student_progress')
      .select('*')
      .order('total_points', { ascending: false });

    if (studentData) {
      setStudentLeaderboard(studentData as unknown as StudentProgress[]);
      
      // Calculate class rankings grouped by year_group + class_name
      const classMap = new Map<string, ClassRanking>();
      (studentData as StudentProgress[]).forEach(student => {
        const key = `${student.year_group || 'Unknown'}_${student.class_name || 'Unknown'}`;
        const existing = classMap.get(key) || {
          class_name: student.class_name || 'Unknown',
          year_group: student.year_group || 'Unknown',
          total_students: 0,
          total_books: 0,
          total_points: 0,
          avg_books: 0
        };
        existing.total_students += 1;
        existing.total_books += student.books_read || 0;
        existing.total_points += student.total_points || 0;
        existing.avg_books = existing.total_books / existing.total_students;
        classMap.set(key, existing);
      });
      setClassRankings(Array.from(classMap.values()).sort((a, b) => b.total_points - a.total_points));

      // Calculate year group rankings
      const yearMap = new Map<string, YearGroupRanking>();
      (studentData as StudentProgress[]).forEach(student => {
        const key = student.year_group || 'Unknown';
        const existing = yearMap.get(key) || {
          year_group: key,
          total_students: 0,
          total_books: 0,
          total_points: 0,
          avg_books: 0
        };
        existing.total_students += 1;
        existing.total_books += student.books_read || 0;
        existing.total_points += student.total_points || 0;
        existing.avg_books = existing.total_books / existing.total_students;
        yearMap.set(key, existing);
      });
      setYearGroupRankings(Array.from(yearMap.values()).sort((a, b) => b.total_points - a.total_points));
    }

    setLoading(false);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const filteredStudents = studentLeaderboard.filter(student => {
    const matchesYear = selectedYearFilter === 'all' || student.year_group === selectedYearFilter;
    const matchesClass = selectedClassFilter === 'all' || student.class_name === selectedClassFilter;
    return matchesYear && matchesClass;
  });

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-5 h-5 text-amber-700" />;
      case 'silver': return <Award className="w-5 h-5 text-slate-400" />;
      case 'gold': return <Crown className="w-5 h-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold shadow-lg shadow-yellow-500/30">🥇</motion.div>
    );
    if (index === 1) return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-white font-bold shadow-lg">🥈</motion.div>
    );
    if (index === 2) return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold shadow-lg">🥉</motion.div>
    );
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">{index + 1}</div>
    );
  };

  // Updated XP levels matching 3pts/book system
  const getXPLevel = (points: number) => {
    if (points >= 120) return { level: 10, title: 'Master Reader', color: 'from-yellow-400 to-orange-500', icon: '👑' };
    if (points >= 105) return { level: 9, title: 'Expert', color: 'from-pink-400 to-rose-500', icon: '💎' };
    if (points >= 90) return { level: 8, title: 'Advanced', color: 'from-purple-400 to-pink-500', icon: '⭐' };
    if (points >= 75) return { level: 7, title: 'Proficient', color: 'from-emerald-400 to-teal-500', icon: '🔥' };
    if (points >= 60) return { level: 6, title: 'Skilled', color: 'from-green-400 to-emerald-500', icon: '📚' };
    if (points >= 45) return { level: 5, title: 'Intermediate', color: 'from-teal-400 to-green-500', icon: '📖' };
    if (points >= 30) return { level: 4, title: 'Developing', color: 'from-cyan-400 to-teal-500', icon: '🌟' };
    if (points >= 18) return { level: 3, title: 'Learner', color: 'from-blue-400 to-cyan-500', icon: '✨' };
    if (points >= 9) return { level: 2, title: 'Beginner', color: 'from-indigo-400 to-blue-500', icon: '📘' };
    return { level: 1, title: 'Starter', color: 'from-slate-400 to-slate-500', icon: '📕' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Reordered: Year Groups → Classes → Houses → Students */}
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6 bg-secondary/50">
          <TabsTrigger value="years" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
            <GraduationCap className="w-4 h-4" />Year Groups
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
            <Building2 className="w-4 h-4" />Classes
          </TabsTrigger>
          <TabsTrigger value="houses" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold data-[state=active]:to-amber-500 data-[state=active]:text-navy">
            <Trophy className="w-4 h-4" />Houses
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            <Users className="w-4 h-4" />Students
          </TabsTrigger>
        </TabsList>

        {/* Year Groups Leaderboard - FIRST */}
        <TabsContent value="years" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearGroupRankings.map((year, index) => {
              const colors = [
                'from-pink-500 to-rose-500',
                'from-blue-500 to-cyan-500',
                'from-green-500 to-emerald-500',
                'from-purple-500 to-violet-500',
                'from-orange-500 to-amber-500',
                'from-teal-500 to-cyan-500',
              ];
              const color = colors[index % colors.length];
              
              return (
                <motion.div key={year.year_group} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className={`relative overflow-hidden ${profile?.year_group === year.year_group ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
                    <CardContent className="pt-6 relative">
                      <div className="flex items-center justify-between mb-4">
                        {getRankBadge(index)}
                        {profile?.year_group === year.year_group && <Badge className="bg-purple-500 text-white">Your Year</Badge>}
                      </div>
                      <h3 className={`text-3xl font-display font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{year.year_group}</h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4" /> Students</span>
                          <span className="font-semibold">{year.total_students}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><BookOpen className="w-4 h-4" /> Books</span>
                          <span className="font-semibold">{year.total_books}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><Target className="w-4 h-4" /> Average</span>
                          <span className="font-semibold">{year.avg_books.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border text-center">
                        <div className={`text-3xl font-display font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{year.total_points}</div>
                        <div className="text-xs text-muted-foreground">total points</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          {yearGroupRankings.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No year group data available yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* Classes Leaderboard - with year group prefix */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-500" />
                Class Rankings
                <Badge variant="secondary">{classRankings.length} classes</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classRankings.map((cls, index) => {
                  const maxPoints = classRankings[0]?.total_points || 1;
                  const isMyClass = profile?.class_name === cls.class_name && profile?.year_group === cls.year_group;
                  
                  return (
                    <motion.div key={`${cls.year_group}_${cls.class_name}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl ${isMyClass ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-secondary'}`}>
                      <div className="flex items-center gap-4">
                        {getRankBadge(index)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-foreground">{cls.year_group} {cls.class_name}</span>
                            {isMyClass && <Badge className="bg-green-500 text-white">Your Class</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {cls.total_students} students • {cls.total_books} books • Avg: {cls.avg_books.toFixed(1)} books/student
                          </div>
                          <Progress value={Math.min((cls.total_points / maxPoints) * 100, 100)} className="mt-2 h-2" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-green-500">{cls.total_points}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {classRankings.length === 0 && <p className="text-center text-muted-foreground py-8">No class data available yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Houses Leaderboard */}
        <TabsContent value="houses" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {houseLeaderboard.slice(0, 3).map((house, index) => {
              const config = houseConfig[house.house] || { bg: 'bg-muted', text: 'text-foreground', accent: 'bg-muted-foreground', gradient: 'from-slate-400 to-slate-500', icon: '🏠', border: 'border-muted' };
              const positions = [1, 0, 2];
              const displayIndex = positions[index];
              
              return (
                <motion.div key={house.house} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: displayIndex * 0.2 }}
                  style={{ order: displayIndex }}>
                  <Card className={`relative overflow-hidden cursor-pointer transition-all hover:scale-105 ${profile?.house === house.house ? 'ring-2 ring-gold ring-offset-2' : ''}`}
                    onClick={() => index === 0 && triggerConfetti()}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10`} />
                    <CardContent className="pt-6 text-center relative">
                      {index === 0 && (
                        <motion.div className="absolute top-2 right-2" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                        </motion.div>
                      )}
                      {getRankBadge(index)}
                      <motion.div className="text-6xl my-4" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>{config.icon}</motion.div>
                      <h3 className="font-display text-2xl font-bold text-foreground">{house.house}</h3>
                      <motion.div className="mt-4 space-y-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
                        <div className={`text-5xl font-display font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>{house.total_points}</div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </motion.div>
                      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
                        <div className="text-center"><div className="font-semibold text-lg">{house.total_readers}</div><div className="text-xs text-muted-foreground">readers</div></div>
                        <div className="text-center"><div className="font-semibold text-lg">{house.total_books}</div><div className="text-xs text-muted-foreground">books</div></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-gold" />All Houses Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {houseLeaderboard.map((house, index) => {
                  const config = houseConfig[house.house] || { bg: 'bg-muted', text: 'text-foreground', gradient: 'from-slate-400 to-slate-500', icon: '🏠' };
                  const maxPoints = houseLeaderboard[0]?.total_points || 1;
                  
                  return (
                    <motion.div key={house.house} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                      className={`relative p-4 rounded-xl ${profile?.house === house.house ? 'bg-gold/10 border-2 border-gold/30' : 'bg-secondary'}`}>
                      <div className="flex items-center gap-4">
                        {getRankBadge(index)}
                        <span className="text-3xl">{config.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-foreground">{house.house}</span>
                            {profile?.house === house.house && <Badge variant="outline" className="bg-gold/20 text-gold border-gold">Your House</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{house.total_readers} readers • {house.total_books} books</div>
                          <Progress value={(house.total_points / maxPoints) * 100} className="mt-2 h-2" />
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-display font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>{house.total_points}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Leaderboard */}
        <TabsContent value="students" className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Year Group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEAR_GROUPS.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filteredStudents.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {filteredStudents.slice(0, 3).map((student, index) => {
                const xpLevel = getXPLevel(student.total_points);
                const config = houseConfig[student.house] || { bg: 'bg-muted', gradient: 'from-slate-400 to-slate-500' };
                
                return (
                  <motion.div key={student.user_id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.15 }}>
                    <Card className={`relative overflow-hidden ${profile?.user_id === student.user_id ? 'ring-2 ring-gold ring-offset-2' : ''}`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${xpLevel.color} opacity-10`} />
                      <CardContent className="pt-6 text-center relative">
                        {getRankBadge(index)}
                        <div className="mt-4 mb-2"><span className="text-4xl">{xpLevel.icon}</span></div>
                        <h3 className="font-semibold text-lg text-foreground truncate">{student.full_name}</h3>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0`}>{student.house}</Badge>
                          {getAchievementIcon(student.achievement_level)}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">{student.year_group} • {student.class_name}</div>
                        <div className="mt-4 p-3 rounded-lg bg-background/50">
                          <div className={`text-3xl font-display font-bold bg-gradient-to-r ${xpLevel.color} bg-clip-text text-transparent`}>{student.total_points} XP</div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-medium">Lv.{xpLevel.level} {xpLevel.title}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">📚 {Math.min(student.books_read, MAX_BOOKS)} books read</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />Top Readers
                <Badge variant="secondary">{filteredStudents.length} students</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredStudents.map((student, index) => {
                    const xpLevel = getXPLevel(student.total_points);
                    const config = houseConfig[student.house] || { bg: 'bg-muted', gradient: 'from-slate-400 to-slate-500' };
                    
                    return (
                      <motion.div key={student.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.5) }}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] ${
                          profile?.user_id === student.user_id ? 'bg-gold/10 border border-gold/30' : 'bg-secondary hover:bg-secondary/80'
                        }`}>
                        {getRankBadge(index)}
                        <div className={`w-3 h-12 rounded-full bg-gradient-to-b ${config.gradient}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">{student.full_name}</span>
                            {getAchievementIcon(student.achievement_level)}
                            <span className="text-lg">{xpLevel.icon}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{student.year_group} • {student.class_name} • {student.house}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs font-medium text-muted-foreground">Lv.{xpLevel.level} {xpLevel.title}</span>
                          </div>
                        </div>
                        <div className="text-center px-4">
                          <div className="font-semibold">{Math.min(student.books_read, MAX_BOOKS)}</div>
                          <div className="text-xs text-muted-foreground">books</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-display font-bold bg-gradient-to-r ${xpLevel.color} bg-clip-text text-transparent`}>{student.total_points}</div>
                          <div className="text-xs text-muted-foreground">XP</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {filteredStudents.length === 0 && <p className="text-center text-muted-foreground py-8">No readers found with selected filters.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedLeaderboard;
