import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StudentDashboard from "./student-dashboard";
import AdminDashboard from "./admin-dashboard";
import StaffDashboard from "./staff-dashboard";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access your dashboard",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Show loading while authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  const userRole = user?.role || 'student';
  
  console.log('Dashboard: Current user:', user);
  console.log('Dashboard: User role:', userRole);
  
  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  if (userRole === 'staff') {
    return <StaffDashboard />;
  }

  // For students, use the student dashboard
  return <StudentDashboard userType={userRole} />;
}