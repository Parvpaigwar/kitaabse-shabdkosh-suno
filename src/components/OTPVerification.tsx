
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

interface OTPVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

const OTPVerification = ({ email, onSuccess, onBack }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    
    setLoading(false);
    
    if (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Email verified successfully",
      description: "You can now log in to your account.",
    });
    
    onSuccess();
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    
    setLoading(false);
    
    if (error) {
      toast({
        title: "Failed to resend OTP",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "OTP resent",
      description: "A new verification code has been sent to your email.",
    });
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
        </CardContent>
        
        <CardFooter className="flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={loading}>
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
            >
              Back to login
            </button>
            
            <button 
              type="button"
              onClick={handleResendOTP} 
              className="text-primary hover:underline" 
              disabled={loading}
            >
              Resend code
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default OTPVerification;
