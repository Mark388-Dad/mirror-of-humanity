import { BookOpen, Sparkles } from "lucide-react";

interface HeroSectionProps {
  title?: string | null;
  content?: string | null;
}

const HeroSection = ({ title, content }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen bg-hero-gradient overflow-hidden flex items-center justify-center">
      {/* Decorative floating books */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] animate-float opacity-20">
          <BookOpen className="w-16 h-16 text-gold" />
        </div>
        <div className="absolute top-40 right-[15%] animate-float-delayed opacity-15">
          <BookOpen className="w-24 h-24 text-gold-light" />
        </div>
        <div className="absolute bottom-32 left-[20%] animate-float-slow opacity-10">
          <BookOpen className="w-20 h-20 text-gold" />
        </div>
        <div className="absolute top-1/3 right-[8%] animate-float opacity-10">
          <Sparkles className="w-12 h-12 text-gold-light" />
        </div>
        <div className="absolute bottom-1/4 right-[25%] animate-float-delayed opacity-15">
          <Sparkles className="w-8 h-8 text-gold" />
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium tracking-wide">2025/2026 Reading Journey</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {title || '45-Book'}
            <span className="block text-gradient-gold">{title ? '' : 'Reading Challenge'}</span>
          </h1>

          <p className="font-display text-xl md:text-2xl text-gold/90 italic mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {content || 'Fiction as a Mirror of Humanity'}
          </p>

          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            A year-long literary adventure designed to awaken curiosity, empathy, and imagination. 
            Explore how stories reflect the beauty, complexity, and resilience of the human spirit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <a href="#achievement-levels" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gold text-navy font-semibold text-lg hover:bg-gold-light transition-all duration-300 glow-gold">
              Start Your Journey
            </a>
            <a href="#categories" className="inline-flex items-center justify-center px-8 py-4 rounded-lg border-2 border-gold/30 text-primary-foreground font-semibold text-lg hover:bg-gold/10 hover:border-gold/50 transition-all duration-300">
              Explore Categories
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-primary-foreground/10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold text-gold mb-2">45</div>
              <div className="text-primary-foreground/60 text-sm uppercase tracking-wider">Books</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold text-gold mb-2">30</div>
              <div className="text-primary-foreground/60 text-sm uppercase tracking-wider">Categories</div>
            </div>
            <div>
              <div className="font-display text-4xl md:text-5xl font-bold text-gold mb-2">3</div>
              <div className="text-primary-foreground/60 text-sm uppercase tracking-wider">Achievement Levels</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(40 33% 98%)" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
