import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useChallenge } from '@/contexts/ChallengeContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, Users, Zap, Search, Star, ArrowRight, Loader2, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays, isPast } from 'date-fns';

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  start_date: string;
  end_date: string;
  target_books: number | null;
  points_reward: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  is_independent: boolean;
  difficulty_level: string | null;
  primary_color: string | null;
  cover_image_url: string | null;
  category: string | null;
  participant_count?: number;
}

const ChallengeHub = () => {
  const navigate = useNavigate();
  const { selectChallenge } = useChallenge();
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('active');

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      // Get participant counts
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('challenge_id');

      const countMap: Record<string, number> = {};
      participants?.forEach(p => {
        countMap[p.challenge_id] = (countMap[p.challenge_id] || 0) + 1;
      });

      setChallenges(data.map(c => ({
        ...c,
        participant_count: countMap[c.id] || 0,
      })) as ChallengeItem[]);
    }
    setLoading(false);
  };

  const filtered = challenges.filter(c => {
    const now = new Date();
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'active': return c.is_active && !isPast(new Date(c.end_date));
      case 'upcoming': return new Date(c.start_date) > now;
      case 'completed': return isPast(new Date(c.end_date));
      default: return true;
    }
  });

  const featured = filtered.filter(c => c.is_featured);
  const regular = filtered.filter(c => !c.is_featured);

  const handleEnterChallenge = async (id: string) => {
    await selectChallenge(id);
    navigate(`/challenge/${id}/dashboard`);
  };

  const getDifficultyBadge = (level: string | null) => {
    switch (level) {
      case 'beginner': return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">🟢 Beginner</Badge>;
      case 'advanced': return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">🔴 Advanced</Badge>;
      default: return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">🔵 Intermediate</Badge>;
    }
  };

  const getTimeStatus = (c: ChallengeItem) => {
    const now = new Date();
    const end = new Date(c.end_date);
    const start = new Date(c.start_date);
    
    if (isPast(end)) return { label: 'Completed', color: 'text-muted-foreground' };
    if (start > now) return { label: `Starts ${format(start, 'MMM d')}`, color: 'text-blue-500' };
    
    const days = differenceInDays(end, now);
    if (days <= 3) return { label: `${days}d left`, color: 'text-red-500' };
    return { label: `${days}d left`, color: 'text-green-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Challenge Hub" description="Browse and join reading challenges. Each challenge creates a unique experience." path="/challenges" />
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Trophy className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Challenge Hub
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose a challenge to enter its world. Each challenge transforms the entire platform with its own theme, leaderboard, and content.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search challenges..."
              className="pl-10" />
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured Challenges */}
        {featured.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" /> Featured Challenges
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featured.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="overflow-hidden border-2 border-yellow-500/30 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
                    onClick={() => handleEnterChallenge(c.id)}>
                    {c.cover_image_url && (
                      <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${c.cover_image_url})` }}>
                        <div className="h-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                          <h3 className="text-2xl font-bold text-white">{c.title}</h3>
                        </div>
                      </div>
                    )}
                    <CardContent className={c.cover_image_url ? 'pt-4' : 'pt-6'}>
                      {!c.cover_image_url && <h3 className="text-xl font-bold mb-2">{c.title}</h3>}
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{c.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getDifficultyBadge(c.difficulty_level)}
                          <span className={`text-sm font-medium ${getTimeStatus(c).color}`}>
                            <Calendar className="w-3 h-3 inline mr-1" />{getTimeStatus(c).label}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            <Users className="w-3 h-3 inline mr-1" />{c.participant_count}
                          </span>
                        </div>
                        <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                          Enter <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Challenges */}
        {regular.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" /> All Challenges
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map((c, i) => {
                const status = getTimeStatus(c);
                const themeColor = c.primary_color ? `hsl(${c.primary_color})` : undefined;

                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group border-2 border-transparent hover:border-primary/30"
                      onClick={() => handleEnterChallenge(c.id)}
                      style={themeColor ? { borderColor: `${themeColor}30` } : undefined}>
                      {c.cover_image_url ? (
                        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${c.cover_image_url})` }}>
                          <div className="h-full bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      ) : (
                        <div className="h-3 bg-gradient-to-r from-primary to-purple-500"
                          style={themeColor ? { background: `linear-gradient(to right, ${themeColor}, hsl(var(--accent)))` } : undefined} />
                      )}
                      <CardContent className="pt-4">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{c.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{c.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {getDifficultyBadge(c.difficulty_level)}
                          {c.points_reward && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />{c.points_reward} XP
                            </Badge>
                          )}
                          {c.target_books && (
                            <Badge variant="outline" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />{c.target_books} books
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${status.color}`}>{status.label}</span>
                          <span className="text-muted-foreground"><Users className="w-3 h-3 inline mr-1" />{c.participant_count}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No challenges found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChallengeHub;
