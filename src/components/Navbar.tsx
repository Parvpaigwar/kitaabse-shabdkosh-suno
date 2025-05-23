
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Upload, Library, User, LogOut, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const { user, signOut, isVerified } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of KitaabSe.",
    });
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });
    
    if (error) {
      toast({
        title: "Failed to resend verification",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Verification email sent",
      description: "Please check your email for a verification link.",
    });
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-amber-600" />
          <span className="text-xl font-bold text-gray-900 font-hindi">किताबसे</span>
        </Link>
        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              {!isVerified && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 border-amber-500 text-amber-600"
                  onClick={handleResendVerification}
                >
                  <Mail className="h-4 w-4" /> Verify Email
                </Button>
              )}
              
              <Link to="/upload">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Book
                </Button>
              </Link>
              <Link to="/library">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Library className="h-4 w-4" /> My Library
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <span className="text-sm">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
