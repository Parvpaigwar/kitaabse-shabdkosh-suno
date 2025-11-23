import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { signup, login, verifyOTP } from "@/services/authService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthView = "login" | "signup" | "otp";

export const GlobalAuthModal = () => {
  const { showAuthModal, authModalCloseable, closeAuthModal, setUser, setToken, openAuthModal } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when modal closes
  useEffect(() => {
    if (!showAuthModal) {
      setAuthView("login");
      setName("");
      setEmail("");
      setPassword("");
      setOtp("");
    }
  }, [showAuthModal]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login({ email, password });

      if (response.status === 'PASS') {
        setUser(response.data.user);
        setToken(response.data.token);

        toast({
          title: "Login successful",
          description: "Welcome back to KitaabSe!",
        });

        // Force close the modal (FeaturedBooks will auto-refresh when user state changes)
        setTimeout(() => {
          closeAuthModal(true);
        }, 100);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Login failed";

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await signup({ name, email });

      if (response.status === 'PASS') {
        toast({
          title: "OTP sent successfully!",
          description: "Please check your email for the verification code. Check spam folder if not found.",
        });
        setAuthView("otp");
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

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp, password });

      if (response.status === 'PASS') {
        setUser(response.data.user);
        setToken(response.data.token);

        toast({
          title: "Account created successfully!",
          description: "Welcome to KitaabSe! You're now logged in.",
        });

        // Force close the modal (FeaturedBooks will auto-refresh when user state changes)
        setTimeout(() => {
          closeAuthModal(true);
        }, 100);
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
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

  const renderAuthContent = () => {
    if (authView === "otp") {
      return (
        <form onSubmit={handleOTPVerification} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please enter the 6-digit code sent to <span className="font-medium">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Can't find the email? Check your spam/junk folder.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp-password">Create Password</Label>
            <Input
              id="otp-password"
              type="password"
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex gap-2">
            {authModalCloseable && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setAuthView("login")}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify & Create Account"
              )}
            </Button>
          </div>
        </form>
      );
    }

    return (
      <Tabs defaultValue="login" value={authView} onValueChange={(value) => setAuthView(value as AuthView)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleSignIn} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => !open && authModalCloseable && closeAuthModal()}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          if (!authModalCloseable) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!authModalCloseable) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">KitaabSe</DialogTitle>
          <DialogDescription className="text-center">
            {authModalCloseable
              ? "हिन्दी साहित्य की गूंज"
              : "Your session has expired. Please log in to continue using KitaabSe."}
          </DialogDescription>
        </DialogHeader>
        {renderAuthContent()}
      </DialogContent>
    </Dialog>
  );
};
