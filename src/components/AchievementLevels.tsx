import { BookOpen, Crown, Medal, Award } from "lucide-react";

const levels = [
  {
    name: "Bronze Reader",
    books: 15,
    icon: Medal,
    color: "bronze",
    bgClass: "bg-gradient-to-br from-amber-700/20 to-amber-900/10 border-amber-700/30",
    iconBg: "bg-amber-700/20",
    iconColor: "text-amber-700",
    semester: "First Semester",
    description: "Complete reflections inspired by 'Titles That Speak' and 'Moments That Change Everything'.",
    focus: "How titles and turning points shape meaning."
  },
  {
    name: "Silver Reader",
    books: 30,
    icon: Award,
    color: "silver",
    bgClass: "bg-gradient-to-br from-slate-400/20 to-slate-600/10 border-slate-400/30",
    iconBg: "bg-slate-400/20",
    iconColor: "text-slate-500",
    semester: "Second Semester",
    description: "Explore 'Characters That Stay With Us' through deeper reflection.",
    focus: "How characters reveal identity, resilience, and moral growth."
  },
  {
    name: "Gold Reader",
    books: 45,
    icon: Crown,
    color: "gold",
    bgClass: "bg-gradient-to-br from-gold/20 to-gold-dark/10 border-gold/30",
    iconBg: "bg-gold/20",
    iconColor: "text-gold-dark",
    semester: "Full Year",
    description: "Create a final reflection under 'Stories That Matter'.",
    focus: "Connecting your reading journey to personal and global themes."
  }
];

const AchievementLevels = () => {
  return (
    <section id="achievement-levels" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Achievement Levels
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select one book under each achievement level and reflect based on the provided instructions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {levels.map((level, index) => (
            <div 
              key={index}
              className={`relative rounded-3xl p-8 border-2 ${level.bgClass} hover:scale-105 transition-all duration-300`}
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className={`px-4 py-1 rounded-full ${level.iconBg} border border-current`}>
                  <span className={`text-sm font-medium ${level.iconColor}`}>{level.semester}</span>
                </div>
              </div>

              {/* Icon */}
              <div className={`w-20 h-20 rounded-2xl ${level.iconBg} flex items-center justify-center mx-auto mb-6 mt-4`}>
                <level.icon className={`w-10 h-10 ${level.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="font-display text-2xl font-bold text-foreground text-center mb-2">
                {level.name}
              </h3>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <span className="text-3xl font-display font-bold text-foreground">{level.books}</span>
                <span className="text-muted-foreground">books</span>
              </div>

              <p className="text-muted-foreground text-center mb-4 leading-relaxed">
                {level.description}
              </p>

              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <p className="text-sm text-foreground font-medium text-center italic">
                  "{level.focus}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementLevels;
