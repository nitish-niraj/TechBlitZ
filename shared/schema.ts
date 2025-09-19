import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  pgEnum,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["student", "staff", "admin"]);

// Complaint status enum
export const complaintStatusEnum = pgEnum("complaint_status", [
  "submitted",
  "assigned",
  "in_progress",
  "under_review",
  "resolved",
  "closed",
  "rejected"
]);

// Complaint priority enum
export const complaintPriorityEnum = pgEnum("complaint_priority", [
  "low",
  "medium",
  "high",
  "critical"
]);

// Complaint category enum
export const complaintCategoryEnum = pgEnum("complaint_category", [
  "academic_issues",
  "infrastructure",
  "hostel_accommodation",
  "food_services",
  "it_services",
  "administration",
  "other"
]);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("student").notNull(),
  departmentId: varchar("department_id"),
  studentId: varchar("student_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  headId: varchar("head_id"),
  email: varchar("email"),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  departmentId: varchar("department_id"),
  assignedToId: varchar("assigned_to_id"),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  category: complaintCategoryEnum("category").notNull(),
  priority: complaintPriorityEnum("priority").default("medium").notNull(),
  status: complaintStatusEnum("status").default("submitted").notNull(),
  location: varchar("location"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Complaint attachments table
export const complaintAttachments = pgTable("complaint_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: varchar("complaint_id").notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Complaint history/timeline table
export const complaintHistory = pgTable("complaint_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: varchar("complaint_id").notNull(),
  actorId: varchar("actor_id").notNull(),
  action: varchar("action").notNull(),
  description: text("description"),
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(),
  isRead: boolean("is_read").default(false),
  relatedComplaintId: varchar("related_complaint_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table for real-time communication
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: varchar("complaint_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default("text").notNull(), // text, image, file
  attachmentUrl: varchar("attachment_url"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  complaints: many(complaints),
  assignedComplaints: many(complaints, { relationName: "assignedTo" }),
  notifications: many(notifications),
  complaintHistory: many(complaintHistory),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(users, {
    fields: [departments.headId],
    references: [users.id],
  }),
  users: many(users),
  complaints: many(complaints),
}));

export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  user: one(users, {
    fields: [complaints.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [complaints.departmentId],
    references: [departments.id],
  }),
  assignedTo: one(users, {
    fields: [complaints.assignedToId],
    references: [users.id],
    relationName: "assignedTo",
  }),
  attachments: many(complaintAttachments),
  history: many(complaintHistory),
  chatMessages: many(chatMessages),
}));

export const complaintAttachmentsRelations = relations(complaintAttachments, ({ one }) => ({
  complaint: one(complaints, {
    fields: [complaintAttachments.complaintId],
    references: [complaints.id],
  }),
}));

export const complaintHistoryRelations = relations(complaintHistory, ({ one }) => ({
  complaint: one(complaints, {
    fields: [complaintHistory.complaintId],
    references: [complaints.id],
  }),
  actor: one(users, {
    fields: [complaintHistory.actorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedComplaint: one(complaints, {
    fields: [notifications.relatedComplaintId],
    references: [complaints.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  complaint: one(complaints, {
    fields: [chatMessages.complaintId],
    references: [complaints.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplaintSchema = createInsertSchema(complaints, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertComplaintAttachmentSchema = createInsertSchema(complaintAttachments, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertComplaintHistorySchema = createInsertSchema(complaintHistory, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  id: z.string().optional(),
  createdAt: z.date().optional(),
  editedAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type ComplaintAttachment = typeof complaintAttachments.$inferSelect;
export type InsertComplaintAttachment = z.infer<typeof insertComplaintAttachmentSchema>;
export type ComplaintHistory = typeof complaintHistory.$inferSelect;
export type InsertComplaintHistory = z.infer<typeof insertComplaintHistorySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Extended types for API responses
export type ComplaintWithDetails = Complaint & {
  user?: User;
  department?: Department;
  assignedTo?: User;
  attachments?: ComplaintAttachment[];
  history?: (ComplaintHistory & { actor?: User })[];
  chatMessages?: (ChatMessage & { sender?: User })[];
};
