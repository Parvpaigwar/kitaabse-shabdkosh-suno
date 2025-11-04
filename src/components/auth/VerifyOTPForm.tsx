import { useState } from "react";
import { verifyOTP } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

interface VerifyOTPFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

/**
 * OTP Verification Form Component
 *
 * Handles email verification with OTP and password creation.
 * API Payload: { email: string, otp: string, password: string }
 *
 * Returns JWT tokens and user data upon successful verification.
 * The user is automatically logged in after verification.
 */
export const VerifyOTPForm = ({ email, onSuccess, onBack }: VerifyOTPFormProps) => {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setUser, setToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp, password });

      if (response.status === 'PASS') {
        // Update auth context with user and token
        setUser(response.data.user);
        setToken(response.data.token);

        toast({
          title: "Account verified successfully",
          description: "Welcome to KitaabSe! You're now logged in.",
        });

        onSuccess();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Verification failed";

      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          Verify Your Email
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            We've sent a verification code to{" "}
            <span className="font-medium">{email}</span>
          </div>

          <div className="flex flex-col space-y-2 items-center">
            <Label htmlFor="otp">Enter the 6-digit code</Label>
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSeparator />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password (min 6 characters)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Re-enter your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Didn't receive the code? Check your spam folder.
          </div>
        </CardContent>

        <CardFooter className="flex-col space-y-3">
          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              otp.length !== 6 ||
              password.length < 6 ||
              password !== confirmPassword
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Verify & Create Account"
            )}
          </Button>

          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-primary"
            disabled={loading}
          >
            Back to login
          </button>
        </CardFooter>
      </form>
    </Card>
  );
};
