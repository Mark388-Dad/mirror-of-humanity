import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Layout, GripVertical, Eye, EyeOff } from 'lucide-react';
import { LayoutConfig } from '@/contexts/ChallengeContext';

interface ChallengeLayoutEditorProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
}

const AVAILABLE_SECTIONS = [
  { id: 'hero', label: 'Hero Banner', emoji: '🎯' },
  { id: 'leaderboard', label: 'Leaderboard', emoji: '🏆' },
  { id: 'submissions', label: 'Submissions Feed', emoji: '📚' },
  { id: 'progress', label: 'Progress Tracker', emoji: '📊' },
  { id: 'gallery', label: 'Book Gallery', emoji: '🖼️' },
  { id: 'streak', label: 'Reading Streak', emoji: '🔥' },
  { id: 'recommendations', label: 'Book Recommendations', emoji: '💡' },
  { id: 'countdown', label: 'Countdown Timer', emoji: '⏳' },
];

const ChallengeLayoutEditor = ({ config, onChange }: ChallengeLayoutEditorProps) => {
  const toggleSection = (sectionId: string) => {
    const sections = config.sections.includes(sectionId)
      ? config.sections.filter(s => s !== sectionId)
      : [...config.sections, sectionId];
    onChange({ ...config, sections });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...config.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    onChange({ ...config, sections });
  };

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" /> Layout Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Hero Style */}
        <div>
          <Label className="text-sm font-semibold">Hero Banner Style</Label>
          <Select value={config.hero_style} onValueChange={(v: any) => onChange({ ...config, hero_style: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Screen Hero</SelectItem>
              <SelectItem value="compact">Compact Banner</SelectItem>
              <SelectItem value="minimal">Minimal Header</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Features</Label>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <Label className="text-sm">Show XP Progress Bar</Label>
            <Switch checked={config.show_xp} onCheckedChange={v => onChange({ ...config, show_xp: v })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <Label className="text-sm">Show Reading Streak</Label>
            <Switch checked={config.show_streak} onCheckedChange={v => onChange({ ...config, show_streak: v })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <Label className="text-sm">Show Book Recommendations</Label>
            <Switch checked={config.show_recommendations} onCheckedChange={v => onChange({ ...config, show_recommendations: v })} />
          </div>
        </div>

        {/* Section Manager */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Visible Sections (drag to reorder)</Label>
          <div className="space-y-2">
            {/* Active sections in order */}
            {config.sections.map((sectionId, index) => {
              const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
              if (!section) return null;
              return (
                <div key={sectionId} className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-primary/10">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSection(index, 'up')} disabled={index === 0}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                    <button onClick={() => moveSection(index, 'down')} disabled={index === config.sections.length - 1}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                  </div>
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg">{section.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{section.label}</span>
                  <Badge variant="outline" className="text-xs text-green-600">Visible</Badge>
                  <button onClick={() => toggleSection(sectionId)} className="text-muted-foreground hover:text-destructive">
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Hidden sections */}
            {AVAILABLE_SECTIONS.filter(s => !config.sections.includes(s.id)).map(section => (
              <div key={section.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/20 opacity-60">
                <div className="w-6" />
                <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                <span className="text-lg">{section.emoji}</span>
                <span className="flex-1 text-sm">{section.label}</span>
                <Badge variant="outline" className="text-xs text-muted-foreground">Hidden</Badge>
                <button onClick={() => toggleSection(section.id)} className="text-muted-foreground hover:text-primary">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeLayoutEditor;
