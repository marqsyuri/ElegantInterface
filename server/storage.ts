import {
  users,
  clients,
  inactiveClients,
  appointmentReminders,
  services,
  appointments,
  appointmentProcedures,
  clinicalRecords,
  transactions,
  campaigns,
  messages,
  feedback,
  inventory,
  loyaltyPackages,
  clientPackages,
  procedures,
  staff,
  staffSchedules,
  notifications,
  marketingCampaigns,
  banners,
  packages,
  loyaltySettings,
  payments,
  socialMediaPosts,
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Service,
  type InsertService,
  type Appointment,
  type InsertAppointment,
  type AppointmentProcedure,
  type InsertAppointmentProcedure,
  type ClinicalRecord,
  type InsertClinicalRecord,
  type Transaction,
  type InsertTransaction,
  type Campaign,
  type InsertCampaign,
  type Message,
  type InsertMessage,
  type Feedback,
  type InsertFeedback,
  type Inventory,
  type InsertInventory,
  type LoyaltyPackage,
  type InsertLoyaltyPackage,
  type ClientPackage,
  type InsertClientPackage,
  type Procedure,
  type InsertProcedure,
  type Staff,
  type InsertStaff,
  type StaffSchedule,
  type InsertStaffSchedule,
  type Notification,
  type InsertNotification,
  type NotificationMetadata,
  type MarketingCampaign,
  type InsertMarketingCampaign,

  type Payment,
  type InsertPayment,
  type SocialMediaPost,
  type InsertSocialMediaPost,
  businessHours,
  type BusinessHours,
  type InsertBusinessHours,
  type Banner,
  type InsertBanner,
  type Package,
  type InsertPackage,
  type LoyaltySettings,
  type InsertLoyaltySettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, gte, lte, sql, inArray, isNotNull } from "drizzle-orm";
import session from "express-session";

// Interface for storage operations
export interface IStorage {
  // User operations (converted to local auth)
  getUser(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPublicLink(publicLink: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: number, user: Partial<UpsertUser>): Promise<User>;
  updateUserProfileImage(userId: number, profileImageUrl: string): Promise<void>;
  updateUserHeroImage(userId: number, heroImageUrl: string): Promise<void>;
  
  // Client operations
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number, userId: number): Promise<Client | undefined>;
  getClientAppointments(userId: number, clientId: number): Promise<Appointment[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  
  // Service operations
  getServices(userId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Appointment operations
  getAppointments(userId: number, date?: Date): Promise<(Appointment & { client: Client; service: any })[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  
  // Clinical records operations
  getClinicalRecords(userId: string, clientId?: number): Promise<(ClinicalRecord & { client: Client })[]>;
  createClinicalRecord(record: InsertClinicalRecord): Promise<ClinicalRecord>;
  
  // Transaction operations
  getTransactions(userId: string, startDate?: Date, endDate?: Date): Promise<(Transaction & { client?: Client })[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getDashboardStats(userId: string): Promise<{
    todayAppointments: number;
    dailyRevenue: string;
    activeClients: number;
    satisfaction: string;
    monthlyRevenue: string;
    monthlyExpenses: string;
    netProfit: string;
  }>;
  
  // Message operations
  getMessages(userId: string): Promise<(Message & { client?: Client })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Feedback operations
  getFeedback(userId: string): Promise<(Feedback & { client: Client })[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Inventory operations
  getInventory(userId: string): Promise<Inventory[]>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory>;
  
  // Loyalty operations
  getLoyaltyPackages(userId: string): Promise<LoyaltyPackage[]>;
  createLoyaltyPackage(packageData: InsertLoyaltyPackage): Promise<LoyaltyPackage>;
  getClientPackages(userId: string): Promise<(ClientPackage & { client: Client; package: LoyaltyPackage })[]>;
  
  // Staff operations
  getStaff(userId: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  getStaffSchedules(userId: string): Promise<StaffSchedule[]>;
  createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule>;
  
  // Payslip operations
  getPayslipData(userId: string, staffId?: number, startDate?: Date, endDate?: Date): Promise<Array<{
    staffId: number;
    staffName: string;
    totalDuration: number;
    appointmentCount: number;
    procedures: Array<{
      procedureName: string;
      procedureCategory: string;
      count: number;
      totalDuration: number;
    }>;
    appointments: Array<{
      id: number;
      appointmentDate: Date;
      clientName: string;
      procedures: Array<{
        procedureName: string;
        duration: number;
      }>;
      totalDuration: number;
    }>;
  }>>;
  
  // Marketing operations
  getMarketingCampaigns(userId: string): Promise<MarketingCampaign[]>;
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  
  // Banner operations
  getBanners(userId: number): Promise<Banner[]>;
  getActiveBanner(userId: number): Promise<Banner | null>;
  getPublicLoginBanner(): Promise<Banner | null>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner>;
  deleteBanner(id: number): Promise<void>;
  
  // Package operations
  getPackages(userId: number): Promise<(Package & { client: Client })[]>;
  getPackage(id: number, userId: number): Promise<(Package & { client: Client }) | null>;
  createPackage(packageData: InsertPackage): Promise<Package>;
  updatePackage(id: number, packageData: Partial<InsertPackage>): Promise<Package>;
  deletePackage(id: number): Promise<void>;
  
  // Loyalty Settings operations
  getLoyaltySettings(userId: number): Promise<LoyaltySettings | null>;
  upsertLoyaltySettings(userId: number, settings: InsertLoyaltySettings): Promise<LoyaltySettings>;
  
  // Loyalty Points calculation
  calculateClientLoyaltyPoints(clientId: number, userId: number): Promise<number>;
  
  // Analytics operations
  getAnalytics(userId: string, dateRange?: string): Promise<any>;
  
  // Business hours operations
  getBusinessHours(userId: string): Promise<BusinessHours[]>;
  upsertBusinessHours(hours: InsertBusinessHours[]): Promise<BusinessHours[]>;
  
  // Profile operations
  updateUserProfileImage(userId: string, profileImageUrl: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Initialize session store synchronously - use memory store for all environments for now
    // PostgreSQL session store can be enabled later with proper synchronous initialization
    this.sessionStore = new session.MemoryStore();
  }

  // User operations (converted to local auth)
  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserByPublicLink(publicLink: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfileImage(userId: number, profileImageUrl: string): Promise<void> {
    await db
      .update(users)
      .set({
        profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserHeroImage(userId: number, heroImageUrl: string): Promise<void> {
    await db
      .update(users)
      .set({
        heroImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Client operations
  async getClients(userId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.createdAt));
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async getClientAppointments(userId: number, clientId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        eq(appointments.clientId, clientId)
      ))
      .orderBy(desc(appointments.appointmentDate));
  }

  // Service operations
  async getServices(userId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.userId, userId), eq(services.isActive, true)))
      .orderBy(asc(services.name));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  // Appointment operations
  async getAppointments(userId: string, date?: Date): Promise<(Appointment & { client: Client; service: any })[]> {
    // First get appointments with clients
    let appointmentQuery = db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        clientId: appointments.clientId,
        serviceId: appointments.serviceId,
        serviceType: appointments.serviceType,
        selectedProcedures: appointments.selectedProcedures,
        appointmentDate: appointments.appointmentDate,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        totalAmount: appointments.totalAmount,
        totalPrice: appointments.totalPrice,
        totalDuration: appointments.totalDuration,
        procedureCount: appointments.procedureCount,
        paidAmount: appointments.paidAmount,
        paymentStatus: appointments.paymentStatus,
        beforeImages: appointments.beforeImages,
        afterImages: appointments.afterImages,
        staffId: appointments.staffId,
        createdAt: appointments.createdAt,
        client: clients,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id));

    let whereConditions = [eq(appointments.userId, userId)];
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereConditions.push(
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay)
      );
    }

    if (whereConditions.length > 1) {
      appointmentQuery = appointmentQuery.where(and(...whereConditions));
    } else {
      appointmentQuery = appointmentQuery.where(whereConditions[0]);
    }
    const appointmentsWithClients = await appointmentQuery.orderBy(asc(appointments.appointmentDate));
    
    console.log(`📅 Storage: Found ${appointmentsWithClients.length} appointments for date ${date ? date.toISOString() : 'all'}`);
    if (date && appointmentsWithClients.length > 0) {
      console.log(`📅 Storage: Sample appointments:`, appointmentsWithClients.slice(0, 3).map((a: any) => ({
        id: a.id,
        appointmentDate: a.appointmentDate,
        staffId: a.staffId,
        clientId: a.clientId
      })));
    }
    
    // Now fetch services and procedures for each appointment
    const result = [];
    for (const appointment of appointmentsWithClients) {
      let service;
      let allProcedures = [];
      let calculatedTotal = '0';
      
      // First, try to get procedures from appointment_procedures table (new multi-procedure system)
      const appointmentProceduresData = await db
        .select()
        .from(appointmentProcedures)
        .where(eq(appointmentProcedures.appointmentId, appointment.id))
        .orderBy(appointmentProcedures.order);
      
      if (appointmentProceduresData.length > 0) {
        // New system: use appointment_procedures table
        allProcedures = appointmentProceduresData.map(ap => ({
          id: ap.procedureId,
          name: ap.procedureName,
          category: ap.procedureCategory,
          price: ap.price,
          duration: ap.duration,
        }));
        // Use the first procedure as the main service for backward compatibility
        service = allProcedures[0];
        // Calculate total from appointment_procedures
        calculatedTotal = allProcedures.reduce((sum, proc) => sum + parseFloat(proc.price || '0'), 0).toFixed(2);
      } else if (appointment.serviceType === 'procedure') {
        // Fallback to old system for backward compatibility
        if (appointment.selectedProcedures && Array.isArray(appointment.selectedProcedures) && appointment.selectedProcedures.length > 0) {
          const procedureIds = appointment.selectedProcedures.map((id: string) => parseInt(id)).filter(id => !isNaN(id));
          if (procedureIds.length > 0) {
            allProcedures = await db
              .select()
              .from(procedures)
              .where(and(
                eq(procedures.userId, userId),
                inArray(procedures.id, procedureIds)
              ));
            service = allProcedures[0] || null;
            calculatedTotal = allProcedures.reduce((sum, proc) => sum + parseFloat(proc.price || '0'), 0).toFixed(2);
          }
        } else if (appointment.serviceId) {
          // Fallback: fetch from procedures table using serviceId
          const [procedure] = await db
            .select()
            .from(procedures)
            .where(and(
              eq(procedures.id, appointment.serviceId),
              eq(procedures.userId, userId)
            ));
          service = procedure || null;
          allProcedures = service ? [service] : [];
          calculatedTotal = service?.price || '0';
        }
      } else if (appointment.serviceId) {
        // Fetch from services table (default)
        const [serviceRecord] = await db
          .select()
          .from(services)
          .where(and(
            eq(services.id, appointment.serviceId),
            eq(services.userId, userId)
          ));
        service = serviceRecord;
        calculatedTotal = service?.price || '0';
      }
      
      result.push({
        ...appointment,
        service: service || { id: appointment.serviceId || 0, name: 'Unknown Service', category: 'Unknown', price: '0' },
        allProcedures: allProcedures,
        // Use totalPrice (new field) if available, otherwise totalAmount, otherwise calculated total from procedures
        totalAmount: appointment.totalPrice || appointment.totalAmount || calculatedTotal
      });
    }
    
    return result as (Appointment & { client: Client; service: any })[];
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment as any).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointment as any)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  // Multiple procedures support
  calculateAppointmentTotals(proceduresList: Procedure[]): { totalPrice: string; totalDuration: number; procedureCount: number } {
    const totalPrice = proceduresList.reduce((sum, proc) => sum + parseFloat(proc.price || '0'), 0).toFixed(2);
    const totalDuration = proceduresList.reduce((sum, proc) => sum + (proc.duration || 0), 0);
    const procedureCount = proceduresList.length;
    
    return { totalPrice, totalDuration, procedureCount };
  }

  async createAppointmentWithProcedures(
    appointmentData: Omit<InsertAppointment, 'totalPrice' | 'totalDuration' | 'procedureCount'>,
    procedureIds: number[],
    userId: number
  ): Promise<{ appointment: Appointment; procedures: AppointmentProcedure[] }> {
    // Fetch all procedures to create snapshots
    const proceduresList = await db
      .select()
      .from(procedures)
      .where(and(
        inArray(procedures.id, procedureIds),
        eq(procedures.userId, userId)
      ));

    if (proceduresList.length === 0) {
      throw new Error('No valid procedures found');
    }

    // Calculate totals
    const { totalPrice, totalDuration, procedureCount } = this.calculateAppointmentTotals(proceduresList);

    // Create appointment with calculated totals
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...appointmentData,
        totalPrice,
        totalDuration,
        procedureCount,
        // Also set totalAmount for backward compatibility with payment system
        totalAmount: totalPrice,
      } as any)
      .returning();

    // Create appointment_procedures records with snapshots
    const appointmentProceduresData: InsertAppointmentProcedure[] = proceduresList.map((proc, index) => ({
      appointmentId: newAppointment.id,
      procedureId: proc.id,
      order: index,
      procedureName: proc.name,
      procedureCategory: proc.category,
      price: proc.price || '0',
      duration: proc.duration || 0,
      materials: proc.materials || [],
    }));

    const createdProcedures = await db
      .insert(appointmentProcedures)
      .values(appointmentProceduresData)
      .returning();

    return { appointment: newAppointment, procedures: createdProcedures };
  }

  async getAppointmentWithProcedures(appointmentId: number, userId: number): Promise<{
    appointment: Appointment;
    procedures: AppointmentProcedure[];
    client: Client;
  } | null> {
    // Get appointment with client
    const [appointmentData] = await db
      .select({
        appointment: appointments,
        client: clients,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.userId, userId)
      ));

    if (!appointmentData) {
      return null;
    }

    // Get appointment procedures
    const proceduresList = await db
      .select()
      .from(appointmentProcedures)
      .where(eq(appointmentProcedures.appointmentId, appointmentId))
      .orderBy(asc(appointmentProcedures.order));

    return {
      appointment: appointmentData.appointment,
      procedures: proceduresList,
      client: appointmentData.client,
    };
  }

  // Clinical records operations
  async getClinicalRecords(userId: string, clientId?: number): Promise<(ClinicalRecord & { client: Client })[]> {
    let query = db
      .select({
        id: clinicalRecords.id,
        userId: clinicalRecords.userId,
        clientId: clinicalRecords.clientId,
        appointmentId: clinicalRecords.appointmentId,
        procedureDate: clinicalRecords.procedureDate,
        procedure: clinicalRecords.procedure,
        observations: clinicalRecords.observations,
        resultRating: clinicalRecords.resultRating,
        beforeImages: clinicalRecords.beforeImages,
        afterImages: clinicalRecords.afterImages,
        nextAppointment: clinicalRecords.nextAppointment,
        createdAt: clinicalRecords.createdAt,
        client: clients,
      })
      .from(clinicalRecords)
      .innerJoin(clients, eq(clinicalRecords.clientId, clients.id))
      .where(eq(clinicalRecords.userId, userId));

    if (clientId) {
      query = db
        .select({
          id: clinicalRecords.id,
          userId: clinicalRecords.userId,
          clientId: clinicalRecords.clientId,
          appointmentId: clinicalRecords.appointmentId,
          procedureDate: clinicalRecords.procedureDate,
          procedure: clinicalRecords.procedure,
          observations: clinicalRecords.observations,
          resultRating: clinicalRecords.resultRating,
          beforeImages: clinicalRecords.beforeImages,
          afterImages: clinicalRecords.afterImages,
          nextAppointment: clinicalRecords.nextAppointment,
          createdAt: clinicalRecords.createdAt,
          client: clients,
        })
        .from(clinicalRecords)
        .innerJoin(clients, eq(clinicalRecords.clientId, clients.id))
        .where(
          and(
            eq(clinicalRecords.userId, userId),
            eq(clinicalRecords.clientId, clientId)
          )
        );
    }

    return await query.orderBy(desc(clinicalRecords.procedureDate));
  }

  async createClinicalRecord(record: InsertClinicalRecord): Promise<ClinicalRecord> {
    const [newRecord] = await db.insert(clinicalRecords).values(record).returning();
    return newRecord;
  }

  // Transaction operations
  async getTransactions(userId: string, startDate?: Date, endDate?: Date): Promise<(Transaction & { client?: Client })[]> {
    let query = db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        clientId: transactions.clientId,
        appointmentId: transactions.appointmentId,
        type: transactions.type,
        description: transactions.description,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,
        category: transactions.category,
        isPaid: transactions.isPaid,
        dueDate: transactions.dueDate,
        createdAt: transactions.createdAt,
        client: clients,
      })
      .from(transactions)
      .leftJoin(clients, eq(transactions.clientId, clients.id))
      .where(eq(transactions.userId, userId));

    if (startDate && endDate) {
      query = db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          clientId: transactions.clientId,
          appointmentId: transactions.appointmentId,
          type: transactions.type,
          description: transactions.description,
          amount: transactions.amount,
          transactionDate: transactions.transactionDate,
          category: transactions.category,
          isPaid: transactions.isPaid,
          dueDate: transactions.dueDate,
          createdAt: transactions.createdAt,
          client: clients,
        })
        .from(transactions)
        .leftJoin(clients, eq(transactions.clientId, clients.id))
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.transactionDate, startDate.toISOString().split('T')[0]),
            lte(transactions.transactionDate, endDate.toISOString().split('T')[0])
          )
        );
    }

    return await query.orderBy(desc(transactions.transactionDate));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getDashboardStats(userId: string): Promise<{
    todayAppointments: number;
    dailyRevenue: string;
    activeClients: number;
    satisfaction: string;
    monthlyRevenue: string;
    monthlyExpenses: string;
    netProfit: string;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Today's appointments
    const [todayAppointmentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );

    // Daily revenue from transactions
    const [dailyTransactionsResult] = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          eq(transactions.transactionDate, today.toISOString().split('T')[0])
        )
      );

    // Daily revenue from appointments (using new totalPrice field)
    const [dailyAppointmentsResult] = await db
      .select({ total: sql<string>`coalesce(sum(cast(coalesce(total_price, total_amount, '0') as decimal)), 0)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow),
          eq(appointments.status, "completed")
        )
      );

    // Total daily revenue
    const dailyRevenue = parseFloat(dailyTransactionsResult.total || "0") + parseFloat(dailyAppointmentsResult.total || "0");

    // Active clients
    const [activeClientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          eq(clients.isActive, true)
        )
      );

    // Average satisfaction
    const [satisfactionResult] = await db
      .select({ avg: sql<string>`coalesce(avg(rating::numeric), 0)` })
      .from(feedback)
      .where(eq(feedback.userId, userId));

    // Monthly revenue from transactions
    const [monthlyRevenueResult] = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "income"),
          gte(transactions.transactionDate, startOfMonth.toISOString().split('T')[0]),
          lte(transactions.transactionDate, endOfMonth.toISOString().split('T')[0])
        )
      );

    // Monthly revenue from appointments (using new totalPrice field)
    const [monthlyAppointmentsResult] = await db
      .select({ total: sql<string>`coalesce(sum(cast(coalesce(total_price, total_amount, '0') as decimal)), 0)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, startOfMonth),
          lte(appointments.appointmentDate, endOfMonth),
          eq(appointments.status, "completed")
        )
      );

    // Monthly expenses
    const [monthlyExpensesResult] = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          gte(transactions.transactionDate, startOfMonth.toISOString().split('T')[0]),
          lte(transactions.transactionDate, endOfMonth.toISOString().split('T')[0])
        )
      );

    const monthlyRevenue = parseFloat(monthlyRevenueResult.total || "0") + parseFloat(monthlyAppointmentsResult.total || "0");
    const monthlyExpenses = parseFloat(monthlyExpensesResult.total) || 0;
    const netProfit = monthlyRevenue - monthlyExpenses;

    return {
      todayAppointments: todayAppointmentsResult.count || 0,
      dailyRevenue: dailyRevenue.toFixed(2),
      activeClients: activeClientsResult.count || 0,
      satisfaction: parseFloat(satisfactionResult.avg || "0").toFixed(1),
      monthlyRevenue: monthlyRevenueResult.total || "0",
      monthlyExpenses: monthlyExpensesResult.total || "0",
      netProfit: netProfit.toString(),
    };
  }

  // Message operations
  async getMessages(userId: string): Promise<(Message & { client?: Client })[]> {
    return await db
      .select({
        id: messages.id,
        userId: messages.userId,
        clientId: messages.clientId,
        type: messages.type,
        channel: messages.channel,
        content: messages.content,
        isScheduled: messages.isScheduled,
        scheduledFor: messages.scheduledFor,
        sentAt: messages.sentAt,
        status: messages.status,
        createdAt: messages.createdAt,
        client: clients,
      })
      .from(messages)
      .leftJoin(clients, eq(messages.clientId, clients.id))
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Feedback operations
  async getFeedback(userId: string): Promise<(Feedback & { client: Client })[]> {
    return await db
      .select({
        id: feedback.id,
        userId: feedback.userId,
        clientId: feedback.clientId,
        appointmentId: feedback.appointmentId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
        client: clients,
      })
      .from(feedback)
      .innerJoin(clients, eq(feedback.clientId, clients.id))
      .where(eq(feedback.userId, userId))
      .orderBy(desc(feedback.createdAt));
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  // Inventory operations
  async getInventory(userId: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.userId, userId))
      .orderBy(asc(inventory.itemName));
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory> {
    const [updatedItem] = await db
      .update(inventory)
      .set(item)
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem;
  }

  // Loyalty operations
  async getLoyaltyPackages(userId: string): Promise<LoyaltyPackage[]> {
    return await db
      .select()
      .from(loyaltyPackages)
      .where(and(eq(loyaltyPackages.userId, userId), eq(loyaltyPackages.isActive, true)))
      .orderBy(asc(loyaltyPackages.name));
  }

  async createLoyaltyPackage(packageData: InsertLoyaltyPackage): Promise<LoyaltyPackage> {
    const [newPackage] = await db.insert(loyaltyPackages).values(packageData).returning();
    return newPackage;
  }

  async getClientPackages(userId: string): Promise<(ClientPackage & { client: Client; package: LoyaltyPackage })[]> {
    return await db
      .select({
        id: clientPackages.id,
        userId: clientPackages.userId,
        clientId: clientPackages.clientId,
        packageId: clientPackages.packageId,
        purchaseDate: clientPackages.purchaseDate,
        expiryDate: clientPackages.expiryDate,
        sessionsUsed: clientPackages.sessionsUsed,
        totalSessions: clientPackages.totalSessions,
        status: clientPackages.status,
        createdAt: clientPackages.createdAt,
        client: clients,
        package: loyaltyPackages,
      })
      .from(clientPackages)
      .innerJoin(clients, eq(clientPackages.clientId, clients.id))
      .innerJoin(loyaltyPackages, eq(clientPackages.packageId, loyaltyPackages.id))
      .where(eq(clientPackages.userId, userId))
      .orderBy(desc(clientPackages.createdAt));
  }

  // Staff operations
  async getStaff(userId: string): Promise<Staff[]> {
    return await db
      .select()
      .from(staff)
      .where(eq(staff.userId, userId))
      .orderBy(asc(staff.name));
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff;
  }

  async updateStaff(staffId: number, userId: string, staffData: Omit<InsertStaff, 'userId'>): Promise<Staff> {
    const [updatedStaff] = await db
      .update(staff)
      .set(staffData)
      .where(and(eq(staff.id, staffId), eq(staff.userId, userId)))
      .returning();
    return updatedStaff;
  }

  async deleteStaff(staffId: number, userId: string): Promise<void> {
    await db.delete(staff).where(and(eq(staff.id, staffId), eq(staff.userId, userId)));
  }

  async getStaffSchedules(userId: string): Promise<StaffSchedule[]> {
    const results = await db
      .select({
        id: staffSchedules.id,
        staffId: staffSchedules.staffId,
        dayOfWeek: staffSchedules.dayOfWeek,
        startTime: staffSchedules.startTime,
        endTime: staffSchedules.endTime,
        isAvailable: staffSchedules.isAvailable,
        createdAt: staffSchedules.createdAt,
      })
      .from(staffSchedules)
      .innerJoin(staff, eq(staffSchedules.staffId, staff.id))
      .where(eq(staff.userId, userId))
      .orderBy(asc(staffSchedules.dayOfWeek));
    
    return results;
  }

  async createStaffSchedule(scheduleData: InsertStaffSchedule): Promise<StaffSchedule> {
    const [newSchedule] = await db.insert(staffSchedules).values(scheduleData).returning();
    return newSchedule;
  }

  // Payslip operations
  async getPayslipData(
    userId: string,
    staffId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    staffId: number;
    staffName: string;
    totalDuration: number;
    appointmentCount: number;
    procedures: Array<{
      procedureName: string;
      procedureCategory: string;
      count: number;
      totalDuration: number;
    }>;
    appointments: Array<{
      id: number;
      appointmentDate: Date;
      clientName: string;
      procedures: Array<{
        procedureName: string;
        duration: number;
      }>;
      totalDuration: number;
    }>;
  }>> {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    
    // Build where conditions
    const whereConditions = [
      eq(appointments.userId, userIdNum),
      eq(appointments.status, 'completed'),
      isNotNull(appointments.staffId),
    ];

    if (staffId) {
      whereConditions.push(eq(appointments.staffId, staffId));
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereConditions.push(gte(appointments.appointmentDate, start));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereConditions.push(lte(appointments.appointmentDate, end));
    }

    // Get all completed appointments with staff
    const completedAppointments = await db
      .select({
        appointment: appointments,
        staff: staff,
        client: clients,
      })
      .from(appointments)
      .innerJoin(staff, eq(appointments.staffId, staff.id))
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .where(and(...whereConditions))
      .orderBy(asc(appointments.appointmentDate));

    // Group by staff
    const staffMap = new Map<number, {
      staffId: number;
      staffName: string;
      totalDuration: number;
      appointmentCount: number;
      procedures: Map<string, {
        procedureName: string;
        procedureCategory: string;
        count: number;
        totalDuration: number;
      }>;
      appointments: Array<{
        id: number;
        appointmentDate: Date;
        clientName: string;
        procedures: Array<{
          procedureName: string;
          duration: number;
        }>;
        totalDuration: number;
      }>;
    }>();

    // Process each appointment
    for (const { appointment, staff: staffMember, client } of completedAppointments) {
      const staffId = appointment.staffId!;
      
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staffId: staffId,
          staffName: staffMember.name,
          totalDuration: 0,
          appointmentCount: 0,
          procedures: new Map(),
          appointments: [],
        });
      }

      const staffData = staffMap.get(staffId)!;

      // Get appointment procedures from database
      const appointmentProceduresData = await db
        .select()
        .from(appointmentProcedures)
        .where(eq(appointmentProcedures.appointmentId, appointment.id))
        .orderBy(appointmentProcedures.order);

      // Calculate appointment duration (use totalDuration if available, otherwise sum procedures)
      let appointmentDuration = appointment.totalDuration || 0;
      if (appointmentDuration === 0 && appointmentProceduresData.length > 0) {
        appointmentDuration = appointmentProceduresData.reduce((sum, ap) => sum + (ap.duration || 0), 0);
      }
      if (appointmentDuration === 0) {
        appointmentDuration = appointment.duration || 0;
      }

      staffData.totalDuration += appointmentDuration;
      staffData.appointmentCount += 1;

      // Process procedures
      const appointmentProceduresList: Array<{ procedureName: string; duration: number }> = [];
      
      for (const ap of appointmentProceduresData) {
        appointmentProceduresList.push({
          procedureName: ap.procedureName,
          duration: ap.duration || 0,
        });

        const procedureKey = `${ap.procedureName}_${ap.procedureCategory}`;
        if (!staffData.procedures.has(procedureKey)) {
          staffData.procedures.set(procedureKey, {
            procedureName: ap.procedureName,
            procedureCategory: ap.procedureCategory,
            count: 0,
            totalDuration: 0,
          });
        }

        const procedureData = staffData.procedures.get(procedureKey)!;
        procedureData.count += 1;
        procedureData.totalDuration += ap.duration || 0;
      }

      // If no procedures found, try to get from appointment data
      if (appointmentProceduresList.length === 0 && appointment.serviceType === 'procedure') {
        // Try to get from old system
        if (appointment.selectedProcedures && Array.isArray(appointment.selectedProcedures)) {
          const procedureIds = appointment.selectedProcedures
            .map((id: string) => parseInt(id))
            .filter((id: number) => !isNaN(id));
          
          if (procedureIds.length > 0) {
            const proceduresList = await db
              .select()
              .from(procedures)
              .where(and(
                eq(procedures.userId, userIdNum),
                inArray(procedures.id, procedureIds)
              ));

            for (const proc of proceduresList) {
              appointmentProceduresList.push({
                procedureName: proc.name,
                duration: proc.duration || 0,
              });

              const procedureKey = `${proc.name}_${proc.category}`;
              if (!staffData.procedures.has(procedureKey)) {
                staffData.procedures.set(procedureKey, {
                  procedureName: proc.name,
                  procedureCategory: proc.category,
                  count: 0,
                  totalDuration: 0,
                });
              }

              const procedureData = staffData.procedures.get(procedureKey)!;
              procedureData.count += 1;
              procedureData.totalDuration += proc.duration || 0;
            }
          }
        }
      }

      staffData.appointments.push({
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        clientName: client.name,
        procedures: appointmentProceduresList,
        totalDuration: appointmentDuration,
      });
    }

    // Convert Map to Array
    const result = Array.from(staffMap.values()).map(staffData => ({
      ...staffData,
      procedures: Array.from(staffData.procedures.values()),
    }));

    return result;
  }

  // Marketing operations
  async getMarketingCampaigns(userId: string): Promise<MarketingCampaign[]> {
    return await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.userId, userId))
      .orderBy(desc(marketingCampaigns.createdAt));
  }

  async createMarketingCampaign(campaignData: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [newCampaign] = await db.insert(marketingCampaigns).values(campaignData).returning();
    return newCampaign;
  }

  // Banner operations
  async getBanners(userId: number): Promise<Banner[]> {
    return await db
      .select()
      .from(banners)
      .where(eq(banners.userId, userId))
      .orderBy(desc(banners.createdAt));
  }

  async getActiveBanner(userId: number): Promise<Banner | null> {
    const [banner] = await db
      .select()
      .from(banners)
      .where(and(
        eq(banners.userId, userId),
        eq(banners.isActive, true)
      ))
      .orderBy(desc(banners.createdAt))
      .limit(1);
    return banner || null;
  }

  async createBanner(bannerData: InsertBanner): Promise<Banner> {
    const [newBanner] = await db.insert(banners).values({
      ...bannerData,
      updatedAt: new Date(),
    }).returning();
    return newBanner;
  }

  async updateBanner(id: number, bannerData: Partial<InsertBanner>): Promise<Banner> {
    const [updatedBanner] = await db
      .update(banners)
      .set({
        ...bannerData,
        updatedAt: new Date(),
      })
      .where(eq(banners.id, id))
      .returning();
    if (!updatedBanner) {
      throw new Error(`Banner with id ${id} not found`);
    }
    return updatedBanner;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  // Get public login banner (first active banner found)
  async getPublicLoginBanner(): Promise<Banner | null> {
    const [banner] = await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(desc(banners.createdAt))
      .limit(1);
    return banner || null;
  }

  // Package operations
  async getPackages(userId: number): Promise<(Package & { client: Client })[]> {
    return await db
      .select({
        id: packages.id,
        userId: packages.userId,
        clientId: packages.clientId,
        name: packages.name,
        description: packages.description,
        services: packages.services,
        products: packages.products,
        serviceBalance: packages.serviceBalance,
        moneyBalance: packages.moneyBalance,
        totalPrice: packages.totalPrice,
        validityStartDate: packages.validityStartDate,
        validityEndDate: packages.validityEndDate,
        status: packages.status,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        client: clients,
      })
      .from(packages)
      .innerJoin(clients, eq(packages.clientId, clients.id))
      .where(eq(packages.userId, userId))
      .orderBy(desc(packages.createdAt));
  }

  async getPackage(id: number, userId: number): Promise<(Package & { client: Client }) | null> {
    const [result] = await db
      .select({
        id: packages.id,
        userId: packages.userId,
        clientId: packages.clientId,
        name: packages.name,
        description: packages.description,
        services: packages.services,
        products: packages.products,
        serviceBalance: packages.serviceBalance,
        moneyBalance: packages.moneyBalance,
        totalPrice: packages.totalPrice,
        validityStartDate: packages.validityStartDate,
        validityEndDate: packages.validityEndDate,
        status: packages.status,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
        client: clients,
      })
      .from(packages)
      .innerJoin(clients, eq(packages.clientId, clients.id))
      .where(and(eq(packages.id, id), eq(packages.userId, userId)))
      .limit(1);
    return result || null;
  }

  async createPackage(packageData: InsertPackage): Promise<Package> {
    // Calculate serviceBalance and moneyBalance from services and products
    const serviceBalance = (packageData.services || []).reduce((sum, s) => sum + (s.quantity || 0), 0);
    const moneyBalance = (packageData.products || []).reduce((sum, p) => {
      const price = parseFloat(p.price?.toString() || '0');
      const quantity = p.quantity || 0;
      return sum + (price * quantity);
    }, 0);

    const [newPackage] = await db.insert(packages).values({
      ...packageData,
      serviceBalance,
      moneyBalance: moneyBalance.toString(),
      updatedAt: new Date(),
    }).returning();
    return newPackage;
  }

  async updatePackage(id: number, packageData: Partial<InsertPackage>): Promise<Package> {
    // Recalculate balances if services or products changed
    const updateData: any = { ...packageData, updatedAt: new Date() };
    
    if (packageData.services !== undefined) {
      updateData.serviceBalance = (packageData.services || []).reduce((sum, s) => sum + (s.quantity || 0), 0);
    }
    
    if (packageData.products !== undefined) {
      updateData.moneyBalance = (packageData.products || []).reduce((sum, p) => {
        const price = parseFloat(p.price?.toString() || '0');
        const quantity = p.quantity || 0;
        return sum + (price * quantity);
      }, 0).toString();
    }

    const [updatedPackage] = await db
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, id))
      .returning();
    
    if (!updatedPackage) {
      throw new Error(`Package with id ${id} not found`);
    }
    return updatedPackage;
  }

  async deletePackage(id: number): Promise<void> {
    await db.delete(packages).where(eq(packages.id, id));
  }

  // Loyalty Settings operations
  async getLoyaltySettings(userId: number): Promise<LoyaltySettings | null> {
    const [settings] = await db
      .select()
      .from(loyaltySettings)
      .where(eq(loyaltySettings.userId, userId))
      .limit(1);
    return settings || null;
  }

  async upsertLoyaltySettings(userId: number, settingsData: InsertLoyaltySettings): Promise<LoyaltySettings> {
    const existing = await this.getLoyaltySettings(userId);
    
    if (existing) {
      const [updated] = await db
        .update(loyaltySettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(loyaltySettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(loyaltySettings)
        .values({
          ...settingsData,
          userId,
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  // Calculate loyalty points for a client based on appointments/procedures and transactions/products
  async calculateClientLoyaltyPoints(clientId: number, userId: number): Promise<number> {
    // Get loyalty settings
    const settings = await this.getLoyaltySettings(userId);
    const pointsPerDollar = parseFloat(settings?.pointsPerDollar?.toString() || '1.00');

    // Calculate points from appointments/procedures
    const clientAppointments = await db
      .select({
        appointmentId: appointments.id,
        totalPrice: appointments.totalPrice,
      })
      .from(appointments)
      .where(and(
        eq(appointments.userId, userId),
        eq(appointments.clientId, clientId),
        eq(appointments.status, 'completed')
      ));

    let totalSpent = 0;

    // Sum up total spent from completed appointments
    for (const apt of clientAppointments) {
      const price = parseFloat(apt.totalPrice?.toString() || '0');
      totalSpent += price;
    }

    // Calculate points from transactions (products purchases)
    const productTransactions = await db
      .select({
        amount: transactions.amount,
      })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.clientId, clientId),
        eq(transactions.type, 'income')
      ));

    // Sum up product purchases
    for (const trans of productTransactions) {
      const amount = parseFloat(trans.amount?.toString() || '0');
      totalSpent += amount;
    }

    // Calculate total points
    const calculatedPoints = Math.floor(totalSpent * pointsPerDollar);

    return calculatedPoints;
  }

  // Analytics operations
  async getAnalytics(userId: string, dateRange?: string): Promise<any> {
    // For now, return empty analytics data
    // In a real implementation, this would calculate various metrics
    return {
      revenue: {
        total: 0,
        trend: "up",
        percentage: 0
      },
      clients: {
        total: 0,
        active: 0,
        new: 0
      },
      appointments: {
        total: 0,
        completed: 0,
        cancelled: 0
      }
    };
  }

  // Business hours operations
  async getBusinessHours(userId: string): Promise<BusinessHours[]> {
    return await db
      .select()
      .from(businessHours)
      .where(eq(businessHours.userId, userId))
      .orderBy(asc(businessHours.dayOfWeek));
  }

  async upsertBusinessHours(hoursArray: InsertBusinessHours[]): Promise<BusinessHours[]> {
    const results: BusinessHours[] = [];
    
    for (const hours of hoursArray) {
      // Delete existing records for this user and day
      await db
        .delete(businessHours)
        .where(and(
          eq(businessHours.userId, hours.userId),
          eq(businessHours.dayOfWeek, hours.dayOfWeek)
        ));
      
      // Insert new record
      const [newHours] = await db
        .insert(businessHours)
        .values(hours)
        .returning();
      
      results.push(newHours);
    }
    
    return results;
  }

  // Inactive Clients operations
  async findInactiveClients(userId: number): Promise<any[]> {
    // Get user's inactivity threshold
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return [];

    const inactivityDays = user.inactivityDays || 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - inactivityDays);

    // Get all active clients for this user
    const allClients = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          eq(clients.isActive, true)
        )
      );

    const inactiveClientsList: any[] = [];

    // For each client, check their last appointment
    for (const client of allClients) {
      // Get last completed appointment for this client
      const lastAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.clientId, client.id),
            eq(appointments.status, 'completed')
          )
        )
        .orderBy(desc(appointments.appointmentDate))
        .limit(1);

      const lastAppointment = lastAppointments[0];
      
      // Check if client is inactive (no appointments or last appointment older than threshold)
      const isInactive = !lastAppointment || new Date(lastAppointment.appointmentDate) < thresholdDate;

      if (isInactive) {
        // Get procedure name(s) - support for multiple procedures
        let lastProcedure = null;
        if (lastAppointment) {
          // Try to get procedures from appointment_procedures table first
          const procedureRecords = await db
            .select({
              procedureName: appointmentProcedures.procedureName,
            })
            .from(appointmentProcedures)
            .where(eq(appointmentProcedures.appointmentId, lastAppointment.id));

          if (procedureRecords.length > 0) {
            // Concatenate multiple procedure names
            lastProcedure = procedureRecords
              .map(p => p.procedureName)
              .filter(name => name)
              .join(', ');
          } else if (lastAppointment.serviceId) {
            // Fallback to old single service/procedure lookup
            const [service] = await db
              .select({ name: services.name })
              .from(services)
              .where(eq(services.id, lastAppointment.serviceId))
              .limit(1);
            
            if (!service) {
              const [procedure] = await db
                .select({ name: procedures.name })
                .from(procedures)
                .where(eq(procedures.id, lastAppointment.serviceId))
                .limit(1);
              lastProcedure = procedure?.name || null;
            } else {
              lastProcedure = service.name;
            }
          }
        }

        // Determine contact preference
        let contactPreference = null;
        if (client.notifyWhatsapp) contactPreference = 'whatsapp';
        else if (client.notifySms) contactPreference = 'sms';
        else if (client.notifyPhone) contactPreference = 'phone';

        inactiveClientsList.push({
          userId,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
          lastProcedure,
          lastAppointmentDate: lastAppointment?.appointmentDate || null,
          contactPreference,
          status: 0,
        });
      }
    }

    return inactiveClientsList;
  }

  async populateInactiveClients(userId: number): Promise<void> {
    const inactiveClientsData = await this.findInactiveClients(userId);
    
    if (inactiveClientsData.length === 0) return;

    // Clear previous entries for this user
    await db.delete(inactiveClients).where(eq(inactiveClients.userId, userId));

    // Insert new inactive clients
    await db.insert(inactiveClients).values(inactiveClientsData);
  }

  async populateAllUsersInactiveClients(): Promise<void> {
    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.isActive, true));

    // Process each user
    for (const user of allUsers) {
      await this.populateInactiveClients(user.id);
    }
  }

  async getInactiveClients(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(inactiveClients)
      .where(eq(inactiveClients.userId, userId))
      .orderBy(desc(inactiveClients.lastAppointmentDate));
  }

  // Appointment Reminders operations
  async findUpcomingAppointments(userId: number): Promise<any[]> {
    // Get user's reminder settings
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return [];

    const reminderHours = user.reminderHours || 2;
    const reminderStartTime = user.reminderStartTime || '09:00';
    const reminderEndTime = user.reminderEndTime || '21:00';

    // Check if current time is within reminder window
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime < reminderStartTime || currentTime > reminderEndTime) {
      return []; // Outside reminder window
    }

    // Calculate time window for appointments
    const startWindow = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
    const endWindow = new Date(startWindow.getTime() + 60 * 60 * 1000); // 1 hour window

    // Get upcoming appointments in the time window
    const upcomingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, startWindow),
          lte(appointments.appointmentDate, endWindow),
          inArray(appointments.status, ['pending', 'confirmed', 'scheduled'])
        )
      );

    const remindersList: any[] = [];

    for (const appointment of upcomingAppointments) {
      // Check if reminder already exists
      const existingReminder = await db
        .select()
        .from(appointmentReminders)
        .where(
          and(
            eq(appointmentReminders.appointmentId, appointment.id),
            eq(appointmentReminders.userId, userId)
          )
        )
        .limit(1);

      if (existingReminder.length > 0) continue; // Skip if reminder already exists

      // Get client info
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, appointment.clientId))
        .limit(1);

      if (!client) continue;

      // Get procedure name(s) - support for multiple procedures
      let procedureName = null;
      
      // Try to get procedures from appointment_procedures table first
      const procedureRecords = await db
        .select({
          procedureName: appointmentProcedures.procedureName,
        })
        .from(appointmentProcedures)
        .where(eq(appointmentProcedures.appointmentId, appointment.id));

      if (procedureRecords.length > 0) {
        // Concatenate multiple procedure names
        procedureName = procedureRecords
          .map(p => p.procedureName)
          .filter(name => name)
          .join(', ');
      } else if (appointment.serviceId) {
        // Fallback to old single service/procedure lookup
        if (appointment.serviceType === 'service') {
          const [service] = await db
            .select({ name: services.name })
            .from(services)
            .where(eq(services.id, appointment.serviceId))
            .limit(1);
          procedureName = service?.name || null;
        } else {
          const [procedure] = await db
            .select({ name: procedures.name })
            .from(procedures)
            .where(eq(procedures.id, appointment.serviceId))
            .limit(1);
          procedureName = procedure?.name || null;
        }
      }

      // Determine contact preference
      let contactPreference = null;
      if (client.notifyWhatsapp) contactPreference = 'whatsapp';
      else if (client.notifySms) contactPreference = 'sms';
      else if (client.notifyPhone) contactPreference = 'phone';

      // Format appointment time
      const appointmentDate = new Date(appointment.appointmentDate);
      const appointmentTime = `${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`;

      remindersList.push({
        userId,
        appointmentId: appointment.id,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        appointmentDate: appointment.appointmentDate,
        appointmentTime,
        procedureName,
        contactPreference,
        status: 0,
      });
    }

    return remindersList;
  }

  async populateAppointmentReminders(userId: number): Promise<void> {
    const remindersData = await this.findUpcomingAppointments(userId);
    
    if (remindersData.length === 0) return;

    // Insert new reminders (don't delete old ones to keep history)
    await db.insert(appointmentReminders).values(remindersData);
  }

  async populateAllUsersAppointmentReminders(): Promise<void> {
    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.isActive, true));

    // Process each user
    for (const user of allUsers) {
      await this.populateAppointmentReminders(user.id);
    }
  }

  async getAppointmentReminders(userId: number, status?: number): Promise<any[]> {
    const query = db
      .select()
      .from(appointmentReminders)
      .where(eq(appointmentReminders.userId, userId));

    if (status !== undefined) {
      return await query
        .where(and(
          eq(appointmentReminders.userId, userId),
          eq(appointmentReminders.status, status)
        ))
        .orderBy(asc(appointmentReminders.appointmentDate));
    }

    return await query.orderBy(asc(appointmentReminders.appointmentDate));
  }

  async deductMaterialsForAppointment(appointmentId: number, userId: number): Promise<void> {
    // Get all procedures for this appointment with their materials snapshot
    const proceduresList = await db
      .select()
      .from(appointmentProcedures)
      .where(eq(appointmentProcedures.appointmentId, appointmentId));

    if (!proceduresList || proceduresList.length === 0) return;

    // Process each procedure's materials
    for (const proc of proceduresList) {
      if (!proc.materials || (proc.materials as any[]).length === 0) continue;

      // Deduct each material from inventory
      for (const material of proc.materials as any[]) {
        const [currentMaterial] = await db
          .select()
          .from(inventory)
          .where(and(
            eq(inventory.id, material.materialId),
            eq(inventory.userId, userId)
          ));

        if (currentMaterial && currentMaterial.currentStock !== null && currentMaterial.currentStock >= material.quantity) {
          await db
            .update(inventory)
            .set({
              currentStock: currentMaterial.currentStock - material.quantity
            })
            .where(eq(inventory.id, material.materialId));
        }
      }
    }
  }

  // Campaign methods
  async createCampaign(userId: string, data: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values({
        ...data,
        userId: parseInt(userId),
        updatedAt: new Date(),
      })
      .returning();
    return campaign;
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, parseInt(userId)))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | null> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, parseInt(userId))))
      .limit(1);
    return campaign || null;
  }

  async updateCampaignStatus(id: number, status: string, stats?: { sentCount?: number; failedCount?: number }): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (stats) {
      if (stats.sentCount !== undefined) updateData.sentCount = stats.sentCount;
      if (stats.failedCount !== undefined) updateData.failedCount = stats.failedCount;
    }

    await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, id));
  }

  async sendCampaign(campaignId: number): Promise<void> {
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign[0]) {
      throw new Error('Campaign not found');
    }

    const campaignData = campaign[0];

    // Buscar clientes elegíveis baseado no canal
    let eligibleClients;
    if (campaignData.channel === 'whatsapp') {
      eligibleClients = await db
        .select()
        .from(clients)
        .where(and(
          eq(clients.userId, campaignData.userId),
          eq(clients.isActive, true),
          eq(clients.notifyWhatsapp, true)
        ));
    } else if (campaignData.channel === 'email') {
      eligibleClients = await db
        .select()
        .from(clients)
        .where(and(
          eq(clients.userId, campaignData.userId),
          eq(clients.isActive, true),
          isNotNull(clients.email)
        ));
    } else {
      throw new Error('Invalid channel');
    }

    // Atualizar total de destinatários
    await db
      .update(campaigns)
      .set({
        totalRecipients: eligibleClients.length,
        status: 'sending',
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    // Criar mensagens para cada cliente
    const messageInserts = eligibleClients.map(client => ({
      userId: campaignData.userId,
      clientId: client.id,
      campaignId: campaignId,
      type: 'automatic',
      channel: campaignData.channel,
      content: campaignData.messageContent.replace(/{nome}/g, client.name),
      status: 'pending',
    }));

    if (messageInserts.length > 0) {
      await db.insert(messages).values(messageInserts);
    }

    // Atualizar status para completed
    await this.updateCampaignStatus(campaignId, 'completed', {
      sentCount: eligibleClients.length,
      failedCount: 0,
    });
  }

  async deleteCampaign(id: number, userId: string): Promise<void> {
    // Primeiro deletar mensagens relacionadas
    await db
      .delete(messages)
      .where(eq(messages.campaignId, id));

    // Depois deletar a campanha
    await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, parseInt(userId))));
  }
}

export const storage = new DatabaseStorage();

// Procedure storage
export const procedureStorage = {
  async getProcedures(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(procedures)
      .where(eq(procedures.userId, userId))
      .orderBy(asc(procedures.name));
  },

  async createProcedure(userId: string, procedure: any): Promise<any> {
    const [newProcedure] = await db.insert(procedures).values({
      ...procedure,
      userId
    }).returning();
    return newProcedure;
  },

  async updateProcedure(id: number, userId: string, updates: any): Promise<any> {
    const [updatedProcedure] = await db
      .update(procedures)
      .set(updates)
      .where(and(eq(procedures.id, id), eq(procedures.userId, userId)))
      .returning();
    return updatedProcedure;
  },

  async deductMaterialsForProcedure(procedureId: number, userId: string): Promise<void> {
    // Get the procedure with its required materials
    const [procedure] = await db
      .select()
      .from(procedures)
      .where(and(eq(procedures.id, procedureId), eq(procedures.userId, userId)));

    if (!procedure || !procedure.materials) return;

    // Deduct each material from inventory
    for (const material of procedure.materials as any[]) {
      const [currentMaterial] = await db
        .select()
        .from(inventory)
        .where(and(
          eq(inventory.id, material.materialId),
          eq(inventory.userId, userId)
        ));

      if (currentMaterial && currentMaterial.currentStock && currentMaterial.currentStock >= material.quantity) {
        await db
          .update(inventory)
          .set({
            currentStock: currentMaterial.currentStock - material.quantity
          })
          .where(eq(inventory.id, material.materialId));
      }
    }
  }
};
