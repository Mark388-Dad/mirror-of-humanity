import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { Button, Input, Label } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const [newPassword, setNewPassword] = useState('');

  // 🔥 Detect reset password mode (Supabase recovery)
  useEffect(() => {
    const detectRecovery = async () => {
      const hash = window.location.hash;

      if (hash.includes('type=recovery')) {
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          setIsRecoveryMode(true);
          setShowForgotPassword(true);
        }
      }
    };

    detectRecovery();
  }, []);

  // 🔐 SIGN IN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      navigate('/');
    }
  };

  // 🆕 SIGN UP (basic)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email to confirm your account');
    }
  };

  // 📩 SEND RESET EMAIL
  const handleSendReset = async (email: string) => {
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Reset link sent! Check your email.');
    }
  };

  // 🔄 UPDATE PASSWORD
  const handleUpdatePassword = async () => {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Password updated successfully!');
      window.location.href = '/auth';
    }
  };

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

          <CardTitle className="font-display text-2xl">
            45-Book Reading Challenge
          </CardTitle>

          <CardDescription>
            2025/2026 • Fiction as a Mirror of Humanity
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showForgotPassword ? (
            isRecoveryMode ? (
              // 🔥 RESET PASSWORD UI
              <div className="space-y-4">
                <h2 className="text-center text-lg font-semibold">
                  Set New Password
                </h2>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  className="w-full bg-gold text-navy"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                </Button>
              </div>
            ) : (
              // 📩 FORGOT PASSWORD UI
              <ForgotPasswordForm
                onSubmit={handleSendReset}
                onBack={() => setShowForgotPassword(false)}
              />
            )
          ) : (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* 🔐 SIGN IN */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
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

                  <Button
                    type="submit"
                    className="w-full bg-gold text-navy"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* 🆕 SIGN UP */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gold text-navy">
                    Sign Up
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
