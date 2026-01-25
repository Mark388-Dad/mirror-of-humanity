import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, BookOpen, Medal, Award, Crown } from 'lucide-react';

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

const Leaderboard = () => {
  const { profile } = useAuth();
  const [houseLeaderboard, setHouseLeaderboard] = useState<HouseLeaderboard[]>([]);
  const [studentLeaderboard, setStudentLeaderboard] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch house leaderboard
      const { data: houseData } = await supabase
        .from('house_leaderboard')
        .select('*')
        .order('total_points', { ascending: false });

      if (houseData) {
        setHouseLeaderboard(houseData as unknown as HouseLeaderboard[]);
      }

      // Fetch student leaderboard
      const { data: studentData } = await supabase
        .from('student_progress')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(50);

      if (studentData) {
        setStudentLeaderboard(studentData as unknown as StudentProgress[]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const houseColors: Record<string, { bg: string; text: string; accent: string }> = {
    Kenya: { bg: 'bg-red-500/10', text: 'text-red-500', accent: 'bg-red-500' },
    Longonot: { bg: 'bg-blue-500/10', text: 'text-blue-500', accent: 'bg-blue-500' },
    Kilimanjaro: { bg: 'bg-green-500/10', text: 'text-green-500', accent: 'bg-green-500' },
    Elgon: { bg: 'bg-purple-500/10', text: 'text-purple-500', accent: 'bg-purple-500' },
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-5 h-5 text-amber-700" />;
      case 'silver': return <Award className="w-5 h-5 text-slate-400" />;
      case 'gold': return <Crown className="w-5 h-5 text-gold" />;
      default: return null;
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy font-bold">1</div>;
    if (index === 1) return <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold">2</div>;
    if (index === 2) return <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold">3</div>;
    return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">{index + 1}</div>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Leaderboard 🏆
          </h1>
          <p className="text-muted-foreground">
            See how houses and students are performing in the reading challenge.
          </p>
        </div>

        <Tabs defaultValue="houses" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="houses" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Houses
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Top Readers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="houses">
            <div className="grid gap-6">
              {/* Top 3 Houses */}
              <div className="grid md:grid-cols-3 gap-4">
                {houseLeaderboard.slice(0, 3).map((house, index) => {
                  const colors = houseColors[house.house] || { bg: 'bg-muted', text: 'text-foreground', accent: 'bg-muted-foreground' };
                  return (
                    <Card 
                      key={house.house} 
                      className={`${colors.bg} border-2 ${profile?.house === house.house ? 'border-gold ring-2 ring-gold/20' : 'border-transparent'}`}
                    >
                      <CardContent className="pt-6 text-center">
                        {getRankBadge(index)}
                        <div className={`w-4 h-20 ${colors.accent} rounded-full mx-auto my-4`} />
                        <h3 className="font-display text-2xl font-bold text-foreground">{house.house}</h3>
                        <div className="mt-4 space-y-2">
                          <div className="text-4xl font-display font-bold text-gold">{house.total_points}</div>
                          <div className="text-sm text-muted-foreground">points</div>
                        </div>
                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
                          <div className="text-center">
                            <div className="font-semibold">{house.total_readers}</div>
                            <div className="text-xs text-muted-foreground">readers</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{house.total_books}</div>
                            <div className="text-xs text-muted-foreground">books</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* All Houses Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Houses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {houseLeaderboard.map((house, index) => {
                      const colors = houseColors[house.house] || { bg: 'bg-muted', text: 'text-foreground', accent: 'bg-muted-foreground' };
                      return (
                        <div 
                          key={house.house}
                          className={`flex items-center gap-4 p-4 rounded-xl ${
                            profile?.house === house.house ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                          }`}
                        >
                          {getRankBadge(index)}
                          <div className={`w-3 h-12 rounded-full ${colors.accent}`} />
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">{house.house}</div>
                            <div className="text-sm text-muted-foreground">
                              {house.total_readers} readers • {house.total_books} books
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-display font-bold text-gold">{house.total_points}</div>
                            <div className="text-xs text-muted-foreground">points</div>
                          </div>
                        </div>
                      );
                    })}
                    {houseLeaderboard.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No data yet. Be the first to submit a book!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold" />
                  Top 50 Readers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentLeaderboard.map((student, index) => {
                    const colors = houseColors[student.house] || { bg: 'bg-muted', text: 'text-foreground', accent: 'bg-muted-foreground' };
                    return (
                      <div 
                        key={student.user_id}
                        className={`flex items-center gap-4 p-4 rounded-xl ${
                          profile?.user_id === student.user_id ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                        }`}
                      >
                        {getRankBadge(index)}
                        <div className={`w-2 h-10 rounded-full ${colors.accent}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{student.full_name}</span>
                            {getAchievementIcon(student.achievement_level)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.year_group} • {student.house}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{student.books_read}</div>
                          <div className="text-xs text-muted-foreground">books</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-gold">{student.total_points}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    );
                  })}
                  {studentLeaderboard.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No readers yet. Be the first to submit a book!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Leaderboard;
