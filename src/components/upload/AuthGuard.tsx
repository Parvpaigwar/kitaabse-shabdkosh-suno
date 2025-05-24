
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, isVerified, userRole } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to upload books</h1>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!isVerified && userRole !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Email verification required</h1>
          <p className="mb-4">Please verify your email address before uploading books.</p>
          <Button onClick={() => navigate("/auth")}>Verify Email</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
