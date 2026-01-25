import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Trophy, Target, Star, Medal, Award, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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

const Dashboard = () => {
  const { profile } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<HouseLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch student progress
      if (profile.role === 'student') {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        
        if (progressData) {
          setProgress(progressData as unknown as StudentProgress);
        }
      }

      // Fetch house leaderboard
      const { data: leaderboardData } = await supabase
        .from('house_leaderboard')
        .select('*')
        .order('total_points', { ascending: false });
      
      if (leaderboardData) {
        setLeaderboard(leaderboardData as unknown as HouseLeaderboard[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-8 h-8 text-amber-700" />;
      case 'silver': return <Award className="w-8 h-8 text-slate-400" />;
      case 'gold': return <Crown className="w-8 h-8 text-gold" />;
      default: return <Target className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getNextLevel = (booksRead: number) => {
    if (booksRead < 15) return { name: 'Bronze', target: 15, remaining: 15 - booksRead };
    if (booksRead < 30) return { name: 'Silver', target: 30, remaining: 30 - booksRead };
    if (booksRead < 45) return { name: 'Gold', target: 45, remaining: 45 - booksRead };
    return null;
  };

  const houseColors: Record<string, string> = {
    Kenya: 'bg-red-500',
    Longonot: 'bg-blue-500',
    Kilimanjaro: 'bg-green-500',
    Elgon: 'bg-purple-500',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === 'student' 
              ? `Keep reading! You're doing great.`
              : `Track student progress and engagement.`}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Progress Card - Students Only */}
          {profile?.role === 'student' && (
            <Card className="lg:col-span-2 card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gold" />
                  Your Reading Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center">
                    {getAchievementIcon(progress?.achievement_level || 'none')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-display font-bold text-foreground">
                        {progress?.books_read || 0}
                      </span>
                      <span className="text-muted-foreground">/ 45 books</span>
                    </div>
                    <Progress 
                      value={((progress?.books_read || 0) / 45) * 100} 
                      className="h-3"
                    />
                    {progress?.books_read !== undefined && getNextLevel(progress.books_read) && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {getNextLevel(progress.books_read)?.remaining} more books to reach{' '}
                        <span className="font-medium text-gold">
                          {getNextLevel(progress.books_read)?.name}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-secondary">
                    <div className="text-2xl font-display font-bold text-foreground">
                      {progress?.total_points || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-secondary">
                    <div className="text-2xl font-display font-bold text-foreground capitalize">
                      {progress?.achievement_level || 'None'}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Level</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-secondary">
                    <div className="text-2xl font-display font-bold text-foreground">
                      {profile?.house || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">House</div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button asChild className="bg-gold text-navy hover:bg-gold-light flex-1">
                    <Link to="/submit">Submit a Book</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/progress">View Full Progress</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* House Leaderboard */}
          <Card className={profile?.role === 'student' ? '' : 'lg:col-span-2'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                House Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((house, index) => (
                  <div 
                    key={house.house}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      profile?.house === house.house ? 'bg-gold/10 border border-gold/30' : 'bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-bold">
                      {index + 1}
                    </div>
                    <div className={`w-3 h-12 rounded-full ${houseColors[house.house] || 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{house.house}</div>
                      <div className="text-sm text-muted-foreground">
                        {house.total_readers} readers • {house.total_books} books
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-display font-bold text-gold">
                        {house.total_points}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No data yet. Be the first to submit a book!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats for Staff */}
          {profile?.role !== 'student' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary">
                    <div className="text-3xl font-display font-bold text-foreground">
                      {leaderboard.reduce((sum, h) => sum + h.total_readers, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Participants</div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary">
                    <div className="text-3xl font-display font-bold text-foreground">
                      {leaderboard.reduce((sum, h) => sum + h.total_books, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Books Submitted</div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary">
                    <div className="text-3xl font-display font-bold text-foreground">
                      {leaderboard.reduce((sum, h) => sum + h.total_points, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
