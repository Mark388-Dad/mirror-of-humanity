import { Card } from '@/components/ui/card';

interface CertificateTemplate {
  level: string;
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  signature_url: string | null;
  template_preset: string;
}

interface CertificatePreviewProps {
  template: CertificateTemplate;
  studentName: string;
  booksRead: number;
  date: string;
}

const LEVEL_STYLES: Record<string, { line: string; badge: string; label: string }> = {
  beginner: {
    line: '#9BE7FF',
    badge: '🌱',
    label: 'Beginner Level',
  },
  bronze: {
    line: '#CD7F32',
    badge: '🥉',
    label: 'Bronze Achievement',
  },
  silver: {
    line: '#C0C0C0',
    badge: '🥈',
    label: 'Silver Achievement',
  },
  gold: {
    line: '#D4AF37',
    badge: '🥇',
    label: 'Gold Achievement',
  },
};

const CertificatePreview = ({
  template,
  studentName,
  booksRead,
  date,
}: CertificatePreviewProps) => {
  const level = LEVEL_STYLES[template.level] || LEVEL_STYLES.beginner;

  return (
    <Card
      className="relative overflow-hidden aspect-[1.414/1] flex flex-col justify-center p-10 bg-white"
      style={{
        backgroundImage: template.background_image_url
          ? `url(${template.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
      }}
    >
      {/* DARK BLUE RIGHT SIDE */}
      <div className="absolute right-0 top-0 h-full w-1/3 bg-[#1E3A6D]" />

      {/* LEVEL COLORED LINE */}
      <div
        className="absolute inset-0 border-[6px]"
        style={{ borderColor: level.line }}
      />

      {/* SCHOOL LOGO CIRCLE */}
      {template.school_logo_url && (
        <div className="absolute top-10 right-20 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
          <img
            src={template.school_logo_url}
            className="w-20 h-20 object-contain"
          />
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-xl z-10">
        <h2 className="text-3xl font-bold tracking-wide">
          {template.title}
        </h2>

        <p className="text-sm text-slate-600 mt-1">
          {template.subtitle}
        </p>

        <p className="mt-10 text-sm text-slate-600">
          PRESENTED TO
        </p>

        <h3 className="text-2xl font-semibold border-b pb-2 w-fit">
          {studentName}
        </h3>

        <p className="mt-6 text-sm text-slate-700 max-w-md">
          {template.body_text}
        </p>

        {/* SIGNATURE */}
        {template.signature_url && (
          <div className="mt-10">
            <img
              src={template.signature_url}
              className="h-12 object-contain"
            />
            <p className="text-xs mt-1 font-semibold">LIBRARIAN</p>
          </div>
        )}
      </div>

      {/* LEVEL BADGE BOTTOM RIGHT */}
      <div className="absolute bottom-10 right-20 text-white text-right">
        <div className="text-3xl">{level.badge}</div>
        <p className="text-sm font-semibold">{level.label}</p>
      </div>

      {/* DATE */}
      <p className="absolute bottom-6 left-10 text-xs text-slate-500">
        {date}
      </p>
    </Card>
  );
};

export default CertificatePreview;
