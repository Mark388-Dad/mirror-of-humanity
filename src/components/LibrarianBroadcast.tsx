import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, Megaphone, Upload, X, Image as ImageIcon, Paperclip, FileText } from 'lucide-react';

type AudienceType = 'all' | 'house' | 'year_group' | 'class' | 'role' | 'emails';

const HOUSES = ['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon'];
const YEARS = ['MYP5', 'DP1', 'DP2', 'G10', 'G11', 'G12'];
const ROLES = ['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff'];

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

const formatSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

export const LibrarianBroadcast = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [audienceValue, setAudienceValue] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  const [heroImage, setHeroImage] = useState<UploadedFile | null>(null);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [dragOver, setDragOver] = useState<'hero' | 'attach' | null>(null);

  const uploadToBucket = async (file: File): Promise<UploadedFile> => {
    const ext = file.name.split('.').pop();
    const path = `broadcasts/${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('librarian-files').upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('librarian-files').getPublicUrl(path);
    return { name: file.name, url: publicUrl, size: file.size, type: file.type };
  };

  const handleHeroUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Image only', description: 'Hero must be an image file', variant: 'destructive' });
      return;
    }
    setUploadingHero(true);
    try {
      const uploaded = await uploadToBucket(file);
      setHeroImage(uploaded);
      toast({ title: 'Image uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploadingHero(false); }
  };

  const handleAttachUpload = async (files: FileList | File[]) => {
    setUploadingAttach(true);
    try {
      const arr = Array.from(files);
      const results = await Promise.all(arr.map(uploadToBucket));
      setAttachments(prev => [...prev, ...results]);
      toast({ title: `${results.length} file(s) attached` });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally { setUploadingAttach(false); }
  };

  const addEmails = (raw: string) => {
    const parsed = raw.split(/[\s,;]+/).map(s => s.trim()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
    if (parsed.length) setEmailList(prev => Array.from(new Set([...prev, ...parsed])));
    setEmailInput('');
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }
    if (audienceType === 'emails' && emailList.length === 0) {
      toast({ title: 'No recipients', description: 'Add at least one email', variant: 'destructive' });
      return;
    }
    if (!['all', 'emails'].includes(audienceType) && !audienceValue) {
      toast({ title: 'Pick an audience', description: 'Select a target', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('librarian-broadcast', {
        body: {
          subject, message,
          imageUrl: heroImage?.url,
          linkUrl: linkUrl || undefined,
          linkLabel: linkLabel || undefined,
          attachments: attachments.map(a => ({ name: a.name, url: a.url })),
          audience: audienceType === 'emails'
            ? { type: 'emails', emails: emailList }
            : { type: audienceType, value: audienceValue || undefined },
        },
      });
      if (error) throw error;
      toast({
        title: '📨 Broadcast sent',
        description: `Delivered to ${data.sent}/${data.total}${data.failed ? ` (${data.failed} failed)` : ''}`,
      });
      setSubject(''); setMessage(''); setLinkUrl(''); setLinkLabel('');
      setHeroImage(null); setAttachments([]); setEmailList([]);
    } catch (e: any) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const onDrop = useCallback((e: React.DragEvent, kind: 'hero' | 'attach') => {
    e.preventDefault();
    setDragOver(null);
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    if (kind === 'hero') handleHeroUpload(files[0]);
    else handleAttachUpload(files);
  }, []);

  const renderAudienceValue = () => {
    if (audienceType === 'all' || audienceType === 'emails') return null;
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
    return <Input placeholder="e.g. 10A" value={audienceValue} onChange={(e) => setAudienceValue(e.target.value)} />;
  };

  return (
    <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Broadcast Email
        </CardTitle>
        <p className="text-sm text-muted-foreground">Send announcements with images, files, and links to any group.</p>
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
                <SelectItem value="emails">✉️ By email address(es)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target</Label>
            {audienceType === 'all' ? <Input disabled value="Everyone in the school" /> :
             audienceType === 'emails' ? <Input disabled value={`${emailList.length} email(s) added below`} /> :
             renderAudienceValue()}
          </div>
        </div>

        {audienceType === 'emails' && (
          <div className="space-y-2 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-muted/30">
            <Label>Recipient Emails</Label>
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmails(emailInput); } }}
                onBlur={() => emailInput && addEmails(emailInput)}
                placeholder="Type or paste emails — comma, space, or Enter to add"
              />
              <Button type="button" variant="outline" onClick={() => addEmails(emailInput)}>Add</Button>
            </div>
            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {emailList.map(em => (
                  <Badge key={em} variant="secondary" className="gap-1 py-1">
                    {em}
                    <button onClick={() => setEmailList(prev => prev.filter(e => e !== em))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Subject *</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="📢 Important announcement..." maxLength={200} />
        </div>

        <div className="space-y-2">
          <Label>Message *</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message here..." rows={6} maxLength={5000} />
        </div>

        {/* Hero image dropzone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Hero Image (optional)</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver('hero'); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(e, 'hero')}
            onClick={() => document.getElementById('hero-input')?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver === 'hero' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <input id="hero-input" type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleHeroUpload(e.target.files[0])} />
            {uploadingHero ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
             heroImage ? (
              <div className="flex items-center justify-between gap-3">
                <img src={heroImage.url} alt="" className="h-16 w-16 object-cover rounded" />
                <span className="text-sm flex-1 text-left truncate">{heroImage.name}</span>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setHeroImage(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
             ) : (
              <>
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">Drag & drop or click to upload an image</p>
              </>
             )}
          </div>
        </div>

        {/* Attachments dropzone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Attachments (optional)</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver('attach'); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(e, 'attach')}
            onClick={() => document.getElementById('attach-input')?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver === 'attach' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
            }`}
          >
            <input id="attach-input" type="file" multiple className="hidden"
              onChange={(e) => e.target.files && handleAttachUpload(e.target.files)} />
            {uploadingAttach ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
              <>
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">Drag & drop files or click to attach</p>
                <p className="text-xs text-muted-foreground mt-1">PDFs, docs, anything — links included in email</p>
              </>
            )}
          </div>
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-sm truncate">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{formatSize(a.size)}</span>
                  <Button size="sm" variant="ghost" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Call-to-Action Link (optional)</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
          {linkUrl && (
            <div className="space-y-2">
              <Label>Button Label</Label>
              <Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Open Link" />
            </div>
          )}
        </div>

        <Button onClick={handleSend} disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          {loading ? 'Sending...' : 'Send Broadcast'}
        </Button>

        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          ⚠️ Using Resend test mode (<code>onboarding@resend.dev</code>). Until you verify a custom domain in Resend, only your own verified address receives email — but in-app notifications work for everyone.
        </p>
      </CardContent>
    </Card>
  );
};
