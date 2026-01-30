import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, Star, Sparkles, Flame, Globe, Heart, 
  Brain, Music, Lightbulb, Feather, Mountain, Compass,
  Telescope, BookMarked, Library, GraduationCap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  requirement: (completedCategories: number[], booksRead: number) => boolean;
  unlocked?: boolean;
}

const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'first_book',
    name: 'First Steps',
    description: 'Submit your first book',
    icon: BookOpen,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    requirement: (_, books) => books >= 1,
  },
  {
    id: 'fiction_explorer',
    name: 'Fiction Explorer',
    description: 'Complete 5 fiction categories',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    requirement: (cats) => cats.filter(c => c >= 1 && c <= 15).length >= 5,
  },
  {
    id: 'nonfiction_master',
    name: 'Knowledge Seeker',
    description: 'Complete 5 non-fiction categories',
    icon: Brain,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    requirement: (cats) => cats.filter(c => c >= 16 && c <= 25).length >= 5,
  },
  {
    id: 'poetry_soul',
    name: 'Poetic Soul',
    description: 'Complete a poetry category',
    icon: Feather,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    requirement: (cats) => cats.includes(26) || cats.includes(27),
  },
  {
    id: 'drama_lover',
    name: 'Stage Presence',
    description: 'Complete a play/drama category',
    icon: Music,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    requirement: (cats) => cats.includes(28) || cats.includes(29) || cats.includes(30),
  },
  {
    id: 'world_traveler',
    name: 'World Traveler',
    description: 'Read books from 3 different cultures',
    icon: Globe,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    requirement: (cats) => cats.filter(c => [5, 6, 7, 11, 12, 24].includes(c)).length >= 3,
  },
  {
    id: 'empathy_champion',
    name: 'Empathy Champion',
    description: 'Complete categories about identity and emotions',
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    requirement: (cats) => cats.includes(2) && cats.includes(3) && cats.includes(4),
  },
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain a 3-week reading streak',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    requirement: (_, books) => books >= 3, // Simplified, actual streak tracked separately
  },
  {
    id: 'adventurer',
    name: 'Adventurer',
    description: 'Complete adventure and survival categories',
    icon: Mountain,
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    requirement: (cats) => cats.includes(8) && cats.includes(9),
  },
  {
    id: 'deep_thinker',
    name: 'Deep Thinker',
    description: 'Complete philosophy and ethics categories',
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    requirement: (cats) => cats.filter(c => [19, 20, 21, 25].includes(c)).length >= 2,
  },
  {
    id: 'explorer',
    name: 'Literary Explorer',
    description: 'Complete 15 different categories',
    icon: Compass,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    requirement: (cats) => cats.length >= 15,
  },
  {
    id: 'visionary',
    name: 'Visionary Reader',
    description: 'Complete sci-fi and speculative fiction',
    icon: Telescope,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    requirement: (cats) => cats.includes(10) && cats.includes(11),
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete all 30 categories',
    icon: Library,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    requirement: (cats) => cats.length >= 30,
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Reach 100 total points',
    icon: GraduationCap,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    requirement: (_, books) => books * 3 >= 100, // Approximation
  },
  {
    id: 'bookworm',
    name: 'Dedicated Bookworm',
    description: 'Read 25 books',
    icon: BookMarked,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    requirement: (_, books) => books >= 25,
  },
  {
    id: 'legend',
    name: 'Reading Legend',
    description: 'Complete the 45-Book Challenge',
    icon: Star,
    color: 'text-gold',
    bgColor: 'bg-gradient-to-br from-gold/20 to-amber-500/10',
    requirement: (_, books) => books >= 45,
  },
];

const AchievementBadges = () => {
  const { user } = useAuth();
  const [completedCategories, setCompletedCategories] = useState<number[]>([]);
  const [booksRead, setBooksRead] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('book_submissions')
        .select('category_number')
        .eq('user_id', user.id);

      if (!error && data) {
        const categories = [...new Set(data.map(d => d.category_number))];
        setCompletedCategories(categories);
        setBooksRead(data.length);
      }
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  const badgesWithStatus = ACHIEVEMENT_BADGES.map(badge => ({
    ...badge,
    unlocked: badge.requirement(completedCategories, booksRead),
  }));

  const unlockedCount = badgesWithStatus.filter(b => b.unlocked).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            Achievement Badges
          </CardTitle>
          <Badge variant="secondary" className="text-gold">
            {unlockedCount}/{ACHIEVEMENT_BADGES.length} Unlocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {badgesWithStatus.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  badge.unlocked
                    ? `${badge.bgColor} border-current shadow-lg`
                    : 'bg-muted/30 border-border opacity-50 grayscale'
                }`}
              >
                {badge.unlocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.unlocked ? badge.bgColor : 'bg-muted'}`}>
                    <Icon className={`w-6 h-6 ${badge.unlocked ? badge.color : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {badge.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;
