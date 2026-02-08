import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CertificatePreview from "./CertificatePreview";

/* ======================================================
   LEVEL CONFIG (MATCH YOUR NEW CERTIFICATE DESIGN)
   ====================================================== */
const LEVELS = [
  { id: "beginner", label: "Beginner Level" },
  { id: "bronze", label: "Bronze Achievement Level" },
  { id: "silver", label: "Silver Achievement Level" },
  { id: "gold", label: "Gold Achievement Level" },
];

/* ======================================================
   TYPES
   ====================================================== */
interface CertificateTemplate {
  id: string;
  level: string;
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  signature_url: string | null;
  template_preset: string;
  is_published: boolean;
}

/* ======================================================
   MAIN COMPONENT
   ====================================================== */
const CertificateManager = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [activeLevel, setActiveLevel] = useState("beginner");
  const [uploading, setUploading] = useState(false);

  /* ======================================================
     LOAD TEMPLATES
     ====================================================== */
  const loadTemplates = async () => {
    const { data } = await supabase
      .from("certificate_templates")
      .select("*")
      .order("level");

    if (data) setTemplates(data as CertificateTemplate[]);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  /* ======================================================
     UPDATE TEMPLATE FIELD (LIVE UPDATE)
     ====================================================== */
  const updateTemplate = async (
    id: string,
    field: string,
    value: string | boolean
  ) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );

    await supabase.from("certificate_templates").update({
      [field]: value,
    }).eq("id", id);
  };

  /* ======================================================
     IMAGE UPLOAD (BACKGROUND / LOGO / SIGNATURE)
     ====================================================== */
  const uploadImage = async (
    file: File,
    type: "background" | "logo" | "signature",
    templateId: string
  ) => {
    setUploading(true);

    const filePath = `certificates/${templateId}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("certificate-assets")
      .upload(filePath, file);

    if (error) {
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("certificate-assets")
      .getPublicUrl(filePath);

    let field = "background_image_url";
    if (type === "logo") field = "school_logo_url";
    if (type === "signature") field = "signature_url";

    await updateTemplate(templateId, field, data.publicUrl);

    setUploading(false);
  };

  /* ======================================================
     ACTIVE TEMPLATE
     ====================================================== */
  const template =
    templates.find((t) => t.level === activeLevel) || null;

  if (!template) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading templates...
      </div>
    );
  }

  /* ======================================================
     UI
     ====================================================== */
  return (
    <div className="w-full min-h-screen bg-[#F4F6F9] p-10 space-y-8">

      {/* ===============================
         LEVEL TABS
         =============================== */}
      <div className="flex gap-3">
        {LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => setActiveLevel(lvl.id)}
            className={`px-6 py-3 rounded-xl font-semibold transition
            ${
              activeLevel === lvl.id
                ? "bg-[#1E3A6D] text-white shadow-lg"
                : "bg-white border"
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {/* ===============================
         MAIN GRID
         =============================== */}
      <div className="grid grid-cols-2 gap-10">

        {/* ======================================================
           LEFT — EDITOR PANEL
           ====================================================== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">

          <h2 className="text-xl font-bold">Certificate Editor</h2>

          <div>
            <label className="text-sm font-semibold">Title</label>
            <input
              value={template.title}
              onChange={(e) =>
                updateTemplate(template.id, "title", e.target.value)
              }
              className="w-full border rounded-lg p-3 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Subtitle</label>
            <input
              value={template.subtitle}
              onChange={(e) =>
                updateTemplate(template.id, "subtitle", e.target.value)
              }
              className="w-full border rounded-lg p-3 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Body Text</label>
            <textarea
              value={template.body_text}
              onChange={(e) =>
                updateTemplate(template.id, "body_text", e.target.value)
              }
              className="w-full border rounded-lg p-3 mt-1 h-28"
            />
          </div>

          {/* ===============================
             UPLOADS
             =============================== */}
          <div className="space-y-4 pt-4 border-t">

            <div>
              <label className="text-sm font-semibold">
                Background Image
              </label>
              <input
                type="file"
                disabled={uploading}
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadImage(
                    e.target.files[0],
                    "background",
                    template.id
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                School Logo
              </label>
              <input
                type="file"
                disabled={uploading}
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadImage(
                    e.target.files[0],
                    "logo",
                    template.id
                  )
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Signature
              </label>
              <input
                type="file"
                disabled={uploading}
                onChange={(e) =>
                  e.target.files?.[0] &&
                  uploadImage(
                    e.target.files[0],
                    "signature",
                    template.id
                  )
                }
              />
            </div>
          </div>

          {/* ===============================
             PUBLISH SWITCH
             =============================== */}
          <button
            onClick={() =>
              updateTemplate(
                template.id,
                "is_published",
                !template.is_published
              )
            }
            className={`w-full py-3 rounded-xl font-semibold transition
              ${
                template.is_published
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
          >
            {template.is_published ? "Published" : "Not Published"}
          </button>
        </div>

        {/* ======================================================
           RIGHT — LIVE PREVIEW (AUTO UPDATES)
           ====================================================== */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <CertificatePreview
            template={template}
            studentName="Sample Student"
            booksRead={12}
            date={new Date().toLocaleDateString()}
          />
        </div>
      </div>
    </div>
  );
};

export default CertificateManager;
