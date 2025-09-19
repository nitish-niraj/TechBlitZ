import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Building, 
  FileText, 
  ArrowLeft,
  LogIn,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserCheck,
  GraduationCap,
  BriefcaseBusiness
} from "lucide-react";

export default function EnhancedLoginPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const [credentials, setCredentials] = useState({
    student: { id: "", password: "" },
    staff: { id: "", password: "" },
    admin: { id: "", password: "" }
  });

  // Check for user type from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    if (userType && ['student', 'staff', 'admin'].includes(userType)) {
      setActiveTab(userType);
    }
  }, []);

  // Note: Removed automatic redirect to allow role switching and logout functionality

  const userTypes = [
    {
      key: "student",
      title: "Student Portal",
      description: "Login with your Student ID",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "bg-blue-500",
      placeholder: "Student ID (e.g., 2024CS001)",
      demoCredentials: { id: "STU001", password: "student123" }
    },
    {
      key: "staff",
      title: "Staff Portal", 
      description: "Login with your Staff ID",
      icon: <BriefcaseBusiness className="w-6 h-6" />,
      color: "bg-green-500",
      placeholder: "Staff ID (e.g., ST001)",
      demoCredentials: { id: "STAFF001", password: "staff123" }
    },
    {
      key: "admin",
      title: "Administrative Portal",
      description: "Login with your Admin ID",
      icon: <Shield className="w-6 h-6" />,
      color: "bg-red-500",
      placeholder: "Admin ID (e.g., AD001)",
      demoCredentials: { id: "ADMIN001", password: "admin123" }
    }
  ];

  const handleLogin = async (userType: string) => {
    setIsLoading(true);
    
    try {
      const creds = credentials[userType as keyof typeof credentials];
      
      if (!creds.id || !creds.password) {
        toast({
          title: "Missing Information",
          description: "Please enter both ID and password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // For development, use demo credentials to simulate different user types
      let email = "";
      if (userType === "student") {
        email = "student@university.edu";
      } else if (userType === "staff") {
        email = "staff@university.edu";
      } else if (userType === "admin") {
        email = "admin@university.edu";
      }

      // Simulate login by making a request to the dev auth endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: creds.password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome to the ${userType} portal!`,
      });

      // Redirect to appropriate dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);

    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please check your ID and password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (userType: string) => {
    const demoUser = userTypes.find(type => type.key === userType);
    if (demoUser) {
      setCredentials(prev => ({
        ...prev,
        [userType]: demoUser.demoCredentials
      }));
    }
  };

  const updateCredentials = (userType: string, field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [userType]: {
        ...prev[userType as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">University Grievance Portal</h1>
                <p className="text-sm text-gray-600">Secure Login System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && user && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Logged in as {user.firstName} ({user.role})
                  </Badge>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      localStorage.removeItem('auth-user');
                      window.location.reload();
                    }}
                    className="flex items-center gap-2"
                  >
                    Logout
                  </Button>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Login to Your Portal</CardTitle>
              <CardDescription>
                Choose your role and enter your credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated && user && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    You are currently logged in as <strong>{user.firstName} ({user.role})</strong>. 
                    You can switch roles by logging in with different credentials or{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 font-medium"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      go to your dashboard
                    </Button>.
                  </AlertDescription>
                </Alert>
              )}
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {userTypes.map((type) => (
                    <TabsTrigger 
                      key={type.key} 
                      value={type.key}
                      className="flex items-center gap-1 text-xs"
                    >
                      {type.icon}
                      <span className="hidden sm:inline">{type.key}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {userTypes.map((type) => (
                  <TabsContent key={type.key} value={type.key} className="space-y-4 mt-6">
                    {/* Portal Info */}
                    <div className="text-center mb-6">
                      <div className={`${type.color} text-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3`}>
                        {type.icon}
                      </div>
                      <h3 className="font-semibold text-lg">{type.title}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>

                    {/* Login Form */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`${type.key}-id`} className="text-sm font-medium">
                          {type.key === 'student' ? 'Student ID' : 
                           type.key === 'staff' ? 'Staff ID' : 'Admin ID'}
                        </Label>
                        <Input
                          id={`${type.key}-id`}
                          type="text"
                          placeholder={type.placeholder}
                          value={credentials[type.key as keyof typeof credentials].id}
                          onChange={(e) => updateCredentials(type.key, 'id', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`${type.key}-password`} className="text-sm font-medium">
                          Password
                        </Label>
                        <Input
                          id={`${type.key}-password`}
                          type="password"
                          placeholder="Enter your password"
                          value={credentials[type.key as keyof typeof credentials].password}
                          onChange={(e) => updateCredentials(type.key, 'password', e.target.value)}
                          className="mt-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleLogin(type.key)}
                        />
                      </div>

                      <Button 
                        onClick={() => handleLogin(type.key)}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Logging in...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Login to {type.title}
                          </>
                        )}
                      </Button>

                      {/* Demo Login */}
                      <div className="pt-4 border-t">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <div className="flex items-center justify-between">
                              <span>Demo Login Available</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDemoLogin(type.key)}
                              >
                                Use Demo
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Card className="p-3">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Secure Authentication</span>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Role-Based Access</span>
                </div>
              </Card>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>Having trouble logging in? Contact IT Support</p>
              <p>Email: support@university.edu | Phone: +1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}