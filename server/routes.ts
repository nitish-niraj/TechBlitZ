import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertComplaintSchema, insertDepartmentSchema, insertComplaintAttachmentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const uploadDir = "uploads";
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Department routes
  app.get('/api/departments', isAuthenticated, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post('/api/departments', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Complaint routes
  app.get('/api/complaints', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let complaints;
      if (user.role === 'admin') {
        // Admin can see all complaints
        complaints = await storage.getComplaints();
      } else if (user.role === 'staff') {
        // Staff can see complaints from their department
        complaints = await storage.getComplaints(undefined, user.departmentId || undefined);
      } else {
        // Students can only see their own complaints
        complaints = await storage.getComplaints(user.id);
      }

      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.get('/api/complaints/:id', isAuthenticated, async (req: any, res) => {
    try {
      const complaint = await storage.getComplaint(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check access permissions
      const canAccess = user.role === 'admin' || 
                       complaint.userId === user.id ||
                       (user.role === 'staff' && complaint.departmentId === user.departmentId);
      
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(complaint);
    } catch (error) {
      console.error("Error fetching complaint:", error);
      res.status(500).json({ message: "Failed to fetch complaint" });
    }
  });

  app.post('/api/complaints', isAuthenticated, upload.array('attachments', 5), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertComplaintSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const complaint = await storage.createComplaint(validatedData);

      // Handle file uploads
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await storage.addComplaintAttachment({
            complaintId: complaint.id,
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
          });
        }
      }

      // Create notification for department
      if (complaint.departmentId) {
        const department = await storage.getDepartment(complaint.departmentId);
        if (department && department.headId) {
          await storage.createNotification({
            userId: department.headId,
            title: "New Complaint Received",
            message: `A new complaint "${complaint.subject}" has been submitted to your department.`,
            type: "complaint_submitted",
            relatedComplaintId: complaint.id,
          });
        }
      }

      const fullComplaint = await storage.getComplaint(complaint.id);
      res.status(201).json(fullComplaint);
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({ message: "Failed to create complaint" });
    }
  });

  app.patch('/api/complaints/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const complaint = await storage.getComplaint(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Check permissions (staff/admin can update status)
      const canUpdate = user.role === 'admin' || 
                       (user.role === 'staff' && complaint.departmentId === user.departmentId);
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { status } = req.body;
      const updatedComplaint = await storage.updateComplaintStatus(req.params.id, status, user.id);

      // Create notification for the complaint owner
      await storage.createNotification({
        userId: complaint.userId!,
        title: "Complaint Status Updated",
        message: `Your complaint "${complaint.subject}" status has been updated to ${status}.`,
        type: "status_updated",
        relatedComplaintId: complaint.id,
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error updating complaint status:", error);
      res.status(500).json({ message: "Failed to update complaint status" });
    }
  });

  app.patch('/api/complaints/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const complaint = await storage.getComplaint(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Check permissions (admin can assign)
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { assignedToId } = req.body;
      const updatedComplaint = await storage.assignComplaint(req.params.id, assignedToId, user.id);

      // Create notification for assigned user
      await storage.createNotification({
        userId: assignedToId,
        title: "Complaint Assigned",
        message: `A complaint "${complaint.subject}" has been assigned to you.`,
        type: "complaint_assigned",
        relatedComplaintId: complaint.id,
      });

      // Create notification for complaint owner
      await storage.createNotification({
        userId: complaint.userId!,
        title: "Complaint Assigned",
        message: `Your complaint "${complaint.subject}" has been assigned to a staff member.`,
        type: "complaint_assigned",
        relatedComplaintId: complaint.id,
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error assigning complaint:", error);
      res.status(500).json({ message: "Failed to assign complaint" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let departmentId = undefined;
      if (user.role === 'staff') {
        departmentId = user.departmentId || undefined;
      }

      const stats = await storage.getComplaintStats(departmentId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { role } = req.body;
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', isAuthenticated, express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
