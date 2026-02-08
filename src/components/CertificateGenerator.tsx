import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Certificate from './CertificatePreview';
import domtoimage from 'dom-to-image-more';

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
      // ✅ Wait for images (logo/background) to load fully
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

      // Use dom-to-image-more for better compatibility with gradients and skewed elements
      const blob = await domtoimage.toBlob(certRef.current, {
        bgcolor: '#ffffff',
        width: certRef.current.scrollWidth * 3, // high-res
        height: certRef.current.scrollHeight * 3,
        style: {
          transform: 'scale(3)',
          transformOrigin: 'top left',
        },
        filter: (node) => node.tagName !== 'BUTTON', // exclude buttons
      });

      const link = document.createElement('a');
      link.download = `certificate-${template.level}-${studentName.replace(
        /\s+/g,
        '-'
      )}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Certificate generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [template.level, studentName]);

  return (
    <div className="space-y-6">
      <div ref={certRef} className="bg-white rounded-xl overflow-hidden shadow-xl">
        <Certificate
          template={template}
          studentName={studentName}
          booksRead={booksRead}
          date={date}
        />
      </div>

      <Button
        onClick={downloadCertificate}
        disabled={generating}
        className="w-full h-12 text-sm font-semibold"
      >
        {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        Download Certificate
      </Button>
    </div>
  );
};

export default CertificateGenerator;

