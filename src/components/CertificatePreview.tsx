import React, { useRef, useState } from 'react';
import { Shield, CheckCircle2, Star } from 'lucide-react';
import html2canvas from 'html2canvas';

export interface CertificatePreviewProps {
  template: {
    level: 'beginner' | 'bronze' | 'silver' | 'gold';
    title: string;
    subtitle: string;
    body_text: string;
    signature_url?: string | null;
  };
  studentName: string;
  booksRead?: number;
  date?: string;
}

const SCHOOL = {
  blue: '#002855',
  green: '#6BBE45',
};

const LEVEL_ACCENT = {
  beginner: '#D4AF37',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

const CertificatePreview = ({ template, studentName }: CertificatePreviewProps) => {
  const accent = LEVEL_ACCENT[template.level];
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
      });
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `certificate-${template.level}-${studentName}.png`;
      link.click();
    } catch (err) {
      console.error('Error generating certificate:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={certificateRef} className="relative bg-white overflow-hidden shadow-2xl"
        style={{ width: '1122px', height: '794px' }}>
        <div className="absolute inset-0" style={{ border: `10px solid ${accent}` }} />
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[120px]" style={{ background: SCHOOL.blue, opacity: 0.15 }} />
          <div className="absolute top-40 -right-40 w-[700px] h-[700px] rounded-full blur-[120px]" style={{ background: SCHOOL.green, opacity: 0.12 }} />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[130px]" style={{ background: accent, opacity: 0.12 }} />
        </div>
        <div className="absolute top-8 left-10 w-28 z-10">
          <img src="/mpesa-logo.png" alt="MPESA Foundation Academy" className="w-full object-contain select-none pointer-events-none" />
        </div>
        <div className="relative z-10 text-center pt-20">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="h-[2px] w-20" style={{ background: SCHOOL.green }} />
            <Star size={22} style={{ color: accent }} />
            <div className="h-[2px] w-20" style={{ background: SCHOOL.green }} />
          </div>
          <h1 className="text-6xl font-serif tracking-wide text-[#1a1a1a]">CERTIFICATE</h1>
          <h2 className="text-2xl tracking-widest uppercase" style={{ color: SCHOOL.blue }}>of Achievement</h2>
        </div>
        <div className="relative z-10 text-center mt-20 px-32">
          <p className="text-sm uppercase tracking-wider text-gray-500">This is proudly presented to</p>
          <h2 className="text-5xl font-serif my-6" style={{ color: SCHOOL.blue }}>{studentName}</h2>
          <p className="text-lg text-gray-700 mb-8">for the successful completion and mastery of</p>
          <div className="inline-block px-12 py-4 rounded-full border shadow-sm bg-white" style={{ borderColor: accent }}>
            <span className="text-2xl font-bold">
              {template.title}<span className="mx-3" style={{ color: accent }}>•</span>{template.subtitle}
            </span>
          </div>
          <p className="mt-8 italic text-gray-600 max-w-2xl mx-auto">"{template.body_text}"</p>
        </div>
        <div className="absolute bottom-14 left-20 right-20 z-10 flex justify-between items-end">
          <div className="text-center">
            {template.signature_url && <img src={template.signature_url} className="h-14 object-contain mb-2" alt="Signature" />}
            <div className="w-36 h-[1px] bg-gray-300 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: SCHOOL.blue }}>Librarian</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, #ffffff)` }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative" style={{ background: SCHOOL.blue }}>
                <Shield className="text-white w-7 h-7" />
                <CheckCircle2 className="absolute bottom-1 right-1 text-white w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: SCHOOL.blue }}>MPESA FOUNDATION</div>
              <div className="font-black text-lg" style={{ color: accent }}>OFFICIAL SEAL</div>
              <div className="text-[10px] uppercase text-gray-400">Verified Achievement</div>
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleDownload} disabled={downloading}
        className={`mt-6 px-6 py-3 rounded font-bold text-white ${downloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {downloading ? 'Preparing...' : 'Download Certificate'}
      </button>
    </div>
  );
};

export default CertificatePreview;
