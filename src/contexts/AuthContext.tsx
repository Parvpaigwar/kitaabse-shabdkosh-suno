import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, logout as authLogout, User as APIUser } from "@/services/authService";

type UserRole = "superadmin" | "user";

// Custom User type compatible with our Django backend
export interface User {
  id: number;
  name: string;
  email: string;
}

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isVerified: boolean;
  userRole: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserRole = async () => {
    // For Django backend, role could be determined from user data
    // For now, defaulting to 'user'. You can add role logic based on backend
    if (user) {
      setUserRole('user'); // Default role
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = getCurrentUser();

        if (storedToken && storedUser) {
          setUser(storedUser);
          setToken(storedToken);
          setIsVerified(true); // User is verified if they have a token
          setUserRole('user'); // Default role, can be enhanced based on backend
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
    try {
      authLogout();
      setUser(null);
      setToken(null);
      setUserRole(null);
      setIsVerified(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isVerified,
    userRole,
    isLoading,
    signOut,
    refreshUserRole,
    setUser,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
