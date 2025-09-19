import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { University, Shield, Clock, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <University className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">University GRS</h1>
              <p className="text-muted-foreground">Grievance Redressal System</p>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive platform for university students to submit, track, and resolve their grievances with transparency and efficiency.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center" data-testid="card-feature-easy">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Secure & Confidential</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your complaints are handled with complete confidentiality and security. Anonymous submissions are also supported.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-feature-fast">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle>Quick Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track your complaint status in real-time and get timely updates throughout the resolution process.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="card-feature-support">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Multi-Department Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Complaints are automatically routed to the relevant departments for faster and more accurate resolution.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Sign in with your university account to access the grievance redressal system.
              </p>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>University Grievance Redressal System - Ensuring Student Voice is Heard</p>
        </div>
      </div>
    </div>
  );
}
