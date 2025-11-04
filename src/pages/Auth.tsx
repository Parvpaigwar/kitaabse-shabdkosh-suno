
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signup, login } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import OTPVerification from "@/components/OTPVerification";
import PasswordReset from "@/components/PasswordReset";
import UpdatePassword from "@/components/UpdatePassword";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup" | "otp" | "reset" | "update-password">(
    searchParams.get("tab") === "signup" ? "signup" :
    searchParams.get("tab") === "update-password" ? "update-password" : "login"
  );
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  // Reset inputs when switching auth view
  useEffect(() => {
    if (authView !== "otp") {
      setPassword("");
      if (authView !== "reset") {
        setEmail("");
        setName("");
      }
    }
  }, [authView]);

  const handleSignIn = async (e: React.FormEvent) => {
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

        navigate("/");
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Login failed";

      // Check if the error is due to email not being confirmed
      if (errorMessage.includes("verify") || errorMessage.includes("verification")) {
        toast({
          title: "Email not verified",
          description: "Please verify your email before logging in.",
          variant: "destructive",
        });

        // Switch to OTP verification view
        setAuthView("otp");
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await signup({ name, email });

      if (response.status === 'PASS') {
        toast({
          title: "Signup successful",
          description: "Please check your email for a verification code.",
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

  // Render different views based on authView state
  const renderAuthContent = () => {
    switch (authView) {
      case "otp":
        return (
          <OTPVerification
            email={email}
            onSuccess={() => navigate("/")}
            onBack={() => setAuthView("login")}
          />
        );
      case "reset":
        return (
          <PasswordReset
            onSuccess={() => setAuthView("login")}
            onBack={() => setAuthView("login")}
          />
        );
      case "update-password":
        return <UpdatePassword />;
      default:
        return (
          <Tabs defaultValue={authView} className="w-full" onValueChange={(value) => setAuthView(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 mt-4">
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button 
                        type="button" 
                        onClick={() => setAuthView("reset")} 
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">KitaabSe</CardTitle>
          <CardDescription className="text-center">हिन्दी साहित्य की गूंज</CardDescription>
        </CardHeader>
        {renderAuthContent()}
      </Card>
    </div>
  );
};

export default Auth;
