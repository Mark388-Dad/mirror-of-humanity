import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, Star, CheckCircle2 } from 'lucide-react';

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

/* =========================================
   NEW CERTIFICATE PREVIEW — MATCHES NEW UI
   EXACT STRUCTURE LIKE YOUR NEW CERTIFICATE
   ========================================= */

const CertificatePreview = ({
  template,
  studentName,
}: CertificatePreviewProps) => {
  return (
    <Card className="relative w-full aspect-[1.414/1] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border-[12px] border-white">
      
      {/* BACKGROUND PATTERN */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#002855 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* LEFT WING */}
      <div className="absolute top-0 left-0 w-[40%] h-full pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[#002855] -skew-x-[15deg] -translate-x-1/2 shadow-2xl" />
        <div className="absolute top-0 left-0 w-[95%] h-full bg-[#003b7a] -skew-x-[15deg] -translate-x-1/2 opacity-40" />
        <div className="absolute top-0 left-0 w-6 h-full bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b8860b] -skew-x-[15deg] -translate-x-1/4 shadow-lg" />
      </div>

      {/* RIGHT WING */}
      <div className="absolute top-0 right-0 w-[45%] h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[#002855] skew-x-[15deg] translate-x-1/2 shadow-2xl" />
        <div className="absolute top-0 right-0 w-[95%] h-full bg-[#003b7a] skew-x-[15deg] translate-x-1/2 opacity-40" />
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#d4af37] via-[#f9e29c] to-[#b8860b] skew-x-[15deg] translate-x-1/3 shadow-lg" />
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full px-24 py-16">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-[2px] w-12 bg-[#d4af37]" />
            <Star className="text-[#d4af37] w-5 h-5 fill-[#d4af37]" />
            <div className="h-[2px] w-12 bg-[#d4af37]" />
          </div>

          <h1 className="text-7xl font-serif font-bold tracking-[0.15em] text-[#1a1a1a]">
            CERTIFICATE
          </h1>

          <h2 className="text-2xl font-sans font-light tracking-[0.5em] text-[#003b7a] uppercase">
            of Achievement
          </h2>
        </div>

        {/* RECIPIENT */}
        <div className="w-full max-w-2xl text-center space-y-6">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">
              This is proudly presented to
            </p>

            <div className="relative py-4">
              <span className="text-5xl font-serif italic text-[#002855] font-semibold tracking-wide">
                {studentName}
              </span>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              for the successful completion and mastery of
            </p>

            <div className="inline-block px-8 py-3 bg-[#f8f9fa] border border-gray-100 rounded-full shadow-sm">
              <span className="text-2xl font-bold text-[#1a1a1a]">
                {template.title}
                <span className="text-[#d4af37] mx-2">•</span>
                {template.subtitle}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-gray-500 max-w-xl mx-auto font-medium italic">
              "{template.body_text}"
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="w-full flex justify-between items-end mt-8">

          {/* SIGNATURE */}
          <div className="flex flex-col items-center min-w-[200px]">
            {template.signature_url && (
              <img
                src={template.signature_url}
                className="h-12 object-contain mb-2"
              />
            )}
            <div className="w-full h-[1px] bg-gray-300 mb-2" />
            <div className="bg-[#002855] px-6 py-1.5 rounded-sm shadow-md">
              <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                LIBRARIAN
              </span>
            </div>
          </div>

          {/* SEAL */}
          <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-xl">
            <div className="relative w-24 h-24 flex-shrink-0">
              <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-md opacity-20 animate-pulse" />

              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full h-1 bg-[#d4af37]"
                    style={{ transform: `rotate(${i * 7.5}deg)` }}
                  />
                ))}
              </div>

              <div className="absolute inset-1 bg-gradient-to-br from-[#d4af37] via-[#f9e29c] to-[#b8860b] rounded-full flex items-center justify-center shadow-inner border-2 border-white">
                <div className="w-[85%] h-[85%] bg-[#002855] rounded-full flex flex-col items-center justify-center border border-[#d4af37]/50">
                  {template.school_logo_url ? (
                    <img
                      src={template.school_logo_url}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Shield className="text-[#d4af37] w-8 h-8" />
                  )}
                  <CheckCircle2 className="text-white w-3 h-3 absolute bottom-4 right-4" />
                </div>
              </div>
            </div>

            <div className="text-left">
              <div className="text-[#002855] font-bold text-sm tracking-wider leading-tight">
                MPESA FOUNDATION
              </div>

              <div className="text-[#d4af37] font-black text-lg leading-none mt-1">
                OFFICIAL SEAL
              </div>

              <div className="text-gray-400 text-[9px] font-bold tracking-widest mt-1 uppercase">
                Verified Achievement
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Montserrat:wght@200;400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

        .font-serif {
          font-family: 'Cinzel', serif;
        }
        .font-sans {
          font-family: 'Montserrat', sans-serif;
        }
        .font-italic {
          font-family: 'Playfair Display', serif;
        }
      `}</style>
    </Card>
  );
};

export default CertificatePreview;
