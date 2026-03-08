import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import AdvancedLeaderboard from '@/components/AdvancedLeaderboard';
import { FollettLibraryButton } from '@/components/VibrantDashboardCard';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

const Leaderboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-10 h-10 text-gold" />
            </motion.div>
            <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold via-amber-500 to-orange-500 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </motion.div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how houses, students, and classes are performing in the reading challenge. 
            Compete, climb the ranks, and earn XP!
          </p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <FollettLibraryButton />
          </motion.div>
        </motion.div>

        <AdvancedLeaderboard />
      </main>
    </div>
  );
};

export default Leaderboard;
