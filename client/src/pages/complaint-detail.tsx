import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Flag, User, Mail, Phone, MessageCircle, Paperclip, Share } from "lucide-react";
import type { ComplaintWithDetails, User as UserType } from "@shared/schema";

const statusColors = {
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  assigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  under_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const statusProgress = {
  submitted: 20,
  assigned: 40,
  in_progress: 60,
  under_review: 80,
  resolved: 100,
  closed: 100,
  rejected: 0,
};

export default function ComplaintDetail() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/complaint/:id");

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

  const { data: complaint, isLoading: complaintLoading, error } = useQuery<ComplaintWithDetails>({
    queryKey: ["/api/complaints", params?.id],
    enabled: isAuthenticated && !!params?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await apiRequest("PATCH", `/api/complaints/${params?.id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Complaint status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
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
        description: "Failed to update complaint status.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || complaintLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Complaint not found or you don't have access to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canUpdateStatus = user?.role === 'admin' || 
                         (user?.role === 'staff' && complaint.departmentId === user.departmentId);

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Complaint Details</h1>
            <p className="text-muted-foreground">Track the progress and timeline of the complaint</p>
          </div>
          <Badge className={statusColors[complaint.status as keyof typeof statusColors]} data-testid="badge-status">
            {complaint.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <Card data-testid="card-complaint-details">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold" data-testid="text-complaint-subject">
                      {complaint.subject}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-complaint-id">
                      Complaint ID: #{complaint.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" data-testid="text-department">
                      {complaint.department?.name || 'Unassigned'}
                    </p>
                    <p className="text-xs text-muted-foreground">Department</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-foreground" data-testid="text-complaint-description">
                    {complaint.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <span>
                      <Calendar className="w-4 h-4 mr-1 inline" />
                      Submitted: {formatDate(complaint.createdAt!)}
                    </span>
                    {complaint.location && (
                      <span>
                        <MapPin className="w-4 h-4 mr-1 inline" />
                        {complaint.location}
                      </span>
                    )}
                    <span>
                      <Flag className="w-4 h-4 mr-1 inline" />
                      {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card data-testid="card-timeline">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {complaint.history && complaint.history.length > 0 ? (
                    complaint.history.map((event, index) => (
                      <div key={event.id} className="flex items-start space-x-4 pb-6" data-testid={`timeline-event-${index}`}>
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-current rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(event.createdAt!)}</p>
                          {event.actor && (
                            <p className="text-xs text-muted-foreground mt-1">
                              by {event.actor.firstName} {event.actor.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Progress */}
            <Card data-testid="card-status-progress">
              <CardHeader>
                <CardTitle>Complaint Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium" data-testid="text-progress-percentage">
                    {statusProgress[complaint.status as keyof typeof statusProgress]}%
                  </span>
                </div>
                <Progress 
                  value={statusProgress[complaint.status as keyof typeof statusProgress]} 
                  className="w-full"
                  data-testid="progress-status"
                />
                <div className="text-xs text-muted-foreground">
                  Expected resolution: 2-3 business days
                </div>
                
                {canUpdateStatus && (
                  <div className="space-y-2 pt-4">
                    <p className="text-sm font-medium">Update Status:</p>
                    <div className="space-y-2">
                      {['assigned', 'in_progress', 'under_review', 'resolved'].map(status => (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => updateStatusMutation.mutate({ status })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-update-status-${status}`}
                        >
                          {status.replace('_', ' ').toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {complaint.assignedTo && (
              <Card data-testid="card-contact-info">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Assigned Officer</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-assigned-officer">
                      {complaint.assignedTo.firstName} {complaint.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Support Specialist</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-assigned-email">
                      {complaint.assignedTo.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-add-comment">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="button-add-attachment">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add Attachment
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="button-share-status">
                  <Share className="w-4 h-4 mr-2" />
                  Share Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
