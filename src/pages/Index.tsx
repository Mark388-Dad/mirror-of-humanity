import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import HeroSection from "@/components/HeroSection";
import GoalsSection from "@/components/GoalsSection";
import PointsSection from "@/components/PointsSection";
import AchievementLevels from "@/components/AchievementLevels";
import CategoriesSection from "@/components/CategoriesSection";
import ReflectionPrompts from "@/components/ReflectionPrompts";
import IBConnectionsSection from "@/components/IBConnectionsSection";
import OutcomesSection from "@/components/OutcomesSection";
import Footer from "@/components/Footer";
import FeaturedChallenges from "@/components/FeaturedChallenges";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, LayoutDashboard, Sparkles, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomepageContent {
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_visible: boolean;
}

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf-u0b7RP1aUMOJGQvGzUaJKEP2hMKyNWvB0cMu68ANHqFq-A/viewform";
const FOLLETT_URL = "https://mfa.follettdestiny.com";

const Index = () => {
  const { user, loading } = useAuth();
  const [homepageContent, setHomepageContent] = useState<HomepageContent[]>([]);

  useEffect(() => {
    fetchHomepageContent();
  }, []);

  const fetchHomepageContent = async () => {
    const { data } = await supabase
      .from('homepage_content')
      .select('*')
      .order('display_order');
    if (data) setHomepageContent(data);
  };

  const getContent = (key: string) => homepageContent.find(c => c.section_key === key);
  const isVisible = (key: string) => {
    const c = getContent(key);
    return c ? c.is_visible : true; // Default visible if not in DB
  };

  const hero = getContent('hero');
  const goals = getContent('goals');
  const points = getContent('points');
  const categories = getContent('categories');
  const ibConnections = getContent('ib_connections');
  const outcomes = getContent('outcomes');
  const footer = getContent('footer');
  const announcement = getContent('announcement');
  const tipOfDay = getContent('tip_of_day');
  const featuredChallenge = getContent('featured_challenge');
  const motivation = getContent('motivation');

  return (
    <main className="min-h-screen relative">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {!loading && (
          user ? (
            <Button asChild className="bg-gold text-navy hover:bg-gold-light shadow-lg">
              <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
            </Button>
          ) : (
            <Button asChild className="bg-gold text-navy hover:bg-gold-light shadow-lg">
              <Link to="/auth"><LogIn className="w-4 h-4 mr-2" />Sign In</Link>
            </Button>
          )
        )}
      </div>

      {isVisible('hero') && <HeroSection title={hero?.title} content={hero?.content} />}

      <AnimatePresence>
        {announcement?.is_visible && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-y border-primary/20">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-center gap-4 text-center">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <div>
                  <h3 className="font-semibold text-primary">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                </div>
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Action Cards */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="h-full border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/10 hover:shadow-lg transition-all hover:-translate-y-1">
              <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"><span className="text-3xl">📝</span></div>
                  <h3 className="font-bold text-lg mb-2">Submit a Book</h3>
                  <p className="text-sm text-muted-foreground mb-4">Complete a book? Submit your reflection via our Google Form</p>
                  <Button variant="outline" className="w-full border-green-500/50 hover:bg-green-500/10"><ExternalLink className="w-4 h-4 mr-2" />Open Form</Button>
                </CardContent>
              </a>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <Card className="h-full border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 hover:shadow-lg transition-all hover:-translate-y-1">
              <a href={FOLLETT_URL} target="_blank" rel="noopener noreferrer">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center"><span className="text-3xl">📚</span></div>
                  <h3 className="font-bold text-lg mb-2">Follett Library</h3>
                  <p className="text-sm text-muted-foreground mb-4">Access eBooks, audiobooks, and curated reading lists</p>
                  <Button variant="outline" className="w-full border-blue-500/50 hover:bg-blue-500/10"><ExternalLink className="w-4 h-4 mr-2" />Browse Library</Button>
                </CardContent>
              </a>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/10 hover:shadow-lg transition-all hover:-translate-y-1">
              <Link to="/challenges">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center"><span className="text-3xl">🏆</span></div>
                  <h3 className="font-bold text-lg mb-2">{featuredChallenge?.title || 'Active Challenges'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{featuredChallenge?.content || 'Join exciting reading challenges and earn bonus points!'}</p>
                  <Button variant="outline" className="w-full border-purple-500/50 hover:bg-purple-500/10">View Challenges</Button>
                </CardContent>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {tipOfDay?.is_visible && (
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="container mx-auto px-4 py-6">
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="py-6 flex items-center gap-4">
              <div className="text-4xl">💡</div>
              <div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-400">{tipOfDay.title}</h3>
                <p className="text-muted-foreground">{tipOfDay.content}</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {isVisible('goals') && <GoalsSection title={goals?.title} content={goals?.content} />}
      {isVisible('points') && <PointsSection title={points?.title} content={points?.content} />}
      
      {/* Featured Challenges - auto-populated from DB */}
      <FeaturedChallenges />
      
      <AchievementLevels />
      {isVisible('categories') && <CategoriesSection title={categories?.title} content={categories?.content} />}
      <ReflectionPrompts />

      {motivation?.is_visible && (
        <motion.section initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="container mx-auto px-4 py-12">
          <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20 text-center">
            <CardContent className="py-12">
              <div className="text-5xl mb-4">✨</div>
              <blockquote className="text-xl md:text-2xl font-medium italic text-foreground max-w-2xl mx-auto">"{motivation.content}"</blockquote>
              {motivation.title && <p className="mt-4 text-muted-foreground">— {motivation.title}</p>}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {isVisible('ib_connections') && <IBConnectionsSection title={ibConnections?.title} content={ibConnections?.content} />}
      {isVisible('outcomes') && <OutcomesSection title={outcomes?.title} content={outcomes?.content} />}
      {isVisible('footer') && <Footer title={footer?.title} content={footer?.content} />}
    </main>
  );
};

export default Index;
