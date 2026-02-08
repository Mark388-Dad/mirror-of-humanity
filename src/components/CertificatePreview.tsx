import React from 'react';
import { Shield, CheckCircle2, Star } from 'lucide-react';

interface CertificatePreviewProps {
  recipientName: string;
  achievementTitle: string;
  achievementLevel: string;
  description: string;
  role?: string;
  organizationName?: string;
  schoolLogoUrl?: string;
  signatureUrl?: string;
}

const CertificatePreview = ({
  recipientName,
  achievementTitle,
  achievementLevel,
  description,
  role = 'LIBRARIAN',
  organizationName = 'MPESA FOUNDATION ACADEMY',
  schoolLogoUrl,
  signatureUrl,
}: CertificatePreviewProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f2f5] p-8">
      <div className="relative w-full max-w-5xl aspect-[1.414/1] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border-[12px] border-white rounded-xl">
        
        {/* Elegant Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#002855 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Left Wing */}
        <div className="absolute top-0 left-0 w-[40%] h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[#002855] -skew-x-[15deg] -translate-x-1/2 shadow-2xl" />
          <div className="absolute top-0 left-0 w-[95%] h-full bg-[#003b7a] -skew-x-[15deg] -translate-x-1/2 opacity-40" />
          <div className="absolute top-0 left-0 w-6 h-full bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b8860b] -skew-x-[15deg] -translate-x-1/4 shadow-lg" />
        </div>

        {/* Right Wing */}
        <div className="absolute top-0 right-0 w-[45%] h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full bg-[#002855] skew-x-[15deg] translate-x-1/2 shadow-2xl" />
          <div className="absolute top-0 right-0 w-[95%] h-full bg-[#003b7a] skew-x-[15deg] translate-x-1/2 opacity-40" />
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#d4af37] via-[#f9e29c] to-[#b8860b] skew-x-[15deg] translate-x-1/3 shadow-lg" />
        </div>

        {/* School Logo */}
        {schoolLogoUrl && (
          <div className="absolute top-6 right-6 w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg">
            <img
              src={schoolLogoUrl}
              className="w-full h-full object-contain p-2"
              alt="School Logo"
            />
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-24 py-16">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-[2px] w-12 bg-[#d4af37]" />
              <Star className="text-[#d4af37] w-5 h-5 fill-[#d4af37]" />
              <div className="h-[2px] w-12 bg-[#d4af37]" />
            </div>
            <h1 className="text-7xl font-serif font-bold tracking-[0.15em] text-[#1a1a1a] drop-shadow-sm">
              CERTIFICATE
            </h1>
            <h2 className="text-2xl font-sans font-light tracking-[0.5em] text-[#003b7a] uppercase">
              of Achievement
            </h2>
          </div>

          {/* Recipient */}
          <div className="w-full max-w-2xl text-center space-y-6">
            <p className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">
              This is proudly presented to
            </p>
            <h2 className="text-5xl font-serif italic text-[#002855] font-semibold tracking-wide py-2">
              {recipientName}
            </h2>

            <p className="text-lg text-gray-700">for the successful completion and mastery of</p>

            <div className="inline-block px-8 py-3 bg-[#f8f9fa] border border-gray-100 rounded-full shadow-sm">
              <span className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                {achievementTitle} <span className="text-[#d4af37] mx-2">•</span> {achievementLevel}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-gray-500 max-w-xl mx-auto font-medium italic">
              "{description}"
            </p>
          </div>

          {/* Footer */}
          <div className="w-full flex justify-between items-end mt-8">

            {/* Signature */}
            <div className="flex flex-col items-center min-w-[200px]">
              {signatureUrl && (
                <img src={signatureUrl} className="h-12 object-contain mb-2" alt="Signature" />
              )}
              <div className="w-full h-[1px] bg-gray-300 mb-2" />
              <div className="bg-[#002855] px-6 py-1.5 rounded-sm shadow-md">
                <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                  {role}
                </span>
              </div>
            </div>

            {/* Badge / Seal */}
            <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-xl">
              <div className="relative w-24 h-24 flex-shrink-0">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-md opacity-20 animate-pulse" />
                {/* Serrated Edge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full h-1 bg-[#d4af37]"
                      style={{ transform: `rotate(${i * 7.5}deg)` }}
                    />
                  ))}
                </div>
                {/* Main Circle */}
                <div className="absolute inset-1 bg-gradient-to-br from-[#d4af37] via-[#f9e29c] to-[#b8860b] rounded-full flex items-center justify-center shadow-inner border-2 border-white">
                  <div className="w-[85%] h-[85%] bg-[#002855] rounded-full flex flex-col items-center justify-center border border-[#d4af37]/50">
                    <Shield className="text-[#d4af37] w-8 h-8" />
                    <CheckCircle2 className="text-white w-3 h-3 absolute bottom-4 right-4" />
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className="text-[#002855] font-bold text-sm tracking-wider leading-tight">
                  {organizationName}
                </div>
                <div className="text-[#d4af37] font-black text-lg leading-none mt-1">OFFICIAL SEAL</div>
                <div className="text-gray-400 text-[9px] font-bold tracking-widest mt-1 uppercase">
                  Verified Achievement
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute bottom-[-60px] right-[-60px] w-40 h-40 bg-[#002855] rounded-full opacity-10"></div>
        <div className="absolute top-[-60px] left-[-60px] w-40 h-40 bg-[#d4af37] rounded-full opacity-10"></div>
      </div>
    </div>
  );
};

export default CertificatePreview;
