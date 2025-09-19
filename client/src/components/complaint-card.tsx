import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User } from "lucide-react";
import type { ComplaintWithDetails } from "@shared/schema";

const statusColors = {
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  assigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  under_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const categoryIcons = {
  academic_issues: "fas fa-graduation-cap",
  infrastructure: "fas fa-building", 
  hostel_accommodation: "fas fa-bed",
  food_services: "fas fa-utensils",
  it_services: "fas fa-wifi",
  administration: "fas fa-user-tie",
  other: "fas fa-question-circle",
};

interface ComplaintCardProps {
  complaint: ComplaintWithDetails;
  "data-testid"?: string;
}

export default function ComplaintCard({ complaint, "data-testid": testId }: ComplaintCardProps) {
  const formatDate = (dateInput: string | Date) => {
    const now = new Date();
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link href={`/complaint/${complaint.id}`}>
      <div 
        className="flex items-start space-x-4 p-4 rounded-lg bg-accent/50 hover:bg-accent/70 transition-colors cursor-pointer"
        data-testid={testId}
      >
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className={`${categoryIcons[complaint.category as keyof typeof categoryIcons]} text-blue-600 dark:text-blue-400 text-sm`}></i>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground truncate" data-testid="text-complaint-subject">
              {complaint.subject}
            </h3>
            <Badge 
              className={`${statusColors[complaint.status as keyof typeof statusColors]} flex-shrink-0 ml-2`}
              data-testid="badge-complaint-status"
            >
              {complaint.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground space-x-4 mb-2">
            <span className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {complaint.department?.name || 'Unassigned'}
            </span>
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(complaint.createdAt!)}
            </span>
            {complaint.location && (
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {complaint.location}
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground" data-testid="text-complaint-id">
            ID: #{complaint.id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>
    </Link>
  );
}
