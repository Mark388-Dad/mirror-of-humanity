import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onSubmit?: (email: string) => void;
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Enter your email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://mfareadingchallenge.netlify.app/reset-password",
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent!");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-center text-lg font-semibold">
        Reset Your Password
      </h2>

      <p className="text-sm text-muted-foreground text-center">
        Enter your email and we’ll send you a reset link
      </p>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-gold text-navy"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <button
        onClick={onBack}
        className="w-full text-sm text-muted-foreground hover:underline"
      >
        Back to Login
      </button>
    </div>
  );
}
