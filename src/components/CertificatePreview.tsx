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

/* ===============================
   NEW LEVEL STYLES (MATCH NEW EDIT)
   =============================== */
const LEVEL_STYLES: Record<
  string,
  { border: string; accent: string; label: string }
> = {
  beginner: {
    border: '#9BE7FF',
    accent: '#0B3D91',
    label: 'Beginner Level',
  },
  bronze: {
    border: '#CD7F32',
    accent: '#0B3D91',
    label: 'Bronze Achievement Level',
  },
  silver: {
    border: '#C0C0C0',
    accent: '#0B3D91',
    label: 'Silver Achievement Level',
  },
  gold: {
    border: '#D4AF37',
    accent: '#0B3D91',
    label: 'Gold Achievement Level',
  },
};

const CertificatePreview = ({
  template,
  studentName,
  date,
}: CertificatePreviewProps) => {
  const level = LEVEL_STYLES[template.level] || LEVEL_STYLES.beginner;

  return (
    <Card
      className="relative overflow-hidden aspect-[1.414/1] flex flex-col justify-center bg-[#F8F6F2] p-12"
      style={{
        backgroundImage: template.background_image_url
          ? `url(${template.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: `6px solid ${level.border}`,
      }}
    >
      {/* ===============================
         RIGHT DARK BLUE GEOMETRIC SIDE
         (MATCH IMAGE DESIGN)
         =============================== */}
      <div className="absolute right-0 top-0 h-full w-[38%] bg-[#1E3A6D]" />

      {/* GOLD EDGE LINE */}
      <div className="absolute right-[38%] top-0 h-full w-[6px] bg-[#D4AF37]" />

      {/* ===============================
         SCHOOL LOGO CIRCLE
         =============================== */}
      {template.school_logo_url && (
        <div className="absolute top-16 right-24 w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center">
          <img
            src={template.school_logo_url}
            className="w-24 h-24 object-contain"
          />
        </div>
      )}

      {/* ===============================
         MAIN CONTENT (LEFT SIDE)
         =============================== */}
      <div className="relative z-10 max-w-xl">
        <h2 className="text-4xl font-bold tracking-widest uppercase">
          {template.title}
        </h2>

        <p className="text-lg text-slate-600 tracking-wide">
          {template.subtitle}
        </p>

        <p className="mt-12 text-sm tracking-[3px] text-slate-600">
          PRESENTED TO
        </p>

        <h3 className="text-3xl font-semibold border-b border-black pb-2 w-[420px]">
          {studentName}
        </h3>

        <p className="mt-6 text-sm text-slate-700 max-w-md leading-relaxed">
          {template.body_text}
        </p>

        {/* ===============================
           SIGNATURE BLOCK
           =============================== */}
        {template.signature_url && (
          <div className="mt-14">
            <img
              src={template.signature_url}
              className="h-14 object-contain"
            />
            <p className="text-sm font-semibold mt-1 tracking-wide">
              LIBRARIAN
            </p>
          </div>
        )}
      </div>

      {/* ===============================
         DATE (BOTTOM LEFT)
         =============================== */}
      <p className="absolute bottom-8 left-12 text-xs text-slate-500 tracking-wide">
        {date}
      </p>

      {/* ===============================
         LEVEL LABEL (BOTTOM RIGHT)
         =============================== */}
      <div className="absolute bottom-12 right-20 text-right text-white">
        <p className="text-sm font-semibold tracking-wide">
          {level.label}
        </p>
      </div>
    </Card>
  );
};

export default CertificatePreview;
