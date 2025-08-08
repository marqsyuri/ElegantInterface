import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  professionalRegistration: varchar("professional_registration"),
  specialties: text("specialties"),
  clinicName: varchar("clinic_name"),
  clinicCnpj: varchar("clinic_cnpj"),
  clinicAddress: text("clinic_address"),
  clinicPhone: varchar("clinic_phone"),
  clinicWhatsapp: varchar("clinic_whatsapp"),
  publicLink: varchar("public_link").unique(), // Unique identifier for client access
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business Hours table
export const businessHours = pgTable("business_hours", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  dayOfWeek: varchar("day_of_week").notNull(), // monday, tuesday, etc.
  isOpen: boolean("is_open").default(true),
  openTime: varchar("open_time"), // HH:MM format
  closeTime: varchar("close_time"), // HH:MM format
  breakStartTime: varchar("break_start_time"), // Optional lunch break
  breakEndTime: varchar("break_end_time"), // Optional lunch break
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  cpf: varchar("cpf"),
  phone: varchar("phone"),
  email: varchar("email"),
  birthDate: date("birth_date"),
  profileImage: text("profile_image"), // base64 encoded image
  healthHistory: text("health_history"),
  isActive: boolean("is_active").default(true),
  loyaltyPoints: integer("loyalty_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }),
  category: varchar("category").notNull().default("General"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procedures table
export const procedures = pgTable("procedures", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  duration: integer("duration"), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }).default('0'),
  materials: jsonb("materials").$type<{ materialId: number; quantity: number }[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceId: integer("service_id").notNull(),
  serviceType: varchar("service_type").notNull().default("service"), // "service" or "procedure"
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(60), // in minutes
  status: varchar("status").notNull().default("pending"), // pending, confirmed, scheduled, completed, cancelled
  notes: text("notes"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default('0'),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  paymentStatus: varchar("payment_status").default("pending"), // pending, partial, paid
  beforeImages: jsonb("before_images").$type<string[]>().default([]), // array of image URLs
  afterImages: jsonb("after_images").$type<string[]>().default([]), // array of image URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// Clinical records table
export const clinicalRecords = pgTable("clinical_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  procedureId: integer("procedure_id").references(() => procedures.id),
  procedureDate: date("procedure_date").notNull(),
  procedure: varchar("procedure").notNull(),
  observations: text("observations"),
  clientName: varchar("client_name"),
  clientPhone: varchar("client_phone"),
  clientEmail: varchar("client_email"),
  serviceRequested: varchar("service_requested"),
  preferredDate: varchar("preferred_date"),
  preferredTime: varchar("preferred_time"),
  notes: text("notes"),
  resultRating: integer("result_rating"), // 1-5 scale
  beforeImages: jsonb("before_images"), // array of image URLs
  afterImages: jsonb("after_images"), // array of image URLs
  nextAppointment: date("next_appointment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  type: varchar("type").notNull(), // income, expense
  description: varchar("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionDate: date("transaction_date").notNull(),
  category: varchar("category"),
  isPaid: boolean("is_paid").default(false),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table for client communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  type: varchar("type").notNull(), // manual, automatic
  channel: varchar("channel").notNull(), // whatsapp, sms, email
  content: text("content").notNull(),
  isScheduled: boolean("is_scheduled").default(false),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  status: varchar("status").default("pending"), // pending, sent, delivered, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Client feedback table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory/Materials table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemName: varchar("item_name").notNull(),
  category: varchar("category").notNull(), // epi, material, product
  currentStock: integer("current_stock").default(0),
  minStock: integer("min_stock").default(0),
  unit: varchar("unit").notNull(), // pieces, boxes, bottles, etc
  lastRestocked: date("last_restocked"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty packages table
export const loyaltyPackages = pgTable("loyalty_packages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  services: jsonb("services"), // array of service IDs and quantities
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  discountPercentage: integer("discount_percentage"),
  validityDays: integer("validity_days"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client packages (purchased packages)
export const clientPackages = pgTable("client_packages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  packageId: integer("package_id").notNull().references(() => loyaltyPackages.id),
  purchaseDate: date("purchase_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  sessionsUsed: integer("sessions_used").default(0),
  totalSessions: integer("total_sessions").notNull(),
  status: varchar("status").default("active"), // active, expired, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff management table
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  role: varchar("role").notNull(), // 'therapist', 'receptionist', 'manager'
  specialties: jsonb("specialties").$type<string[]>().default([]),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0"), // percentage
  isActive: boolean("is_active").default(true),
  startDate: date("start_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff schedules table
export const staffSchedules = pgTable("staff_schedules", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  dayOfWeek: varchar("day_of_week").notNull(), // 'monday', 'tuesday', etc.
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  type: varchar("type").notNull(), // 'reminder', 'confirmation', 'marketing', 'low_stock'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  channel: varchar("channel").notNull(), // 'email', 'sms', 'push', 'in_app'
  status: varchar("status").default("pending"), // 'pending', 'sent', 'failed'
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketing campaigns table
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'email', 'sms', 'promotion'
  subject: varchar("subject"),
  content: text("content").notNull(),
  targetAudience: varchar("target_audience").notNull(), // 'all', 'vip', 'inactive', 'birthday'
  status: varchar("status").default("draft"), // 'draft', 'scheduled', 'sent', 'paused'
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});



// Payment transactions table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("NZD"),
  method: varchar("method").notNull(), // 'cash', 'eftpos', 'credit_card', 'paywave', 'app_payment'
  status: varchar("status").default("pending"), // 'pending', 'completed', 'failed', 'refunded'
  transactionId: varchar("transaction_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media integration table
export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  platform: varchar("platform").notNull(), // 'facebook', 'instagram', 'google_business'
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  postType: varchar("post_type").notNull(), // 'promotion', 'before_after', 'testimonial', 'tip'
  status: varchar("status").default("draft"), // 'draft', 'scheduled', 'published', 'failed'
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  engagement: jsonb("engagement").$type<{likes?: number, comments?: number, shares?: number}>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  services: many(services),
  appointments: many(appointments),
  clinicalRecords: many(clinicalRecords),
  transactions: many(transactions),
  messages: many(messages),
  feedback: many(feedback),
  inventory: many(inventory),
  loyaltyPackages: many(loyaltyPackages),
  clientPackages: many(clientPackages),
  staff: many(staff),
  notifications: many(notifications),
  marketingCampaigns: many(marketingCampaigns),

  payments: many(payments),
  socialMediaPosts: many(socialMediaPosts),
  businessHours: many(businessHours),
}));

export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  user: one(users, { fields: [businessHours.userId], references: [users.id] }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  appointments: many(appointments),
  clinicalRecords: many(clinicalRecords),
  transactions: many(transactions),
  messages: many(messages),
  feedback: many(feedback),
  clientPackages: many(clientPackages),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  user: one(users, { fields: [services.userId], references: [users.id] }),
  appointments: many(appointments),
}));

export const proceduresRelations = relations(procedures, ({ one }) => ({
  user: one(users, { fields: [procedures.userId], references: [users.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  client: one(clients, { fields: [appointments.clientId], references: [clients.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const clinicalRecordsRelations = relations(clinicalRecords, ({ one }) => ({
  user: one(users, { fields: [clinicalRecords.userId], references: [users.id] }),
  client: one(clients, { fields: [clinicalRecords.clientId], references: [clients.id] }),
  appointment: one(appointments, { fields: [clinicalRecords.appointmentId], references: [appointments.id] }),
  procedure: one(procedures, { fields: [clinicalRecords.procedureId], references: [procedures.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  client: one(clients, { fields: [transactions.clientId], references: [clients.id] }),
  appointment: one(appointments, { fields: [transactions.appointmentId], references: [appointments.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  client: one(clients, { fields: [messages.clientId], references: [clients.id] }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
  client: one(clients, { fields: [feedback.clientId], references: [clients.id] }),
  appointment: one(appointments, { fields: [feedback.appointmentId], references: [appointments.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, { fields: [inventory.userId], references: [users.id] }),
}));

export const loyaltyPackagesRelations = relations(loyaltyPackages, ({ one, many }) => ({
  user: one(users, { fields: [loyaltyPackages.userId], references: [users.id] }),
  clientPackages: many(clientPackages),
}));

export const clientPackagesRelations = relations(clientPackages, ({ one }) => ({
  user: one(users, { fields: [clientPackages.userId], references: [users.id] }),
  client: one(clients, { fields: [clientPackages.clientId], references: [clients.id] }),
  package: one(loyaltyPackages, { fields: [clientPackages.packageId], references: [loyaltyPackages.id] }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, { fields: [staff.userId], references: [users.id] }),
  schedules: many(staffSchedules),
}));

export const staffSchedulesRelations = relations(staffSchedules, ({ one }) => ({
  staff: one(staff, { fields: [staffSchedules.staffId], references: [staff.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  client: one(clients, { fields: [notifications.clientId], references: [clients.id] }),
  appointment: one(appointments, { fields: [notifications.appointmentId], references: [appointments.id] }),
}));

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one }) => ({
  user: one(users, { fields: [marketingCampaigns.userId], references: [users.id] }),
}));



export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
  appointment: one(appointments, { fields: [payments.appointmentId], references: [appointments.id] }),
}));

export const socialMediaPostsRelations = relations(socialMediaPosts, ({ one }) => ({
  user: one(users, { fields: [socialMediaPosts.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertClinicalRecordSchema = createInsertSchema(clinicalRecords).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyPackageSchema = createInsertSchema(loyaltyPackages).omit({
  id: true,
  createdAt: true,
});

export const insertClientPackageSchema = createInsertSchema(clientPackages).omit({
  id: true,
  createdAt: true,
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.preprocess((val) => {
    if (typeof val === "number") return val.toString();
    if (val === "" || val === null || val === undefined) return "0";
    return val;
  }, z.string()),
});

export const updateProcedureSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().optional(),
  price: z.preprocess((val) => {
    if (typeof val === "number") return val.toString();
    if (val === "" || val === null || val === undefined) return "0";
    return val;
  }, z.string()).optional(),
  materials: z.array(z.object({
    materialId: z.number(),
    quantity: z.number()
  })).optional(),
  isActive: z.boolean().optional(),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffScheduleSchema = createInsertSchema(staffSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
});



export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessHoursSchema = createInsertSchema(businessHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type ClinicalRecord = typeof clinicalRecords.$inferSelect;
export type InsertClinicalRecord = z.infer<typeof insertClinicalRecordSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type LoyaltyPackage = typeof loyaltyPackages.$inferSelect;
export type InsertLoyaltyPackage = z.infer<typeof insertLoyaltyPackageSchema>;
export type ClientPackage = typeof clientPackages.$inferSelect;
export type InsertClientPackage = z.infer<typeof insertClientPackageSchema>;
export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type StaffSchedule = typeof staffSchedules.$inferSelect;
export type InsertStaffSchedule = z.infer<typeof insertStaffScheduleSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;


export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;
export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
