import { Trophy, Star } from "lucide-react";

interface PointsSectionProps {
  title?: string | null;
  content?: string | null;
}

const PointsSection = ({ title, content }: PointsSectionProps) => {
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
              {title || 'Points System'}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {content || 'Every book you read earns 3 points for you, your class, and your house.'}
            </p>
          </div>

          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 rounded-xl bg-background hover:bg-secondary/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <Star className="w-6 h-6 text-gold" />
                  </div>
                  <span className="text-foreground font-medium text-lg">Each book submitted</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-display font-bold text-gold">3</span>
                  <span className="text-muted-foreground text-sm">pts</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gold/5 border border-gold/20">
                <p className="text-center text-muted-foreground">
                  <strong className="text-foreground">Simple & fair:</strong> Every book = 3 points. 
                  Read up to 45 books to earn a maximum of 135 points.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PointsSection;
