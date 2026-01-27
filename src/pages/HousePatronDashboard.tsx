import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Trophy, TrendingUp, Medal, Award, Crown } from 'lucide-react';

interface HouseStudent {
  user_id: string;
  full_name: string;
  year_group: string;
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
}

const HousePatronDashboard = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<HouseStudent[]>([]);
  const [stats, setStats] = useState<HouseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.house) {
      fetchHouseData();
    }
  }, [profile?.house]);

  const fetchHouseData = async () => {
    if (!profile?.house) return;

    // Fetch students in the house with their progress
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

    // Calculate stats
    const totalMembers = studentsList.length;
    const totalBooks = studentsList.reduce((sum, s) => sum + (s.books_read || 0), 0);
    const totalPoints = studentsList.reduce((sum, s) => sum + (s.total_points || 0), 0);
    const bronzeCount = studentsList.filter(s => s.achievement_level === 'bronze').length;
    const silverCount = studentsList.filter(s => s.achievement_level === 'silver').length;
    const goldCount = studentsList.filter(s => s.achievement_level === 'gold').length;

    setStats({
      total_members: totalMembers,
      total_books: totalBooks,
      total_points: totalPoints,
      bronze_count: bronzeCount,
      silver_count: silverCount,
      gold_count: goldCount,
    });

    setLoading(false);
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-5 h-5 text-amber-700" />;
      case 'silver': return <Award className="w-5 h-5 text-slate-400" />;
      case 'gold': return <Crown className="w-5 h-5 text-gold" />;
      default: return null;
    }
  };

  const houseColors: Record<string, string> = {
    Kenya: 'from-red-500 to-red-600',
    Longonot: 'from-blue-500 to-blue-600',
    Kilimanjaro: 'from-green-500 to-green-600',
    Elgon: 'from-purple-500 to-purple-600',
  };

  if (profile?.role !== 'house_patron') {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* House Header */}
        <div className={`rounded-2xl bg-gradient-to-r ${houseColors[profile?.house || ''] || 'from-gray-500 to-gray-600'} p-8 mb-8 text-white`}>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            House {profile?.house} 🏠
          </h1>
          <p className="text-white/80">
            Track your house members' reading journey and achievements.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{stats.total_members}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{stats.total_books}</div>
                <div className="text-sm text-muted-foreground">Total Books</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{stats.total_points}</div>
                <div className="text-sm text-muted-foreground">House Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="flex justify-center gap-2 text-sm mt-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">{stats.bronze_count} 🥉</Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">{stats.silver_count} 🥈</Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{stats.gold_count} 🥇</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">Achievements</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Readers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              House Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No readers in your house yet.
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div 
                    key={student.user_id}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      index < 3 ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-gold text-navy' : 
                      index === 1 ? 'bg-slate-300 text-slate-800' : 
                      index === 2 ? 'bg-amber-600 text-white' : 
                      'bg-background'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{student.full_name}</span>
                        {getAchievementIcon(student.achievement_level)}
                        <Badge variant="outline" className="text-xs">
                          {student.year_group}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <Progress 
                          value={(student.books_read / 45) * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {student.books_read}/45 books
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gold">{student.total_points}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HousePatronDashboard;
