import React from 'react';
import { Shield, CheckCircle2, Star } from 'lucide-react';
import MpesaLogo from '@/assets/mpesa-logo.png';

interface CertificateTemplate {
  level: 'beginner' | 'bronze' | 'silver' | 'gold';
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  signature_url: string | null;
}

interface CertificatePreviewProps {
  template: CertificateTemplate;
  studentName: string;
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

  return (
    <div
      className="relative bg-white overflow-hidden"
      style={{
        width: '1122px',
        height: '794px', // A4 landscape
        border: `10px solid ${accent}`,
      }}
    >
      {/* BACKGROUND WASH */}
      <div
        className="absolute inset-0"
        style={{
          background:
            `linear-gradient(135deg, ${SCHOOL.blue}08, ${SCHOOL.green}05, transparent)`,
        }}
      />

      {/* FIXED SCHOOL LOGO */}
      <div className="absolute top-6 left-6 w-28 h-28">
        <img
          src={MpesaLogo}
          alt="MPESA Foundation Academy"
          className="w-full h-full object-contain"
        />
      </div>

      {/* HEADER */}
      <div className="text-center pt-20">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="h-[2px] w-16" style={{ background: SCHOOL.green }} />
          <Star size={20} style={{ color: accent }} />
          <div className="h-[2px] w-16" style={{ background: SCHOOL.green }} />
        </div>

        <h1 className="text-6xl font-serif tracking-wide text-[#1a1a1a]">
          CERTIFICATE
        </h1>
        <h2
          className="text-2xl tracking-widest uppercase"
          style={{ color: SCHOOL.blue }}
        >
          of Achievement
        </h2>
      </div>

      {/* STUDENT */}
      <div className="text-center mt-20 px-24">
        <p className="text-sm uppercase tracking-wider text-gray-500">
          This is proudly presented to
        </p>

        <h2 className="text-5xl font-serif my-6" style={{ color: SCHOOL.blue }}>
          {studentName}
        </h2>

        <p className="text-lg text-gray-700 mb-6">
          for the successful completion and mastery of
        </p>

        <div
          className="inline-block px-10 py-4 rounded-full border"
          style={{ borderColor: accent }}
        >
          <span className="text-2xl font-bold">
            {template.title}
            <span className="mx-3" style={{ color: accent }}>•</span>
            {template.subtitle}
          </span>
        </div>

        <p className="mt-6 italic text-gray-500 max-w-xl mx-auto">
          “{template.body_text}”
        </p>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-12 left-16 right-16 flex justify-between items-end">
        {/* SIGNATURE */}
        <div className="text-center">
          {template.signature_url && (
            <img
              src={template.signature_url}
              className="h-12 object-contain mb-2"
              alt="Signature"
            />
          )}
          <div className="w-32 h-[1px] bg-gray-300 mx-auto mb-2" />
          <span className="text-xs font-bold uppercase" style={{ color: SCHOOL.blue }}>
            Librarian
          </span>
        </div>

        {/* OFFICIAL SEAL */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accent}, #fff)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: SCHOOL.blue }}
            >
              <Shield className="text-white w-7 h-7" />
              <CheckCircle2 className="absolute bottom-1 right-1 text-white w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="font-bold text-sm" style={{ color: SCHOOL.blue }}>
              MPESA FOUNDATION
            </div>
            <div className="font-black text-lg" style={{ color: accent }}>
              OFFICIAL SEAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
