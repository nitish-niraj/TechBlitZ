import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  Clock, 
  FileText,
  UserPlus 
} from "lucide-react";
import type { User, ComplaintWithDetails } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, toast]);

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: complaints } = useQuery<ComplaintWithDetails[]>({
    queryKey: ["/api/complaints"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: stats } = useQuery<{
    total: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }>({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const activeComplaints = complaints?.filter(c => 
    ['submitted', 'assigned', 'in_progress', 'under_review'].includes(c.status)
  ) || [];

  const resolvedToday = complaints?.filter(c => 
    c.status === 'resolved' && 
    c.resolvedAt && 
    new Date(c.resolvedAt).toDateString() === new Date().toDateString()
  ) || [];

  const departmentStats = complaints?.reduce((acc, complaint) => {
    const deptName = complaint.department?.name || 'Unassigned';
    if (!acc[deptName]) {
      acc[deptName] = { total: 0, resolved: 0 };
    }
    acc[deptName].total++;
    if (complaint.status === 'resolved') {
      acc[deptName].resolved++;
    }
    return acc;
  }, {} as Record<string, { total: number; resolved: number }>) || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage complaints, users, and system analytics</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" data-testid="button-export-report">
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card data-testid="card-total-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{users?.length || 0}</p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-active-cases">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Cases</p>
                  <p className="text-2xl font-bold text-amber-600">{activeComplaints.length}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-resolved-today">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Resolved Today</p>
                  <p className="text-2xl font-bold text-emerald-600">{resolvedToday.length}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-departments">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Departments</p>
                  <p className="text-2xl font-bold text-foreground">{Object.keys(departmentStats).length}</p>
                </div>
                <Building className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-resolution">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Avg Resolution</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.avgResolutionDays?.toFixed(1) || '0'}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Complaints */}
          <Card data-testid="card-recent-complaints-admin">
            <CardHeader>
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints?.slice(0, 5).map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid={`complaint-subject-${complaint.id}`}>
                          {complaint.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{complaint.id.slice(-8).toUpperCase()} • {complaint.user?.firstName} {complaint.user?.lastName}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      data-testid={`badge-status-${complaint.id}`}
                    >
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                  </div>
                )) || []}
                {(!complaints || complaints.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No complaints found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card data-testid="card-department-performance">
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(departmentStats).map(([deptName, stats]) => (
                  <div key={deptName} className="flex items-center justify-between" data-testid={`dept-stats-${deptName}`}>
                    <div>
                      <p className="text-sm font-medium">{deptName}</p>
                      <p className="text-xs text-muted-foreground">{stats.total} total cases</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">
                        {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Resolution rate</p>
                    </div>
                  </div>
                ))}
                {Object.keys(departmentStats).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card data-testid="card-user-management">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users?.slice(0, 10).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" data-testid={`user-name-${user.id}`}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={user.role === 'admin' ? 'destructive' : user.role === 'staff' ? 'default' : 'secondary'}
                      className="text-xs"
                      data-testid={`badge-role-${user.id}`}
                    >
                      {user.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newRole = user.role === 'student' ? 'staff' : 
                                      user.role === 'staff' ? 'admin' : 'student';
                        updateUserRoleMutation.mutate({ userId: user.id, role: newRole });
                      }}
                      disabled={updateUserRoleMutation.isPending}
                      data-testid={`button-update-role-${user.id}`}
                    >
                      Update Role
                    </Button>
                  </div>
                </div>
              )) || []}
              {(!users || users.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
