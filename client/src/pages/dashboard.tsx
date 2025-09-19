import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import StatsCard from "@/components/stats-card";
import ComplaintCard from "@/components/complaint-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Bell } from "lucide-react";
import type { ComplaintWithDetails, Notification } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: complaints, isLoading: complaintsLoading } = useQuery<ComplaintWithDetails[]>({
    queryKey: ["/api/complaints"],
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }>({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const recentComplaints = complaints?.slice(0, 3) || [];

  if (isLoading || complaintsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Complaints"
            value={stats?.total || 0}
            subtitle="+2 from last month"
            icon="clipboard-list"
            color="blue"
            data-testid="stats-total"
          />
          <StatsCard
            title="In Progress"
            value={stats?.inProgress || 0}
            subtitle="Average 3.2 days"
            icon="clock"
            color="amber"
            data-testid="stats-progress"
          />
          <StatsCard
            title="Resolved"
            value={stats?.resolved || 0}
            subtitle={`${Math.round(((stats?.resolved || 0) / (stats?.total || 1)) * 100)}% resolution rate`}
            icon="check-circle"
            color="emerald"
            data-testid="stats-resolved"
          />
          <StatsCard
            title="Avg Resolution"
            value={stats?.avgResolutionDays?.toFixed(1) || "0"}
            subtitle="days"
            icon="chart-line"
            color="purple"
            data-testid="stats-avg-resolution"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Complaints */}
          <div className="lg:col-span-2">
            <Card data-testid="card-recent-complaints">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Complaints</CardTitle>
                  <Link href="/complaints" className="text-sm text-primary hover:text-primary/80 font-medium">
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentComplaints.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No complaints found</p>
                    <Link href="/submit">
                      <Button className="mt-4" data-testid="button-submit-first">
                        Submit Your First Complaint
                      </Button>
                    </Link>
                  </div>
                ) : (
                  recentComplaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      data-testid={`complaint-card-${complaint.id}`}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/submit">
                  <Button className="w-full" data-testid="button-new-complaint">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit New Complaint
                  </Button>
                </Link>
                
                <Button variant="secondary" className="w-full" data-testid="button-track-complaint">
                  <Search className="w-4 h-4 mr-2" />
                  Track Complaint
                </Button>
                
                <Button variant="outline" className="w-full" data-testid="button-download-report">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card data-testid="card-notifications">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notifications</CardTitle>
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" data-testid="badge-notification-count">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                        notification.isRead 
                          ? "bg-muted/50" 
                          : "bg-blue-50 dark:bg-blue-900/20"
                      }`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.isRead ? "bg-muted-foreground" : "bg-blue-500"
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt!).toRelativeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add relative time helper
declare global {
  interface Date {
    toRelativeString(): string;
  }
}

Date.prototype.toRelativeString = function() {
  const now = new Date();
  const diffMs = now.getTime() - this.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return this.toLocaleDateString();
};
