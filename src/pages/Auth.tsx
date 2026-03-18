import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

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
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff']),
  yearGroup: z.string().optional(),
  className: z.string().optional(),
  house: z.string().optional(),
  accessCode: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ROLE_FIELD_CONFIG: Record<UserRole, string[]> = {
  student: ['yearGroup', 'className', 'house', 'accessCode'],
  homeroom_tutor: ['yearGroup', 'className', 'accessCode'],
  head_of_year: ['yearGroup', 'accessCode'],
  house_patron: ['house', 'accessCode'],
  librarian: ['accessCode'],
  staff: ['accessCode'],
};

const Auth = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
  const availableClasses = formData.yearGroup ? (CLASS_BY_YEAR[formData.yearGroup] || []) : [];

  // ===============================
  // Enrollment Check
  // ===============================
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

  // ===============================
  // Sign In
  // ===============================
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
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Sign Up
  // ===============================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');

    try {
      const validatedData = signUpSchema.parse(formData);

      setLoading(true);

      const { data: authData, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (error) throw error;

      if (authData.user) {
        await supabase.from('profiles').insert([{
          user_id: authData.user.id,
          full_name: validatedData.fullName,
          email: validatedData.email,
          role: validatedData.role,
        }]);

        toast.success('Account created! Check your email.');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-6">
      <SEOHead title="Sign In" description="Authentication page" path="/auth" />

      <Card className="w-full max-w-lg bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gold" />
            </div>
          </div>

          <CardTitle className="text-2xl">45-Book Reading Challenge</CardTitle>
          <CardDescription>2025/2026</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ================= SIGN IN ================= */}
            <TabsContent value="signin">
              {showForgotPassword ? (
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-gold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>

                </form>
              )}
            </TabsContent>

            {/* ================= SIGN UP ================= */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
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
