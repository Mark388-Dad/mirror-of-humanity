import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Calendar, Users, Zap, Target, BookOpen, CheckCircle, Loader2, Plus } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_books: number;
  points_reward: number;
  is_active: boolean;
  is_independent: boolean;
}

interface Participation {
  challenge_id: string;
  books_completed: number;
  completed_at: string | null;
}

const Challenges = () => {
  const { user, profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Record<string, Participation>>({});
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);
  const [challengeForm, setChallengeForm] = useState({ title: '', author: '', reflection: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchChallenges(); }, [user]);

  const fetchChallenges = async () => {
    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('end_date', { ascending: true });

    setChallenges((challengeData as Challenge[]) || []);

    if (user) {
      const { data: participationData } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', user.id);

      if (participationData) {
        const map: Record<string, Participation> = {};
        participationData.forEach((p: any) => { map[p.challenge_id] = p; });
        setParticipations(map);
      }
    }

    const counts: Record<string, number> = {};
    for (const challenge of (challengeData as Challenge[]) || []) {
      const { count } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challenge.id);
      counts[challenge.id] = count || 0;
    }
    setParticipantCounts(counts);
    setLoading(false);
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) { toast.error('Please sign in'); return; }
    if (profile?.role !== 'student') { toast.error('Only students can join'); return; }
    setJoining(challengeId);

    const { error } = await supabase.from('challenge_participants').insert({
      challenge_id: challengeId, user_id: user.id, books_completed: 0,
    });

    if (error) {
      toast.error(error.code === '23505' ? 'Already joined' : 'Failed to join');
    } else {
      toast.success('Joined the challenge! 🎉');
      fetchChallenges();
    }
    setJoining(null);
  };

  const submitChallengeBook = async (challengeId: string) => {
    if (!user || !challengeForm.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);

    const { error } = await supabase.from('challenge_submissions').insert({
      challenge_id: challengeId,
      user_id: user.id,
      title: challengeForm.title.trim(),
      author: challengeForm.author.trim() || 'Unknown',
      reflection: challengeForm.reflection.trim(),
    });

    if (error) {
      toast.error('Failed to submit');
    } else {
      // Increment books_completed
      const current = participations[challengeId]?.books_completed || 0;
      await supabase.from('challenge_participants')
        .update({ books_completed: current + 1 })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      toast.success('Book submitted for challenge! +3 points');
      setChallengeForm({ title: '', author: '', reflection: '' });
      setSubmittingFor(null);
      fetchChallenges();
    }
    setSubmitting(false);
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'timed_sprint': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'category': return <Target className="w-5 h-5 text-blue-500" />;
      case 'house_competition': return <Trophy className="w-5 h-5 text-purple-500" />;
      default: return <BookOpen className="w-5 h-5 text-green-500" />;
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'timed_sprint': return 'Reading Sprint';
      case 'category': return 'Category Challenge';
      case 'house_competition': return 'House Competition';
      default: return 'Custom Challenge';
    }
  };

  const isStudent = profile?.role === 'student';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Reading Challenges 🏆
          </h1>
          <p className="text-muted-foreground">
            Join exciting challenges to earn extra points and compete with fellow readers!
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
              <p className="text-muted-foreground">Check back soon for new reading challenges!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map(challenge => {
              const participation = participations[challenge.id];
              const hasJoined = !!participation;
              const isCompleted = !!participation?.completed_at;
              const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
              const isExpired = isPast(new Date(challenge.end_date));
              const progress = hasJoined 
                ? ((participation.books_completed || 0) / challenge.target_books) * 100
                : 0;

              return (
                <Card key={challenge.id} className={`card-elevated ${isCompleted ? 'border-green-500 bg-green-50/50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getChallengeTypeIcon(challenge.challenge_type)}
                        <Badge variant="outline">{getChallengeTypeLabel(challenge.challenge_type)}</Badge>
                        {challenge.is_independent && <Badge variant="secondary" className="text-xs">Independent</Badge>}
                      </div>
                      <Badge variant={isExpired ? 'secondary' : daysLeft <= 3 ? 'destructive' : 'default'} className="text-xs">
                        {isExpired ? 'Ended' : `${daysLeft} days left`}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-display mt-2">{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-secondary rounded-lg p-2">
                        <div className="text-lg font-bold text-foreground">{challenge.target_books}</div>
                        <div className="text-xs text-muted-foreground">Books</div>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <div className="text-lg font-bold text-gold">+{challenge.points_reward}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <div className="text-lg font-bold text-foreground">{participantCounts[challenge.id] || 0}</div>
                        <div className="text-xs text-muted-foreground">Joined</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                    </div>

                    {hasJoined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your Progress</span>
                          <span className="font-medium">{participation.books_completed || 0} / {challenge.target_books}</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                      </div>
                    )}

                    {isStudent && !isExpired && (
                      <div className="space-y-2">
                        {!hasJoined ? (
                          <Button className="w-full" disabled={joining === challenge.id} onClick={() => joinChallenge(challenge.id)}>
                            {joining === challenge.id ? 'Joining...' : <><Zap className="w-4 h-4 mr-2" />Join Challenge</>}
                          </Button>
                        ) : isCompleted ? (
                          <Button className="w-full" variant="secondary" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />Completed!
                          </Button>
                        ) : (
                          <Dialog open={submittingFor === challenge.id} onOpenChange={(open) => !open && setSubmittingFor(null)}>
                            <DialogTrigger asChild>
                              <Button className="w-full" variant="outline" onClick={() => setSubmittingFor(challenge.id)}>
                                <Plus className="w-4 h-4 mr-2" />Submit for this Challenge
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Book for: {challenge.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {challenge.is_independent && (
                                  <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg">
                                    ℹ️ This is an independent challenge — submissions do NOT count toward your 45-book total.
                                  </p>
                                )}
                                <div>
                                  <Label>Book Title *</Label>
                                  <Input value={challengeForm.title} onChange={e => setChallengeForm(f => ({ ...f, title: e.target.value }))} placeholder="Book title" />
                                </div>
                                <div>
                                  <Label>Author</Label>
                                  <Input value={challengeForm.author} onChange={e => setChallengeForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" />
                                </div>
                                <div>
                                  <Label>Reflection</Label>
                                  <Textarea value={challengeForm.reflection} onChange={e => setChallengeForm(f => ({ ...f, reflection: e.target.value }))} placeholder="Your thoughts..." rows={3} />
                                </div>
                                <Button onClick={() => submitChallengeBook(challenge.id)} disabled={submitting} className="w-full">
                                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                  Submit (+3 pts)
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )}

                    {!isStudent && (
                      <p className="text-sm text-center text-muted-foreground">Only students can join challenges</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Challenges;
