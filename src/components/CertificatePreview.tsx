import React from 'react';
import { Shield, CheckCircle2, Star } from 'lucide-react';

interface CertificateTemplate {
  level: 'beginner' | 'bronze' | 'silver' | 'gold';
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  signature_url: string | null;
}

interface CertificatePreviewProps {
  template: CertificateTemplate;
  studentName: string;
  booksRead?: number;
  date?: string;
}

/* MAP LEVEL TO GOLD BORDER COLOR */
const LEVEL_GOLD = {
  beginner: '#D4AF37',
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

const CertificatePreview = ({
  template,
  studentName,
  booksRead = 0,
  date = new Date().toLocaleDateString(),
}: CertificatePreviewProps) => {
  const goldColor = LEVEL_GOLD[template.level] || LEVEL_GOLD.beginner;

  return (
    <div
      className="relative w-full h-full bg-white overflow-hidden border-8"
      style={{
        borderColor: goldColor,
        width: '1122px',
        height: '794px', // A4 landscape
      }}
    >
      {/* BACKGROUND */}
      {template.background_image_url && (
        <img
          src={template.background_image_url}
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          alt="Background"
        />
      )}

      {/* SCHOOL LOGO */}
      {template.school_logo_url && (
        <div className="absolute top-6 right-6 w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg">
          <img
            src={template.school_logo_url}
            className="w-full h-full object-contain p-2"
            alt="School Logo"
          />
        </div>
      )}

      {/* HEADER */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-16">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-[2px] w-12" style={{ backgroundColor: goldColor }} />
          <Star className="w-5 h-5" style={{ color: goldColor }} />
          <div className="h-[2px] w-12" style={{ backgroundColor: goldColor }} />
        </div>
        <h1 className="text-6xl font-serif font-bold tracking-wide text-[#1a1a1a]">
          CERTIFICATE
        </h1>
        <h2 className="text-2xl font-sans font-light text-[#003b7a] tracking-widest uppercase">
          of Achievement
        </h2>
      </div>

      {/* RECIPIENT */}
      <div className="relative z-10 flex flex-col items-center mt-16 text-center px-16">
        <p className="text-sm uppercase text-gray-500 tracking-wide">
          This is proudly presented to
        </p>
        <h2 className="text-5xl font-serif font-semibold text-[#002855] my-4">
          {studentName}
        </h2>

        <p className="text-lg text-gray-700 mb-4">
          for the successful completion and mastery of
        </p>

        <div className="inline-block px-8 py-3 bg-[#f8f9fa] border border-gray-100 rounded-full shadow-sm mb-4">
          <span className="text-2xl font-bold text-[#1a1a1a]">
            {template.title} <span className="mx-2" style={{ color: goldColor }}>•</span> {template.subtitle}
          </span>
        </div>

        <p className="text-sm italic text-gray-500 max-w-xl">
          "{template.body_text}"
        </p>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-12 left-16 right-16 flex justify-between items-end">
        {/* SIGNATURE */}
        <div className="flex flex-col items-center">
          {template.signature_url && (
            <img src={template.signature_url} className="h-12 object-contain mb-2" alt="Signature" />
          )}
          <div className="w-32 h-[1px] bg-gray-300 mb-2" />
          <div className="bg-[#002855] px-6 py-1.5 rounded-sm shadow-md">
            <span className="text-[10px] text-white font-bold tracking-wide uppercase">
              LIBRARIAN
            </span>
          </div>
        </div>

        {/* SEAL */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 rounded-full" />
            <div className="absolute inset-2 bg-[#002855] rounded-full flex items-center justify-center border border-yellow-400">
              <Shield className="text-yellow-400 w-8 h-8" />
              <CheckCircle2 className="text-white w-3 h-3 absolute bottom-2 right-2" />
            </div>
          </div>
          <div className="text-left">
            <div className="text-[#002855] font-bold text-sm">MPESA FOUNDATION</div>
            <div className="text-yellow-400 font-black text-lg mt-1">OFFICIAL SEAL</div>
            <div className="text-gray-400 text-[9px] mt-1 uppercase">Verified Achievement</div>
          </div>
        </div>
      </div>

      {/* FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Montserrat:wght@200;400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

        .font-serif { font-family: 'Cinzel', serif; }
        .font-sans { font-family: 'Montserrat', sans-serif; }
        .font-italic { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
};

export default CertificatePreview;
