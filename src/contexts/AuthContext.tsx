import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
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

  // Use refs to avoid stale closures in token getter
  const isSignedInRef = useRef(isSignedIn);
  const getTokenRef = useRef(getToken);

  // Keep refs in sync with current values
  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Set up token getter for API calls - only once on mount
  useEffect(() => {
    setAuthTokenGetter(async () => {
      console.log('[Auth] Token requested, isSignedIn:', isSignedInRef.current);
      // Read current value from ref to avoid stale closure
      if (isSignedInRef.current !== true) {
        console.log('[Auth] Not signed in or auth not loaded, returning null');
        return null;
      }
      try {
        const token = await getTokenRef.current();
        console.log('[Auth] Got token from Clerk:', token ? 'Yes' : 'No');
        return token;
      } catch (error) {
        console.error('[Auth] Error getting token:', error);
        return null;
      }
    });
  }, []); // Empty deps - set once on mount, refs keep it updated

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
