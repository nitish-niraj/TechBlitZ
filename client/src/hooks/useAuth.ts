import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check for ?loggedOut=true in URL
  const [loggedOut, setLoggedOut] = React.useState(false);
  const [userType, setUserType] = React.useState(() => 
    typeof window !== 'undefined' ? (localStorage.getItem('userType') || 'student') : 'student'
  );

  React.useEffect(() => {
    if (window.location.search.includes('loggedOut=true')) {
      setLoggedOut(true);
      // Optionally, remove the param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Listen for changes in localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      const newUserType = localStorage.getItem('userType') || 'student';
      setUserType(newUserType);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check immediately in case the change happened in the same tab
    const currentUserType = localStorage.getItem('userType') || 'student';
    if (currentUserType !== userType) {
      setUserType(currentUserType);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userType]);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user", userType],
    queryFn: async () => {
      console.log('useAuth: Fetching user with userType:', userType);
      const res = await fetch(`/api/auth/user?userType=${userType}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const userData = await res.json();
      console.log('useAuth: Received user data:', userData);
      return userData;
    },
    retry: false,
    enabled: !loggedOut,
  });

  return {
    user: loggedOut ? undefined : user,
    isLoading,
    isAuthenticated: !loggedOut && !!user,
  };
}
