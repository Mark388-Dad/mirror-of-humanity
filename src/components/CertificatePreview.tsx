import React from 'react';
import { Shield, CheckCircle2, Star } from 'lucide-react';

interface CertificateConfig {
  recipientName: string;
  achievementTitle: string;
  achievementLevel: string;
  description: string;
  role?: string;
  organizationName?: string;
  schoolLogoUrl?: string;
  signatureUrl?: string;

  // NEW FLEXIBLE STYLING OPTIONS
  primaryColor?: string;      // Main blue / dark color
  accentColor?: string;       // Gold / gradient color
  bgColor?: string;           // Certificate background
  textColor?: string;         // Main text color
  fontHeader?: string;        // Header font
  fontBody?: string;          // Body font
  fontItalic?: string;        // Italic font
  layout?: 'landscape' | 'portrait';
  logoPosition?: 'top-right' | 'top-left' | 'center'; // Logo placement
}

const FlexibleCertificatePreview = ({
  recipientName,
  achievementTitle,
  achievementLevel,
  description,
  role = 'LIBRARIAN',
  organizationName = 'MPESA FOUNDATION ACADEMY',
  schoolLogoUrl,
  signatureUrl,
  primaryColor = '#002855',
  accentColor = '#d4af37',
  bgColor = '#ffffff',
  textColor = '#1a1a1a',
  fontHeader = "'Cinzel', serif",
  fontBody = "'Montserrat', sans-serif",
  fontItalic = "'Playfair Display', serif",
  layout = 'landscape',
  logoPosition = 'top-right',
}: CertificateConfig) => {
  // Determine aspect ratio
  const aspect = layout === 'landscape' ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]';

  // Logo placement
  const logoStyles: React.CSSProperties = {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid white',
    top: 24,
    ...(logoPosition === 'top-right'
      ? { right: 24 }
      : logoPosition === 'top-left'
      ? { left: 24 }
      : { left: '50%', transform: 'translateX(-50%)' }),
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8" style={{ backgroundColor: '#f0f2f5' }}>
      <div
        className={`relative w-full max-w-5xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border-[12px] border-white rounded-xl ${aspect}`}
        style={{ backgroundColor: bgColor }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Left Wing */}
        <div className="absolute top-0 left-0 w-[40%] h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full shadow-2xl" style={{ backgroundColor: primaryColor, transform: 'skewX(-15deg) translateX(-50%)' }} />
          <div className="absolute top-0 left-0 w-[95%] h-full opacity-40" style={{ backgroundColor: '#003b7a', transform: 'skewX(-15deg) translateX(-50%)' }} />
          <div className="absolute top-0 left-0 w-6 h-full shadow-lg" style={{ background: `linear-gradient(to right, ${accentColor} 0%, #f9e29c 50%, #b8860b 100%)`, transform: 'skewX(-15deg) translateX(-25%)' }} />
        </div>

        {/* Right Wing */}
        <div className="absolute top-0 right-0 w-[45%] h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full shadow-2xl" style={{ backgroundColor: primaryColor, transform: 'skewX(15deg) translateX(50%)' }} />
          <div className="absolute top-0 right-0 w-[95%] h-full opacity-40" style={{ backgroundColor: '#003b7a', transform: 'skewX(15deg) translateX(50%)' }} />
          <div className="absolute top-0 right-0 w-8 h-full shadow-lg" style={{ background: `linear-gradient(to left, ${accentColor} 0%, #f9e29c 50%, #b8860b 100%)`, transform: 'skewX(15deg) translateX(33%)' }} />
        </div>

        {/* School Logo */}
        {schoolLogoUrl && <img src={schoolLogoUrl} alt="School Logo" style={logoStyles} />}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-24 py-16">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-[2px] w-12" style={{ backgroundColor: accentColor }} />
              <Star className="w-5 h-5 fill-current" style={{ color: accentColor }} />
              <div className="h-[2px] w-12" style={{ backgroundColor: accentColor }} />
            </div>
            <h1 className="text-7xl font-bold tracking-[0.15em]" style={{ fontFamily: fontHeader, color: textColor }}>CERTIFICATE</h1>
            <h2 className="text-2xl font-light tracking-[0.5em]" style={{ fontFamily: fontBody, color: primaryColor, textTransform: 'uppercase' }}>of Achievement</h2>
          </div>

          {/* Recipient */}
          <div className="w-full max-w-2xl text-center space-y-6">
            <p className="text-xs font-bold tracking-[0.3em]" style={{ color: '#666' }}>This is proudly presented to</p>
            <h2 className="text-5xl italic font-semibold py-2" style={{ fontFamily: fontItalic, color: primaryColor }}>{recipientName}</h2>

            <p className="text-lg" style={{ color: '#333' }}>for the successful completion and mastery of</p>
            <div className="inline-block px-8 py-3 bg-[#f8f9fa] border border-gray-100 rounded-full shadow-sm">
              <span className="text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                {achievementTitle} <span style={{ color: accentColor }} className="mx-2">•</span> {achievementLevel}
              </span>
            </div>
            <p className="text-sm max-w-xl mx-auto font-medium italic" style={{ color: '#555', fontFamily: fontItalic }}>"{description}"</p>
          </div>

          {/* Footer */}
          <div className="w-full flex justify-between items-end mt-8">
            {/* Signature */}
            <div className="flex flex-col items-center min-w-[200px]">
              {signatureUrl && <img src={signatureUrl} alt="Signature" className="h-12 object-contain mb-2" />}
              <div className="w-full h-[1px] bg-gray-300 mb-2" />
              <div className="px-6 py-1.5 rounded-sm shadow-md" style={{ backgroundColor: primaryColor }}>
                <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">{role}</span>
              </div>
            </div>

            {/* Badge */}
            <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-xl">
              <div className="relative w-24 h-24 flex-shrink-0">
                <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-md opacity-20 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="absolute w-full h-1" style={{ backgroundColor: accentColor, transform: `rotate(${i * 7.5}deg)` }} />
                  ))}
                </div>
                <div className="absolute inset-1 bg-gradient-to-br from-[#d4af37] via-[#f9e29c] to-[#b8860b] rounded-full flex items-center justify-center shadow-inner border-2 border-white">
                  <div className="w-[85%] h-[85%] bg-[#002855] rounded-full flex items-center justify-center border border-[#d4af37]/50">
                    <Shield className="text-[#d4af37] w-8 h-8" />
                    <CheckCircle2 className="text-white w-3 h-3 absolute bottom-4 right-4" />
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className="font-bold text-sm tracking-wider leading-tight" style={{ color: primaryColor }}>{organizationName}</div>
                <div className="font-black text-lg leading-none mt-1" style={{ color: accentColor }}>OFFICIAL SEAL</div>
                <div className="text-gray-400 text-[9px] font-bold tracking-widest mt-1 uppercase">Verified Achievement</div>
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

export default FlexibleCertificatePreview;
