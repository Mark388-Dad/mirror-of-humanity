import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Certificate from './CertificatePreview'; // your certificate component

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

      // ✅ Wait for all images inside certificate to load
      const images = certRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) resolve();
              else img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      const canvas = await html2canvas(certRef.current, {
        scale: 3, // high-resolution
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
      {/* Certificate Render */}
      <div
        ref={certRef}
        className="bg-white rounded-xl overflow-hidden shadow-xl"
      >
        <Certificate
          template={template}
          studentName={studentName}
          booksRead={booksRead}
          date={date}
        />
      </div>

      {/* Download Button */}
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
