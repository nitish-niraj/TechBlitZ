import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check for ?loggedOut=true in URL
  const [loggedOut, setLoggedOut] = React.useState(false);
  React.useEffect(() => {
    if (window.location.search.includes('loggedOut=true')) {
      setLoggedOut(true);
      // Optionally, remove the param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !loggedOut,
  });

  return {
    user: loggedOut ? undefined : user,
    isLoading,
    isAuthenticated: !loggedOut && !!user,
  };
}
