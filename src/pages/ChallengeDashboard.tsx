import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenge } from '@/contexts/ChallengeContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Trophy, Target, Users, Zap, ArrowLeft, Calendar, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import ReadingStreak from '@/components/ReadingStreak';
import BookRecommendations from '@/components/BookRecommendations';
import XPProgressBar from '@/components/XPProgressBar';
import { HOUSE_COLORS } from '@/lib/constants';

interface Participant {
  user_id: string;
  books_completed: number;
  joined_at: string;
  profiles?: { full_name: string; house: string | null };
}

const ChallengeDashboard = () => {
  const { profile } = useAuth();
  const { activeChallenge, layoutConfig, clearChallenge } = useChallenge();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipation, setMyParticipation] = useState<Participant | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (activeChallenge) fetchData();
  }, [activeChallenge]);

  const fetchData = async () => {
    if (!activeChallenge) return;

    // Fetch participants
    const { data: parts } = await supabase
      .from('challenge_participants')
      .select('*, profiles!challenge_participants_user_id_fkey(full_name, house)')
      .eq('challenge_id', activeChallenge.id)
      .order('books_completed', { ascending: false });

    if (parts) {
      setParticipants(parts as unknown as Participant[]);
      if (profile) {
        const mine = parts.find((p: any) => p.user_id === profile.user_id);
        setMyParticipation(mine as unknown as Participant || null);
      }
    }

    // Fetch challenge submissions
    const { data: subs } = await supabase
      .from('challenge_submissions')
      .select('*')
      .eq('challenge_id', activeChallenge.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (subs) setSubmissions(subs);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!profile || !activeChallenge) return;
    setJoining(true);
    const { error } = await supabase.from('challenge_participants').insert({
      challenge_id: activeChallenge.id,
      user_id: profile.user_id,
    });
    if (!error) {
      setMyParticipation({ user_id: profile.user_id, books_completed: 0, joined_at: new Date().toISOString() });
      fetchData();
    }
    setJoining(false);
  };

  const handleLeaveChallenge = () => {
    clearChallenge();
    navigate('/challenges');
  };

  if (!activeChallenge) return null;

  const daysLeft = differenceInDays(new Date(activeChallenge.end_date), new Date());
  const sections = layoutConfig.sections;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={activeChallenge.title} description={activeChallenge.description} path={`/challenge/${activeChallenge.id}/dashboard`} />
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Challenge Header */}
        {sections.includes('hero') && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            {layoutConfig.hero_style === 'full' && activeChallenge.cover_image_url ? (
              <div className="relative rounded-2xl overflow-hidden mb-6">
                <div className="h-64 bg-cover bg-center" style={{ backgroundImage: `url(${activeChallenge.cover_image_url})` }}>
                  <div className="h-full bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Button variant="ghost" size="sm" onClick={handleLeaveChallenge} className="text-white/80 hover:text-white">
                        <ArrowLeft className="w-4 h-4 mr-1" /> All Challenges
                      </Button>
                    </div>
                    {activeChallenge.logo_url && (
                      <img src={activeChallenge.logo_url} alt="" className="h-12 object-contain mb-3" />
                    )}
                    <h1 className="text-4xl font-display font-bold text-white">{activeChallenge.title}</h1>
                    <p className="text-white/80 mt-2 max-w-2xl">{activeChallenge.welcome_message || activeChallenge.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <Button variant="ghost" size="sm" onClick={handleLeaveChallenge} className="mb-2">
                    <ArrowLeft className="w-4 h-4 mr-1" /> All Challenges
                  </Button>
                  <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {activeChallenge.title}
                  </h1>
                  <p className="text-muted-foreground mt-1">{activeChallenge.welcome_message || activeChallenge.description}</p>
                </div>
                {activeChallenge.logo_url && (
                  <img src={activeChallenge.logo_url} alt="" className="h-16 object-contain" />
                )}
              </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                  <div className="text-2xl font-bold">{participants.length}</div>
                  <div className="text-xs text-muted-foreground">Participants</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{submissions.length}</div>
                  <div className="text-xs text-muted-foreground">Submissions</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{activeChallenge.points_reward || 0}</div>
                  <div className="text-xs text-muted-foreground">XP Reward</div>
                </CardContent>
              </Card>
              <Card className={`bg-gradient-to-br ${daysLeft <= 3 ? 'from-red-500/10 to-red-500/5' : 'from-green-500/10 to-green-500/5'}`}>
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{Math.max(0, daysLeft)}</div>
                  <div className="text-xs text-muted-foreground">Days Left</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Join Button */}
        {profile?.role === 'student' && !myParticipation && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="py-6 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="text-xl font-bold mb-2">Ready to join this challenge?</h3>
                <p className="text-muted-foreground mb-4">Join now to start tracking your progress and competing!</p>
                <Button onClick={handleJoin} disabled={joining} className="bg-primary text-primary-foreground">
                  {joining ? 'Joining...' : 'Join Challenge'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* My Progress */}
        {myParticipation && sections.includes('progress') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold">{myParticipation.books_completed || 0}</div>
                  <div className="text-muted-foreground">/ {activeChallenge.target_books || '∞'} books</div>
                </div>
                {activeChallenge.target_books && (
                  <Progress value={Math.min(((myParticipation.books_completed || 0) / activeChallenge.target_books) * 100, 100)} className="h-3" />
                )}
                {layoutConfig.show_xp && (
                  <div className="mt-4">
                    <XPProgressBar currentXP={(myParticipation.books_completed || 0) * 3} />
                  </div>
                )}
                <div className="mt-4">
                  <Button asChild>
                    <Link to={`/challenge/${activeChallenge.id}/submit`}>
                      <BookOpen className="w-4 h-4 mr-2" /> Submit a Book
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          {sections.includes('leaderboard') && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Challenge Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {participants.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No participants yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3">
                      {participants.slice(0, 10).map((p, i) => (
                        <div key={p.user_id} className={`flex items-center gap-3 p-3 rounded-lg ${
                          p.user_id === profile?.user_id ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {(p as any).profiles?.full_name || 'Anonymous'}
                              {p.user_id === profile?.user_id && <Badge className="ml-2 text-xs">You</Badge>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{p.books_completed || 0}</div>
                            <div className="text-xs text-muted-foreground">books</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Side panel */}
          <div className="space-y-6">
            {layoutConfig.show_streak && (
              <ReadingStreak />
            )}
            {layoutConfig.show_recommendations && (
              <BookRecommendations />
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        {sections.includes('submissions') && submissions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Recent Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {submissions.slice(0, 10).map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{sub.title}</div>
                        <div className="text-xs text-muted-foreground">by {sub.author}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">+{sub.points_earned} XP</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ChallengeDashboard;
