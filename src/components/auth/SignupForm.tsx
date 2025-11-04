import { useState } from "react";
import { signup } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SignupFormProps {
  onSuccess: (email: string) => void;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
}

/**
 * Signup Form Component
 *
 * Handles user registration by collecting name and email.
 * API Payload: { name: string, email: string }
 *
 * After successful signup, OTP is sent to the user's email.
 */
export const SignupForm = ({ onSuccess, onEmailChange, onNameChange }: SignupFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleNameChange = (value: string) => {
    setName(value);
    onNameChange(value);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    onEmailChange(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await signup({ name, email });

      if (response.status === 'PASS') {
        toast({
          title: "Signup successful",
          description: "Please check your email for a verification code.",
        });
        onSuccess(email);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Signup failed";

      toast({
        title: "Signup failed",
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
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            minLength={2}
            maxLength={100}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email Address</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="your.email@example.com"
            required
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            disabled={loading}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </CardFooter>
    </form>
  );
};
