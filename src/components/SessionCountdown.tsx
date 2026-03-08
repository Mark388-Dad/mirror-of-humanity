import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BookOpen } from 'lucide-react';

interface SessionCountdownProps {
  endDate?: string | null;
  startDate?: string | null;
  title?: string | null;
  description?: string | null;
  sessionName?: string | null;
}

const FlipDigit = ({ value, label }: { value: number; label: string }) => {
  const display = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-20 md:w-24 md:h-28 perspective-500">
        {/* Glow behind */}
        <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl animate-pulse" />
        
        {/* Card */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-b from-card via-card to-muted border border-border shadow-lg overflow-hidden">
          {/* Top half */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-card rounded-t-xl border-b border-border/50 overflow-hidden">
            <div className="flex items-end justify-center h-full pb-0.5">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={display}
                  initial={{ y: -20, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: 20, opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-3xl md:text-5xl font-bold text-foreground"
                >
                  {display}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Bottom half */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-muted/50 rounded-b-xl overflow-hidden">
            <div className="flex items-start justify-center h-full pt-0.5">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={display + '-bottom'}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.6 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-3xl md:text-5xl font-bold text-foreground/60"
                >
                  {display}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Center line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-border z-10" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-xl" />
        </div>
      </div>
      <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
        {label}
      </span>
    </div>
  );
};

const SessionCountdown = ({ endDate, startDate, title, description, sessionName }: SessionCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!endDate) return;

    const target = new Date(endDate).getTime();
    const start = startDate ? new Date(startDate).getTime() : null;

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setProgress(100);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });

      if (start) {
        const total = target - start;
        const elapsed = now - start;
        setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate, startDate]);

  if (!endDate) return null;

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="container mx-auto px-4 py-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-8 md:p-12 text-center bg-gradient-to-br from-card via-card to-muted/50">
        {/* Animated glow orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Session name badge */}
          {sessionName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{sessionName}</span>
            </motion.div>
          )}

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {title || 'Challenge Countdown'}
            </h3>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">{description}</p>
          )}

          {isExpired ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="py-6"
            >
              <p className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                Challenge Complete! 🎉
              </p>
              <p className="text-muted-foreground">This reading session has ended. Stay tuned for the next one!</p>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center gap-2 md:gap-4 mt-6">
              {blocks.map((block, i) => (
                <div key={block.label} className="flex items-center gap-2 md:gap-4">
                  <FlipDigit value={block.value} label={block.label} />
                  {i < blocks.length - 1 && (
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {startDate && !isExpired && (
            <div className="mt-8 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Session Progress</span>
                <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden border border-border/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default SessionCountdown;
