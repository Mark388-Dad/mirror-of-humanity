import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOLLETT_LIBRARY_URL = 'https://mfa.follettdestiny.com/portal/portal?app=Destiny%20Discover&appId=destiny-B896-BHZF&siteGuid=8A7E2238-818E-42A2-AFD1-33425ECB934C&nav=https:%2F%2Fmfa.follettdestiny.com%2Fmetasearch%2Fui%2F54793';

interface VibrantDashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient?: string;
  className?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  showFollettLink?: boolean;
  delay?: number;
}

const VibrantDashboardCard = ({
  title,
  icon,
  children,
  gradient = 'from-blue-500/10 to-purple-500/10',
  className,
  action,
  showFollettLink = false,
  delay = 0
}: VibrantDashboardCardProps) => {
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
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', gradient)} />
        
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
