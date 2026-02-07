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

const LEVEL_LINES: Record<string, string> = {
  beginner: '#8CE0FF',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#D4AF37',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner Level',
  bronze: 'Bronze Achievement',
  silver: 'Silver Achievement',
  gold: 'Gold Achievement',
};

const CertificatePreview = ({
  template,
  studentName,
  booksRead,
  date,
}: CertificatePreviewProps) => {
  const lineColor = LEVEL_LINES[template.level] || LEVEL_LINES.beginner;
  const levelLabel = LEVEL_LABELS[template.level];

  return (
    <Card
      className="relative w-full aspect-[1.414/1] overflow-hidden bg-white"
      style={{
        backgroundImage: template.background_image_url
          ? `url(${template.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* === THIN LEVEL LINE === */}
      <div
        className="absolute inset-0 border-[6px]"
        style={{ borderColor: lineColor }}
      />

      {/* === SCHOOL LOGO (TOP RIGHT CIRCLE) === */}
      {template.school_logo_url && (
        <img
          src={template.school_logo_url}
          className="absolute top-[90px] right-[120px] w-[90px] h-[90px] object-contain"
        />
      )}

      {/* === TITLE === */}
      <div className="absolute top-[120px] left-[120px] text-center">
        <h2 className="text-[42px] tracking-widest font-semibold">
          {template.title}
        </h2>
        <p className="text-[16px] tracking-[4px] text-slate-600">
          {template.subtitle}
        </p>
      </div>

      {/* === PRESENTED TO === */}
      <p className="absolute top-[260px] left-[300px] text-[12px] tracking-[3px] text-slate-600">
        PRESENTED TO
      </p>

      {/* === STUDENT NAME === */}
      <h3 className="absolute top-[300px] left-[240px] w-[420px] text-center text-[20px] font-semibold border-b border-slate-500 pb-2">
        {studentName}
      </h3>

      {/* === BODY TEXT === */}
      <p className="absolute top-[360px] left-[220px] w-[480px] text-center text-[12px] text-slate-700">
        {template.body_text}
      </p>

      {/* === SIGNATURE === */}
      {template.signature_url && (
        <img
          src={template.signature_url}
          className="absolute bottom-[120px] left-[260px] h-[40px]"
        />
      )}

      <p className="absolute bottom-[95px] left-[280px] text-[12px] font-semibold">
        LIBRARIAN
      </p>

      {/* === LEVEL BADGE BOTTOM RIGHT === */}
      <div className="absolute bottom-[110px] right-[140px] text-white text-right">
        <p className="text-[14px] font-semibold">{levelLabel}</p>
        <p className="text-[12px]">📚 {booksRead} Books</p>
      </div>

      {/* === DATE === */}
      <p className="absolute bottom-[60px] left-[120px] text-[10px] text-slate-600">
        {date}
      </p>
    </Card>
  );
};

export default CertificatePreview;
