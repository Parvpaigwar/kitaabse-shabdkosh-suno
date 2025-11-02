
import { useState } from "react";
import { verifyOTP } from "@/services/authService";
import { Button } from "@/components/ui/button";
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

interface OTPVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

const OTPVerification = ({ email, onSuccess, onBack }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp });

      if (response.status === 'PASS') {
        toast({
          title: "Email verified successfully",
          description: "Welcome to KitaabSe! You can now log in.",
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

  const handleResendOTP = async () => {
    setResending(true);

    try {
      // Note: The API documentation doesn't show a resend OTP endpoint
      // You may need to call the signup endpoint again or implement a separate resend endpoint
      toast({
        title: "Resend feature",
        description: "Please contact support to resend your verification code.",
      });

      // Clear the OTP input
      setOtp("");
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast({
        title: "Failed to resend verification code",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">Verify Your Email</CardTitle>
      </CardHeader>
      <form onSubmit={handleVerify}>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            We've sent a verification code to <span className="font-medium">{email}</span>
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
          
          <div className="text-center text-xs text-muted-foreground">
            Didn't receive the code? Check your spam folder or try resending.
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
          
          <div className="flex justify-between w-full text-sm">
            <button 
              type="button"
              onClick={onBack} 
              className="text-muted-foreground hover:text-primary"
              disabled={loading || resending}
            >
              Back to login
            </button>
            
            <button 
              type="button"
              onClick={handleResendOTP} 
              className="text-primary hover:underline" 
              disabled={loading || resending}
            >
              {resending ? (
                <>
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Sending...
                </>
              ) : (
                "Resend code"
              )}
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default OTPVerification;
