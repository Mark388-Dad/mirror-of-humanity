import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Zap, Star, Trophy, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: React.ReactNode;
}

// 3 points per book, max 45 books = 135 XP max
const XP_LEVELS: XPLevel[] = [
  { level: 1, title: 'Starter', minXP: 0, maxXP: 9, color: 'from-slate-400 to-slate-500', icon: <Star className="w-5 h-5" /> },
  { level: 2, title: 'Beginner', minXP: 9, maxXP: 18, color: 'from-indigo-400 to-blue-500', icon: <Star className="w-5 h-5" /> },
  { level: 3, title: 'Learner', minXP: 18, maxXP: 30, color: 'from-blue-400 to-cyan-500', icon: <Star className="w-5 h-5" /> },
  { level: 4, title: 'Developing', minXP: 30, maxXP: 45, color: 'from-cyan-400 to-teal-500', icon: <Zap className="w-5 h-5" /> },
  { level: 5, title: 'Intermediate', minXP: 45, maxXP: 60, color: 'from-teal-400 to-green-500', icon: <Zap className="w-5 h-5" /> },
  { level: 6, title: 'Skilled', minXP: 60, maxXP: 75, color: 'from-green-400 to-emerald-500', icon: <Zap className="w-5 h-5" /> },
  { level: 7, title: 'Proficient', minXP: 75, maxXP: 90, color: 'from-emerald-400 to-teal-500', icon: <Trophy className="w-5 h-5" /> },
  { level: 8, title: 'Advanced', minXP: 90, maxXP: 105, color: 'from-purple-400 to-pink-500', icon: <Trophy className="w-5 h-5" /> },
  { level: 9, title: 'Expert', minXP: 105, maxXP: 120, color: 'from-pink-400 to-rose-500', icon: <Crown className="w-5 h-5" /> },
  { level: 10, title: 'Master Reader', minXP: 120, maxXP: 135, color: 'from-yellow-400 to-orange-500', icon: <Crown className="w-5 h-5" /> },
];

export const getXPLevel = (xp: number): XPLevel => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) return XP_LEVELS[i];
  }
  return XP_LEVELS[0];
};

export const getNextLevel = (xp: number): XPLevel | null => {
  const currentLevel = getXPLevel(xp);
  const nextLevelIndex = XP_LEVELS.findIndex(l => l.level === currentLevel.level + 1);
  return nextLevelIndex >= 0 ? XP_LEVELS[nextLevelIndex] : null;
};

interface XPProgressBarProps {
  currentXP: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const XPProgressBar = ({ currentXP, showDetails = true, size = 'md', className }: XPProgressBarProps) => {
  const currentLevel = getXPLevel(currentXP);
  const nextLevel = getNextLevel(currentXP);
  
  const progressInLevel = currentXP - currentLevel.minXP;
  const levelRange = currentLevel.maxXP - currentLevel.minXP;
  const progressPercent = nextLevel ? Math.min((progressInLevel / levelRange) * 100, 100) : 100;
  
  const sizeClasses = {
    sm: { bar: 'h-2', text: 'text-xs', icon: 'w-4 h-4' },
    md: { bar: 'h-3', text: 'text-sm', icon: 'w-5 h-5' },
    lg: { bar: 'h-4', text: 'text-base', icon: 'w-6 h-6' },
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              className={cn(
                'p-1.5 rounded-lg bg-gradient-to-r',
                currentLevel.color,
                'text-white'
              )}
            >
              {currentLevel.icon}
            </motion.div>
            <div>
              <div className={cn('font-semibold', sizeClasses[size].text)}>
                Level {currentLevel.level}: {currentLevel.title}
              </div>
              {nextLevel && (
                <div className="text-xs text-muted-foreground">
                  {nextLevel.minXP - currentXP} XP to {nextLevel.title}
                </div>
              )}
            </div>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className={cn('font-bold', sizeClasses[size].text)}>{currentXP} XP</span>
          </motion.div>
        </div>
      )}
      
      <div className="relative">
        <div className={cn('w-full bg-secondary rounded-full overflow-hidden', sizeClasses[size].bar)}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full bg-gradient-to-r',
              currentLevel.color
            )}
          />
        </div>
        
        <motion.div
          initial={{ left: 0, opacity: 0 }}
          animate={{ 
            left: `${progressPercent}%`,
            opacity: [0, 1, 0]
          }}
          transition={{ 
            left: { duration: 1, ease: 'easeOut' },
            opacity: { duration: 0.5, delay: 0.8 }
          }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
      </div>
      
      {showDetails && nextLevel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentLevel.minXP} XP</span>
          <span>{currentLevel.maxXP} XP</span>
        </div>
      )}
    </div>
  );
};

export default XPProgressBar;
