import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Feather, Globe, Clock, Palette } from 'lucide-react';

export interface ChallengeTemplate {
  name: string;
  icon: React.ReactNode;
  category: string;
  difficulty: string;
  targetBooks: number;
  points: number;
  duration: number; // days
  title: string;
  description: string;
  color: string;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    name: 'Reading Sprint',
    icon: <Zap className="w-5 h-5" />,
    category: 'timed_sprint',
    difficulty: 'intermediate',
    targetBooks: 3,
    points: 15,
    duration: 7,
    title: '7-Day Reading Sprint 🏃‍♂️',
    description: 'Read 3 books in one week! Push your reading speed and discover new favourites in this fast-paced sprint challenge.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    name: 'Genre Explorer',
    icon: <Globe className="w-5 h-5" />,
    category: 'genre_explorer',
    difficulty: 'beginner',
    targetBooks: 5,
    points: 20,
    duration: 30,
    title: 'Genre Explorer Challenge 🗺️',
    description: 'Step outside your comfort zone! Read one book from 5 different genres. Discover stories you never knew you loved.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Writing Contest',
    icon: <Feather className="w-5 h-5" />,
    category: 'creative_response',
    difficulty: 'advanced',
    targetBooks: 1,
    points: 25,
    duration: 14,
    title: 'Creative Writing Response ✍️',
    description: 'Read a book and write a creative response — a poem, short story, or alternate ending inspired by the text.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Poetry Deep Dive',
    icon: <Palette className="w-5 h-5" />,
    category: 'reflection',
    difficulty: 'intermediate',
    targetBooks: 3,
    points: 15,
    duration: 21,
    title: 'Poetry & Prose Deep Dive 📝',
    description: 'Read 3 works of poetry or literary prose and write thoughtful reflections connecting themes across the texts.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    name: 'House Battle',
    icon: <BookOpen className="w-5 h-5" />,
    category: 'house_competition',
    difficulty: 'beginner',
    targetBooks: 10,
    points: 30,
    duration: 30,
    title: 'House Reading Battle 🏠',
    description: 'Which house reads the most? Every book submitted earns points for your house. Work together to claim the top spot!',
    color: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Speed Read',
    icon: <Clock className="w-5 h-5" />,
    category: 'daily_streak',
    difficulty: 'advanced',
    targetBooks: 7,
    points: 35,
    duration: 14,
    title: '14-Day Streak Challenge 🔥',
    description: 'Can you submit a book every 2 days? Build the ultimate reading streak and earn massive bonus points!',
    color: 'from-red-500 to-orange-500',
  },
];

interface ChallengeTemplatesProps {
  onSelect: (template: ChallengeTemplate) => void;
}

const ChallengeTemplates = ({ onSelect }: ChallengeTemplatesProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Quick Start Templates</h3>
        <p className="text-sm text-muted-foreground">Choose a template to pre-fill the form, then customise as needed.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CHALLENGE_TEMPLATES.map((template, i) => (
          <motion.div key={template.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}>
            <Card className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all h-full"
              onClick={() => onSelect(template)}>
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-white`}>
                  {template.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">📚 {template.targetBooks} books</Badge>
                  <Badge variant="outline" className="text-xs">⭐ {template.points} pts</Badge>
                  <Badge variant="outline" className="text-xs">📅 {template.duration}d</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChallengeTemplates;
