import { BookOpen, MessageCircle, Users, Star } from "lucide-react";

const outcomes = [
  {
    icon: BookOpen,
    text: "Read at least 45 books across genres and themes that mirror humanity."
  },
  {
    icon: MessageCircle,
    text: "Engage meaningfully with texts through reflection and creative interpretation."
  },
  {
    icon: Users,
    text: "Collaborate across houses and classes to celebrate a shared culture of reading."
  },
  {
    icon: Star,
    text: "Contribute to displays and digital showcases highlighting your reflections."
  }
];

const OutcomesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Expected Outcomes
            </h2>
            <p className="text-muted-foreground text-lg">
              By the end of this challenge, you will have achieved:
            </p>
          </div>

          <div className="space-y-6">
            {outcomes.map((outcome, index) => (
              <div 
                key={index}
                className="flex items-start gap-6 p-6 rounded-2xl bg-card border border-border hover:border-gold/30 hover:shadow-md transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <outcome.icon className="w-7 h-7 text-gold" />
                </div>
                <p className="text-foreground text-lg leading-relaxed pt-3">
                  {outcome.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OutcomesSection;
