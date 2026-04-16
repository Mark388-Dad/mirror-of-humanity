import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Megaphone } from 'lucide-react';

type AudienceType = 'all' | 'house' | 'year_group' | 'class' | 'role' | 'individual';

const HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'];
const YEARS = ['MYP5', 'DP1', 'DP2', 'G10', 'G11', 'G12'];
const ROLES = ['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff'];

export const LibrarianBroadcast = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [audienceValue, setAudienceValue] = useState('');

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }
    if (audienceType !== 'all' && !audienceValue) {
      toast({ title: 'Pick an audience', description: 'Select a value for the chosen audience', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('librarian-broadcast', {
        body: {
          subject, message, imageUrl: imageUrl || undefined,
          linkUrl: linkUrl || undefined, linkLabel: linkLabel || undefined,
          audience: { type: audienceType, value: audienceValue || undefined },
        },
      });
      if (error) throw error;
      toast({
        title: '📨 Broadcast sent',
        description: `Delivered to ${data.sent}/${data.total} recipients${data.failed ? ` (${data.failed} failed)` : ''}`,
      });
      setSubject(''); setMessage(''); setImageUrl(''); setLinkUrl(''); setLinkLabel('');
    } catch (e: any) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const renderAudienceValue = () => {
    if (audienceType === 'all') return null;
    if (audienceType === 'house') return (
      <Select value={audienceValue} onValueChange={setAudienceValue}>
        <SelectTrigger><SelectValue placeholder="Pick a house" /></SelectTrigger>
        <SelectContent>{HOUSES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
      </Select>
    );
    if (audienceType === 'year_group') return (
      <Select value={audienceValue} onValueChange={setAudienceValue}>
        <SelectTrigger><SelectValue placeholder="Pick a year" /></SelectTrigger>
        <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
      </Select>
    );
    if (audienceType === 'role') return (
      <Select value={audienceValue} onValueChange={setAudienceValue}>
        <SelectTrigger><SelectValue placeholder="Pick a role" /></SelectTrigger>
        <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
      </Select>
    );
    return (
      <Input
        placeholder={audienceType === 'class' ? 'e.g. 10A' : audienceType === 'individual' ? 'User ID (UUID)' : ''}
        value={audienceValue}
        onChange={(e) => setAudienceValue(e.target.value)}
      />
    );
  };

  return (
    <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Broadcast Email
        </CardTitle>
        <p className="text-sm text-muted-foreground">Send announcements to students, classes, houses, year groups, or the whole school.</p>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={audienceType} onValueChange={(v) => { setAudienceType(v as AudienceType); setAudienceValue(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌍 Entire school</SelectItem>
                <SelectItem value="house">🏛️ Specific house</SelectItem>
                <SelectItem value="year_group">🎓 Specific year</SelectItem>
                <SelectItem value="class">📚 Specific class</SelectItem>
                <SelectItem value="role">👤 By role</SelectItem>
                <SelectItem value="individual">✉️ Individual user</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target</Label>
            {audienceType === 'all' ? <Input disabled value="Everyone" /> : renderAudienceValue()}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Subject *</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="📢 Important announcement..." maxLength={200} />
        </div>

        <div className="space-y-2">
          <Label>Message *</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message here..." rows={6} maxLength={5000} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Link URL (optional)</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {linkUrl && (
          <div className="space-y-2">
            <Label>Button Label</Label>
            <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Open Link" />
          </div>
        )}

        <Button onClick={handleSend} disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          {loading ? 'Sending...' : 'Send Broadcast'}
        </Button>

        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          ⚠️ Using Resend test mode (<code>onboarding@resend.dev</code>). Emails will only deliver to verified addresses until you connect a custom domain in Resend. In-app notifications work for everyone.
        </p>
      </CardContent>
    </Card>
  );
};
