import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Palette, Image, Type, Eye } from 'lucide-react';

interface ThemeValues {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  cover_image_url: string;
  logo_url: string;
  welcome_message: string;
  custom_css: string;
}

interface ChallengeThemeEditorProps {
  values: ThemeValues;
  onChange: (values: Partial<ThemeValues>) => void;
}

const COLOR_PRESETS = [
  { name: 'Forest', primary: '152 69% 31%', secondary: '40 30% 94%', accent: '220 70% 50%' },
  { name: 'Ocean', primary: '210 80% 45%', secondary: '200 30% 94%', accent: '180 70% 40%' },
  { name: 'Sunset', primary: '20 90% 50%', secondary: '40 40% 94%', accent: '350 80% 55%' },
  { name: 'Royal', primary: '260 70% 50%', secondary: '250 30% 94%', accent: '280 80% 55%' },
  { name: 'Ruby', primary: '0 75% 50%', secondary: '0 20% 94%', accent: '340 80% 55%' },
  { name: 'Midnight', primary: '220 75% 25%', secondary: '220 20% 90%', accent: '45 100% 50%' },
];

const ChallengeThemeEditor = ({ values, onChange }: ChallengeThemeEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const hslToHex = (hsl: string) => {
    if (!hsl) return '#000000';
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    const sNorm = (s || 0) / 100;
    const lNorm = (l || 0) / 100;
    const a = sNorm * Math.min(lNorm, 1 - lNorm);
    const f = (n: number) => {
      const k = (n + (h || 0) / 30) % 12;
      const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" /> Theme & Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Color Presets */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Quick Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_PRESETS.map(preset => (
              <Button key={preset.name} variant="outline" size="sm"
                className="justify-start gap-2"
                onClick={() => onChange({
                  primary_color: preset.primary,
                  secondary_color: preset.secondary,
                  accent_color: preset.accent,
                })}>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${preset.primary})` }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${preset.accent})` }} />
                </div>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold">Primary Color</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={hslToHex(values.primary_color || '')}
                onChange={e => {
                  onChange({ primary_color: values.primary_color });
                }}
                className="w-10 h-10 rounded cursor-pointer border" />
              <Input value={values.primary_color || ''} onChange={e => onChange({ primary_color: e.target.value })}
                placeholder="152 69% 31%" className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">Secondary Color</Label>
            <Input value={values.secondary_color || ''} onChange={e => onChange({ secondary_color: e.target.value })}
              placeholder="40 30% 94%" className="mt-1 text-xs" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Accent Color</Label>
            <Input value={values.accent_color || ''} onChange={e => onChange({ accent_color: e.target.value })}
              placeholder="220 70% 50%" className="mt-1 text-xs" />
          </div>
        </div>

        {/* Images */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold flex items-center gap-1"><Image className="w-3 h-3" /> Cover Image URL</Label>
            <Input value={values.cover_image_url || ''} onChange={e => onChange({ cover_image_url: e.target.value })}
              placeholder="https://..." className="mt-1" />
            {values.cover_image_url && (
              <div className="mt-2 h-20 rounded-lg bg-cover bg-center border"
                style={{ backgroundImage: `url(${values.cover_image_url})` }} />
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold flex items-center gap-1"><Image className="w-3 h-3" /> Logo URL</Label>
            <Input value={values.logo_url || ''} onChange={e => onChange({ logo_url: e.target.value })}
              placeholder="https://..." className="mt-1" />
            {values.logo_url && (
              <img src={values.logo_url} alt="Logo preview" className="mt-2 h-12 object-contain" />
            )}
          </div>
        </div>

        {/* Welcome Message */}
        <div>
          <Label className="text-sm font-semibold flex items-center gap-1"><Type className="w-3 h-3" /> Welcome Message</Label>
          <Textarea value={values.welcome_message || ''} onChange={e => onChange({ welcome_message: e.target.value })}
            placeholder="Welcome to this challenge! Here's what you need to know..."
            rows={3} className="mt-1" />
        </div>

        {/* Custom CSS */}
        <div>
          <Label className="text-sm font-semibold">Custom CSS (Advanced)</Label>
          <Textarea value={values.custom_css || ''} onChange={e => onChange({ custom_css: e.target.value })}
            placeholder=".card { border-radius: 1rem; }" rows={3} className="mt-1 font-mono text-xs" />
        </div>

        {/* Live Preview */}
        {(values.primary_color || values.cover_image_url) && (
          <div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="mb-2">
              <Eye className="w-4 h-4 mr-1" /> {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            {showPreview && (
              <div className="rounded-xl border overflow-hidden">
                <div className="h-24 flex items-end p-4"
                  style={{
                    background: values.cover_image_url
                      ? `linear-gradient(to top, rgba(0,0,0,0.6), transparent), url(${values.cover_image_url}) center/cover`
                      : `linear-gradient(135deg, hsl(${values.primary_color || '152 69% 31%'}), hsl(${values.accent_color || '220 70% 50%'}))`
                  }}>
                  <span className="text-white font-bold text-lg">Challenge Title Preview</span>
                </div>
                <div className="p-4" style={{ backgroundColor: `hsl(${values.secondary_color || '40 30% 94%'})` }}>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: `hsl(${values.primary_color || '152 69% 31%'})` }}>
                      Button
                    </div>
                    <div className="px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: `hsl(${values.accent_color || '220 70% 50%'})` }}>
                      Accent
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChallengeThemeEditor;
