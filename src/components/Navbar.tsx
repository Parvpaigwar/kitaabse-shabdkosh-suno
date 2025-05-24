
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Upload, Library, User, LogOut, Mail, Crown, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const { user, signOut, isVerified, userRole } = useAuth();
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
    
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
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
        description: "Please check your email for a verification code.",
      });
    } catch (error) {
      toast({
        title: "Failed to resend verification",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
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
              {!isVerified && userRole !== 'superadmin' && (
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
                  <Library className="h-4 w-4" /> 
                  {userRole === 'superadmin' ? 'All Books' : 'My Library'}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> 
                    Account
                    {userRole === 'superadmin' && (
                      <Crown className="h-3 w-3 text-amber-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.email}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {userRole === 'superadmin' ? (
                          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            <Crown className="h-3 w-3" />
                            Superadmin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <Shield className="h-3 w-3" />
                            User
                          </Badge>
                        )}
                        {isVerified ? (
                          <Badge variant="default" className="text-xs">Verified</Badge>
                        ) : userRole !== 'superadmin' ? (
                          <Badge variant="destructive" className="text-xs">Unverified</Badge>
                        ) : null}
                      </div>
                    </div>
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
