import { Card } from '@/components/ui/card';

interface CertificateTemplate {
  level: string;
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  template_preset: string;
}

interface CertificatePreviewProps {
  template: CertificateTemplate;
  studentName: string;
  booksRead: number;
  date: string;
}

const PRESET_STYLES: Record<string, { bg: string; border: string; titleColor: string; accent: string }> = {
  classic: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    border: 'border-4 border-amber-300',
    titleColor: 'text-amber-900',
    accent: 'text-amber-700',
  },
  elegant: {
    bg: 'bg-gradient-to-br from-slate-50 to-gray-100',
    border: 'border-4 border-slate-300',
    titleColor: 'text-slate-800',
    accent: 'text-slate-600',
  },
  modern: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-4 border-blue-300',
    titleColor: 'text-blue-900',
    accent: 'text-blue-600',
  },
  royal: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    border: 'border-4 border-purple-400',
    titleColor: 'text-purple-900',
    accent: 'text-purple-600',
  },
};

const LEVEL_BADGES: Record<string, { emoji: string; label: string }> = {
  beginner: { emoji: '🌱', label: 'Beginner Reader' },
  bronze: { emoji: '🥉', label: 'Bronze Achievement' },
  silver: { emoji: '🥈', label: 'Silver Achievement' },
  gold: { emoji: '🥇', label: 'Gold Achievement' },
};

const CertificatePreview = ({ template, studentName, booksRead, date }: CertificatePreviewProps) => {
  const style = PRESET_STYLES[template.template_preset] || PRESET_STYLES.classic;
  const badge = LEVEL_BADGES[template.level] || LEVEL_BADGES.beginner;

  return (
    <Card className={`${style.bg} ${style.border} relative overflow-hidden aspect-[1.414/1] flex flex-col items-center justify-center p-8 text-center`}
      style={template.background_image_url ? {
        backgroundImage: `url(${template.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}>
      
      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-current opacity-30" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-current opacity-30" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-current opacity-30" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-current opacity-30" />

      {/* School Logo */}
      {template.school_logo_url && (
        <img src={template.school_logo_url} alt="School Logo" className="w-16 h-16 object-contain mb-4" />
      )}

      {/* Badge */}
      <div className="text-5xl mb-2">{badge.emoji}</div>

      {/* Title */}
      <h2 className={`text-2xl md:text-3xl font-display font-bold ${style.titleColor} mb-1`}>
        {template.title}
      </h2>
      <p className={`text-sm ${style.accent} mb-6`}>{template.subtitle}</p>

      {/* Awarded to */}
      <p className={`text-sm ${style.accent} mb-1`}>This is awarded to</p>
      <h3 className={`text-xl md:text-2xl font-display font-bold ${style.titleColor} mb-4 border-b-2 border-current pb-2 px-8`}>
        {studentName}
      </h3>

      {/* Body */}
      <p className={`text-sm ${style.accent} max-w-md mb-4`}>{template.body_text}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className={style.accent}>📚 {booksRead} Books Read</span>
        <span className={style.accent}>🏆 {badge.label}</span>
      </div>

      {/* Date */}
      <p className={`text-xs ${style.accent} mt-4 opacity-70`}>{date}</p>
    </Card>
  );
};

export default CertificatePreview;
