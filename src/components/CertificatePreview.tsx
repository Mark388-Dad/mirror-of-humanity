import React, { useRef, useState } from 'react';
import { Shield, CheckCircle2, Star, Award, Crown, Medal, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import SocialShareButton from './SocialShareButton';

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
  cream: '#FFFDF7',
};

const LEVEL_CONFIG: Record<string, {
  accent: string; gradient: string; label: string; emoji: string;
  bgGradient: string; sealGlow: string; borderPattern: string;
  ribbonGradient: string; textShadow: string;
}> = {
  beginner: {
    accent: '#D4AF37', gradient: 'linear-gradient(135deg, #D4AF37, #F5E6A3)',
    label: 'BEGINNER', emoji: '⭐',
    bgGradient: 'radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,40,85,0.04) 0%, transparent 50%)',
    sealGlow: '0 0 40px rgba(212,175,55,0.3)', borderPattern: '#D4AF37',
    ribbonGradient: 'linear-gradient(135deg, #D4AF37, #C5A028, #F5E6A3, #D4AF37)',
    textShadow: '0 2px 8px rgba(212,175,55,0.2)',
  },
  bronze: {
    accent: '#CD7F32', gradient: 'linear-gradient(135deg, #CD7F32, #E8B87A)',
    label: 'BRONZE', emoji: '🥉',
    bgGradient: 'radial-gradient(ellipse at 30% 60%, rgba(205,127,50,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(0,40,85,0.04) 0%, transparent 50%)',
    sealGlow: '0 0 40px rgba(205,127,50,0.3)', borderPattern: '#CD7F32',
    ribbonGradient: 'linear-gradient(135deg, #CD7F32, #A0622A, #E8B87A, #CD7F32)',
    textShadow: '0 2px 8px rgba(205,127,50,0.2)',
  },
  silver: {
    accent: '#A8A9AD', gradient: 'linear-gradient(135deg, #A8A9AD, #D4D5D9)',
    label: 'SILVER', emoji: '🥈',
    bgGradient: 'radial-gradient(ellipse at 40% 40%, rgba(168,169,173,0.08) 0%, transparent 50%), radial-gradient(ellipse at 60% 70%, rgba(0,40,85,0.04) 0%, transparent 50%)',
    sealGlow: '0 0 40px rgba(168,169,173,0.3)', borderPattern: '#A8A9AD',
    ribbonGradient: 'linear-gradient(135deg, #A8A9AD, #8B8C90, #D4D5D9, #A8A9AD)',
    textShadow: '0 2px 8px rgba(168,169,173,0.2)',
  },
  gold: {
    accent: '#FFD700', gradient: 'linear-gradient(135deg, #FFD700, #FFF4B0)',
    label: 'GOLD', emoji: '🥇',
    bgGradient: 'radial-gradient(ellipse at 25% 35%, rgba(255,215,0,0.1) 0%, transparent 50%), radial-gradient(ellipse at 75% 65%, rgba(0,40,85,0.05) 0%, transparent 50%)',
    sealGlow: '0 0 60px rgba(255,215,0,0.4)', borderPattern: '#FFD700',
    ribbonGradient: 'linear-gradient(135deg, #FFD700, #DAA520, #FFF4B0, #FFD700)',
    textShadow: '0 2px 8px rgba(255,215,0,0.3)',
  },
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
      <div ref={certificateRef} className="relative overflow-hidden"
        style={{ width: '1122px', height: '794px', background: SCHOOL.cream }}>

        {/* Subtle background texture */}
        <div className="absolute inset-0" style={{ background: config.bgGradient }} />
        
        {/* Ornate triple border */}
        <div className="absolute inset-0" style={{ border: `14px solid ${config.accent}` }} />
        <div className="absolute" style={{
          inset: '16px',
          border: `2px solid ${config.accent}`,
          opacity: 0.5,
        }} />
        <div className="absolute" style={{
          inset: '22px',
          border: `1px solid ${config.accent}`,
          opacity: 0.25,
        }} />
        {/* Inner decorative dotted border */}
        <div className="absolute" style={{
          inset: '28px',
          border: `1px dashed ${config.accent}`,
          opacity: 0.15,
        }} />

        {/* Corner filigree decorations */}
        {[
          { top: 32, left: 32, rotate: 0 },
          { top: 32, right: 32, rotate: 90 },
          { bottom: 32, right: 32, rotate: 180 },
          { bottom: 32, left: 32, rotate: 270 },
        ].map((pos, i) => (
          <div key={i} className="absolute w-24 h-24 z-10" style={{
            top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom
          } as any}>
            <svg viewBox="0 0 80 80" fill="none" style={{ transform: `rotate(${pos.rotate}deg)` }}>
              <path d="M0 0 C0 0, 40 0, 40 0 C40 0, 40 40, 40 40" stroke={config.accent} strokeWidth="1.5" fill="none" opacity={0.4} />
              <path d="M0 0 L25 0 Q5 5 0 25Z" fill={config.accent} opacity={0.25} />
              <path d="M0 0 L50 0 Q8 8 0 50Z" fill={config.accent} opacity={0.08} />
              <circle cx="6" cy="6" r="3" fill={config.accent} opacity={0.35} />
              <path d="M10 0 Q15 5 10 10 Q5 5 10 0Z" fill={config.accent} opacity={0.2} />
            </svg>
          </div>
        ))}

        {/* Side flourish lines */}
        <div className="absolute left-[50px] top-[120px] bottom-[120px] w-[1px] z-5" 
          style={{ background: `linear-gradient(to bottom, transparent, ${config.accent}30, ${config.accent}15, ${config.accent}30, transparent)` }} />
        <div className="absolute right-[50px] top-[120px] bottom-[120px] w-[1px] z-5" 
          style={{ background: `linear-gradient(to bottom, transparent, ${config.accent}30, ${config.accent}15, ${config.accent}30, transparent)` }} />

        {/* Logo */}
        <div className="absolute top-10 left-12 w-24 z-10">
          <img src="/mpesa-logo.png" alt="MPESA Foundation Academy" 
            className="w-full object-contain select-none pointer-events-none" />
        </div>

        {/* Achievement Badge ribbon - top right */}
        <div className="absolute top-8 right-10 z-10">
          <div className="relative">
            <div className="px-6 py-2.5 rounded-full flex items-center gap-2.5 shadow-lg"
              style={{ background: config.ribbonGradient, boxShadow: config.sealGlow }}>
              <span className="text-2xl drop-shadow-md">{config.emoji}</span>
              <div>
                <span className="text-xs font-black text-white tracking-[0.2em] block"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  {config.label}
                </span>
                <span className="text-[9px] font-bold text-white/80 tracking-wider block"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  ACHIEVEMENT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="relative z-10 text-center pt-16">
          {/* Decorative star line */}
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="h-[1px] w-32" style={{ background: `linear-gradient(to right, transparent, ${config.accent})` }} />
            <Star size={12} style={{ color: config.accent, opacity: 0.5 }} />
            <Star size={16} style={{ color: config.accent }} />
            <Sparkles size={20} style={{ color: config.accent }} />
            <Star size={16} style={{ color: config.accent }} />
            <Star size={12} style={{ color: config.accent, opacity: 0.5 }} />
            <div className="h-[1px] w-32" style={{ background: `linear-gradient(to left, transparent, ${config.accent})` }} />
          </div>

          {/* Title */}
          <h1 className="text-[56px] font-serif tracking-[0.08em]"
            style={{ 
              color: SCHOOL.blue, 
              textShadow: config.textShadow,
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}>
            CERTIFICATE
          </h1>
          <h2 className="text-xl tracking-[0.35em] uppercase mt-0" style={{ color: config.accent }}>
            of Achievement
          </h2>

          {/* Ornamental line under title */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-[1px] w-20" style={{ background: `linear-gradient(to right, transparent, ${config.accent}60)` }} />
            <div className="w-2 h-2 rounded-full" style={{ background: config.accent, opacity: 0.4 }} />
            <div className="h-[2px] w-24" style={{ background: config.gradient }} />
            <div className="w-2 h-2 rounded-full" style={{ background: config.accent, opacity: 0.4 }} />
            <div className="h-[1px] w-20" style={{ background: `linear-gradient(to left, transparent, ${config.accent}60)` }} />
          </div>
        </div>

        {/* Student Name Section */}
        <div className="relative z-10 text-center mt-10 px-28">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: '#888' }}>
            This certificate is proudly presented to
          </p>
          
          {/* Name with decorative underline */}
          <div className="relative mt-3 mb-3">
            <h2 className="text-[48px] font-serif italic" style={{
              color: SCHOOL.blue,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              textShadow: '0 2px 4px rgba(0,40,85,0.1)',
            }}>
              {studentName}
            </h2>
            <div className="flex items-center justify-center gap-1 mt-1">
              <div className="h-[1px] w-16" style={{ background: `linear-gradient(to right, transparent, ${config.accent})` }} />
              <div className="h-[2px] w-48" style={{ background: config.gradient }} />
              <div className="h-[1px] w-16" style={{ background: `linear-gradient(to left, transparent, ${config.accent})` }} />
            </div>
          </div>

          <p className="text-base" style={{ color: '#555', lineHeight: 1.5 }}>
            for outstanding dedication and achievement in the
          </p>
          <p className="text-lg font-bold" style={{ color: SCHOOL.blue }}>
            45-Book Reading Challenge 2025/2026
          </p>

          {/* Achievement info card */}
          <div className="inline-flex items-center gap-5 mt-5 px-10 py-4 rounded-2xl bg-white/80 shadow-lg"
            style={{
              border: `2px solid ${config.accent}40`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px ${config.accent}10`,
            }}>
            <span className="text-4xl drop-shadow-md">{config.emoji}</span>
            <div className="text-left border-l border-r px-5" style={{ borderColor: `${config.accent}30` }}>
              <span className="text-lg font-bold block" style={{ color: SCHOOL.blue }}>
                {template.title}
              </span>
              {template.subtitle && (
                <span className="text-xs block mt-0.5" style={{ color: '#888' }}>{template.subtitle}</span>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-black" style={{ 
                color: config.accent,
                textShadow: config.textShadow,
              }}>{booksRead}</div>
              <div className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: '#999' }}>
                Books Read
              </div>
            </div>
          </div>

          {/* Body text quote */}
          {template.body_text && (
            <div className="mt-4 relative max-w-lg mx-auto">
              <span className="absolute -left-4 -top-2 text-3xl" style={{ color: `${config.accent}40`, fontFamily: 'Georgia' }}>"</span>
              <p className="italic text-sm px-4" style={{ color: '#666', lineHeight: 1.7 }}>
                {template.body_text}
              </p>
              <span className="absolute -right-4 -bottom-2 text-3xl" style={{ color: `${config.accent}40`, fontFamily: 'Georgia' }}>"</span>
            </div>
          )}
        </div>

        {/* ===== BOTTOM SECTION ===== */}
        <div className="absolute bottom-10 left-16 right-16 z-10 flex justify-between items-end">
          {/* Signature */}
          <div className="text-center min-w-[160px]">
            {template.signature_url && (
              <img src={template.signature_url} className="h-12 object-contain mb-1 mx-auto opacity-90" alt="Signature" />
            )}
            <div className="w-40 h-[1.5px] mx-auto mb-1.5" 
              style={{ background: `linear-gradient(to right, transparent, ${SCHOOL.blue}40, transparent)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: SCHOOL.blue }}>
              Librarian
            </span>
          </div>

          {/* Date */}
          <div className="text-center min-w-[160px]">
            <p className="text-sm font-bold mb-2" style={{ color: SCHOOL.blue }}>
              {date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="w-40 h-[1.5px] mx-auto mb-1.5" 
              style={{ background: `linear-gradient(to right, transparent, ${SCHOOL.blue}40, transparent)` }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: SCHOOL.blue }}>
              Date Awarded
            </span>
          </div>

          {/* Official Seal - ornate design */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="w-[88px] h-[88px] rounded-full absolute -inset-1"
                style={{ background: config.gradient, opacity: 0.3, filter: 'blur(4px)' }} />
              {/* Seal outer ring */}
              <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center relative"
                style={{ background: config.ribbonGradient, boxShadow: config.sealGlow }}>
                {/* Inner seal */}
                <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${SCHOOL.blue}, #1a3a5c)`,
                    boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 2px ${config.accent}60`,
                  }}>
                  <Shield className="text-white w-6 h-6 drop-shadow-md" />
                  <CheckCircle2 className="absolute bottom-0.5 right-0.5 w-4 h-4 drop-shadow-sm"
                    style={{ color: config.accent }} />
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.15em]" style={{ color: SCHOOL.blue }}>
                MPESA FOUNDATION
              </div>
              <div className="text-sm font-black tracking-wider" style={{ color: config.accent }}>
                ACADEMY
              </div>
              <div className="text-[8px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#999' }}>
                Verified Achievement
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={handleDownload} disabled={downloading}
          className={`px-10 py-3.5 rounded-xl font-bold text-white transition-all duration-300 ${
            downloading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
          }`}>
          {downloading ? '⏳ Preparing High-Quality PNG...' : '📥 Download Certificate'}
        </button>
        <SocialShareButton
          title={`${config.label} Achievement Certificate`}
          text={`🎉 ${studentName} earned a ${config.label} certificate in the 45-Book Reading Challenge at M-PESA Foundation Academy! ${config.emoji} #ReadingChallenge #MPESAAcademy`}
        />
      </div>
    </div>
  );
};

export default CertificatePreview;
