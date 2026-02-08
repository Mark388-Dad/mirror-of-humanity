import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Certificate from './CertificatePreview'; // ✅ NEW CERTIFICATE VERSION

interface CertificateTemplate {
  level: string;
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  template_preset: string;
}

interface CertificateGeneratorProps {
  template: CertificateTemplate;
  studentName: string;
  booksRead: number;
  date: string;
}

const CertificateGenerator = ({
  template,
  studentName,
  booksRead,
  date,
}: CertificateGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = useCallback(async () => {
    if (!certRef.current) return;
    setGenerating(true);

    try {
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(certRef.current, {
        scale: 3, // ✅ higher resolution for new premium design
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `certificate-${template.level}-${studentName.replace(
        /\s+/g,
        '-'
      )}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Certificate generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [template.level, studentName]);

  return (
    <div className="space-y-6">
      {/* CERTIFICATE RENDER AREA */}
      <div
        ref={certRef}
        className="bg-white rounded-xl overflow-hidden shadow-xl"
      >
        <Certificate
          recipientName={studentName}
          achievementTitle={template.title}
          achievementLevel={template.subtitle}
          description={template.body_text}
          role="LIBRARIAN"
          organizationName="MPESA FOUNDATION ACADEMY"
        />
      </div>

      {/* DOWNLOAD BUTTON */}
      <Button
        onClick={downloadCertificate}
        disabled={generating}
        className="w-full h-12 text-sm font-semibold"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download Certificate
      </Button>
    </div>
  );
};

export default CertificateGenerator;
