import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, Loader2 } from 'lucide-react';
import { USER_ROLES, YEAR_GROUPS, CLASS_BY_YEAR, HOUSES } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
    yearGroup: '',
    className: '',
    house: '',
    studentCode: '',
    accessCode: '',
  });

  const resetMode = searchParams.get('reset') === 'true';

  useEffect(() => {
    if (resetMode) {
      setShowForgotPassword(true);
    }
  }, [resetMode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) throw error;
      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.fullName.trim()) {
        toast.error('Please enter your full name');
        setLoading(false);
        return;
      }

      const isStudent = formData.role === 'student';

      if (isStudent && !formData.yearGroup) {
        toast.error('Please select your year group');
        setLoading(false);
        return;
      }
      if (isStudent && !formData.className) {
        toast.error('Please select your class');
        setLoading(false);
        return;
      }
      if (isStudent && !formData.house) {
        toast.error('Please select your house');
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          role: formData.role as any,
          year_group: (formData.yearGroup || null) as any,
          class_name: formData.className || null,
          house: (formData.house || null) as any,
          student_code: formData.studentCode.trim() || null,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      toast.success('Account created! Please check your email to verify your account.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = formData.yearGroup ? (CLASS_BY_YEAR[formData.yearGroup] || []) : [];
  const showStudentFields = formData.role === 'student';

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-6">
      <SEOHead title="Sign In" description="Sign in or create an account" path="/auth" />
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
          {showForgotPassword ? (
            <ForgotPasswordForm onBack={() => { setShowForgotPassword(false); navigate('/auth'); }} />
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="your.email@school.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-gold hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="your.name@mpesafoundationacademy.ac.ke"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Student Code */}
                  <div className="space-y-2">
                    <Label>Student Code {showStudentFields ? '*' : '(Optional)'}</Label>
                    <Input
                      placeholder="Enter your student code"
                      value={formData.studentCode}
                      onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                      required={showStudentFields}
                    />
                  </div>

                  {/* Year Group */}
                  <div className="space-y-2">
                    <Label>Year Group {showStudentFields ? '*' : '(Optional)'}</Label>
                    <Select 
                      value={formData.yearGroup} 
                      onValueChange={(v) => setFormData({ ...formData, yearGroup: v, className: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year group" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_GROUPS.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Class */}
                  {formData.yearGroup && (
                    <div className="space-y-2">
                      <Label>Class {showStudentFields ? '*' : '(Optional)'}</Label>
                      <Select value={formData.className} onValueChange={(v) => setFormData({ ...formData, className: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your class" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* House */}
                  <div className="space-y-2">
                    <Label>House {showStudentFields ? '*' : '(Optional)'}</Label>
                    <Select value={formData.house} onValueChange={(v) => setFormData({ ...formData, house: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your house" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOUSES.map((house) => (
                          <SelectItem key={house} value={house}>{house}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Access Code */}
                  <div className="space-y-2">
                    <Label>Access Code</Label>
                    <Input
                      placeholder="Enter access code (if provided)"
                      value={formData.accessCode}
                      onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Required for staff roles. Students may leave blank.</p>
                  </div>

                  <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
