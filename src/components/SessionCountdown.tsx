import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface SessionCountdownProps {
  endDate?: string | null;
  title?: string | null;
}

const SessionCountdown = ({ endDate, title }: SessionCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const target = new Date(endDate).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold text-primary">
              {title || 'Challenge Countdown'}
            </h3>
          </div>

          {isExpired ? (
            <p className="text-2xl font-bold text-destructive">Challenge has ended! 🎉</p>
          ) : (
            <div className="flex items-center justify-center gap-3 md:gap-6">
              {blocks.map((block) => (
                <div key={block.label} className="flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center">
                    <span className="font-display text-2xl md:text-3xl font-bold text-foreground">
                      {String(block.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">
                    {block.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default SessionCountdown;
