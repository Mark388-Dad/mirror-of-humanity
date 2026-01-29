import { useState, useEffect } from 'react';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_bonus_points: number;
  last_submission_date: string | null;
}

const ReadingStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      const { data, error } = await supabase
        .from('reading_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setStreak(data);
      }
      setLoading(false);
    };

    fetchStreak();
  }, [user]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const bonusPoints = streak?.total_bonus_points || 0;

  const getStreakEmoji = (count: number) => {
    if (count >= 10) return '🔥🔥🔥';
    if (count >= 5) return '🔥🔥';
    if (count >= 1) return '🔥';
    return '❄️';
  };

  const getStreakMessage = (count: number) => {
    if (count >= 10) return "You're on fire! Incredible streak!";
    if (count >= 5) return 'Amazing consistency! Keep it up!';
    if (count >= 3) return 'Nice streak going! Keep reading!';
    if (count >= 1) return 'Good start! Read more to build your streak!';
    return 'Submit a book to start your streak!';
  };

  return (
    <Card className="card-elevated overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          Reading Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-center mb-4">
          <div className="text-4xl mb-1">{getStreakEmoji(currentStreak)}</div>
          <div className="text-3xl font-bold font-display text-foreground">
            {currentStreak} {currentStreak === 1 ? 'book' : 'books'}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getStreakMessage(currentStreak)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Trophy className="w-4 h-4 text-gold" />
            <div>
              <div className="text-sm font-medium">{longestStreak}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-sm font-medium">+{bonusPoints}</div>
              <div className="text-xs text-muted-foreground">Bonus Points</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Keep reading within 7 days to maintain your streak! 3+ books = bonus points!
        </p>
      </CardContent>
    </Card>
  );
};

export default ReadingStreak;
