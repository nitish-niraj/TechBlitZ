import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./devAuth";
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
  // Auth middleware - using dev authentication
  await setupAuth(app);

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

  // User Management Routes (Admin Only)
  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { email, firstName, lastName, role, studentId, departmentId } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields: email, firstName, lastName, role" });
      }

      // Validate role
      if (!['student', 'staff', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be student, staff, or admin." });
      }

      // For students, require studentId
      if (role === 'student' && !studentId) {
        return res.status(400).json({ message: "Student ID is required for student accounts." });
      }

      // For staff, require departmentId
      if (role === 'staff' && !departmentId) {
        return res.status(400).json({ message: "Department ID is required for staff accounts." });
      }

      // Generate a unique user ID
      const userId = `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      const newUser = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        role: role as "student" | "staff" | "admin",
        profileImageUrl: null,
        departmentId: role === 'staff' ? departmentId : null,
        studentId: role === 'student' ? studentId : null,
      });

      // Create notification for the new user
      await storage.createNotification({
        userId: newUser.id,
        title: "Welcome to University Grievance System",
        message: `Your ${role} account has been created. You can now log in using your email: ${email}`,
        type: "account_created",
      });

      res.status(201).json({ 
        message: "User created successfully", 
        user: newUser,
        loginInstructions: `User can login with email: ${email} and a temporary password will be sent separately.`
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get('/api/admin/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { role, department, search } = req.query;
      
      // Get all users and filter based on query parameters
      const allUsers = await storage.getAllUsers();
      let filteredUsers = allUsers;

      if (role && role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }

      if (department && department !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.departmentId === department);
      }

      if (search) {
        const searchTerm = String(search).toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
          (user.email && user.email.toLowerCase().includes(searchTerm)) ||
          (user.studentId && user.studentId.toLowerCase().includes(searchTerm))
        );
      }

      res.json(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const userId = req.params.id;
      const { firstName, lastName, email, departmentId, studentId, role } = req.body;

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...existingUser,
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        email: email || existingUser.email,
        departmentId: departmentId !== undefined ? departmentId : existingUser.departmentId,
        studentId: studentId !== undefined ? studentId : existingUser.studentId,
        role: role || existingUser.role,
      });

      // Create notification for user about profile update
      await storage.createNotification({
        userId: updatedUser.id,
        title: "Profile Updated",
        message: "Your profile information has been updated by an administrator.",
        type: "profile_updated",
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const userId = req.params.id;
      
      // Prevent admin from deleting themselves
      if (userId === adminUser.id) {
        return res.status(400).json({ message: "Cannot delete your own admin account." });
      }

      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }

      // In a real implementation, you'd have a deleteUser method
      // For now, we'll just return success as the storage doesn't have delete functionality
      res.json({ 
        message: "User deletion requested", 
        note: "User deletion would be implemented in production with proper data handling" 
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post('/api/admin/users/bulk-create', isAuthenticated, async (req: any, res) => {
    try {
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { users } = req.body;

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: "Invalid users array provided" });
      }

      const createdUsers = [];
      const errors = [];

      for (const userData of users) {
        try {
          const { email, firstName, lastName, role, studentId, departmentId } = userData;

          // Validate required fields
          if (!email || !firstName || !lastName || !role) {
            errors.push({ email, error: "Missing required fields" });
            continue;
          }

          // Generate unique user ID
          const userId = `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          const newUser = await storage.upsertUser({
            id: userId,
            email,
            firstName,
            lastName,
            role: role as "student" | "staff" | "admin",
            profileImageUrl: null,
            departmentId: role === 'staff' ? departmentId : null,
            studentId: role === 'student' ? studentId : null,
          });

          createdUsers.push(newUser);

          // Create welcome notification
          await storage.createNotification({
            userId: newUser.id,
            title: "Welcome to University Grievance System",
            message: `Your ${role} account has been created.`,
            type: "account_created",
          });

        } catch (error) {
          errors.push({ email: userData.email, error: "Failed to create user" });
        }
      }

      res.status(201).json({
        message: `Successfully created ${createdUsers.length} users`,
        created: createdUsers,
        errors: errors,
        summary: {
          total: users.length,
          successful: createdUsers.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error("Error bulk creating users:", error);
      res.status(500).json({ message: "Failed to bulk create users" });
    }
  });

  // Staff department routes
  app.get('/api/complaints/department', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let complaints;
      if (user.role === 'admin') {
        // Admin can see all complaints
        complaints = await storage.getComplaints();
      } else if (user.role === 'staff' && user.departmentId) {
        // Staff can see complaints for their department
        complaints = await storage.getComplaints(undefined, user.departmentId);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(complaints);
    } catch (error) {
      console.error("Error fetching department complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.put('/api/complaints/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied. Staff or admin role required." });
      }

      const { status, comment } = req.body;
      const complaintId = req.params.id;

      // Update complaint status
      const updatedComplaint = await storage.updateComplaintStatus(complaintId, status, user.id);
      
      if (!updatedComplaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Add status update comment if provided
      if (comment) {
        await storage.createChatMessage({
          complaintId: complaintId,
          senderId: user.id,
          message: comment,
          messageType: "staff_update",
        });
      }

      // Create notification for student
      await storage.createNotification({
        userId: updatedComplaint.userId!,
        title: "Complaint Status Updated",
        message: `Your complaint "${updatedComplaint.subject}" status has been updated to ${status.replace('_', ' ')}.`,
        type: "status_update",
        relatedComplaintId: updatedComplaint.id,
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error updating complaint status:", error);
      res.status(500).json({ message: "Failed to update complaint status" });
    }
  });

  app.put('/api/complaints/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied. Staff or admin role required." });
      }

      const { assignedTo } = req.body;
      const complaintId = req.params.id;

      const updatedComplaint = await storage.assignComplaint(complaintId, assignedTo, user.id);
      
      if (!updatedComplaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      // Create notification for assigned staff member
      if (assignedTo) {
        await storage.createNotification({
          userId: assignedTo,
          title: "Complaint Assigned",
          message: `You have been assigned a new complaint: "${updatedComplaint.subject}".`,
          type: "complaint_assigned",
          relatedComplaintId: updatedComplaint.id,
        });
      }

      // Create notification for student
      await storage.createNotification({
        userId: updatedComplaint.userId!,
        title: "Complaint Assigned",
        message: `Your complaint "${updatedComplaint.subject}" has been assigned to a staff member.`,
        type: "complaint_assigned",
        relatedComplaintId: updatedComplaint.id,
      });

      res.json(updatedComplaint);
    } catch (error) {
      console.error("Error assigning complaint:", error);
      res.status(500).json({ message: "Failed to assign complaint" });
    }
  });

  app.get('/api/analytics/department', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let departmentId;
      if (user.role === 'staff') {
        departmentId = user.departmentId;
      } else if (user.role === 'admin') {
        // Admin can see all department stats
        departmentId = req.query.departmentId || undefined;
      } else {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getComplaintStats(departmentId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching department analytics:", error);
      res.status(500).json({ message: "Failed to fetch department analytics" });
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
