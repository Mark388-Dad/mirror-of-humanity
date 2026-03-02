import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CertificatePreview from "./CertificatePreview";

const LEVELS = [
  { id: "beginner", label: "Beginner Level" },
  { id: "bronze", label: "Bronze Achievement Level" },
  { id: "silver", label: "Silver Achievement Level" },
  { id: "gold", label: "Gold Achievement Level" },
];

interface CertificateTemplate {
  id: string;
  level: string;
  title: string;
  subtitle: string;
  body_text: string;
  background_image_url: string | null;
  school_logo_url: string | null;
  template_preset: string;
  is_published: boolean;
  signature_url?: string | null;
}

const CertificateManager = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [activeLevel, setActiveLevel] = useState("beginner");
  const [uploading, setUploading] = useState(false);

  const loadTemplates = async () => {
    const { data } = await supabase.from("certificate_templates").select("*").order("level");
    if (data) {
      setTemplates(data.map(d => ({ ...d, signature_url: (d as any).signature_url ?? null })) as CertificateTemplate[]);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const updateTemplate = async (id: string, field: string, value: string | boolean) => {
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, [field]: value } : t)));
    await supabase.from("certificate_templates").update({ [field]: value }).eq("id", id);
  };

  const uploadImage = async (file: File, type: "background" | "logo" | "signature", templateId: string) => {
    setUploading(true);
    const filePath = `certificates/${templateId}-${Date.now()}`;
    const { error } = await supabase.storage.from("certificates").upload(filePath, file);
    if (error) { setUploading(false); return; }
    const { data } = supabase.storage.from("certificates").getPublicUrl(filePath);
    let field = "background_image_url";
    if (type === "logo") field = "school_logo_url";
    if (type === "signature") field = "signature_url";
    await updateTemplate(templateId, field, data.publicUrl);
    setUploading(false);
  };

  const template = templates.find(t => t.level === activeLevel) || null;

  if (!template) return <div className="p-10 text-center text-muted-foreground">Loading templates...</div>;

  const previewTemplate = {
    level: template.level as 'beginner' | 'bronze' | 'silver' | 'gold',
    title: template.title,
    subtitle: template.subtitle,
    body_text: template.body_text,
    signature_url: template.signature_url ?? null,
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex gap-3 flex-wrap">
        {LEVELS.map(lvl => (
          <button key={lvl.id} onClick={() => setActiveLevel(lvl.id)}
            className={`px-6 py-3 rounded-xl font-semibold transition ${activeLevel === lvl.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary border"}`}>
            {lvl.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-card rounded-2xl shadow-lg p-8 space-y-6">
          <h2 className="text-xl font-bold">Certificate Editor</h2>
          <div>
            <label className="text-sm font-semibold">Title</label>
            <input value={template.title} onChange={e => updateTemplate(template.id, "title", e.target.value)} className="w-full border rounded-lg p-3 mt-1 bg-background" />
          </div>
          <div>
            <label className="text-sm font-semibold">Subtitle</label>
            <input value={template.subtitle} onChange={e => updateTemplate(template.id, "subtitle", e.target.value)} className="w-full border rounded-lg p-3 mt-1 bg-background" />
          </div>
          <div>
            <label className="text-sm font-semibold">Body Text</label>
            <textarea value={template.body_text} onChange={e => updateTemplate(template.id, "body_text", e.target.value)} className="w-full border rounded-lg p-3 mt-1 h-28 bg-background" />
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div><label className="text-sm font-semibold">Background Image</label>
              <input type="file" disabled={uploading} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "background", template.id)} /></div>
            <div><label className="text-sm font-semibold">School Logo</label>
              <input type="file" disabled={uploading} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "logo", template.id)} /></div>
            <div><label className="text-sm font-semibold">Signature</label>
              <input type="file" disabled={uploading} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], "signature", template.id)} /></div>
          </div>
          <button onClick={() => updateTemplate(template.id, "is_published", !template.is_published)}
            className={`w-full py-3 rounded-xl font-semibold transition ${template.is_published ? "bg-green-600 text-white" : "bg-secondary"}`}>
            {template.is_published ? "Published ✅" : "Not Published"}
          </button>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-6 overflow-auto">
          <CertificatePreview template={previewTemplate} studentName="Sample Student" />
        </div>
      </div>
    </div>
  );
};

export default CertificateManager;
