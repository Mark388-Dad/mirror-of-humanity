import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2, Key, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { HOUSES, YEAR_GROUPS, CLASS_BY_YEAR, USER_ROLES, MAX_STUDENTS_PER_CLASS } from '@/lib/constants';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];
type YearGroup = Database['public']['Enums']['year_group'];
type HouseName = Database['public']['Enums']['house_name'];

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff']),
  yearGroup: z.string().optional(),
  className: z.string().optional(),
  house: z.string().optional(),
  accessCode: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const ROLE_FIELD_CONFIG: Record<UserRole, string[]> = {
  student: ['yearGroup', 'className', 'house', 'accessCode'],
  homeroom_tutor: ['yearGroup', 'className', 'accessCode'],
  head_of_year: ['yearGroup', 'accessCode'],
  house_patron: ['house', 'accessCode'],
  librarian: ['accessCode'],
  staff: ['accessCode'],
};

const ForgotPasswordLink = () => {
  const [sending, setSending] = useState(false);
  const [email, setForgotEmail] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else { toast.success('Password reset link sent! Check your email.'); setShowDialog(false); }
    setSending(false);
  };

  if (!showDialog) {
    return (
      <button type="button" onClick={() => setShowDialog(true)}
        className="w-full text-sm text-primary hover:underline mt-2 text-center">
        Forgot your password?
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-lg border bg-secondary/50 space-y-3">
      <p className="text-sm font-medium">Reset your password</p>
      <Input type="email" placeholder="Enter your email address" value={email}
        onChange={(e) => setForgotEmail(e.target.value)} />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleForgotPassword} disabled={sending} className="bg-gold text-navy hover:bg-gold-light">
          {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
          Send Reset Link
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
      </div>
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [classEnrollment, setClassEnrollment] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as UserRole,
    yearGroup: '',
    className: '',
    house: '',
    accessCode: '',
  });

  const roleFields = ROLE_FIELD_CONFIG[formData.role] || [];
  const requiresCode = true; // All roles require access codes for security

  // Get available classes for selected year group
  const availableClasses = formData.yearGroup ? (CLASS_BY_YEAR[formData.yearGroup] || []) : [];

  // Check class enrollment when year group changes
  useEffect(() => {
    if (!formData.yearGroup || !roleFields.includes('className')) return;

    const checkEnrollment = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('class_name')
        .eq('year_group', formData.yearGroup as any)
        .eq('role', 'student');

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(p => {
          if (p.class_name) {
            counts[p.class_name] = (counts[p.class_name] || 0) + 1;
          }
        });
        setClassEnrollment(counts);
      }
    };

    checkEnrollment();
  }, [formData.yearGroup, formData.role]);

  const validateAccessCode = async (code: string, role: string): Promise<boolean> => {
    if (!code) return false;
    
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setCodeError('Invalid access code');
      return false;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCodeError('This access code has expired');
      return false;
    }

    if (data.max_uses && data.current_uses && data.current_uses >= data.max_uses) {
      setCodeError('This access code has reached its usage limit');
      return false;
    }

    const validCodeTypes = role === 'student' ? ['student'] : ['librarian', 'staff', 'tutor', 'patron', 'head_of_year'];
    // Also check role_restriction if set on the code
    if (!validCodeTypes.includes(data.code_type)) {
      setCodeError(`This code is not valid for ${role} registration`);
      return false;
    }
    if (data.role_restriction && data.role_restriction !== role) {
      setCodeError(`This code is restricted to ${data.role_restriction} role`);
      return false;
    }

    await supabase
      .from('access_codes')
      .update({ current_uses: (data.current_uses || 0) + 1 })
      .eq('id', data.id);

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    
    try {
      const validatedData = signUpSchema.parse({
        ...formData,
        yearGroup: formData.yearGroup || undefined,
        className: formData.className || undefined,
        house: formData.house || undefined,
        accessCode: formData.accessCode || undefined,
      });

      if (formData.role === 'student') {
        if (!formData.yearGroup || !formData.className || !formData.house) {
          toast.error('Students must select year group, class, and house');
          return;
        }
        if (!formData.accessCode) {
          toast.error('Students must enter an access code');
          return;
        }
        // Check class cap
        const currentCount = classEnrollment[formData.className] || 0;
        if (currentCount >= MAX_STUDENTS_PER_CLASS) {
          toast.error(`This class is full (${MAX_STUDENTS_PER_CLASS} students max). Please choose another class.`);
          return;
        }
      }

      if (formData.role === 'homeroom_tutor') {
        if (!formData.yearGroup || !formData.className) {
          toast.error('Homeroom tutors must select year group and class');
          return;
        }
        if (!formData.accessCode) {
          toast.error('Staff must enter an access code');
          return;
        }
      }

      if (formData.role === 'head_of_year') {
        if (!formData.yearGroup) {
          toast.error('Head of Year must select a year group');
          return;
        }
        if (!formData.accessCode) {
          toast.error('Staff must enter an access code');
          return;
        }
      }

      if (formData.role === 'house_patron') {
        if (!formData.house) {
          toast.error('House Patrons must select a house');
          return;
        }
        if (!formData.accessCode) {
          toast.error('Staff must enter an access code');
          return;
        }
      }

      if (formData.role === 'librarian' && !formData.accessCode) {
        toast.error('Librarians must enter an access code');
        return;
      }

      if (formData.role === 'staff' && !formData.accessCode) {
        toast.error('Staff must enter an access code');
        return;
      }

      setLoading(true);

      if (requiresCode) {
        const codeValid = await validateAccessCode(formData.accessCode, formData.role);
        if (!codeValid) {
          setLoading(false);
          return;
        }
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: { emailRedirectTo: redirectUrl },
      });

      if (authError) throw authError;

      if (authData.user) {
        let yearGroupValue: YearGroup | null = null;
        if (['student', 'homeroom_tutor', 'head_of_year'].includes(formData.role) && formData.yearGroup) {
          yearGroupValue = formData.yearGroup as YearGroup;
        }

        let houseValue: HouseName | null = null;
        if (['student', 'house_patron'].includes(formData.role) && formData.house) {
          houseValue = formData.house as HouseName;
        }

        const { error: profileError } = await supabase.from('profiles').insert([{
          user_id: authData.user.id,
          full_name: validatedData.fullName,
          email: validatedData.email,
          role: validatedData.role as UserRole,
          year_group: yearGroupValue,
          class_name: ['student', 'homeroom_tutor'].includes(formData.role) && formData.className ? formData.className : null,
          house: houseValue,
        }]);

        if (profileError) throw profileError;

        // Import pending submissions for students
        if (formData.role === 'student') {
          const { data: pendingData } = await supabase
            .from('pending_submissions')
            .select('*')
            .eq('email', validatedData.email);

          if (pendingData && pendingData.length > 0) {
            const submissionsToInsert = pendingData.map(pending => ({
              user_id: authData.user!.id,
              category_number: pending.category_number,
              category_name: pending.category_name,
              title: pending.title,
              author: pending.author,
              date_started: pending.date_started,
              date_finished: pending.date_finished,
              reflection: pending.reflection,
              points_earned: 3,
              approval_status: 'approved',
            }));

            await supabase.from('book_submissions').insert(submissionsToInsert);

            await supabase
              .from('pending_submissions')
              .update({ imported_at: new Date().toISOString(), imported_to_user_id: authData.user!.id })
              .eq('email', validatedData.email);

            toast.success(`Account created! ${pendingData.length} previous submissions imported.`);
          } else {
            toast.success('Account created successfully! Check your email to verify.');
          }
        } else {
          toast.success('Account created successfully! Check your email to verify.');
        }
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please sign in.');
      } else {
        toast.error(error.message || 'An error occurred');
      }
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
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-6">
      <SEOHead title="Sign In" description="Sign in or create an account for the 45-Book Reading Challenge at M-PESA Foundation Academy." path="/auth" />
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
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="your.email@mpesafoundationacademy.ac.ke"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
                <ForgotPasswordLink />
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Enter your full name"
                    value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="your.email@mpesafoundationacademy.ac.ke"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="At least 6 characters"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value, yearGroup: '', className: '', house: '', accessCode: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresCode && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Key className="w-4 h-4" />Access Code</Label>
                    <Input placeholder="Enter your access code" value={formData.accessCode}
                      onChange={(e) => { setCodeError(''); setFormData({ ...formData, accessCode: e.target.value.toUpperCase() }); }}
                      className="uppercase" required />
                    {codeError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" /><AlertDescription>{codeError}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.role === 'student' ? 'Get your code from the librarian' : 'Get your code from an existing librarian or admin'}
                    </p>
                  </div>
                )}

                {roleFields.includes('yearGroup') && (
                  <div className="space-y-2">
                    <Label>Year Group</Label>
                    <Select value={formData.yearGroup} onValueChange={(value) => setFormData({ ...formData, yearGroup: value, className: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select year group" /></SelectTrigger>
                      <SelectContent>
                        {YEAR_GROUPS.map((yg) => (
                          <SelectItem key={yg} value={yg}>{yg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {roleFields.includes('className') && (
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={formData.className} onValueChange={(value) => setFormData({ ...formData, className: value })}
                      disabled={!formData.yearGroup && roleFields.includes('yearGroup')}>
                      <SelectTrigger><SelectValue placeholder={formData.yearGroup ? "Select your class" : "Select year group first"} /></SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((cls) => {
                          const count = classEnrollment[cls] || 0;
                          const isFull = formData.role === 'student' && count >= MAX_STUDENTS_PER_CLASS;
                          return (
                            <SelectItem key={cls} value={cls} disabled={isFull}>
                              {formData.yearGroup} {cls} {isFull ? '(Full)' : `(${count}/${MAX_STUDENTS_PER_CLASS})`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {roleFields.includes('house') && (
                  <div className="space-y-2">
                    <Label>House</Label>
                    <Select value={formData.house} onValueChange={(value) => setFormData({ ...formData, house: value })}>
                      <SelectTrigger><SelectValue placeholder="Select your house" /></SelectTrigger>
                      <SelectContent>
                        {HOUSES.map((house) => (
                          <SelectItem key={house} value={house}>{house}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
