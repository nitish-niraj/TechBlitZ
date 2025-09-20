import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Building, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Eye,
  UserCheck,
  Settings,
  BarChart3
} from "lucide-react";

export default function HomePage() {
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);

  const userTypes = [
    {
      type: "student",
      title: "Student Portal",
      description: "Submit complaints, track progress, and communicate with staff",
      icon: <Users className="w-8 h-8" />,
      color: "bg-blue-500",
      features: [
        "Submit new complaints with photo/video evidence",
        "Real-time tracking with unique complaint ID",
        "Chat with assigned staff members",
        "View complaint history and status updates",
        "Receive instant notifications"
      ]
    },
    {
      type: "staff",
      title: "Staff Portal",
      description: "Manage assigned complaints and collaborate with departments",
      icon: <Building className="w-8 h-8" />,
      color: "bg-green-500",
      features: [
        "Department-specific complaint dashboard",
        "Priority-based task management",
        "Internal communication tools",
        "Status update and tracking system",
        "Performance analytics and reports"
      ]
    },
    {
      type: "admin",
      title: "Administrative Portal",
      description: "System oversight, user management, and analytics",
      icon: <Shield className="w-8 h-8" />,
      color: "bg-red-500",
      features: [
        "Complete system oversight and monitoring",
        "Staff and department management (CRUD)",
        "Advanced analytics and reporting",
        "Policy configuration and escalation rules",
        "Cross-departmental coordination"
      ]
    }
  ];

  const systemStats = [
    { label: "Total Complaints Resolved", value: "2,456", icon: <CheckCircle2 className="w-5 h-5" /> },
    { label: "Active Users", value: "1,847", icon: <Users className="w-5 h-5" /> },
    { label: "Departments", value: "12", icon: <Building className="w-5 h-5" /> },
    { label: "Average Resolution Time", value: "2.3 days", icon: <Clock className="w-5 h-5" /> }
  ];

  const handleLoginRedirect = (userType: string) => {
    window.location.href = `/login?type=${userType}`;
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
                <p className="text-sm text-gray-600">Your Voice, Our Priority</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/about'}>
                About
              </Button>
              <Button onClick={() => window.location.href = '/login'}>
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            {/* <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
              New System Launch
            </Badge> */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              University Grievance
              <span className="block text-blue-600">Redressal System</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              A comprehensive platform for submitting, tracking, and resolving university complaints. 
              Streamlined processes for students, efficient workflows for staff, and powerful analytics for administrators.
            </p>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {systemStats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center mb-2 text-blue-600">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/login'}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-3 text-lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* User Type Selection */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Portal</h2>
            <p className="text-xl text-gray-600">Different interfaces designed for different roles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userTypes.map((userType, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  selectedUserType === userType.type ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedUserType(userType.type)}
              >
                <CardHeader className="text-center">
                  <div className={`${userType.color} text-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                    {userType.icon}
                  </div>
                  <CardTitle className="text-xl">{userType.title}</CardTitle>
                  <CardDescription>{userType.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {userType.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full"
                    onClick={() => handleLoginRedirect(userType.type)}
                  >
                    Access {userType.title}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">System Features</h2>
            <p className="text-xl text-gray-600">Comprehensive tools for efficient complaint management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <FileText className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Easy Complaint Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Simple forms with photo/video upload, department categorization, and instant acknowledgment.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Eye className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Live status updates, progress monitoring, and automated notifications throughout the resolution process.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle>Communication Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Direct chat with assigned staff, internal messaging, and automated status notifications.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <UserCheck className="w-8 h-8 text-orange-600 mb-2" />
                <CardTitle>Staff Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Complete CRUD operations for staff, role assignments, and department-based access control.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Comprehensive reports, trend analysis, performance metrics, and system insights.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="w-8 h-8 text-indigo-600 mb-2" />
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Escalation rules, policy configuration, automated workflows, and system customization.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-xl mb-8 text-blue-100">Our support team is here to assist you</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center space-x-3">
              <Mail className="w-6 h-6" />
              <span>support@university.edu</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Phone className="w-6 h-6" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <MapPin className="w-6 h-6" />
              <span>Admin Building, Room 101</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">University Grievance Portal</span>
          </div>
          <p className="text-gray-400">© 2025 University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}