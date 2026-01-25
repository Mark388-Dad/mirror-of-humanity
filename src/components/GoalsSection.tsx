import { Heart, Brain, Globe, Users } from "lucide-react";

const goals = [
  {
    icon: Heart,
    title: "Nurture Reading Culture",
    description: "Build stamina, joy, and reflection through consistent reading habits."
  },
  {
    icon: Brain,
    title: "Strengthen Analysis",
    description: "Develop analytical and interpretive skills through fiction and diverse genres."
  },
  {
    icon: Globe,
    title: "Foster Empathy",
    description: "Cultivate open-mindedness and global awareness through varied stories."
  },
  {
    icon: Users,
    title: "IB Connection",
    description: "Connect reading to Learner Profile attributes and ATL skills."
  }
];

const GoalsSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Goals
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Through this challenge, MYP5 and DP1 learners will journey across worlds, voices, and experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {goals.map((goal, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-card card-elevated hover:scale-105 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                <goal.icon className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {goal.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {goal.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoalsSection;
