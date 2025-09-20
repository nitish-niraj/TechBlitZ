import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText, ArrowLeft, GraduationCap, BriefcaseBusiness } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    if (userType && ['student', 'staff', 'admin'].includes(userType)) {
      setActiveTab(userType);
    }
  }, []);

  const userTypes = [
    {
      key: "student",
      title: "Student Portal",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "bg-blue-500",
      email: "student@university.edu",
      description: "Access your student dashboard"
    },
    {
      key: "staff",
      title: "Staff Portal", 
      icon: <BriefcaseBusiness className="w-5 h-5" />,
      color: "bg-green-500",
      email: "staff@university.edu",
      description: "Manage department complaints"
    },
    {
      key: "admin",
      title: "Admin Portal",
      icon: <Shield className="w-5 h-5" />,
      color: "bg-red-500",
      email: "admin@university.edu", 
      description: "System administration"
    }
  ];

  const handleLogin = async (userType: string) => {
    setIsLoading(true);
    try {
      const email = userTypes.find(u => u.key === userType)?.email || "";
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: formData.password }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Login failed');
      
      localStorage.setItem('userType', userType);
      toast({
        title: "Login Successful",
        description: `Welcome to the ${userType} portal!`,
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please check your details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (userType: string) => {
    setFormData({ 
      email: userTypes.find(u => u.key === userType)?.email || "",
      password: "demo123"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">University Grievance Portal</h1>
                <p className="text-sm text-gray-600">Secure Login</p>
              </div>
            </div>
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
      </header>

      <section className="flex h-[calc(100vh-120px)] items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-blue-600 p-3 rounded-full">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Portal Access</CardTitle>
            <p className="text-sm text-gray-600">
              Select your role and sign in to continue
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {userTypes.map((type) => (
                  <TabsTrigger 
                    key={type.key} 
                    value={type.key}
                    className="text-xs"
                  >
                    {type.icon}
                    <span className="ml-1 hidden sm:inline">{type.key}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {userTypes.map((type) => (
                <TabsContent key={type.key} value={type.key} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className={`${type.color} text-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto`}>
                      {type.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{type.title}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                    <Badge variant="outline" className="text-xs">
                      Demo: {type.email}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin(type.key)}
                    />

                    <div className="space-y-3">
                      <Button 
                        className="w-full"
                        onClick={() => handleLogin(type.key)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDemoLogin(type.key)}
                      >
                        <FcGoogle className="mr-2 w-4 h-4" />
                        Demo Login
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="text-center text-sm text-gray-500">
              <p>Need help? Contact support at</p>
              <a href="mailto:support@university.edu" className="text-blue-600 hover:underline">
                support@university.edu
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}