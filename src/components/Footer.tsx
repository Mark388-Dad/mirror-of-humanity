import { BookOpen, Quote } from "lucide-react";

interface FooterProps {
  title?: string | null;
  content?: string | null;
}

const Footer = ({ title, content }: FooterProps) => {
  return (
    <footer className="bg-hero-gradient text-primary-foreground py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Quote className="w-12 h-12 text-gold/50 mx-auto mb-6" />
          <blockquote className="font-display text-2xl md:text-3xl italic text-primary-foreground/90 leading-relaxed">
            "{content || 'Every story is a mirror; when we read, we find not only the world but also ourselves.'}"
          </blockquote>
        </div>

        <div className="w-24 h-px bg-gold/30 mx-auto mb-12" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gold" />
            </div>
            <div>
              <span className="font-display font-semibold">{title || '45-Book Reading Challenge'}</span>
              <p className="text-primary-foreground/60 text-sm">2025/2026</p>
            </div>
          </div>

          <div className="text-primary-foreground/60 text-sm">
            MYP5 & DP1 • Fiction as a Mirror of Humanity
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
