import { useState } from "react";
import { login } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
  onEmailChange: (email: string) => void;
  onNeedVerification: () => void;
}

/**
 * Login Form Component
 *
 * Handles user authentication with email and password.
 * API Payload: { email: string, password: string }
 *
 * Returns JWT tokens (access and refresh) upon successful login.
 */
export const LoginForm = ({
  onSuccess,
  onForgotPassword,
  onEmailChange,
  onNeedVerification
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setUser, setToken } = useAuth();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    onEmailChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login({ email, password });

      if (response.status === 'PASS') {
        // Update auth context
        setUser(response.data.user);
        setToken(response.data.token);

        toast({
          title: "Login successful",
          description: "Welcome back to KitaabSe!",
        });

        onSuccess();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Login failed";

      // Check if the error is due to email not being verified
      if (errorMessage.includes("verify") || errorMessage.includes("verification")) {
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });

        onNeedVerification();
        return;
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email Address</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="your.email@example.com"
            required
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};
