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
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: varchar("status").notNull().default("scheduled"), // scheduled, confirmed, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clinical records table
export const clinicalRecords = pgTable("clinical_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  procedureDate: date("procedure_date").notNull(),
  procedure: varchar("procedure").notNull(),
  observations: text("observations"),
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

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  client: one(clients, { fields: [appointments.clientId], references: [clients.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const clinicalRecordsRelations = relations(clinicalRecords, ({ one }) => ({
  user: one(users, { fields: [clinicalRecords.userId], references: [users.id] }),
  client: one(clients, { fields: [clinicalRecords.clientId], references: [clients.id] }),
  appointment: one(appointments, { fields: [clinicalRecords.appointmentId], references: [appointments.id] }),
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
