import HeroSection from "@/components/HeroSection";
import GoalsSection from "@/components/GoalsSection";
import PointsSection from "@/components/PointsSection";
import AchievementLevels from "@/components/AchievementLevels";
import CategoriesSection from "@/components/CategoriesSection";
import ReflectionPrompts from "@/components/ReflectionPrompts";
import IBConnectionsSection from "@/components/IBConnectionsSection";
import OutcomesSection from "@/components/OutcomesSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
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
