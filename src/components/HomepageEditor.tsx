import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Save, Eye, EyeOff, GripVertical, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_visible: boolean;
  display_order: number;
}

// Friendly labels for known sections; unknown sections fallback gracefully
const sectionLabels: Record<string, { label: string; description: string; icon: string }> = {
  hero: { label: 'Hero Banner', description: 'Main welcome message', icon: '🎯' },
  announcement: { label: 'Announcement', description: 'Featured news or updates', icon: '📢' },
  tip_of_day: { label: 'Reading Tip', description: 'Daily reading tip', icon: '💡' },
  featured_challenge: { label: 'Featured Challenge', description: 'Highlight a challenge', icon: '🏆' },
  motivation: { label: 'Motivation', description: 'Inspirational message', icon: '✨' },

  HeroSection: { label: 'Hero Section', description: 'Top banner section', icon: '🎯' },
  Footer: { label: 'Footer', description: 'Bottom of page', icon: '📌' },
  GoalsSection: { label: 'Goals', description: 'Student goals', icon: '🎯' },
  IBConnectionsSection: { label: 'IB Connections', description: 'IB links & updates', icon: '🌐' },
  OutcomesSection: { label: 'Outcomes', description: 'Learning outcomes', icon: '📊' },
  PointsSection: { label: 'Points', description: 'Student points display', icon: '🏅' },
  NavLink: { label: 'Nav Link', description: 'Navigation links', icon: '🔗' },
  Navbar: { label: 'Navbar', description: 'Top navigation bar', icon: '🧭' },
};

const HomepageEditor = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('homepage_content')
      .select('*')
      .order('display_order');

    if (error) {
      toast({ title: 'Error loading sections', description: error.message, variant: 'destructive' });
    } else {
      setSections(data || []);
    }
    setLoading(false);
  };

  const updateSection = async (id: string, updates: Partial<HomepageSection>) => {
    setSaving(id);
    const { error } = await supabase
      .from('homepage_content')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast({ title: 'Saved!', description: 'Changes published to homepage' });
    }
    setSaving(null);
  };

  const handleInputChange = (id: string, field: keyof HomepageSection, value: string | boolean) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-6 w-6 text-gold" />
        <div>
          <h2 className="text-2xl font-bold">Homepage Editor</h2>
          <p className="text-muted-foreground">Edit all sections on the student homepage</p>
        </div>
      </div>

      {sections.map((section, index) => {
        const config = sectionLabels[section.section_key] || {
          label: section.section_key,
          description: 'Custom section',
          icon: '📄'
        };

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`border-2 transition-all ${section.is_visible ? 'border-green-500/30 bg-green-500/5' : 'border-muted opacity-60'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {section.is_visible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        checked={section.is_visible}
                        onCheckedChange={(checked) => updateSection(section.id, { is_visible: checked })}
                      />
                      <Label className="text-sm">{section.is_visible ? 'Visible' : 'Hidden'}</Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`title-${section.id}`}>Title</Label>
                  <Input
                    id={`title-${section.id}`}
                    value={section.title || ''}
                    onChange={(e) => handleInputChange(section.id, 'title', e.target.value)}
                    placeholder="Section title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`content-${section.id}`}>Content</Label>
                  <Textarea
                    id={`content-${section.id}`}
                    value={section.content || ''}
                    onChange={(e) => handleInputChange(section.id, 'content', e.target.value)}
                    placeholder="Section content..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`image-${section.id}`}>Image URL (optional)</Label>
                  <Input
                    id={`image-${section.id}`}
                    value={section.image_url || ''}
                    onChange={(e) => handleInputChange(section.id, 'image_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => updateSection(section.id, {
                    title: section.title,
                    content: section.content,
                    image_url: section.image_url,
                  })}
                  disabled={saving === section.id}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving === section.id ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default HomepageEditor;
