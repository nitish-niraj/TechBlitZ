import {
  users,
  departments,
  complaints,
  complaintAttachments,
  complaintHistory,
  notifications,
  chatMessages,
  type User,
  type UpsertUser,
  type Department,
  type InsertDepartment,
  type Complaint,
  type InsertComplaint,
  type ComplaintAttachment,
  type InsertComplaintAttachment,
  type ComplaintHistory,
  type InsertComplaintHistory,
  type Notification,
  type InsertNotification,
  type ChatMessage,
  type InsertChatMessage,
  type ComplaintWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Complaint operations
  getComplaints(userId?: string, departmentId?: string): Promise<ComplaintWithDetails[]>;
  getComplaint(id: string): Promise<ComplaintWithDetails | undefined>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaintStatus(id: string, status: string, actorId: string): Promise<Complaint>;
  assignComplaint(id: string, assignedToId: string, actorId: string): Promise<Complaint>;
  
  // Complaint attachments
  addComplaintAttachment(attachment: InsertComplaintAttachment): Promise<ComplaintAttachment>;
  getComplaintAttachments(complaintId: string): Promise<ComplaintAttachment[]>;
  
  // Complaint history
  addComplaintHistory(history: InsertComplaintHistory): Promise<ComplaintHistory>;
  getComplaintHistory(complaintId: string): Promise<(ComplaintHistory & { actor?: User })[]>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  
  // Chat messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(complaintId: string): Promise<(ChatMessage & { sender?: User })[]>;
  updateChatMessage(id: string, message: string): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<void>;
  
  // Analytics
  getComplaintStats(departmentId?: string): Promise<{
    total: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  // Complaint operations
  async getComplaints(userId?: string, departmentId?: string): Promise<ComplaintWithDetails[]> {
    const query = db
      .select({
        complaint: complaints,
        user: users,
        department: departments,
        assignedTo: {
          id: sql`assigned_user.id`,
          firstName: sql`assigned_user.first_name`,
          lastName: sql`assigned_user.last_name`,
          email: sql`assigned_user.email`,
        },
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.userId, users.id))
      .leftJoin(departments, eq(complaints.departmentId, departments.id))
      .leftJoin(sql`users as assigned_user`, sql`complaints.assigned_to_id = assigned_user.id`);

    if (userId) {
      query.where(eq(complaints.userId, userId));
    }

    if (departmentId) {
      query.where(eq(complaints.departmentId, departmentId));
    }

    const results = await query.orderBy(desc(complaints.createdAt));

    return results.map(result => ({
      ...result.complaint,
      user: result.user || undefined,
      department: result.department || undefined,
      assignedTo: result.assignedTo?.id ? result.assignedTo as User : undefined,
    }));
  }

  async getComplaint(id: string): Promise<ComplaintWithDetails | undefined> {
    const [result] = await db
      .select({
        complaint: complaints,
        user: users,
        department: departments,
        assignedTo: {
          id: sql`assigned_user.id`,
          firstName: sql`assigned_user.first_name`,
          lastName: sql`assigned_user.last_name`,
          email: sql`assigned_user.email`,
        },
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.userId, users.id))
      .leftJoin(departments, eq(complaints.departmentId, departments.id))
      .leftJoin(sql`users as assigned_user`, sql`complaints.assigned_to_id = assigned_user.id`)
      .where(eq(complaints.id, id));

    if (!result) return undefined;

    // Get attachments
    const attachments = await this.getComplaintAttachments(id);
    
    // Get history
    const history = await this.getComplaintHistory(id);

    return {
      ...result.complaint,
      user: result.user || undefined,
      department: result.department || undefined,
      assignedTo: result.assignedTo?.id ? result.assignedTo as User : undefined,
      attachments,
      history,
    };
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [newComplaint] = await db.insert(complaints).values(complaint).returning();
    
    // Add initial history entry
    await this.addComplaintHistory({
      complaintId: newComplaint.id,
      actorId: complaint.userId,
      action: "submitted",
      description: "Complaint submitted successfully",
    });

    return newComplaint;
  }

  async updateComplaintStatus(id: string, status: string, actorId: string): Promise<Complaint> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    
    const [updatedComplaint] = await db
      .update(complaints)
      .set({ 
        status: status as any,
        updatedAt: new Date(),
        resolvedAt: status === 'resolved' ? new Date() : null,
      })
      .where(eq(complaints.id, id))
      .returning();

    // Add history entry
    await this.addComplaintHistory({
      complaintId: id,
      actorId,
      action: "status_updated",
      description: `Status updated to ${status}`,
      previousValue: complaint.status,
      newValue: status,
    });

    return updatedComplaint;
  }

  async assignComplaint(id: string, assignedToId: string, actorId: string): Promise<Complaint> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    
    const [updatedComplaint] = await db
      .update(complaints)
      .set({ 
        assignedToId,
        status: "assigned",
        updatedAt: new Date(),
      })
      .where(eq(complaints.id, id))
      .returning();

    // Add history entry
    await this.addComplaintHistory({
      complaintId: id,
      actorId,
      action: "assigned",
      description: `Complaint assigned to staff member`,
      previousValue: complaint.assignedToId || null,
      newValue: assignedToId,
    });

    return updatedComplaint;
  }

  // Complaint attachments
  async addComplaintAttachment(attachment: InsertComplaintAttachment): Promise<ComplaintAttachment> {
    const [newAttachment] = await db.insert(complaintAttachments).values(attachment).returning();
    return newAttachment;
  }

  async getComplaintAttachments(complaintId: string): Promise<ComplaintAttachment[]> {
    return await db.select().from(complaintAttachments).where(eq(complaintAttachments.complaintId, complaintId));
  }

  // Complaint history
  async addComplaintHistory(history: InsertComplaintHistory): Promise<ComplaintHistory> {
    const [newHistory] = await db.insert(complaintHistory).values(history).returning();
    return newHistory;
  }

  async getComplaintHistory(complaintId: string): Promise<(ComplaintHistory & { actor?: User })[]> {
    const results = await db
      .select({
        history: complaintHistory,
        actor: users,
      })
      .from(complaintHistory)
      .leftJoin(users, eq(complaintHistory.actorId, users.id))
      .where(eq(complaintHistory.complaintId, complaintId))
      .orderBy(desc(complaintHistory.createdAt));

    return results.map(result => ({
      ...result.history,
      actor: result.actor || undefined,
    }));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(10);
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Chat message operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getChatMessages(complaintId: string): Promise<(ChatMessage & { sender?: User })[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.complaintId, complaintId))
      .orderBy(chatMessages.createdAt);

    return messages.map(row => ({
      ...row.chat_messages,
      sender: row.users || undefined,
    }));
  }

  async updateChatMessage(id: string, message: string): Promise<ChatMessage> {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ 
        message, 
        isEdited: true, 
        editedAt: new Date() 
      })
      .where(eq(chatMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.id, id));
  }

  // Analytics
  async getComplaintStats(departmentId?: string): Promise<{
    total: number;
    inProgress: number;
    resolved: number;
    avgResolutionDays: number;
  }> {
    let whereCondition = undefined;
    if (departmentId) {
      whereCondition = eq(complaints.departmentId, departmentId);
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(whereCondition);

    const [inProgressResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(
        and(
          whereCondition,
          or(
            eq(complaints.status, "submitted"),
            eq(complaints.status, "assigned"),
            eq(complaints.status, "in_progress"),
            eq(complaints.status, "under_review")
          )
        )
      );

    const [resolvedResult] = await db
      .select({ count: count() })
      .from(complaints)
      .where(
        and(
          whereCondition,
          eq(complaints.status, "resolved")
        )
      );

    // Calculate average resolution days
    const [avgResult] = await db
      .select({
        avg: sql`AVG(EXTRACT(day FROM (resolved_at - created_at)))`.as("avg")
      })
      .from(complaints)
      .where(
        and(
          whereCondition,
          eq(complaints.status, "resolved"),
          sql`resolved_at IS NOT NULL`
        )
      );

    return {
      total: totalResult.count,
      inProgress: inProgressResult.count,
      resolved: resolvedResult.count,
      avgResolutionDays: Number(avgResult.avg) || 0,
    };
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
