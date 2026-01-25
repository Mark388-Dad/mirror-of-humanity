import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { HOUSES, YEAR_GROUPS, MYP5_CLASSES, DP1_CLASSES, USER_ROLES } from '@/lib/constants';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'homeroom_tutor', 'head_of_year', 'house_patron', 'librarian', 'staff']),
  yearGroup: z.enum(['MYP5', 'DP1']).optional(),
  className: z.string().optional(),
  house: z.enum(['Kenya', 'Longonot', 'Kilimanjaro', 'Elgon']).optional(),
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
    yearGroup: '' as 'MYP5' | 'DP1' | '',
    className: '',
    house: '' as 'Kenya' | 'Longonot' | 'Kilimanjaro' | 'Elgon' | '',
  });

  const getClassOptions = () => {
    if (formData.yearGroup === 'MYP5') return MYP5_CLASSES;
    if (formData.yearGroup === 'DP1') return DP1_CLASSES;
    return [];
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = signUpSchema.parse({
        ...formData,
        yearGroup: formData.yearGroup || undefined,
        className: formData.className || undefined,
        house: formData.house || undefined,
      });

      // Validate student-specific fields
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
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([{
          user_id: authData.user.id,
          full_name: validatedData.fullName,
          email: validatedData.email,
          role: validatedData.role,
          year_group: formData.role === 'student' && formData.yearGroup ? formData.yearGroup : null,
          class_name: formData.role === 'student' && formData.className ? formData.className : null,
          house: formData.role === 'student' && formData.house ? formData.house : null,
        }]);

        if (profileError) throw profileError;

        toast.success('Account created successfully!');
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
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@mpesafoundationacademy.ac.ke"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@mpesafoundationacademy.ac.ke"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label>Year Group</Label>
                      <Select value={formData.yearGroup} onValueChange={(value: 'MYP5' | 'DP1') => setFormData({ ...formData, yearGroup: value, className: '' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year group" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEAR_GROUPS.map((yg) => (
                            <SelectItem key={yg} value={yg}>{yg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.yearGroup && (
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={formData.className} onValueChange={(value) => setFormData({ ...formData, className: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                          <SelectContent>
                            {getClassOptions().map((cls) => (
                              <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>House</Label>
                      <Select value={formData.house} onValueChange={(value: any) => setFormData({ ...formData, house: value })}>
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
                  </>
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
