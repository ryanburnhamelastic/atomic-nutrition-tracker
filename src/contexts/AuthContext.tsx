import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { User } from '../types';
import { usersApi, setAuthTokenGetter } from '../lib/api';

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  user: User | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Alias for consistency with other contexts
export const useAuth = useAuthContext;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Set up token getter for API calls
  useEffect(() => {
    setAuthTokenGetter(async () => {
      console.log('[Auth] Token requested, isSignedIn:', isSignedIn);
      // Explicitly check for true to avoid race condition with undefined
      if (isSignedIn !== true) {
        console.log('[Auth] Not signed in or auth not loaded, returning null');
        return null;
      }
      try {
        const token = await getToken();
        console.log('[Auth] Got token from Clerk:', token ? 'Yes' : 'No');
        return token;
      } catch (error) {
        console.error('[Auth] Error getting token:', error);
        return null;
      }
    });
  }, [isSignedIn, getToken]);

  // Fetch or create user on sign in
  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !clerkUser) {
        setUser(null);
        setUserLoading(false);
        return;
      }

      setUserLoading(true);

      try {
        // Try to fetch existing user
        const response = await usersApi.get();

        if (response.data) {
          setUser(response.data);
        } else if (response.error === 'User not found') {
          // Create new user on first login
          const createResponse = await usersApi.create({
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            firstName: clerkUser.firstName || undefined,
            lastName: clerkUser.lastName || undefined,
          });

          if (createResponse.data) {
            setUser(createResponse.data);
          }
        }
      } catch (error) {
        console.error('Failed to sync user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, clerkUser]);

  const refreshUser = async () => {
    if (!isSignedIn) return;

    const response = await usersApi.get();
    if (response.data) {
      setUser(response.data);
    }
  };

  const value: AuthContextType = {
    isLoaded: isLoaded && !userLoading,
    isSignedIn: isSignedIn ?? false,
    userId: userId ?? null,
    userEmail: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    userName: clerkUser?.firstName ?? null,
    user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
