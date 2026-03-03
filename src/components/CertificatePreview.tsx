import React, { useRef, useState } from 'react';
import { Shield, CheckCircle2, Star, Award, Crown, Medal, Sparkles } from 'lucide-react';
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

const LEVEL_CONFIG: Record<string, { accent: string; gradient: string; label: string; emoji: string }> = {
  beginner: { accent: '#D4AF37', gradient: 'linear-gradient(135deg, #D4AF37, #F5E6A3)', label: 'BEGINNER', emoji: '⭐' },
  bronze: { accent: '#CD7F32', gradient: 'linear-gradient(135deg, #CD7F32, #E8B87A)', label: 'BRONZE', emoji: '🥉' },
  silver: { accent: '#C0C0C0', gradient: 'linear-gradient(135deg, #A8A8A8, #E0E0E0)', label: 'SILVER', emoji: '🥈' },
  gold: { accent: '#FFD700', gradient: 'linear-gradient(135deg, #FFD700, #FFF4B0)', label: 'GOLD', emoji: '🥇' },
};

const CertificatePreview = ({ template, studentName, booksRead = 0, date }: CertificatePreviewProps) => {
  const config = LEVEL_CONFIG[template.level];
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 3, useCORS: true, allowTaint: true });
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
        {/* Decorative border */}
        <div className="absolute inset-0" style={{ border: `12px solid ${config.accent}` }} />
        <div className="absolute inset-[14px]" style={{ border: `3px solid ${config.accent}40` }} />
        <div className="absolute inset-[20px]" style={{ border: `1px solid ${config.accent}20` }} />

        {/* Background orbs */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[120px]"
            style={{ background: SCHOOL.blue, opacity: 0.12 }} />
          <div className="absolute top-40 -right-40 w-[700px] h-[700px] rounded-full blur-[120px]"
            style={{ background: SCHOOL.green, opacity: 0.1 }} />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[130px]"
            style={{ background: config.accent, opacity: 0.1 }} />
        </div>

        {/* Corner decorations */}
        {[{ top: 30, left: 30 }, { top: 30, right: 30 }, { bottom: 30, left: 30 }, { bottom: 30, right: 30 }].map((pos, i) => (
          <div key={i} className="absolute w-16 h-16 z-10" style={pos as any}>
            <svg viewBox="0 0 60 60" fill="none" style={{ transform: `rotate(${i * 90}deg)` }}>
              <path d="M0 0 L20 0 L0 20Z" fill={config.accent} opacity={0.4} />
              <path d="M0 0 L40 0 L0 40Z" fill={config.accent} opacity={0.15} />
            </svg>
          </div>
        ))}

        {/* Logo */}
        <div className="absolute top-8 left-10 w-28 z-10">
          <img src="/mpesa-logo.png" alt="MPESA Foundation Academy" className="w-full object-contain select-none pointer-events-none" />
        </div>

        {/* Achievement Badge - top right */}
        <div className="absolute top-8 right-10 z-10 flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: config.gradient }}>
          <span className="text-xl">{config.emoji}</span>
          <span className="text-sm font-black text-white tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            {config.label} LEVEL
          </span>
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center pt-20">
          <div className="flex justify-center items-center gap-3 mb-3">
            <div className="h-[2px] w-24" style={{ background: `linear-gradient(to right, transparent, ${config.accent})` }} />
            <Star size={18} style={{ color: config.accent }} />
            <Star size={22} style={{ color: config.accent }} />
            <Star size={18} style={{ color: config.accent }} />
            <div className="h-[2px] w-24" style={{ background: `linear-gradient(to left, transparent, ${config.accent})` }} />
          </div>

          {/* Title */}
          <h1 className="text-6xl font-serif tracking-wide text-[#1a1a1a]"
            style={{ textShadow: `0 2px 4px ${config.accent}20` }}>
            CERTIFICATE
          </h1>
          <h2 className="text-2xl tracking-[0.3em] uppercase mt-1" style={{ color: SCHOOL.blue }}>
            of Achievement
          </h2>
          <div className="h-[2px] w-40 mx-auto mt-3" style={{ background: config.gradient }} />
        </div>

        {/* Student Name Section */}
        <div className="relative z-10 text-center mt-14 px-32">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-500">This is proudly presented to</p>
          <h2 className="text-5xl font-serif my-5" style={{ color: SCHOOL.blue }}>{studentName}</h2>
          <p className="text-lg text-gray-600 mb-6">for outstanding dedication in the 45-Book Reading Challenge</p>

          {/* Achievement pill */}
          <div className="inline-flex items-center gap-4 px-10 py-4 rounded-full border-2 shadow-md bg-white"
            style={{ borderColor: config.accent }}>
            <span className="text-3xl">{config.emoji}</span>
            <div className="text-left">
              <span className="text-xl font-bold" style={{ color: SCHOOL.blue }}>
                {template.title}
              </span>
              {template.subtitle && <span className="text-sm text-gray-500 block">{template.subtitle}</span>}
            </div>
            <div className="text-center border-l pl-4" style={{ borderColor: `${config.accent}40` }}>
              <div className="text-2xl font-black" style={{ color: config.accent }}>{booksRead}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400">Books Read</div>
            </div>
          </div>

          {/* Body text */}
          {template.body_text && (
            <p className="mt-6 italic text-gray-600 max-w-xl mx-auto text-sm">"{template.body_text}"</p>
          )}
        </div>

        {/* Bottom section */}
        <div className="absolute bottom-14 left-20 right-20 z-10 flex justify-between items-end">
          {/* Signature */}
          <div className="text-center">
            {template.signature_url && <img src={template.signature_url} className="h-14 object-contain mb-2" alt="Signature" />}
            <div className="w-36 h-[1px] bg-gray-300 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: SCHOOL.blue }}>Librarian</span>
          </div>

          {/* Date */}
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: SCHOOL.blue }}>{date || new Date().toLocaleDateString()}</p>
            <div className="w-36 h-[1px] bg-gray-300 mx-auto mb-2 mt-2" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: SCHOOL.blue }}>Date</span>
          </div>

          {/* Official Seal */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: config.gradient }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{ background: SCHOOL.blue }}>
                <Shield className="text-white w-7 h-7" />
                <CheckCircle2 className="absolute bottom-1 right-1 text-white w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: SCHOOL.blue }}>MPESA FOUNDATION</div>
              <div className="font-black text-lg" style={{ color: config.accent }}>OFFICIAL SEAL</div>
              <div className="text-[10px] uppercase text-gray-400 tracking-wider">Verified Achievement</div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} disabled={downloading}
        className={`mt-6 px-8 py-3 rounded-lg font-bold text-white transition-all ${
          downloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}>
        {downloading ? '⏳ Preparing...' : '📥 Download Certificate'}
      </button>
    </div>
  );
};

export default CertificatePreview;
