import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Users,
  AlertTriangle,
  Building
} from "lucide-react";

const icons = {
  "clipboard-list": ClipboardList,
  "clock": Clock,
  "check-circle": CheckCircle,
  "chart-line": TrendingUp,
  "users": Users,
  "alert-triangle": AlertTriangle,
  "building": Building,
};

const colorClasses = {
  blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
  purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  gray: "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400",
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof icons;
  color: keyof typeof colorClasses;
  "data-testid"?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color,
  "data-testid": testId 
}: StatsCardProps) {
  const Icon = icons[icon];
  
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium" data-testid="text-stats-title">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-stats-value">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-stats-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
