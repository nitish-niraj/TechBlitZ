import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard,
  MessageSquare,
  Bell,
  ClipboardList,
  History,
  Settings,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  Search,
  Filter,
  Send,
  Eye,
  Edit,
  ArrowRight,
  Building2,
  Star,
  Flag,
  Timer,
  Activity,
  TrendingUp,
  Users,
  Phone,
  Mail
} from "lucide-react";
import type { User, ComplaintWithDetails, Department, ChatMessage } from "@shared/schema";

export default function NewStaffDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updateComment, setUpdateComment] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);

  // Auto-refresh data every 15 seconds for notifications and 30 seconds for other data
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }, 15000);
    
    const dataInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints/department"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/stats"] });
    }, 30000);
    
    return () => {
      clearInterval(notificationInterval);
      clearInterval(dataInterval);
    };
  }, [queryClient]);

  // Authentication check
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin'))) {
      toast({
        title: "Access Denied",
        description: "Staff access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Data queries
  const { data: complaints, refetch: refetchComplaints } = useQuery<ComplaintWithDetails[]>({
    queryKey: ["/api/complaints/department"],
    enabled: isAuthenticated && (user?.role === 'staff' || user?.role === 'admin'),
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: isAuthenticated,
  });

  const { data: myDepartment } = useQuery<Department>({
    queryKey: [`/api/departments/${user?.departmentId}`],
    enabled: isAuthenticated && !!user?.departmentId,
  });

  const { data: departmentStats } = useQuery<{
    total: number;
    assigned: number;
    pending: number;
    inProgress: number;
    resolved: number;
    avgResolutionTime: number;
  }>({
    queryKey: ["/api/staff/stats"],
    enabled: isAuthenticated && (user?.role === 'staff' || user?.role === 'admin'),
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const { data: chatUsers } = useQuery<User[]>({
    queryKey: ["/api/staff/chat-users"],
    enabled: isAuthenticated && (user?.role === 'staff' || user?.role === 'admin'),
  });

  const { data: chatMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${selectedChatUser}`],
    enabled: isAuthenticated && !!selectedChatUser,
  });

  // Update complaint status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status, comment }: { complaintId: string; status: string; comment: string }) => {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Complaint status updated successfully!",
      });
      setIsUpdateStatusOpen(false);
      setSelectedComplaint(null);
      setNewStatus("");
      setUpdateComment("");
      refetchComplaints();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, message }: { receiverId: string; message: string }) => {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, message }),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      setChatMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${selectedChatUser}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'staff' && user?.role !== 'admin')) {
    return null;
  }

  // Filter functions
  const myComplaints = complaints?.filter(c => c.departmentId === user?.departmentId) || [];
  const assignedComplaints = myComplaints.filter(c => c.assignedTo?.id === user?.id);
  
  const filteredComplaints = myComplaints.filter(c => {
    const matchesSearch = 
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const recentNotifications = notifications?.slice(0, 5) || [];
  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <ClipboardList className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedComplaints.length}</div>
            <p className="text-xs opacity-80">
              {assignedComplaints.filter(c => c.status === 'in_progress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignedComplaints.filter(c => 
                c.status === 'resolved' && 
                new Date(c.updatedAt || Date.now()).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs opacity-80">
              Tasks resolved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myComplaints.filter(c => c.status === 'submitted').length}
            </div>
            <p className="text-xs opacity-80">
              New complaints
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications}</div>
            <p className="text-xs opacity-80">
              Unread messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Info & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{myDepartment?.name}</h3>
              <p className="text-gray-600">{myDepartment?.description}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{departmentStats?.total || 0}</div>
                <div className="text-sm text-blue-600">Total Complaints</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{departmentStats?.resolved || 0}</div>
                <div className="text-sm text-green-600">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {assignedComplaints.slice(0, 5).map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{complaint.subject}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(complaint.updatedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      complaint.status === 'resolved' ? 'default' : 
                      complaint.status === 'in_progress' ? 'secondary' : 'destructive'
                    }>
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assigned Tasks</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{complaint.subject}</h3>
                    <Badge variant={
                      complaint.status === 'resolved' ? 'default' : 
                      complaint.status === 'in_progress' ? 'secondary' : 'destructive'
                    }>
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                    {complaint.priority && (
                      <Badge variant="outline" className={
                        complaint.priority === 'high' ? 'border-red-500 text-red-500' :
                        complaint.priority === 'medium' ? 'border-orange-500 text-orange-500' :
                        'border-green-500 text-green-500'
                      }>
                        {complaint.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {complaint.user?.firstName} {complaint.user?.lastName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(complaint.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {Math.ceil((Date.now() - new Date(complaint.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Dialog open={isUpdateStatusOpen && selectedComplaint === complaint.id} 
                          onOpenChange={(open) => {
                            setIsUpdateStatusOpen(open);
                            if (open) setSelectedComplaint(complaint.id);
                          }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Complaint Status</DialogTitle>
                        <DialogDescription>
                          Update the status and add comments for this complaint.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status">New Status</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="comment">Update Comment</Label>
                          <Textarea
                            id="comment"
                            value={updateComment}
                            onChange={(e) => setUpdateComment(e.target.value)}
                            placeholder="Add your comments here..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateStatusOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => updateStatusMutation.mutate({
                            complaintId: complaint.id,
                            status: newStatus,
                            comment: updateComment
                          })}
                          disabled={updateStatusMutation.isPending || !newStatus}
                        >
                          {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Badge variant="secondary">{unreadNotifications} unread</Badge>
      </div>

      <div className="space-y-3">
        {notifications?.map((notification, index) => (
          <Card key={index} className={`hover:shadow-md transition-shadow ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{notification.title}</span>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!notifications || notifications.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderChatTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Communication Hub</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Chat Users List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contacts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              <div className="space-y-1 p-4">
                {chatUsers?.map((chatUser) => (
                  <button
                    key={chatUser.id}
                    onClick={() => setSelectedChatUser(chatUser.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedChatUser === chatUser.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{chatUser.firstName} {chatUser.lastName}</p>
                        <p className="text-xs text-gray-500">{chatUser.role}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedChatUser ? `Chat with ${chatUsers?.find(u => u.id === selectedChatUser)?.firstName}` : 'Select a contact'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedChatUser ? (
              <div className="flex flex-col h-80">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages?.map((message, index) => (
                      <div key={index} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (chatMessage.trim()) {
                            sendMessageMutation.mutate({
                              receiverId: selectedChatUser,
                              message: chatMessage.trim()
                            });
                          }
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (chatMessage.trim()) {
                          sendMessageMutation.mutate({
                            receiverId: selectedChatUser,
                            message: chatMessage.trim()
                          });
                        }
                      }}
                      disabled={sendMessageMutation.isPending || !chatMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a contact to start chatting</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Task History</h2>
      
      <div className="space-y-4">
        {myComplaints.map((complaint) => (
          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{complaint.subject}</h3>
                    <Badge variant={
                      complaint.status === 'resolved' ? 'default' : 
                      complaint.status === 'in_progress' ? 'secondary' : 'destructive'
                    }>
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                    {complaint.assignedTo?.id === user?.id && (
                      <Badge variant="outline">Assigned to you</Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {complaint.user?.firstName} {complaint.user?.lastName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(complaint.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated: {new Date(complaint.updatedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-500">Department: {myDepartment?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('auth-user');
                  window.location.href = '/';
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="tasks">
            {renderTasksTab()}
          </TabsContent>

          <TabsContent value="notifications">
            {renderNotificationsTab()}
          </TabsContent>

          <TabsContent value="chat">
            {renderChatTab()}
          </TabsContent>

          <TabsContent value="history">
            {renderHistoryTab()}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}