import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Clock, Target, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, isPast, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FeaturedChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  difficulty_level: string | null;
  start_date: string;
  end_date: string;
  target_books: number | null;
  points_reward: number | null;
  badge_name: string | null;
  is_independent: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-red-500',
};

const CHALLENGE_GRADIENTS: Record<string, string> = {
  reading: 'from-blue-500/20 via-cyan-500/10 to-transparent',
  genre_explorer: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  reflection: 'from-violet-500/20 via-purple-500/10 to-transparent',
  house_competition: 'from-amber-500/20 via-orange-500/10 to-transparent',
  timed_sprint: 'from-yellow-500/20 via-amber-500/10 to-transparent',
  creative_response: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
  daily_streak: 'from-red-500/20 via-orange-500/10 to-transparent',
  custom: 'from-purple-500/20 via-indigo-500/10 to-transparent',
};

const CHALLENGE_EMOJIS: Record<string, string> = {
  reading: '📚', genre_explorer: '🗺️', reflection: '✍️', performance: '🎭',
  house_competition: '🏠', ai_buddy: '🤖', creative_response: '🎨',
  daily_streak: '🔥', classic_modern: '📖', book_to_life: '🌍',
  timed_sprint: '⏱️', category: '🏷️', custom: '⚡',
};

const FeaturedChallenges = () => {
  const [challenges, setChallenges] = useState<FeaturedChallenge[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('id, title, description, challenge_type, difficulty_level, start_date, end_date, target_books, points_reward, badge_name, is_independent')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('end_date', { ascending: true })
        .limit(6);

      if (data && data.length > 0) {
        setChallenges(data);
        // Fetch participant counts
        const counts: Record<string, number> = {};
        for (const c of data) {
          const { count } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', c.id);
          counts[c.id] = count || 0;
        }
        setParticipantCounts(counts);
      }
    };

    fetchFeatured();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('featured-challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        fetchFeatured();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (challenges.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">Active Challenges</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
          Featured Reading Challenges 🏆
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join exciting challenges, earn bonus points, and compete with fellow readers!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge, index) => {
          const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
          const isExpired = isPast(new Date(challenge.end_date));
          const participants = participantCounts[challenge.id] || 0;
          const gradient = CHALLENGE_GRADIENTS[challenge.challenge_type] || CHALLENGE_GRADIENTS.custom;
          const emoji = CHALLENGE_EMOJIS[challenge.challenge_type] || '📚';

          return (
            <motion.div key={challenge.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}>
              <Link to="/challenges">
                <Card className={`h-full border-2 border-primary/10 overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:border-primary/30`}>
                  {/* Top gradient bar */}
                  <div className={`h-2 bg-gradient-to-r ${gradient.replace('/20', '').replace('/10', '').replace('to-transparent', 'to-purple-500')}`} />

                  <CardContent className={`pt-5 pb-6 bg-gradient-to-br ${gradient}`}>
                    {/* Header badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{emoji}</span>
                        <Badge className={`${DIFFICULTY_COLORS[challenge.difficulty_level || 'intermediate']} text-white text-xs`}>
                          {challenge.difficulty_level || 'intermediate'}
                        </Badge>
                      </div>
                      <Badge variant={isExpired ? 'secondary' : daysLeft <= 3 ? 'destructive' : 'outline'}
                        className={`text-xs ${!isExpired && daysLeft <= 3 ? 'animate-pulse' : ''}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {isExpired ? 'Ended' : `${daysLeft}d left`}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-display font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{challenge.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-background/60 backdrop-blur rounded-lg p-2">
                        <Target className="w-4 h-4 mx-auto mb-1 text-primary" />
                        <div className="text-sm font-bold">{challenge.target_books || 1}</div>
                        <div className="text-[10px] text-muted-foreground">Books</div>
                      </div>
                      <div className="bg-background/60 backdrop-blur rounded-lg p-2">
                        <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                        <div className="text-sm font-bold text-yellow-600">+{challenge.points_reward || 5}</div>
                        <div className="text-[10px] text-muted-foreground">Points</div>
                      </div>
                      <div className="bg-background/60 backdrop-blur rounded-lg p-2">
                        <Users className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                        <div className="text-sm font-bold">{participants}</div>
                        <div className="text-[10px] text-muted-foreground">Joined</div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {challenge.badge_name && (
                          <Badge variant="secondary" className="text-xs">🏅 {challenge.badge_name}</Badge>
                        )}
                        {challenge.is_independent && (
                          <Badge variant="secondary" className="text-xs">🔓 Independent</Badge>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-center mt-8">
        <Button asChild variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5">
          <Link to="/challenges">
            <Trophy className="w-4 h-4 mr-2" />View All Challenges<ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
};

export default FeaturedChallenges;
