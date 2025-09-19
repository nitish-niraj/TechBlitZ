import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from "@/components/file-upload";
import type { Department } from "@shared/schema";

const complaintSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  description: z.string().min(1, "Description is required").max(2000, "Description too long"),
  category: z.enum([
    "academic_issues",
    "infrastructure", 
    "hostel_accommodation",
    "food_services",
    "it_services",
    "administration",
    "other"
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  departmentId: z.string().min(1, "Department is required"),
  location: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintFormProps {
  departments: Department[];
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}

const categoryLabels = {
  academic_issues: "Academic Issues",
  infrastructure: "Infrastructure",
  hostel_accommodation: "Hostel & Accommodation", 
  food_services: "Food Services",
  it_services: "IT Services",
  administration: "Administration",
  other: "Other",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High", 
  critical: "Critical",
};

export default function ComplaintForm({ departments, onSubmit, isSubmitting }: ComplaintFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  
  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      priority: "medium",
      isAnonymous: false,
    },
  });

  const handleSubmit = (data: ComplaintFormData) => {
    const formData = new FormData();
    
    // Add form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Add files
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    onSubmit(formData);
  };

  return (
    <Card data-testid="card-complaint-form">
      <CardHeader>
        <CardTitle>Submit New Complaint</CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide detailed information about your grievance
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                onValueChange={(value) => form.setValue("category", value as any)}
                data-testid="select-category"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                onValueChange={(value) => form.setValue("priority", value as any)}
                defaultValue="medium"
                data-testid="select-priority"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-destructive">{form.formState.errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select
              onValueChange={(value) => form.setValue("departmentId", value)}
              data-testid="select-department"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.departmentId && (
              <p className="text-sm text-destructive">{form.formState.errors.departmentId.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              {...form.register("subject")}
              placeholder="Brief description of your complaint"
              data-testid="input-subject"
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              {...form.register("description")}
              rows={5}
              placeholder="Please provide a detailed description of your complaint including relevant dates, times, and any other important information..."
              className="resize-none"
              data-testid="textarea-description"
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (if applicable)</Label>
            <Input
              {...form.register("location")}
              placeholder="e.g., Library 2nd Floor, Hostel Block A, Room 204"
              data-testid="input-location"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
              accept="image/*,.pdf,.doc,.docx"
              data-testid="file-upload"
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              {...form.register("isAnonymous")}
              id="anonymous"
              data-testid="checkbox-anonymous"
            />
            <Label htmlFor="anonymous" className="text-sm">
              Submit as anonymous complaint
            </Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
              data-testid="button-submit-complaint"
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="px-6"
              data-testid="button-save-draft"
            >
              Save Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
