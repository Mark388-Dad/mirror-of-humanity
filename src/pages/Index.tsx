import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from "@/components/HeroSection";
import GoalsSection from "@/components/GoalsSection";
import PointsSection from "@/components/PointsSection";
import AchievementLevels from "@/components/AchievementLevels";
import CategoriesSection from "@/components/CategoriesSection";
import ReflectionPrompts from "@/components/ReflectionPrompts";
import IBConnectionsSection from "@/components/IBConnectionsSection";
import OutcomesSection from "@/components/OutcomesSection";
import Footer from "@/components/Footer";
import { Button } from '@/components/ui/button';
import { LogIn, LayoutDashboard } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show auth button in hero for non-logged-in users
  return (
    <main className="min-h-screen relative">
      {/* Floating Auth Button */}
      <div className="fixed top-4 right-4 z-50">
        {!loading && (
          user ? (
            <Button asChild className="bg-gold text-navy hover:bg-gold-light shadow-lg">
              <Link to="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild className="bg-gold text-navy hover:bg-gold-light shadow-lg">
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )
        )}
      </div>

      <HeroSection />
      <GoalsSection />
      <PointsSection />
      <AchievementLevels />
      <CategoriesSection />
      <ReflectionPrompts />
      <IBConnectionsSection />
      <OutcomesSection />
      <Footer />
    </main>
  );
};

export default Index;
