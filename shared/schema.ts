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

export type NotificationMetadata = {
  clientName: string;
  appointmentDate: string;
  appointmentTime?: string | null;
  procedures: Array<{
    id: number;
    name: string;
    duration?: number | null;
    price?: string | null;
  }>;
  staffName?: string | null;
};

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Companies table - Empresas/Salões
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // Nome da empresa/salão
  cnpj: varchar("cnpj"), // CNPJ (opcional)
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table - converted to local authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // MD5 hash
  role: varchar("role").default("admin"), // admin, staff (was showing as resize varchar(50) -> varchar)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  heroImageUrl: varchar("hero_image_url"), // Hero image for client booking page
  loginBannerUrl: varchar("login_banner_url"), // Banner image for login screen
  dashboardBannerUrl: varchar("dashboard_banner_url"), // Banner image for dashboard
  professionalRegistration: varchar("professional_registration"),
  specialties: text("specialties"),
  clinicName: varchar("clinic_name"),
  clinicCnpj: varchar("clinic_cnpj"),
  clinicAddress: text("clinic_address"),
  clinicPhone: varchar("clinic_phone"),
  clinicWhatsapp: varchar("clinic_whatsapp"),
  publicLink: varchar("public_link").unique(), // Unique identifier for client access
  isActive: boolean("is_active").default(true),

  // role: varchar("role").default("admin"), // moved up to restore order if matters, or just ensuring it exists
  companyId: integer("company_id").references(() => companies.id), // ID da empresa (obrigatório para todos)
  parentUserId: integer("parent_user_id").references(() => users.id), // DEPRECATED: Mantido para compatibilidade durante migração
  maxStaffCount: integer("max_staff_count").default(10), // Quantidade máxima de staffs permitidos por salão
  inactivityDays: integer("inactivity_days").default(7), // Days before marking leads for follow-up
  reminderHours: integer("reminder_hours").default(2), // Hours before appointment to send reminder
  reminderStartTime: varchar("reminder_start_time").default("18:00"), // Start time for sending reminders
  reminderEndTime: varchar("reminder_end_time").default("20:00"), // End time for sending reminders
  language: varchar("language").default("pt-BR"), // User preferred language: pt-BR, en-NZ, en-US, es-ES
  currency: varchar("currency").default("BRL"), // User preferred currency: BRL, NZD, USD, EUR, GBP, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // product, service, expense
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  contactName: varchar("contact_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Taxes table
export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // percentage
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procedure Taxes table
export const procedureTaxes = pgTable("procedure_taxes", {
  id: serial("id").primaryKey(),
  procedureId: integer("procedure_id")
    .notNull()
    .references(() => procedures.id, { onDelete: "cascade" }),
  taxId: integer("tax_id")
    .notNull()
    .references(() => taxes.id),
});

// Business Hours table
export const businessHours = pgTable("business_hours", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  cpf: varchar("cpf"),
  phone: varchar("phone"),
  email: varchar("email"),
  password: varchar("password"), // MD5 hashed password for client login (nullable)
  birthDate: date("birth_date"),
  profileImage: text("profile_image"), // base64 encoded image
  healthHistory: text("health_history"),
  isActive: boolean("is_active").default(true),
  loyaltyPoints: integer("loyalty_points").default(0),
  notifySms: boolean("notify_sms").default(false),
  notifyWhatsapp: boolean("notify_whatsapp").default(false),
  notifyPhone: boolean("notify_phone").default(false),
  lastLogin: timestamp("last_login"), // Track last login for client portal
  datahr: timestamp("datahr"), // Data e hora do último agendamento realizado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inactive Clients table - populated daily by scheduled job
export const inactiveClients = pgTable("inactive_clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  lastProcedure: varchar("last_procedure"),
  lastAppointmentDate: timestamp("last_appointment_date"),
  contactPreference: varchar("contact_preference"), // sms, whatsapp, phone
  status: integer("status").default(0), // 0 = pending contact, 1 = contacted, 2 = returned, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  duration: integer("duration"), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  materials: jsonb("materials")
    .$type<{ materialId: number; quantity: number }[]>()
    .default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Procedure products (consumo de insumos por procedimento)
export const procedureProducts = pgTable("procedure_products", {
  id: serial("id").primaryKey(),
  procedureId: integer("procedure_id").notNull().references(() => procedures.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unit: varchar("unit").default("un"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type ProcedureProduct = typeof procedureProducts.$inferSelect;
export type InsertProcedureProduct = typeof procedureProducts.$inferInsert;

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  serviceId: integer("service_id"), // nullable for backwards compatibility
  serviceType: varchar("service_type").notNull().default("service"), // "service" or "procedure"
  selectedProcedures: jsonb("selected_procedures")
    .$type<string[]>()
    .default([]), // DEPRECATED: use appointment_procedures table
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(60), // DEPRECATED: use total_duration
  status: varchar("status").notNull().default("pending"), // pending, confirmed, scheduled, completed, cancelled
  notes: text("notes"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default(
    "0"
  ), // DEPRECATED: use total_price
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  paymentStatus: varchar("payment_status").default("pending"), // pending, partial, paid
  beforeImages: jsonb("before_images").$type<string[]>().default([]), // array of image URLs
  afterImages: jsonb("after_images").$type<string[]>().default([]), // array of image URLs
  // New calculated fields for multiple procedures
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  totalDuration: integer("total_duration"), // in minutes
  procedureCount: integer("procedure_count").default(0),
  waitlist: boolean("waitlist").default(false),
  staffId: integer("staff_id").references(() => staff.id), // assigned professional
  createdAt: timestamp("created_at").defaultNow(),
  professionalId: integer("professional_id"), // DEPRECATED: use staff_id
  selectedProducts: jsonb("selected_products")
    .$type<{ id: number; quantity: number }[]>()
    .default([]), // DEPRECATED: use appointment_products
});

// Appointment Procedures junction table (many-to-many)
export const appointmentProcedures = pgTable("appointment_procedures", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  procedureId: integer("procedure_id")
    .notNull()
    .references(() => procedures.id),
  staffId: integer("staff_id").references(() => staff.id), // Professional who performed this specific procedure
  order: integer("order").default(0), // execution order
  // Snapshot fields - preserve values at booking time
  procedureName: varchar("procedure_name").notNull(),
  procedureCategory: varchar("procedure_category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  materials: jsonb("materials")
    .$type<{ materialId: number; quantity: number }[]>()
    .default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment Products junction table (many-to-many)
export const appointmentProducts = pgTable("appointment_products", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price charged (may include discount)
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }), // Catalog price at time of sale
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment Reminders table - populated hourly by scheduled job
export const appointmentReminders = pgTable("appointment_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => appointments.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: varchar("appointment_time").notNull(),
  procedureName: varchar("procedure_name"),
  contactPreference: varchar("contact_preference"), // sms, whatsapp, phone
  status: integer("status").default(0), // 0 = pending, 1 = sent, 2 = confirmed, 3 = cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clinical records table
export const clinicalRecords = pgTable("clinical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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

// Campaigns table for marketing campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  objective: text("objective"),
  channel: varchar("channel").notNull(), // email, whatsapp
  messageContent: text("message_content").notNull(),
  status: varchar("status").default("draft"), // draft, sending, completed, cancelled
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table for client communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory/Materials table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  itemName: varchar("item_name").notNull(),
  category: varchar("category").notNull(), // epi, material, product
  currentStock: integer("current_stock").default(0),
  minStock: integer("min_stock").default(0),
  unit: varchar("unit").notNull(), // pieces, boxes, bottles, etc
  lastRestocked: date("last_restocked"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table (for retail/sale)
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  code: varchar("code").notNull(),
  description: text("description"),
  categoryId: integer("category_id"), // references product_categories
  supplierId: integer("supplier_id"), // references suppliers
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  currentStock: integer("current_stock").default(0),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock").default(0),
  unit: varchar("unit").notNull(),
  location: varchar("location"),
  barcode: varchar("barcode"),
  weight: decimal("weight", { precision: 10, scale: 2 }), // was numeric(8,3) -> numeric(10,2) in db:push log
  dimensions: jsonb("dimensions"),
  tags: jsonb("tags").$type<string[]>(),
  images: jsonb("images").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty packages table
export const loyaltyPackages = pgTable("loyalty_packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  packageId: integer("package_id")
    .notNull()
    .references(() => loyaltyPackages.id),
  purchaseDate: date("purchase_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  sessionsUsed: integer("sessions_used").default(0),
  totalSessions: integer("total_sessions").notNull(),
  status: varchar("status").default("active"), // active, expired, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Packages table (new system with service and money balances)
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  name: varchar("name").notNull(),
  description: text("description"),
  services: jsonb("services")
    .$type<Array<{ procedureId: number; quantity: number; price: number }>>()
    .default([]), // Array of selected services with quantities
  products: jsonb("products")
    .$type<Array<{ productId: number; quantity: number; price: number }>>()
    .default([]), // Array of selected products with quantities
  serviceBalance: integer("service_balance").default(0), // Hidden service balance (sum of service quantities)
  moneyBalance: decimal("money_balance", { precision: 10, scale: 2 }).default(
    "0"
  ), // Hidden money balance (sum of product prices * quantities)
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // Total price calculated live
  validityStartDate: date("validity_start_date").notNull(), // Period start
  validityEndDate: date("validity_end_date").notNull(), // Period end
  status: varchar("status").default("active"), // active, expired, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty Settings table
export const loyaltySettings = pgTable("loyalty_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  pointsPerDollar: decimal("points_per_dollar", {
    precision: 10,
    scale: 2,
  }).default("1.00"), // Points earned per $1 spent
  discountPerHundredPoints: decimal("discount_per_hundred_points", {
    precision: 10,
    scale: 2,
  }).default("10.00"), // Discount value per 100 points
  birthdayBonusPoints: integer("birthday_bonus_points").default(50),
  referralBonusPoints: integer("referral_bonus_points").default(30),
  bronzeThreshold: integer("bronze_threshold").default(0),
  silverThreshold: integer("silver_threshold").default(300),
  goldThreshold: integer("gold_threshold").default(600),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff management table - Funcionários do sistema com acesso de login
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id), // Admin/empresa que possui este staff
  companyId: integer("company_id").references(() => companies.id), // ID da empresa (pode ser usado em vez de userId)
  // Campos de login para staff fazer login no sistema
  username: varchar("username").unique(), // Username único para login (nullable para staff antigos sem login)
  password: varchar("password"), // MD5 hash da senha (nullable para staff antigos sem login)
  // Informações do funcionário
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  irdNumber: varchar("ird_number"), // NZ tax number
  role: varchar("role").notNull(), // 'therapist', 'receptionist', 'manager' (função do funcionário)
  accessLevel: varchar("access_level").default("staff"), // 'admin' (vê tudo) ou 'staff' (só agendamentos)
  specialties: jsonb("specialties").$type<string[]>().default([]),
  commissionRate: decimal("commission_rate", {
    precision: 5,
    scale: 2,
  }).default("0"), // percentage
  hourlyPayment: boolean("hourly_payment").default(false), // paid by hours worked
  isActive: boolean("is_active").default(true),
  startDate: date("start_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Fields found missing in db:push
  profileImage: text("profile_image"),
  bio: text("bio"),
  experience: varchar("experience"),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("5.0"),
  totalReviews: integer("total_reviews").default(0),
  isAvailable: boolean("is_available").default(true),
});

// Staff-Procedures junction table (many-to-many: which procedures each staff can perform)
export const staffProcedures = pgTable("staff_procedures", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  procedureId: integer("procedure_id")
    .notNull()
    .references(() => procedures.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointment-Staff junction table (many-to-many: multiple staff per appointment)
export const appointmentStaff = pgTable("appointment_staff", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id),
  isPrimary: boolean("is_primary").default(false), // Indicates the primary professional
  role: varchar("role"), // Optional: 'main', 'assistant', 'supervisor', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff schedules table
export const staffSchedules = pgTable("staff_schedules", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id),
  dayOfWeek: varchar("day_of_week").notNull(), // 'monday', 'tuesday', etc.
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  channel: varchar("channel").notNull().default("in_app"),
  status: varchar("status").notNull().default("unread"),
  metadata: jsonb("metadata").$type<NotificationMetadata>().default({
    clientName: "",
    appointmentDate: "1970-01-01T00:00:00.000Z",
    appointmentTime: null,
    procedures: [],
    staffName: null,
  }),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketing campaigns table
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  platform: varchar("platform").notNull(), // 'facebook', 'instagram', 'google_business'
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  postType: varchar("post_type").notNull(), // 'promotion', 'before_after', 'testimonial', 'tip'
  status: varchar("status").default("draft"), // 'draft', 'scheduled', 'published', 'failed'
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  engagement: jsonb("engagement").$type<{
    likes?: number;
    comments?: number;
    shares?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Banners table
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  images: jsonb("images").$type<string[]>().notNull(),
  mode: varchar("mode").notNull().default("fixed"), // 'carousel' | 'fixed'
  duration: integer("duration").default(5), // segundos para transição
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
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
  banners: many(banners),
  packages: many(packages),
  loyaltySettings: one(loyaltySettings, {
    fields: [users.id],
    references: [loyaltySettings.userId],
  }),
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
  packages: many(packages),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  user: one(users, { fields: [services.userId], references: [users.id] }),
  appointments: many(appointments),
}));

export const proceduresRelations = relations(procedures, ({ one, many }) => ({
  user: one(users, { fields: [procedures.userId], references: [users.id] }),
  appointmentProcedures: many(appointmentProcedures),
  staffProcedures: many(staffProcedures),
}));

export const appointmentsRelations = relations(
  appointments,
  ({ one, many }) => ({
    user: one(users, { fields: [appointments.userId], references: [users.id] }),
    client: one(clients, {
      fields: [appointments.clientId],
      references: [clients.id],
    }),
    service: one(services, {
      fields: [appointments.serviceId],
      references: [services.id],
    }),
    staff: one(staff, {
      fields: [appointments.staffId],
      references: [staff.id],
    }), // Mantém para compatibilidade
    appointmentProcedures: many(appointmentProcedures),
    appointmentProducts: many(appointmentProducts), // Nova relação de produtos
    appointmentStaff: many(appointmentStaff), // Nova relação
  })
);

export const appointmentProceduresRelations = relations(
  appointmentProcedures,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [appointmentProcedures.appointmentId],
      references: [appointments.id],
    }),
    procedure: one(procedures, {
      fields: [appointmentProcedures.procedureId],
      references: [procedures.id],
    }),
    staff: one(staff, {
      fields: [appointmentProcedures.staffId],
      references: [staff.id],
    }),
  })
);

export const appointmentProductsRelations = relations(
  appointmentProducts,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [appointmentProducts.appointmentId],
      references: [appointments.id],
    }),
    product: one(products, {
      fields: [appointmentProducts.productId],
      references: [products.id],
    }),
  })
);

export const clinicalRecordsRelations = relations(
  clinicalRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [clinicalRecords.userId],
      references: [users.id],
    }),
    client: one(clients, {
      fields: [clinicalRecords.clientId],
      references: [clients.id],
    }),
    appointment: one(appointments, {
      fields: [clinicalRecords.appointmentId],
      references: [appointments.id],
    }),
    procedure: one(procedures, {
      fields: [clinicalRecords.procedureId],
      references: [procedures.id],
    }),
  })
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
  appointment: one(appointments, {
    fields: [transactions.appointmentId],
    references: [appointments.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  client: one(clients, {
    fields: [messages.clientId],
    references: [clients.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
  client: one(clients, {
    fields: [feedback.clientId],
    references: [clients.id],
  }),
  appointment: one(appointments, {
    fields: [feedback.appointmentId],
    references: [appointments.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, { fields: [inventory.userId], references: [users.id] }),
}));

export const loyaltyPackagesRelations = relations(
  loyaltyPackages,
  ({ one, many }) => ({
    user: one(users, {
      fields: [loyaltyPackages.userId],
      references: [users.id],
    }),
    clientPackages: many(clientPackages),
  })
);

export const clientPackagesRelations = relations(clientPackages, ({ one }) => ({
  user: one(users, { fields: [clientPackages.userId], references: [users.id] }),
  client: one(clients, {
    fields: [clientPackages.clientId],
    references: [clients.id],
  }),
  package: one(loyaltyPackages, {
    fields: [clientPackages.packageId],
    references: [loyaltyPackages.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, { fields: [staff.userId], references: [users.id] }),
  schedules: many(staffSchedules),
  appointments: many(appointments), // Mantém para compatibilidade
  appointmentStaff: many(appointmentStaff), // Nova relação
  staffProcedures: many(staffProcedures), // Nova relação
}));

export const staffSchedulesRelations = relations(staffSchedules, ({ one }) => ({
  staff: one(staff, {
    fields: [staffSchedules.staffId],
    references: [staff.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  client: one(clients, {
    fields: [notifications.clientId],
    references: [clients.id],
  }),
  appointment: one(appointments, {
    fields: [notifications.appointmentId],
    references: [appointments.id],
  }),
}));

export const marketingCampaignsRelations = relations(
  marketingCampaigns,
  ({ one }) => ({
    user: one(users, {
      fields: [marketingCampaigns.userId],
      references: [users.id],
    }),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
}));

export const socialMediaPostsRelations = relations(
  socialMediaPosts,
  ({ one }) => ({
    user: one(users, {
      fields: [socialMediaPosts.userId],
      references: [users.id],
    }),
  })
);

export const bannersRelations = relations(banners, ({ one }) => ({
  user: one(users, { fields: [banners.userId], references: [users.id] }),
}));

export const packagesRelations = relations(packages, ({ one }) => ({
  user: one(users, { fields: [packages.userId], references: [users.id] }),
  client: one(clients, {
    fields: [packages.clientId],
    references: [clients.id],
  }),
}));

export const loyaltySettingsRelations = relations(
  loyaltySettings,
  ({ one }) => ({
    user: one(users, {
      fields: [loyaltySettings.userId],
      references: [users.id],
    }),
  })
);

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
  datahr: true, // Omit datahr from insert - it's only updated when appointments are created
});

export const insertInactiveClientSchema = createInsertSchema(
  inactiveClients
).omit({
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

export const insertAppointmentProcedureSchema = createInsertSchema(
  appointmentProcedures
).omit({
  id: true,
  createdAt: true,
});

export const insertClinicalRecordSchema = createInsertSchema(
  clinicalRecords
).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = createInsertSchema(products)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .partial();

export const insertLoyaltyPackageSchema = createInsertSchema(
  loyaltyPackages
).omit({
  id: true,
  createdAt: true,
});

export const insertClientPackageSchema = createInsertSchema(
  clientPackages
).omit({
  id: true,
  createdAt: true,
});

export const insertProcedureSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string(),
    duration: z.number(),
    materials: z
      .array(
        z.object({
          materialId: z.number(),
          quantity: z.number(),
        })
      )
      .default([]),
    isActive: z.boolean().default(true),
  })
  .passthrough();

export const updateProcedureSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    duration: z.number().optional(),
    materials: z
      .array(
        z.object({
          materialId: z.number(),
          quantity: z.number(),
        })
      )
      .optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough();

export const insertStaffSchema = createInsertSchema(staff)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    commissionRate: z.number().optional(),
  });

export const insertStaffScheduleSchema = createInsertSchema(
  staffSchedules
).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readAt: true,
  isRead: true,
});

export const insertMarketingCampaignSchema = createInsertSchema(
  marketingCampaigns
).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertSocialMediaPostSchema = createInsertSchema(
  socialMediaPosts
).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessHoursSchema = createInsertSchema(businessHours).omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  }
);

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltySettingsSchema = createInsertSchema(
  loyaltySettings
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;

// Integrations table
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name").notNull(),
  url: text("url").notNull(),
  authType: varchar("auth_type").notNull(), // Bearer, Basic, API Key, Custom, etc.
  authData: text("auth_data"), // JSON string with auth credentials
  username: varchar("username"), // Username for authentication
  password: varchar("password"), // Password for authentication
  testPayload: text("test_payload"), // JSON payload for testing
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations, {
  name: z.string().min(1, "Nome é obrigatório"),
  url: z.string().url("URL inválida"),
  authType: z.string().min(1, "Tipo de autenticação é obrigatório"),
  authData: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  testPayload: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type AppointmentProcedure = typeof appointmentProcedures.$inferSelect;
export type InsertAppointmentProcedure = z.infer<
  typeof insertAppointmentProcedureSchema
>;
export type ClinicalRecord = typeof clinicalRecords.$inferSelect;
export type InsertClinicalRecord = z.infer<typeof insertClinicalRecordSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type LoyaltyPackage = typeof loyaltyPackages.$inferSelect;
export type InsertLoyaltyPackage = z.infer<typeof insertLoyaltyPackageSchema>;
export type ClientPackage = typeof clientPackages.$inferSelect;
export type InsertClientPackage = z.infer<typeof insertClientPackageSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type LoyaltySettings = typeof loyaltySettings.$inferSelect;
export type InsertLoyaltySettings = z.infer<typeof insertLoyaltySettingsSchema>;
export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type StaffSchedule = typeof staffSchedules.$inferSelect;
export type InsertStaffSchedule = z.infer<typeof insertStaffScheduleSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<
  typeof insertMarketingCampaignSchema
>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;
export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;

// Login schema for authentication
export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUser = z.infer<typeof loginUserSchema>;

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  saleDate: date("sale_date").notNull(),
  products: jsonb("products")
    .$type<
      { productId: number; quantity: number; price: number; name: string }[]
    >()
    .notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", {
    precision: 5,
    scale: 2,
  }).default("0"),
  discountAmount: decimal("discount_amount", {
    precision: 10,
    scale: 2,
  }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const salesRelations = relations(sales, ({ one }) => ({
  user: one(users, { fields: [sales.userId], references: [users.id] }),
  client: one(clients, { fields: [sales.clientId], references: [clients.id] }),
}));

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export const insertAppointmentProductSchema = createInsertSchema(appointmentProducts).omit({ 
  id: true,
  createdAt: true 
});

export type AppointmentProduct = typeof appointmentProducts.$inferSelect;
export type InsertAppointmentProduct = typeof appointmentProducts.$inferInsert;

export type AppointmentStaff = typeof appointmentStaff.$inferSelect;
export type InsertAppointmentStaff = typeof appointmentStaff.$inferInsert;

export type StaffProcedure = typeof staffProcedures.$inferSelect;
export type InsertStaffProcedure = typeof staffProcedures.$inferInsert;
