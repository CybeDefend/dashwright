import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../services/apiClient';

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  organizationId: string;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setUser } = useAuthStore();
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    // Only fetch if authenticated, no user data, and haven't fetched yet
    if (isAuthenticated && !user && !hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      
      apiClient.get<UserProfile>('/users/profile')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error('Failed to fetch user profile:', error);
          // Don't set the flag to false, we tried once
        });
    }
  }, [isAuthenticated, user, setUser]);

  return <>{children}</>;
}
