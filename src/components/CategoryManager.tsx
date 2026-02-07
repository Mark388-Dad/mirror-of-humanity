import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Loader2, Tag, Trash2, Edit, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomCategory {
  id: number;
  name: string;
  prompt: string;
  is_active: boolean;
  created_at: string;
}

const CategoryManager = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .order('id', { ascending: true });
    if (!error && data) setCategories(data as CustomCategory[]);
    setLoading(false);
  };

  const createCategory = async () => {
    if (!newName.trim()) { toast.error('Category name is required'); return; }
    if (!user) return;
    setCreating(true);

    const { error } = await supabase.from('custom_categories').insert({
      name: newName.trim(),
      prompt: newPrompt.trim(),
      created_by: user.id,
    });

    if (error) {
      toast.error('Failed to create category');
    } else {
      toast.success('Category created!');
      setNewName('');
      setNewPrompt('');
      fetchCategories();
    }
    setCreating(false);
  };

  const updateCategory = async (id: number) => {
    const { error } = await supabase
      .from('custom_categories')
      .update({ name: editName.trim(), prompt: editPrompt.trim() })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Category updated');
      setEditingId(null);
      fetchCategories();
    }
  };

  const toggleActive = async (id: number, currentlyActive: boolean) => {
    const { error } = await supabase
      .from('custom_categories')
      .update({ is_active: !currentlyActive })
      .eq('id', id);
    if (!error) fetchCategories();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete this custom category?')) return;
    const { error } = await supabase.from('custom_categories').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Category deleted');
      fetchCategories();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Tag className="h-6 w-6 text-gold" />
        <div>
          <h2 className="text-2xl font-bold">Custom Categories</h2>
          <p className="text-muted-foreground">Add categories beyond the default 30. They appear in submissions and progress tracking.</p>
        </div>
      </div>

      {/* Create New */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Category Name *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., A Book About Climate Change" />
          </div>
          <div>
            <Label>Reflection Prompt</Label>
            <Textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="What should students reflect on?" rows={2} />
          </div>
          <Button onClick={createCategory} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Category
          </Button>
        </CardContent>
      </Card>

      {/* Existing Categories */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No custom categories created yet.</p>
        ) : (
          categories.map((cat, index) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className={!cat.is_active ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  {editingId === cat.id ? (
                    <div className="space-y-3">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} />
                      <Textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateCategory(cat.id)}><Save className="h-4 w-4 mr-1" />Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">#{cat.id}</Badge>
                          <span className="font-semibold">{cat.name}</span>
                          {!cat.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        {cat.prompt && <p className="text-sm text-muted-foreground">{cat.prompt}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat.id, cat.is_active)} />
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditPrompt(cat.prompt); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCategory(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
