import { Lightbulb, Settings, UserCircle } from "lucide-react";

const connections = [
  {
    category: "TOK Inquiry",
    items: ["How do stories shape what we know about identity, justice, and truth?"],
    icon: Lightbulb,
    color: "bg-blue-500/10 border-blue-500/20"
  },
  {
    category: "ATL Skills",
    items: ["Communication", "Self-Management", "Reflection"],
    icon: Settings,
    color: "bg-emerald-500/10 border-emerald-500/20"
  },
  {
    category: "Learner Profile",
    items: ["Communicators", "Reflective", "Open-minded", "Caring"],
    icon: UserCircle,
    color: "bg-purple-500/10 border-purple-500/20"
  }
];

interface IBConnectionsSectionProps {
  title?: string | null;
  content?: string | null;
}

const IBConnectionsSection = ({ title, content }: IBConnectionsSectionProps) => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {title || 'IB Connections'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {content || 'This challenge connects deeply with IB frameworks and learner development.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {connections.map((connection, index) => (
            <div key={index} className={`p-8 rounded-2xl ${connection.color} border-2 hover:shadow-lg transition-all duration-300`}>
              <div className="w-14 h-14 rounded-xl bg-card flex items-center justify-center mb-6">
                <connection.icon className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">{connection.category}</h3>
              <ul className="space-y-2">
                {connection.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IBConnectionsSection;
