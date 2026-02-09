import React from "react";
import { Shield, CheckCircle2, Star } from "lucide-react";

interface CertificateConfig {
  recipientName: string;
  achievementTitle: string;
  achievementLevel: "Beginner" | "Bronze" | "Silver" | "Gold";
  description: string;
  role?: string;
  organizationName?: string;
  schoolLogoUrl?: string;
  signatureUrl?: string;

  primaryColor?: string;
  bgColor?: string;
  textColor?: string;

  fontHeader?: string;
  fontBody?: string;
  fontItalic?: string;

  layout?: "landscape" | "portrait";
}

const FlexibleCertificatePreview = ({
  recipientName,
  achievementTitle,
  achievementLevel,
  description,
  role = "LIBRARIAN",
  organizationName = "MPESA FOUNDATION ACADEMY",
  schoolLogoUrl,
  signatureUrl,

  primaryColor = "#002855", // School blue
  bgColor = "#ffffff",
  textColor = "#1a1a1a",

  fontHeader = "'Cinzel', serif",
  fontBody = "'Montserrat', sans-serif",
  fontItalic = "'Playfair Display', serif",

  layout = "landscape",
}: CertificateConfig) => {

  /* =========================
     🎖 LEVEL STYLING SYSTEM
     ========================= */

  const levelStyles = {
    Beginner: {
      accent: "#3CB371", // School green
      lineThickness: 4,
      title: "CERTIFICATE OF ACHIEVEMENT",
    },
    Bronze: {
      accent: "#cd7f32",
      lineThickness: 6,
      title: "CERTIFICATE OF ACHIEVEMENT",
    },
    Silver: {
      accent: "#C0C0C0",
      lineThickness: 8,
      title: "CERTIFICATE OF ACHIEVEMENT",
    },
    Gold: {
      accent: "#d4af37",
      lineThickness: 10,
      title: "CERTIFICATE OF EXCELLENCE",
    },
  };

  const accentColor = levelStyles[achievementLevel].accent;
  const lineThickness = levelStyles[achievementLevel].lineThickness;
  const titleText = levelStyles[achievementLevel].title;

  const aspect =
    layout === "landscape" ? "aspect-[1.414/1]" : "aspect-[1/1.414]";

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-[#f3f6fa]">
      <div
        className={`relative w-full max-w-5xl overflow-hidden rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] border-[10px] border-white ${aspect}`}
        style={{ backgroundColor: bgColor }}
      >
        {/* =========================
            LEVEL PROGRESS LINE
           (changes per level)
        ========================= */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: lineThickness,
            background: accentColor,
          }}
        />

        {/* =========================
            SCHOOL LOGO (FIXED STYLE)
        ========================= */}
        {schoolLogoUrl && (
          <div
            className="absolute top-8 right-8 flex items-center justify-center rounded-full shadow-lg"
            style={{
              width: 110,
              height: 110,
              background: "#fff",
              border: `5px solid ${accentColor}`,
              overflow: "hidden",
            }}
          >
            <img
              src={schoolLogoUrl}
              alt="School Logo"
              className="w-full h-full object-contain p-2"
            />
          </div>
        )}

        {/* =========================
            BLUE SIDE PANEL (School aesthetic)
        ========================= */}
        <div
          className="absolute left-0 top-0 h-full w-[30%]"
          style={{
            background: primaryColor,
            clipPath: "polygon(0 0, 100% 0, 70% 100%, 0% 100%)",
          }}
        />

        {/* =========================
            MAIN CONTENT
        ========================= */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-20 py-16">

          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-3">
              <Star style={{ color: accentColor }} />
            </div>

            <h1
              className="text-6xl tracking-[0.15em]"
              style={{ fontFamily: fontHeader, color: textColor }}
            >
              CERTIFICATE
            </h1>

            <h2
              className="text-xl tracking-[0.4em] mt-2"
              style={{ color: accentColor, fontFamily: fontBody }}
            >
              {titleText.replace("CERTIFICATE ", "")}
            </h2>
          </div>

          {/* Recipient */}
          <div className="text-center max-w-2xl space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-gray-500">
              This is proudly presented to
            </p>

            <h2
              className="text-5xl italic"
              style={{ fontFamily: fontItalic, color: primaryColor }}
            >
              {recipientName}
            </h2>

            <p style={{ fontFamily: fontBody }}>
              for the successful completion and mastery of
            </p>

            <div
              className="inline-block px-8 py-3 rounded-full shadow-sm"
              style={{
                border: `2px solid ${accentColor}`,
                color: textColor,
              }}
            >
              <span className="text-2xl font-bold">
                {achievementLevel} Level • {achievementTitle}
              </span>
            </div>

            <p
              className="italic text-sm max-w-xl mx-auto"
              style={{ fontFamily: fontItalic }}
            >
              "{description}"
            </p>
          </div>

          {/* Footer */}
          <div className="w-full flex justify-between items-end mt-8">
            <div className="flex flex-col items-center min-w-[200px]">
              {signatureUrl && (
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="h-12 object-contain mb-2"
                />
              )}
              <div className="w-full h-[1px] bg-gray-300 mb-2" />
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: primaryColor }}
              >
                {role}
              </span>
            </div>

            {/* Official Seal */}
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{
                border: `2px solid ${accentColor}`,
              }}
            >
              <Shield style={{ color: accentColor }} />
              <div>
                <div
                  className="text-sm font-bold"
                  style={{ color: primaryColor }}
                >
                  {organizationName}
                </div>
                <div
                  className="text-xs uppercase"
                  style={{ color: accentColor }}
                >
                  Official Seal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative soft shapes */}
        <div className="absolute bottom-[-60px] right-[-60px] w-40 h-40 rounded-full opacity-10" style={{ background: primaryColor }} />
        <div className="absolute top-[-60px] left-[-60px] w-40 h-40 rounded-full opacity-10" style={{ background: accentColor }} />
      </div>
    </div>
  );
};

export default FlexibleCertificatePreview;

