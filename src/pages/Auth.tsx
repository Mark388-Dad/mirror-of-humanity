import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { BookOpen, Loader2 } from 'lucide-react';
import { HOUSES, YEAR_GROUPS, CLASSES, USER_ROLES } from '@/lib/constants';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff']),
  yearGroup: z.enum(['MYP5', 'DP1', 'DP2', 'G10']).optional(),
  className: z.string().optional(),
  house: z.enum(['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon']).optional(),
  accessCode: z.string().optional(), // New: for student/librarian code
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as const,
    yearGroup: '' as 'MYP5' | 'DP1' | 'DP2' | 'G10' | '',
    className: '',
    house: '' as 'Kenya' | 'Longonot' | 'Kilimanjaro' | 'Elgon' | '',
    accessCode: '',
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = signUpSchema.parse({
        ...formData,
        yearGroup: formData.yearGroup || undefined,
        className: formData.className || undefined,
        house: formData.house || undefined,
        accessCode: formData.accessCode || undefined,
      });

      // Validate student/librarian access code
      if (['student', 'librarian'].includes(formData.role)) {
        if (!formData.accessCode) {
          toast.error('Access code is required for this role');
          return;
        }

        const { data: codeData } = await supabase
          .from('access_codes')
          .select('*')
          .eq('code', formData.accessCode)
          .eq('code_type', formData.role)
          .eq('is_active', true)
          .single();

        if (!codeData) {
          toast.error('Invalid or inactive access code');
          return;
        }
      }

      // Student-specific fields
      if (formData.role === 'student') {
        if (!formData.yearGroup || !formData.className || !formData.house) {
          toast.error('Students must select year group, class, and house');
          return;
        }
      }

      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([{
          user_id: authData.user.id,
          full_name: validatedData.fullName,
          email: validatedData.email,
          role: validatedData.role,
          year_group: formData.role === 'student' ? formData.yearGroup : null,
          class_name: formData.role === 'student' ? formData.className : null,
          house: formData.role === 'student' ? formData.house : null,
        }]);
        if (profileError) throw profileError;

        // Handle pending submissions
        const { data: pendingData } = await supabase
          .from('pending_submissions')
          .select('*')
          .eq('email', validatedData.email);

        if (pendingData?.length) {
          const submissions = pendingData.map(p => ({
            user_id: authData.user!.id,
            category_number: p.category_number,
            category_name: p.category_name,
            title: p.title,
            author: p.author,
            date_started: p.date_started,
            date_finished: p.date_finished,
            reflection: p.reflection,
            points_earned: 3,
          }));
          await supabase.from('book_submissions').insert(submissions);
          await supabase.from('pending_submissions')
            .update({ imported_at: new Date().toISOString(), imported_to_user_id: authData.user!.id })
            .eq('email', validatedData.email);

          toast.success(`Account created! ${pendingData.length} previous submissions imported.`);
        } else {
          toast.success('Account created successfully!');
        }

        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      else if (error.message?.includes('already registered')) toast.error('This email is already registered. Please sign in.');
      else toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signInSchema.parse({ email: formData.email, password: formData.password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;

      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      else toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-6">
      <Card className="w-full max-w-lg bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gold" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl">45-Book Reading Challenge</CardTitle>
          <CardDescription>2025/2026 • Fiction as a Mirror of Humanity</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <InputField label="Full Name" value={formData.fullName} onChange={v => setFormData({ ...formData, fullName: v })} />
                <InputField label="Email" type="email" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                <InputField label="Password" type="password" value={formData.password} onChange={v => setFormData({ ...formData, password: v })} />
                
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {['student', 'librarian'].includes(formData.role) && (
                  <InputField label="Access Code" value={formData.accessCode} onChange={v => setFormData({ ...formData, accessCode: v })} />
                )}

                {formData.role === 'student' && (
                  <>
                    <SelectField label="Year Group" value={formData.yearGroup} options={YEAR_GROUPS} onChange={v => setFormData({ ...formData, yearGroup: v, className: '' })} />
                    <SelectField label="Class" value={formData.className} options={CLASSES} onChange={v => setFormData({ ...formData, className: v })} />
                    <SelectField label="House" value={formData.house} options={HOUSES} onChange={v => setFormData({ ...formData, house: v })} />
                  </>
                )}

                <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin />} Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper components
const InputField = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={e => onChange(e.target.value)} required />
  </div>
);

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  </div>
);

export default Auth;
