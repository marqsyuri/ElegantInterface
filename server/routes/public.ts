import type { Express } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { procedureStorage } from "../procedures";
import { users, clients, appointments, appointmentProcedures, services, procedures, staff } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { isClientAuthenticated } from "../clientAuth";

export function registerPublicRoutes(app: Express) {
// Public API routes for client access (no authentication required)


app.post('/api/public/company/:publicLink/booking', async (req, res) => {
  try {
    const { publicLink } = req.params;
    const bookingData = req.body;
    
    // Get company by public link
    const company = await storage.getUserByPublicLink(publicLink);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Create or find client
    let client = await db.select().from(clients)
      .where(and(
        eq(clients.email, bookingData.email),
        eq(clients.userId, company.id)
      ));

    if (client.length === 0) {
      // Create new client
      const [newClient] = await db.insert(clients).values({
        userId: company.id,
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        birthDate: bookingData.dateOfBirth || null,
      }).returning();
      client = [newClient];
    }

    // Create appointment request (pending status) - using procedure instead of service
    const appointmentData = {
      userId: company.id,
      clientId: client[0].id,
      serviceId: parseInt(bookingData.serviceId), // This will be procedure ID
      serviceType: 'procedure' as const, // Mark as procedure type
      appointmentDate: new Date(bookingData.preferredDate),
      startTime: bookingData.preferredTime,
      endTime: bookingData.preferredTime, // Will be calculated based on procedure duration
      status: 'pending' as const,
      notes: bookingData.notes || '',
    };

    console.log('Creating appointment with data:', appointmentData);
    const appointment = await storage.createAppointment(appointmentData);
    console.log('Appointment created:', appointment);

    res.json({ 
      message: 'Booking request submitted successfully',
      appointmentId: appointment.id 
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Failed to create booking request" });
  }
});

// Public company info endpoint
app.get('/api/public/company/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;
    
    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Return public company information
    res.json({
      clinicName: company.clinicName,
      clinicAddress: company.clinicAddress,
      clinicPhone: company.clinicPhone,
      clinicWhatsapp: company.clinicWhatsapp,
      email: company.email,
      profileImageUrl: company.profileImageUrl,
      heroImageUrl: company.heroImageUrl,
      publicLink: company.publicLink,
      specialties: company.specialties
    });
  } catch (error) {
    console.error("Error fetching company info:", error);
    res.status(500).json({ message: "Failed to fetch company information" });
  }
});

// Find user by email endpoint
app.get('/api/public/user-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return public user information
    res.json({
      id: user.id,
      clinicName: user.clinicName,
      clinicAddress: user.clinicAddress,
      clinicPhone: user.clinicPhone,
      clinicWhatsapp: user.clinicWhatsapp,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      heroImageUrl: user.heroImageUrl,
      publicLink: user.publicLink,
      specialties: user.specialties
    });
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ message: "Failed to fetch user information" });
  }
});

// Public procedures endpoint (replacing services for client booking)
app.get('/api/public/procedures/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;
    
    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get procedures instead of services
    const procedures = await procedureStorage.getProcedures(company.id.toString());
    res.json(procedures);
  } catch (error) {
    console.error("Error fetching procedures:", error);
    res.status(500).json({ message: "Failed to fetch procedures" });
  }
});

// Public business hours endpoint
app.get('/api/public/business-hours/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;
    
    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get business hours for this company
    const businessHours = await storage.getBusinessHours(company.id.toString());
    res.json(businessHours);
  } catch (error) {
    console.error("Error fetching business hours:", error);
    res.status(500).json({ message: "Failed to fetch business hours" });
  }
});

// Public staff endpoint (for client booking professional selection)
app.get('/api/public/staff/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;
    
    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Get staff members for this company
    const staff = await storage.getStaff(company.id.toString());
    res.json(staff.map(member => ({
      id: member.id,
      name: member.name,
      specialties: Array.isArray(member.specialties) ? member.specialties : [],
      profileImage: null // Will be added later when staff upload photos
    })));
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
});


// Public appointment booking endpoint
app.post('/api/public/appointments/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;

    const {
      name,
      phone,
      email,
      notes,
      selectedServices,
      selectedProfessional,
      selectedDate,
      selectedTime
    } = req.body;



    // Validate required fields
    if (!name || !phone || !email || !selectedServices || !selectedProfessional || !selectedDate || !selectedTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!selectedServices.length) {
      return res.status(400).json({ message: "Please select at least one service" });
    }
    
    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Create client if not exists OR use logged in client
    let client;

    // ENFORCE IDENTITY: Check for logged-in client session
    if (req.isAuthenticated() && req.user && (req.user.userType === 'client' || !req.user.userType) && req.user.userId === company.id) {
      console.log(`[Booking] Using logged-in client identity: ID ${req.user.id} (${req.user.name})`);
      // Use the logged in client strictly
      client = [{
         id: req.user.id,
         name: req.user.name,
         email: req.user.email,
         phone: req.user.phone,
         userId: req.user.userId
      }];
    } else {
      // Not logged in - standard flow
      client = await db.select().from(clients).where(
        and(
          eq(clients.userId, company.id),
          eq(clients.email, email)
        )
      ).limit(1);

      if (client.length === 0) {
        const [newClient] = await db.insert(clients).values({
          userId: company.id,
          name,
          phone,
          email
        }).returning();
        client = [newClient];
      }
    }

    // Calculate total duration and price from selected services
    const serviceIds = selectedServices.map((id: string) => parseInt(id)).filter(id => !isNaN(id));
    
    if (serviceIds.length === 0) {
      return res.status(400).json({ message: "No valid services selected" });
    }

    const selectedProcedures = await db.select().from(procedures).where(
      and(
        eq(procedures.userId, company.id),
        inArray(procedures.id, serviceIds)
      )
    );

    if (selectedProcedures.length === 0) {
      return res.status(400).json({ message: "Selected procedures not found" });
    }

    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const professionalId = parseInt(selectedProfessional);
    
    if (isNaN(professionalId)) {
      return res.status(400).json({ message: "Invalid professional selection" });
    }

    // Create appointment data
    const appointmentData = {
      userId: company.id,
      clientId: client[0].id,
      staffId: professionalId,
      appointmentDate: appointmentDateTime,
      status: 'pending' as const,
      notes: notes || ''
    };

    // Use the new multi-procedure system
    const result = await storage.createAppointmentWithProcedures(
      appointmentData,
      serviceIds,
      company.id
    );

    const appointment = result.appointment;

    // Automatically deduct materials from inventory
    await storage.deductMaterialsForAppointment(appointment.id, company.id.toString());

    res.json({ 
      success: true, 
      appointmentId: appointment.id,
      message: "Appointment request submitted successfully" 
    });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ 
      message: "Failed to create appointment",
      error: error.message 
    });
  }
});

// ==============================================
// CLIENT AUTHENTICATION ROUTES (Multi-tenant)
// ==============================================

// Client registration
app.post('/api/client/register/:publicLink', async (req, res) => {
  try {
    const { publicLink } = req.params;
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Check if client already exists with this email for this salon
    const existingClient = await db.select().from(clients).where(
      and(
        eq(clients.email, email),
        eq(clients.userId, company.id)
      )
    ).limit(1);

    if (existingClient.length > 0) {
      if (existingClient[0].password) {
        return res.status(400).json({ message: 'An account with this email already exists. Please login.' });
      } else {
        // Client exists but no password - update with password
        const hashedPassword = hashPassword(password);
        const [updatedClient] = await db
          .update(clients)
          .set({ 
            password: hashedPassword,
            phone: phone || existingClient[0].phone,
            name: name || existingClient[0].name
          })
          .where(eq(clients.id, existingClient[0].id))
          .returning();

        return res.json({ 
          success: true,
          message: 'Account activated successfully',
          client: {
            id: updatedClient.id,
            name: updatedClient.name,
            email: updatedClient.email,
            phone: updatedClient.phone
          }
        });
      }
    }

    // Create new client with password
    const hashedPassword = hashPassword(password);
    const [newClient] = await db.insert(clients).values({
      userId: company.id,
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      isActive: true
    }).returning();

    res.json({ 
      success: true,
      message: 'Account created successfully',
      client: {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone
      }
    });
  } catch (error: any) {
    console.error('Client registration error:', error);
    res.status(500).json({ 
      message: 'Failed to create account',
      error: error.message 
    });
  }
});

// Client login
app.post('/api/client/login/:publicLink', async (req, res, next) => {
  try {
    const { publicLink } = req.params;
    const { email, password } = req.body;

    // Find company by public link
    const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
    
    if (!company) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Add salonId to req.body for passport strategy
    req.body.salonId = company.id;

    // Use passport client strategy
    passport.authenticate('client-local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Client login error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Session error:', err);
          return res.status(500).json({ message: 'Failed to create session' });
        }

        res.json({
          success: true,
          message: 'Login successful',
          client: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            salonId: user.userId
          }
        });
      });
    })(req, res, next);
  } catch (error: any) {
    console.error('Client login error:', error);
    res.status(500).json({ 
      message: 'Failed to login',
      error: error.message 
    });
  }
});

// Get current logged-in client
app.get('/api/client/me', isClientAuthenticated, async (req: any, res) => {
  try {
    const client = req.user;
    res.json({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      salonId: client.userId,
      loyaltyPoints: client.loyaltyPoints,
      lastLogin: client.lastLogin
    });
  } catch (error) {
    console.error('Error fetching client info:', error);
    res.status(500).json({ message: 'Failed to fetch client info' });
  }
});

// Client logout
app.post('/api/client/logout', (req: any, res) => {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Get client's appointments
app.get('/api/client/appointments', isClientAuthenticated, async (req: any, res) => {
  try {
    const clientId = req.user.id;
    const salonId = req.user.userId;

    // Get all appointments for this client at this salon
    const clientAppointments = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        notes: appointments.notes,
        totalPrice: appointments.totalPrice,
        totalDuration: appointments.totalDuration,
        procedureCount: appointments.procedureCount,
        staffId: appointments.staffId,
        createdAt: appointments.createdAt
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.clientId, clientId),
          eq(appointments.userId, salonId)
        )
      )
      .orderBy(desc(appointments.appointmentDate));

    // Get staff info and procedures for each appointment
    const appointmentsWithDetails = await Promise.all(
      clientAppointments.map(async (apt) => {
        // Get staff info
        let staffInfo = null;
        if (apt.staffId) {
          const [staffMember] = await db
            .select({ id: staff.id, name: staff.name })
            .from(staff)
            .where(eq(staff.id, apt.staffId))
            .limit(1);
          staffInfo = staffMember || null;
        }

        // Get procedures
        const aptProcedures = await db
          .select({
            id: appointmentProcedures.id,
            procedureName: appointmentProcedures.procedureName,
            procedureCategory: appointmentProcedures.procedureCategory,
            price: appointmentProcedures.price,
            duration: appointmentProcedures.duration,
            order: appointmentProcedures.order
          })
          .from(appointmentProcedures)
          .where(eq(appointmentProcedures.appointmentId, apt.id))
          .orderBy(appointmentProcedures.order);

        return {
          ...apt,
          staff: staffInfo,
          procedures: aptProcedures
        };
      })
    );

    res.json(appointmentsWithDetails);
  } catch (error) {
    console.error('Error fetching client appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// Cancel appointment (client can only cancel their own)
app.put('/api/client/appointments/:id/cancel', isClientAuthenticated, async (req: any, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const clientId = req.user.id;
    const salonId = req.user.userId;

    // Verify appointment belongs to this client
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.clientId, clientId),
          eq(appointments.userId, salonId)
        )
      )
      .limit(1);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ 
        message: `Cannot cancel appointment with status: ${appointment.status}` 
      });
    }

    // Update appointment status
    const [updated] = await db
      .update(appointments)
      .set({ status: 'cancelled' })
      .where(eq(appointments.id, appointmentId))
      .returning();

    res.json({ 
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: updated
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
});

}
