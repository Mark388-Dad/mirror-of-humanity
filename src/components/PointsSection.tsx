import { Trophy, Star, Award, Medal, Zap } from "lucide-react";

const pointsData = [
   { action: "Each book submitted", points: 3, icon: Star },
   { action: "Joining the challenge", points: 3, icon: Zap },
  { action: "Reaching Bronze Level", points: 5, icon: Medal },
  { action: "Reaching Silver Level", points: 10, icon: Award },
  { action: "Reaching Gold Level", points: 15, icon: Trophy },
];

const PointsSection = () => {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <Trophy className="w-4 h-4 text-gold" />
              <span className="text-gold-dark text-sm font-medium">Earn Points</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Points System
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every page you read earns points for you, your class, and your house. 
              This shared challenge celebrates meaningful connections with stories.
            </p>
          </div>

          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="space-y-4">
              {pointsData.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-5 rounded-xl bg-background hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <item.icon className="w-6 h-6 text-gold" />
                    </div>
                    <span className="text-foreground font-medium text-lg">{item.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-display font-bold text-gold">{item.points}</span>
                    <span className="text-muted-foreground text-sm">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PointsSection;
