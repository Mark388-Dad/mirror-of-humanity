import { useRef } from 'react';
import CertificatePreview from './CertificatePreview';

interface CertificateTemplate {
  level: 'beginner' | 'bronze' | 'silver' | 'gold';
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  signature_url: string | null;
  template_preset: string;
}

interface CertificateGeneratorProps {
  template: CertificateTemplate;
  studentName: string;
  booksRead?: number;
  date?: string;
}

const CertificateGenerator = ({
  template,
  studentName,
  booksRead = 0,
  date = new Date().toLocaleDateString(),
}: CertificateGeneratorProps) => {
  const certRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      {/* PREVIEW */}
      <div className="w-full max-w-lg mx-auto">
        <CertificatePreview
          template={template}
          studentName={studentName}
          booksRead={booksRead}
          date={date}
        />
      </div>

      {/* HIDDEN FULL SIZE FOR EXPORT */}
      <div ref={certRef} className="hidden">
        <CertificatePreview
          template={template}
          studentName={studentName}
          booksRead={booksRead}
          date={date}
        />
      </div>
    </div>
  );
};

export default CertificateGenerator;
