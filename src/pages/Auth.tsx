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

// [schemas, ROLE_FIELD_CONFIG, MAX_STUDENTS_PER_CLASS, validateAccessCode, handleSignUp, handleSignIn stay unchanged]

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [classEnrollment, setClassEnrollment] = useState<Record<string, number>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
  const requiresCode = true;
  const availableClasses = formData.yearGroup ? (CLASS_BY_YEAR[formData.yearGroup] || []) : [];

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
          if (p.class_name) counts[p.class_name] = (counts[p.class_name] || 0) + 1;
        });
        setClassEnrollment(counts);
      }
    };

    checkEnrollment();
  }, [formData.yearGroup, formData.role]);

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-6">
      <SEOHead
        title="Sign In"
        description="Sign in or create an account for the 45-Book Reading Challenge at M-PESA Foundation Academy."
        path="/auth"
      />
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

            {/* SIGN IN */}
            <TabsContent value="signin">
              {showForgotPassword ? (
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
              ) : (
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

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-gold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full bg-gold text-navy hover:bg-gold-light" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Full Name */}
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

                {/* Email */}
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

                {/* Password */}
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

                {/* Role */}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, role: value, yearGroup: '', className: '', house: '', accessCode: '' })
                    }
                  >
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

                {/* Access Code */}
                {requiresCode && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Access Code
                    </Label>
                    <Input
                      placeholder="Enter your access code"
                      value={formData.accessCode}
                      onChange={(e) => {
                        setCodeError('');
                        setFormData({ ...formData, accessCode: e.target.value.toUpperCase() });
                      }}
                      className="uppercase"
                      required
                    />
                    {codeError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{codeError}</AlertDescription>
                      </Alert>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.role === 'student'
                        ? 'Get your code from the librarian'
                        : 'Get your code from an existing librarian or admin'}
                    </p>
                  </div>
                )}

                {/* Year Group */}
                {roleFields.includes('yearGroup') && (
                  <div className="space-y-2">
                    <Label>Year Group</Label>
                    <Select
                      value={formData.yearGroup}
                      onValueChange={(value) => setFormData({ ...formData, yearGroup: value, className: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year group" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_GROUPS.map((yg) => (
                          <SelectItem key={yg} value={yg}>
                            {yg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Class */}
                {roleFields.includes('className') && (
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select
                      value={formData.className}
                      onValueChange={(value) => setFormData({ ...formData, className: value })}
                      disabled={!formData.yearGroup && roleFields.includes('yearGroup')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.yearGroup ? 'Select your class' : 'Select year group first'} />
                      </SelectTrigger>
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

                {/* House */}
                {roleFields.includes('house') && (
                  <div className="space-y-2">
                    <Label>House</Label>
                    <Select
                      value={formData.house}
                      onValueChange={(value) => setFormData({ ...formData, house: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your house" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOUSES.map((house) => (
                          <SelectItem key={house} value={house}>
                            {house}
                          </SelectItem>
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
