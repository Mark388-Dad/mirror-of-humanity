import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOLLETT_LIBRARY_URL = 'https://mfa.follettdestiny.com';

interface VibrantDashboardCardProps {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  children?: React.ReactNode;
  gradient?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gold';
  className?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  showFollettLink?: boolean;
  delay?: number;
}

const colorMap = {
  blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
  green: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
  purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
  orange: 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
  red: 'from-red-500/20 to-rose-500/10 border-red-500/30',
  gold: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
};

export const VibrantDashboardCard = ({
  title,
  value,
  icon,
  children,
  gradient,
  color = 'blue',
  className,
  action,
  showFollettLink = false,
  delay = 0
}: VibrantDashboardCardProps) => {
  const gradientClass = gradient || colorMap[color];
  
  // If value is provided, render a simple stat card
  if (value !== undefined && !children) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        <Card className={cn(
          'relative overflow-hidden transition-all hover:shadow-lg border-2',
          gradientClass,
          className
        )}>
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', gradientClass.split(' ')[0], gradientClass.split(' ')[1])} />
          <CardContent className="relative pt-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring' }}
              className="mb-2 flex justify-center"
            >
              {icon}
            </motion.div>
            <div className="text-3xl font-display font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className={cn(
        'relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5',
        className
      )}>
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', gradientClass)} />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: 'spring' }}
              >
                {icon}
              </motion.div>
              {title}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {showFollettLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600"
                  asChild
                >
                  <a href={FOLLETT_LIBRARY_URL} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="w-3 h-3" />
                    Library
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
              
              {action && (
                action.href ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={action.href}>{action.label}</a>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={action.onClick}>
                    {action.label}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const FollettLibraryButton = ({ className }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Button
      className={cn(
        'gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40',
        className
      )}
      asChild
    >
      <a href={FOLLETT_LIBRARY_URL} target="_blank" rel="noopener noreferrer">
        <Sparkles className="w-4 h-4" />
        Browse Library Catalog
        <ExternalLink className="w-4 h-4" />
      </a>
    </Button>
  </motion.div>
);

export const QuickStats = ({ 
  stats 
}: { 
  stats: Array<{ label: string; value: string | number; icon: React.ReactNode; color: string }> 
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {stats.map((stat, index) => (
      <motion.div
        key={stat.label}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          'p-4 rounded-xl text-center transition-all hover:scale-105',
          stat.color
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
          className="flex justify-center mb-2"
        >
          {stat.icon}
        </motion.div>
        <div className="text-2xl font-display font-bold">{stat.value}</div>
        <div className="text-xs text-muted-foreground">{stat.label}</div>
      </motion.div>
    ))}
  </div>
);

export default VibrantDashboardCard;
