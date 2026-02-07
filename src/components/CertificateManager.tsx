import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Award, Save, Loader2, Eye, Crown, Medal, Target } from 'lucide-react';
import CertificatePreview from './CertificatePreview';

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

const TEMPLATE_PRESETS = [
{ value: 'standard', label: '🎓 Standard Layout' },
];

const LEVEL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
beginner: { label: 'Beginner Level', icon: <Target className="w-5 h-5" />, color: 'text-cyan-400' },
bronze: { label: 'Bronze Achievement', icon: <Medal className="w-5 h-5" />, color: 'text-amber-700' },
silver: { label: 'Silver Achievement', icon: <Award className="w-5 h-5" />, color: 'text-slate-400' },
gold: { label: 'Gold Achievement', icon: <Crown className="w-5 h-5" />, color: 'text-yellow-500' },
};

const CertificateManager = () => {
const { user } = useAuth();
const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);
const [previewLevel, setPreviewLevel] = useState<string | null>(null);

useEffect(() => {
fetchTemplates();
}, []);

const fetchTemplates = async () => {
const { data } = await supabase
.from('certificate_templates')
.select('*')
.order('level');

```
if (data) setTemplates(data as CertificateTemplate[]);
setLoading(false);
```

};

const updateTemplate = async (id: string, updates: Partial<CertificateTemplate>) => {
setSaving(id);

```
const { error } = await supabase
  .from('certificate_templates')
  .update({ ...updates, updated_by: user?.id })
  .eq('id', id);

if (error) {
  toast.error('Failed to save');
} else {
  toast.success('Certificate template saved!');
  fetchTemplates();
}

setSaving(null);
```

};

const uploadImage = async (
file: File,
type: 'background' | 'logo' | 'signature',
templateId: string
) => {
setUploading(true);

```
const ext = file.name.split('.').pop();
const path = `${type}/${templateId}.${ext}`;

const { error: uploadError } = await supabase.storage
  .from('certificates')
  .upload(path, file, { upsert: true });

if (uploadError) {
  toast.error('Upload failed');
  setUploading(false);
  return;
}

const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path);

const field =
  type === 'background'
    ? 'background_image_url'
    : type === 'logo'
    ? 'school_logo_url'
    : 'signature_url';

await updateTemplate(templateId, {
  [field]: urlData.publicUrl,
});

setUploading(false);
```

};

const setField = (id: string, field: string, value: string | boolean) => {
setTemplates(prev =>
prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
);
};

if (loading) {
return ( <div className="flex justify-center py-10"> <Loader2 className="h-8 w-8 animate-spin text-primary" /> </div>
);
}

return ( <div className="space-y-6"> <div className="flex items-center gap-3 mb-4"> <Award className="h-6 w-6 text-gold" /> <div> <h2 className="text-2xl font-bold">Reading Challenge Certificate Designer</h2> <p className="text-muted-foreground">
Librarian controls certificate text, logo, signature and design for each level. </p> </div> </div>

```
  <Tabs defaultValue="beginner">
    <TabsList className="grid w-full grid-cols-4">
      {Object.entries(LEVEL_CONFIG).map(([level, config]) => (
        <TabsTrigger key={level} value={level} className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className="hidden sm:inline">{config.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>

    {templates.map(template => {
      const config = LEVEL_CONFIG[template.level];

      return (
        <TabsContent key={template.id} value={template.level}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* EDITOR PANEL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={config?.color}>{config?.icon}</span>
                  {config?.label}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label>Certificate Title</Label>
                  <Input
                    value={template.title}
                    onChange={e => setField(template.id, 'title', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={template.subtitle}
                    onChange={e => setField(template.id, 'subtitle', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Body Text (Written by Librarian)</Label>
                  <Textarea
                    value={template.body_text}
                    rows={3}
                    onChange={e => setField(template.id, 'body_text', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Template Layout</Label>
                  <Select
                    value={template.template_preset}
                    onValueChange={v => setField(template.id, 'template_preset', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_PRESETS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* IMAGE UPLOADS */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Background</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={e =>
                        e.target.files?.[0] &&
                        uploadImage(e.target.files[0], 'background', template.id)
                      }
                    />
                    {template.background_image_url && (
                      <Badge variant="outline" className="mt-1">
                        ✓ Uploaded
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>School Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={e =>
                        e.target.files?.[0] &&
                        uploadImage(e.target.files[0], 'logo', template.id)
                      }
                    />
                    {template.school_logo_url && (
                      <Badge variant="outline" className="mt-1">
                        ✓ Uploaded
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>Signature</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={e =>
                        e.target.files?.[0] &&
                        uploadImage(e.target.files[0], 'signature', template.id)
                      }
                    />
                    {template.signature_url && (
                      <Badge variant="outline" className="mt-1">
                        ✓ Uploaded
                      </Badge>
                    )}
                  </div>
                </div>

                {/* PUBLISH SWITCH */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_published}
                      onCheckedChange={v =>
                        setField(template.id, 'is_published', v)
                      }
                    />
                    <Label>Published (Students can download)</Label>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      updateTemplate(template.id, {
                        title: template.title,
                        subtitle: template.subtitle,
                        body_text: template.body_text,
                        template_preset: template.template_preset,
                        is_published: template.is_published,
                      })
                    }
                    disabled={saving === template.id}
                  >
                    {saving === template.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setPreviewLevel(template.level)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* LIVE CERTIFICATE PREVIEW */}
            <div>
              <CertificatePreview
                template={template}
                studentName="Sample Student"
                booksRead={
                  template.level === 'beginner'
                    ? 1
                    : template.level === 'bronze'
                    ? 15
                    : template.level === 'silver'
                    ? 30
                    : 45
                }
                date={new Date().toLocaleDateString()}
              />
            </div>
          </div>
        </TabsContent>
      );
    })}
  </Tabs>
</div>
```

);
};

export default CertificateManager;
