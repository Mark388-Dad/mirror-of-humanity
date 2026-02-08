import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import Certificate from "./CertificatePreview"; // ✅ NEW CERTIFICATE VERSION
import domtoimage from "dom-to-image-more";

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
      // Wait for images to load before capture
      const images = Array.from(certRef.current.querySelectorAll("img"));
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.onload = () => res();
                img.onerror = () => res();
              })
        )
      );

      // Use dom-to-image-more for better rendering
      const blob = await domtoimage.toBlob(certRef.current, {
        bgcolor: "#ffffff",
        quality: 1,
        width: certRef.current.scrollWidth * 3, // high-res
        height: certRef.current.scrollHeight * 3,
        style: {
          transform: "scale(3)",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `certificate-${template.level}-${studentName.replace(
        /\s+/g,
        "-"
      )}.png`;
      link.click();
    } catch (err) {
      console.error("Certificate generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [template.level, studentName]);

  return (
    <div className="space-y-6">
      {/* CERTIFICATE RENDER AREA */}
      <div
        ref={certRef}
        className="bg-white rounded-xl overflow-visible shadow-xl"
      >
        <Certificate
          template={template}
          studentName={studentName}
          booksRead={booksRead}
          date={date}
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
