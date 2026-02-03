import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  TabsContent
} from '@/components/ui';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { HOUSES, YEAR_GROUPS, CLASSES, USER_ROLES } from '@/lib/constants';
import { z } from 'zod';

// -------------------
// Validation Schemas
// -------------------
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff']),
  yearGroup: z.enum(['MYP5', 'DP1', 'DP2', 'G10']).optional(),
  className: z.string().optional(),
  house: z.enum(['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon']).optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// -------------------
// Component
// -------------------
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
    accessCode: '', // new field for role access code
  });

  const getClassOptions = () => CLASSES;

  // -------------------
  // Sign Up Handler
  // -------------------
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      const validatedData = signUpSchema.parse({
        ...formData,
        yearGroup: formData.yearGroup || undefined,
        className: formData.className || undefined,
        house: formData.house || undefined,
      });

      // Validate role-specific fields
      if (formData.role === 'student') {
        if (!formData.yearGroup || !formData.className || !formData.house) {
          toast.error('Students must select year group, class, and house');
          return;
        }
        // TODO: Validate student access code from database
        if (!formData.accessCode) {
          toast.error('Student access code is required');
          return;
        }
      }

      if (formData.role === 'librarian' && !formData.accessCode) {
        // TODO: Validate librarian access code from database
        toast.error('Librarian access code is required');
        return;
      }

      setLoading(true);

      // Supabase signup
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Save user profile
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

        toast.success('Account created successfully!');
        navigate('/dashboard');
      }

    } catch (error: any) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      else toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // Sign In Handler
  // -------------------
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-hero-gradient">
      <Card className="w-full max-w-lg bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gold" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">45-Book Reading Challenge</CardTitle>
          <CardDescription>2025/2026 • Fiction as a Mirror of Humanity</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ---------------- Sign In ---------------- */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <InputField label="Email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} type="email" placeholder="your.email@mpesafoundationacademy.ac.ke" />
                <InputField label="Password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} type="password" />
                <Button fullWidth loading={loading}>Sign In</Button>
              </form>
            </TabsContent>

            {/* ---------------- Sign Up ---------------- */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <InputField label="Full Name" value={formData.fullName} onChange={(v) => setFormData({ ...formData, fullName: v })} />
                <InputField label="Email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} type="email" />
                <InputField label="Password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} type="password" />

                {/* Role */}
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map(role => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Student-specific Fields */}
                {(formData.role === 'student' || formData.role === 'librarian') && (
                  <>
                    {formData.role === 'student' && (
                      <>
                        <SelectField label="Year Group" value={formData.yearGroup} options={YEAR_GROUPS} onChange={(v) => setFormData({ ...formData, yearGroup: v, className: '' })} />
                        <SelectField label="Class" value={formData.className} options={getClassOptions()} onChange={(v) => setFormData({ ...formData, className: v })} />
                        <SelectField label="House" value={formData.house} options={HOUSES} onChange={(v) => setFormData({ ...formData, house: v })} />
                      </>
                    )}
                    <InputField label={`${formData.role === 'student' ? 'Student' : 'Librarian'} Access Code`} value={formData.accessCode} onChange={(v) => setFormData({ ...formData, accessCode: v })} />
                  </>
                )}

                <Button fullWidth loading={loading}>Create Account</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

// -------------------
// Helper Components
// -------------------
interface InputProps { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; }
const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: InputProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required />
  </div>
);

interface SelectFieldProps { label: string; value: string; options: string[]; onChange: (v: string) => void; }
const SelectField = ({ label, value, options, onChange }: SelectFieldProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
      <SelectContent>
        {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

interface ButtonProps { children: React.ReactNode; fullWidth?: boolean; loading?: boolean; type?: 'button' | 'submit'; }
const Button = ({ children, fullWidth, loading, type = 'button' }: ButtonProps) => (
  <button
    type={type}
    className={`p-2 rounded bg-gold text-navy hover:bg-gold-light ${fullWidth ? 'w-full' : ''}`}
    disabled={loading}
  >
    {loading && <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />}
    {children}
  </button>
);
