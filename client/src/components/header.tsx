import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, University, Users, ChevronDown } from "lucide-react";
import type { Notification } from "@shared/schema";

export default function Header() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const currentUserType = typeof window !== 'undefined' ? (localStorage.getItem('userType') || 'admin') : 'admin';

  const switchUserType = (newUserType: string) => {
    localStorage.setItem('userType', newUserType);
    window.location.reload();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <University className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-app-title">University GRS</h1>
                <p className="text-xs text-muted-foreground">Grievance Redressal System</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <Button
                variant="ghost"
                className={`text-sm font-medium ${
                  isActive("/") 
                    ? "text-primary border-b-2 border-primary rounded-none pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Button>
            </Link>
            
            <Link href="/submit">
              <Button
                variant="ghost"
                className={`text-sm font-medium ${
                  isActive("/submit") 
                    ? "text-primary border-b-2 border-primary rounded-none pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-submit"
              >
                Submit Complaint
              </Button>
            </Link>

            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className={`text-sm font-medium ${
                    isActive("/admin") 
                      ? "text-primary border-b-2 border-primary rounded-none pb-1" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="nav-admin"
                >
                  Admin Panel
                </Button>
              </Link>
            )}
          </nav>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {/* User Type Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="capitalize">{currentUserType}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => switchUserType('student')}>
                  Switch to Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchUserType('staff')}>
                  Switch to Staff
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchUserType('admin')}>
                  Switch to Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  variant="destructive"
                  data-testid="badge-notification-count"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              
              <div className="hidden sm:block">
                <span className="text-sm font-medium" data-testid="text-user-name">
                  {user?.firstName} {user?.lastName}
                </span>
                <Badge 
                  variant={user?.role === 'admin' ? 'destructive' : user?.role === 'staff' ? 'default' : 'secondary'}
                  className="text-xs ml-2"
                  data-testid="badge-user-role"
                >
                  {user?.role}
                </Badge>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
