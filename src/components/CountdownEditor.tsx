import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Timer, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import DashboardCountdown from '@/components/DashboardCountdown';

const CountdownEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from('homepage_content')
      .select('*')
      .eq('section_key', 'session_countdown')
      .maybeSingle();

    if (data) {
      setRowId(data.id);
      setTitle(data.title || '');
      setEndDate(data.content || '');
      setIsVisible(data.is_visible ?? false);
      try {
        const extra = JSON.parse(data.image_url || '{}');
        setStartDate(extra.startDate || '');
        setSessionName(extra.sessionName || '');
        setDescription(extra.description || '');
      } catch {}
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const imageUrl = JSON.stringify({ startDate, sessionName, description });
    const payload = {
      title,
      content: endDate,
      image_url: imageUrl,
      is_visible: isVisible,
      section_key: 'session_countdown',
    };

    let error;
    if (rowId) {
      ({ error } = await supabase.from('homepage_content').update(payload).eq('id', rowId));
    } else {
      ({ error } = await supabase.from('homepage_content').insert(payload));
    }

    if (error) toast.error('Failed to save: ' + error.message);
    else {
      toast.success('Countdown settings saved!');
      fetchData();
    }
    setSaving(false);
  };

  const toggleVisibility = async () => {
    const newVal = !isVisible;
    setIsVisible(newVal);
    if (rowId) {
      await supabase.from('homepage_content').update({ is_visible: newVal }).eq('id', rowId);
      toast.success(newVal ? 'Countdown visible' : 'Countdown hidden');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Timer className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Session Countdown Manager</h2>
          <p className="text-muted-foreground">Configure the countdown timer shown on all dashboards and the homepage</p>
        </div>
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCountdown />
          {!isVisible && (
            <p className="text-center text-sm text-muted-foreground mt-2">⚠️ Countdown is currently hidden from users</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Countdown Settings</CardTitle>
            <div className="flex items-center gap-2">
              {isVisible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              <Switch checked={isVisible} onCheckedChange={toggleVisibility} />
              <Label className="text-sm">{isVisible ? 'Visible' : 'Hidden'}</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Countdown Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 45-Book Challenge Countdown" className="mt-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date (YYYY-MM-DD)</Label>
              <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="2024-09-01" className="mt-1 font-mono" />
              <p className="text-xs text-muted-foreground mt-1">Used for the progress bar calculation</p>
            </div>
            <div>
              <Label>End Date (YYYY-MM-DD)</Label>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="2025-06-30" className="mt-1 font-mono" />
              <p className="text-xs text-muted-foreground mt-1">The countdown ticks down to this date</p>
            </div>
          </div>
          <div>
            <Label>Session Name (badge label)</Label>
            <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="e.g. 2025/2026 Reading Session" className="mt-1" />
          </div>
          <div>
            <Label>Session Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Read 45 books across 30 categories before the deadline!" rows={2} className="mt-1" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Countdown Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CountdownEditor;
