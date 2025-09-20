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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  PieChart,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  Mail,
  Phone,
  Shield,
  UserCheck,
  AlertCircle,
  Activity,
  User as UserIcon
} from "lucide-react";
import type { User, ComplaintWithDetails, Department } from "@shared/schema";

export default function NewAdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateDepartmentOpen, setIsCreateDepartmentOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "student" as "student" | "staff" | "admin",
    studentId: "",
    departmentId: "",
  });

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  });

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Authentication check
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Data queries
  const { data: allUsers, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: allComplaints } = useQuery<ComplaintWithDetails[]>({
    queryKey: ["/api/complaints"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: departments, refetch: refetchDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<{
    total: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }>({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully!",
      });
      setIsCreateUserOpen(false);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        role: "student",
        studentId: "",
        departmentId: "",
      });
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (deptData: typeof newDepartment) => {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptData),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department created successfully!",
      });
      setIsCreateDepartmentOpen(false);
      setNewDepartment({ name: "", description: "" });
      refetchDepartments();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create department: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully!",
      });
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser & { id: string }) => {
      const { id, ...updateData } = userData;
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      setIsEditUserOpen(false);
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handler to open edit dialog with user data
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setNewUser({
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      studentId: user.studentId || "",
      departmentId: user.departmentId || "",
    });
    setIsEditUserOpen(true);
  };

  // Handler to submit edit form
  const handleEditSubmit = () => {
    if (selectedUser) {
      editUserMutation.mutate({
        id: selectedUser.id,
        ...newUser,
      });
    }
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  // Calculate department-wise statistics
  const departmentStats = departments?.map(dept => {
    const deptComplaints = allComplaints?.filter(c => c.departmentId === dept.id) || [];
    return {
      ...dept,
      totalTickets: deptComplaints.length,
      newTickets: deptComplaints.filter(c => c.status === 'submitted').length,
      pendingTickets: deptComplaints.filter(c => c.status === 'in_progress').length,
      resolvedTickets: deptComplaints.filter(c => c.status === 'resolved').length,
    };
  }) || [];

  // Filter functions
  const filteredUsers = allUsers?.filter(u => {
    const matchesSearch = 
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = userTypeFilter === "all" || u.role === userTypeFilter;
    const matchesDepartment = departmentFilter === "all" || u.departmentId === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDepartment;
  }) || [];

  const filteredComplaints = allComplaints?.filter(c => {
    const matchesSearch = 
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || c.departmentId === departmentFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  }) || [];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
            <p className="text-xs opacity-80">
              {allUsers?.filter(u => u.role === 'student').length} students, {allUsers?.filter(u => u.role === 'staff').length} staff
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs opacity-80">
              {allComplaints?.filter(c => c.status === 'resolved').length} resolved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            <p className="text-xs opacity-80">
              Avg. {stats?.avgResolutionDays || 0} days resolution
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments?.length || 0}</div>
            <p className="text-xs opacity-80">
              Active departments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {allComplaints?.slice(0, 5).map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{complaint.subject}</p>
                      <p className="text-xs text-gray-500">
                        {departments?.find(d => d.id === complaint.departmentId)?.name}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {departmentStats.slice(0, 5).map((dept) => (
                  <div key={dept.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{dept.name}</h4>
                      <span className="text-xs text-gray-500">{dept.totalTickets} tickets</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600">{dept.resolvedTickets} resolved</span>
                      <span className="text-orange-600">{dept.pendingTickets} pending</span>
                      <span className="text-red-600">{dept.newTickets} new</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDepartmentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Department Management</h2>
        <Dialog open={isCreateDepartmentOpen} onOpenChange={setIsCreateDepartmentOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dept-name">Department Name</Label>
                <Input
                  id="dept-name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <Label htmlFor="dept-description">Description</Label>
                <Textarea
                  id="dept-description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Enter department description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDepartmentOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createDepartmentMutation.mutate(newDepartment)}
                disabled={createDepartmentMutation.isPending}
              >
                {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentStats.map((dept) => (
          <Card key={dept.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {dept.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Tickets:</span>
                  <Badge variant="outline">{dept.totalTickets}</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-700">{dept.resolvedTickets}</div>
                    <div className="text-green-600">Resolved</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-semibold text-orange-700">{dept.pendingTickets}</div>
                    <div className="text-orange-600">Pending</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-semibold text-red-700">{dept.newTickets}</div>
                    <div className="text-red-600">New</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: "student" | "staff" | "admin") => 
                  setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUser.role === "student" && (
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={newUser.studentId}
                    onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                  />
                </div>
              )}

              {(newUser.role === "staff" || newUser.role === "admin") && (
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newUser.departmentId} onValueChange={(value) => 
                    setNewUser({ ...newUser, departmentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select value={newUser.role} onValueChange={(value: "student" | "staff" | "admin") => 
                  setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUser.role === "student" && (
                <div>
                  <Label htmlFor="editStudentId">Student ID</Label>
                  <Input
                    id="editStudentId"
                    value={newUser.studentId}
                    onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                  />
                </div>
              )}

              {(newUser.role === "staff" || newUser.role === "admin") && (
                <div>
                  <Label htmlFor="editDepartment">Department</Label>
                  <Select value={newUser.departmentId} onValueChange={(value) => 
                    setNewUser({ ...newUser, departmentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Department</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={editUserMutation.isPending}
              >
                {editUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
                <Badge variant={
                  user.role === 'admin' ? 'default' : 
                  user.role === 'staff' ? 'secondary' : 'outline'
                }>
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              {user.studentId && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCheck className="h-4 w-4" />
                  ID: {user.studentId}
                </div>
              )}
              {user.departmentId && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  {departments?.find(d => d.id === user.departmentId)?.name}
                </div>
              )}
              
              <Separator className="my-3" />
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEditUser(user)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => deleteUserMutation.mutate(user.id)}
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderComplaintsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Complaint Management</h2>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search complaints..."
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
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments?.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Complaints List */}
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
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {departments?.find(d => d.id === complaint.departmentId)?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {complaint.user?.firstName} {complaint.user?.lastName}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics & Reports</h2>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.resolved} of {stats?.total} complaints resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResolutionDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days on average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allUsers?.filter(u => u.role === 'staff').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Satisfaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{dept.name}</span>
                  <span>{dept.totalTickets} tickets</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${dept.totalTickets ? (dept.resolvedTickets / dept.totalTickets) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{dept.resolvedTickets} resolved</span>
                  <span>{dept.pendingTickets} pending</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">University Grievance Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="complaints" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="departments">
            {renderDepartmentsTab()}
          </TabsContent>

          <TabsContent value="users">
            {renderUsersTab()}
          </TabsContent>

          <TabsContent value="complaints">
            {renderComplaintsTab()}
          </TabsContent>

          <TabsContent value="analytics">
            {renderAnalyticsTab()}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}