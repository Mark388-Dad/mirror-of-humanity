import { Quote, Lightbulb, Users, Heart } from "lucide-react";

const prompts = [
  {
    title: "Titles That Speak",
    question: "How does a title capture a story's message or emotion?",
    icon: Quote,
    color: "from-blue-500/20 to-indigo-500/10"
  },
  {
    title: "Moments That Change Everything",
    question: "What scene or decision reshapes the story's direction?",
    icon: Lightbulb,
    color: "from-amber-500/20 to-orange-500/10"
  },
  {
    title: "Characters That Stay With Us",
    question: "Which character resonates with you, and why?",
    icon: Users,
    color: "from-emerald-500/20 to-teal-500/10"
  },
  {
    title: "Stories That Matter",
    question: "Why does this story matter to you or to the world?",
    icon: Heart,
    color: "from-rose-500/20 to-pink-500/10"
  }
];

const ReflectionPrompts = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Reflection Prompts
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Use these guiding prompts to deepen your reflections throughout the challenge.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {prompts.map((prompt, index) => (
            <div 
              key={index}
              className={`p-8 rounded-2xl bg-gradient-to-br ${prompt.color} border border-border hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center flex-shrink-0">
                  <prompt.icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {prompt.title}
                  </h3>
                  <p className="text-muted-foreground italic">
                    "{prompt.question}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReflectionPrompts;
