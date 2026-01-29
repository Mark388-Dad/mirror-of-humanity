import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Trophy, Target, Star, Medal, Award, Crown, Zap, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ReadingStreak from '@/components/ReadingStreak';
import BookRecommendations from '@/components/BookRecommendations';

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

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Fetch student progress (for students)
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
        
        // Calculate school stats
        const stats = {
          total_students: leaderboardData.reduce((sum, h: any) => sum + (h.total_readers || 0), 0),
          total_books: leaderboardData.reduce((sum, h: any) => sum + (h.total_books || 0), 0),
          total_points: leaderboardData.reduce((sum, h: any) => sum + (h.total_points || 0), 0),
        };
        setSchoolStats(stats);
      }

      // Fetch active challenges
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

  const getRoleWelcome = () => {
    switch (profile?.role) {
      case 'librarian': return 'Manage challenges and review submissions.';
      case 'homeroom_tutor': return 'Track your class\'s reading progress.';
      case 'head_of_year': return 'Monitor year group achievements.';
      case 'house_patron': return 'Lead your house to reading glory!';
      default: return 'Keep reading! You\'re doing great.';
    }
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
          <p className="text-muted-foreground">{getRoleWelcome()}</p>
        </div>

        {/* School-Wide Stats */}
        {schoolStats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{schoolStats.total_students}</div>
                <div className="text-sm text-muted-foreground">Active Readers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{schoolStats.total_books}</div>
                <div className="text-sm text-muted-foreground">Books Read</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
                <div className="text-3xl font-display font-bold">{schoolStats.total_points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </CardContent>
            </Card>
          </div>
        )}

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

          {/* Reading Streak - Students Only */}
          {profile?.role === 'student' && (
            <ReadingStreak />
          )}

          {/* House Leaderboard */}
          <Card className={profile?.role === 'student' ? '' : 'lg:col-span-2'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  House Leaderboard
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/leaderboard">View All</Link>
                </Button>
              </div>
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

          {/* Active Challenges */}
          <Card className={profile?.role !== 'student' ? 'lg:col-span-1' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Active Challenges
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/challenges">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeChallenges.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No active challenges right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeChallenges.map(challenge => (
                    <div key={challenge.id} className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{challenge.title}</span>
                        <span className="text-xs text-gold font-bold">+{challenge.points_reward} pts</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {challenge.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Book Recommendations - Students Only */}
          {profile?.role === 'student' && (
            <BookRecommendations />
          )}

          {/* Quick Stats for Staff */}
          {profile?.role !== 'student' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.role === 'librarian' && (
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/librarian">Manage Challenges</Link>
                  </Button>
                )}
                {(profile?.role === 'homeroom_tutor' || profile?.role === 'head_of_year') && (
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/tutor">View Class Progress</Link>
                  </Button>
                )}
                {profile?.role === 'house_patron' && (
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/house">View House Progress</Link>
                  </Button>
                )}
                <Button asChild className="w-full" variant="outline">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/gallery">Browse Book Gallery</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
