import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Timer } from 'lucide-react';
import { useSessionCountdown } from '@/hooks/useSessionCountdown';

const MiniFlipDigit = ({ value, label }: { value: number; label: string }) => {
  const display = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-primary/15 blur-md animate-pulse" />
        <div className="relative w-10 h-12 md:w-12 md:h-14 rounded-lg bg-gradient-to-b from-card to-muted border border-border shadow-sm overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-card border-b border-border/30">
            <div className="flex items-end justify-center h-full pb-px">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={display}
                  initial={{ y: -10, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: 10, opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-lg md:text-xl font-bold text-foreground"
                >
                  {display}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-muted/40">
            <div className="flex items-start justify-center h-full pt-px">
              <span className="font-display text-lg md:text-xl font-bold text-foreground/40">{display}</span>
            </div>
          </div>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">{label}</span>
    </div>
  );
};

const DashboardCountdown = () => {
  const { endDate, startDate, title, sessionName, isVisible } = useSessionCountdown();
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
      if (diff <= 0) { setIsExpired(true); setProgress(100); return; }
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

  if (!isVisible || !endDate) return null;

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6"
    >
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5 p-4 md:p-5">
        {/* Glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
          {/* Left: Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center shrink-0">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display text-sm font-semibold text-foreground truncate">
                  {title || 'Challenge Countdown'}
                </h4>
                {sessionName && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
                    {sessionName}
                  </span>
                )}
              </div>
              {isExpired && (
                <p className="text-xs text-muted-foreground">This session has ended 🎉</p>
              )}
            </div>
          </div>

          {/* Right: Clock */}
          {!isExpired && (
            <div className="flex items-center gap-1.5 md:gap-2">
              {blocks.map((block, i) => (
                <div key={block.label} className="flex items-center gap-1.5 md:gap-2">
                  <MiniFlipDigit value={block.value} label={block.label} />
                  {i < blocks.length - 1 && (
                    <div className="flex flex-col gap-1 mb-4">
                      <div className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" />
                      <div className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {startDate && (
            <div className="mt-3 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium">Session Progress</span>
                <span className="text-[10px] font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardCountdown;
