
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PasswordResetProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PasswordReset = ({ onSuccess, onBack }: PasswordResetProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?tab=update-password`,
    });
    
    setLoading(false);
    
    if (error) {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Reset link sent",
      description: "Check your email for a link to reset your password.",
    });
    
    onSuccess();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">Reset Password</CardTitle>
      </CardHeader>
      <form onSubmit={handleResetPassword}>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
          
          <button 
            type="button"
            onClick={onBack} 
            className="text-muted-foreground hover:text-primary text-sm"
          >
            Back to login
          </button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PasswordReset;
