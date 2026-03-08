import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
 import { Save, Eye, EyeOff, GripVertical, Sparkles, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

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
  hero: { label: 'Hero Banner', description: 'Main welcome message and title', icon: '🎯' },
  goals: { label: 'Goals Section', description: 'Learning objectives and goals', icon: '🎯' },
  categories: { label: 'Categories', description: '30 reading categories section', icon: '📚' },
  ib_connections: { label: 'IB Connections', description: 'TOK, ATL, Learner Profile links', icon: '🌐' },
  outcomes: { label: 'Outcomes', description: 'Expected learning outcomes', icon: '📊' },
  points: { label: 'Points System', description: 'How points are earned (3 pts/book)', icon: '🏅' },
  footer: { label: 'Footer', description: 'Bottom quote and credits', icon: '📌' },
  announcement: { label: 'Announcement Banner', description: 'Special announcements', icon: '📢' },
  featured_challenge: { label: 'Featured Challenge', description: 'Highlight current challenge', icon: '🏆' },
  motivation: { label: 'Motivational Quote', description: 'Inspiring quote section', icon: '✨' },
  tip_of_day: { label: 'Tip of the Day', description: 'Daily reading tips', icon: '💡' },
  session_countdown: { label: 'Session Countdown', description: 'Countdown timer — set end date in Content field (YYYY-MM-DD)', icon: '⏱️' },
};

const HomepageEditor = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
   const [showAddSection, setShowAddSection] = useState(false);
   const [newSectionKey, setNewSectionKey] = useState('');
   const [newSectionTitle, setNewSectionTitle] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
     setLoading(true);
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

   const addSection = async () => {
     if (!newSectionKey || !newSectionTitle) {
       toast({ title: 'Please fill in both fields', variant: 'destructive' });
       return;
     }
     
     const maxOrder = Math.max(...sections.map(s => s.display_order), 0);
     
     const { error } = await supabase
       .from('homepage_content')
       .insert({
         section_key: newSectionKey.toLowerCase().replace(/\s+/g, '_'),
         title: newSectionTitle,
         content: '',
         display_order: maxOrder + 1,
         is_visible: true,
       });
     
     if (error) {
       toast({ title: 'Failed to add section', description: error.message, variant: 'destructive' });
     } else {
       toast({ title: 'Section added!' });
       setShowAddSection(false);
       setNewSectionKey('');
       setNewSectionTitle('');
       fetchSections();
     }
   };
 
   const deleteSection = async (id: string) => {
     if (!confirm('Are you sure you want to delete this section?')) return;
     
     const { error } = await supabase
       .from('homepage_content')
       .delete()
       .eq('id', id);
     
     if (error) {
       toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
     } else {
       toast({ title: 'Section deleted' });
       fetchSections();
     }
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
           <p className="text-muted-foreground">Edit all sections displayed on the public homepage</p>
        </div>
         <div className="ml-auto flex gap-2">
           <Button variant="outline" size="sm" onClick={fetchSections}>
             <RefreshCw className="h-4 w-4 mr-2" />
             Refresh
           </Button>
           <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
             <DialogTrigger asChild>
               <Button size="sm">
                 <Plus className="h-4 w-4 mr-2" />
                 Add Section
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Add New Section</DialogTitle>
               </DialogHeader>
               <div className="space-y-4">
                 <div>
                   <Label>Section Key (unique identifier)</Label>
                   <Input
                     value={newSectionKey}
                     onChange={(e) => setNewSectionKey(e.target.value)}
                     placeholder="e.g. announcement, featured_book"
                   />
                 </div>
                 <div>
                   <Label>Section Title</Label>
                   <Input
                     value={newSectionTitle}
                     onChange={(e) => setNewSectionTitle(e.target.value)}
                     placeholder="e.g. Special Announcement"
                   />
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={addSection}>Add Section</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
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
                {section.section_key === 'session_countdown' ? (
                  <>
                    <div>
                      <Label htmlFor={`title-${section.id}`}>Countdown Title</Label>
                      <Input
                        id={`title-${section.id}`}
                        value={section.title || ''}
                        onChange={(e) => handleInputChange(section.id, 'title', e.target.value)}
                        placeholder="e.g. 45-Book Challenge Countdown"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`content-${section.id}`}>End Date (YYYY-MM-DD)</Label>
                      <Input
                        id={`content-${section.id}`}
                        value={section.content || ''}
                        onChange={(e) => handleInputChange(section.id, 'content', e.target.value)}
                        placeholder="2025-06-30"
                        className="mt-1 font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">The countdown will tick down to this date</p>
                    </div>
                    <div>
                      <Label htmlFor={`start-date-${section.id}`}>Start Date (YYYY-MM-DD)</Label>
                      <Input
                        id={`start-date-${section.id}`}
                        value={(() => { try { return JSON.parse(section.image_url || '{}').startDate || ''; } catch { return ''; } })()}
                        onChange={(e) => {
                          const extra = (() => { try { return JSON.parse(section.image_url || '{}'); } catch { return {}; } })();
                          handleInputChange(section.id, 'image_url', JSON.stringify({ ...extra, startDate: e.target.value }));
                        }}
                        placeholder="2024-09-01"
                        className="mt-1 font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Used to calculate the progress bar percentage</p>
                    </div>
                    <div>
                      <Label htmlFor={`session-name-${section.id}`}>Session Name (badge label)</Label>
                      <Input
                        id={`session-name-${section.id}`}
                        value={(() => { try { return JSON.parse(section.image_url || '{}').sessionName || ''; } catch { return ''; } })()}
                        onChange={(e) => {
                          const extra = (() => { try { return JSON.parse(section.image_url || '{}'); } catch { return {}; } })();
                          handleInputChange(section.id, 'image_url', JSON.stringify({ ...extra, sessionName: e.target.value }));
                        }}
                        placeholder="e.g. 2025/2026 Reading Session"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`session-desc-${section.id}`}>Session Description</Label>
                      <Textarea
                        id={`session-desc-${section.id}`}
                        value={(() => { try { return JSON.parse(section.image_url || '{}').description || ''; } catch { return ''; } })()}
                        onChange={(e) => {
                          const extra = (() => { try { return JSON.parse(section.image_url || '{}'); } catch { return {}; } })();
                          handleInputChange(section.id, 'image_url', JSON.stringify({ ...extra, description: e.target.value }));
                        }}
                        placeholder="e.g. Read 45 books across 30 categories before the deadline!"
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}

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
