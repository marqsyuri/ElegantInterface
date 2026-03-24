import { Express } from 'express';
import { db } from '../db';
import {
  appointments, appointmentProcedures, appointmentProducts, appointmentStaff,
  procedures, services, staff, clients, payments, users, products,
  clinicalRecords, inventory, insertAppointmentSchema, insertClinicalRecordSchema
} from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { isAuthenticated, getEffectiveUserId } from '../auth';
import { storage, procedureStorage } from '../storage';

export function registerAppointmentRoutes(app: Express) {
  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      
      const effectiveUserId = getEffectiveUserId(req);
      const user = req.user;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      

      // If user is staff (userType === 'staff'), filter by their staffId
      const staffId = (user.userType === 'staff' && user.accessLevel === 'staff') ? user.id : undefined;
      
      const appointments = await storage.getAppointments(effectiveUserId, date, staffId);
      res.json(appointments);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/all', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        console.error("[API] /api/appointments/all - No user in request");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const effectiveUserId = getEffectiveUserId(req);
      if (!effectiveUserId || isNaN(effectiveUserId)) {
        console.error("[API] /api/appointments/all - Invalid effectiveUserId:", effectiveUserId, "User:", user);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get staffId from query parameter if provided, otherwise use default behavior
      // Accept both 'staffId' (camelCase) and 'staffid' (lowercase) for compatibility
      let staffId: number | undefined = undefined;
      
      const queryStaffId = req.query.staffId || req.query.staffid;
      if (queryStaffId) {
        // If staffId is provided in query, use it (only for admin users)
        const requestedStaffId = parseInt(queryStaffId.toString());
        if (!isNaN(requestedStaffId)) {
          // Admin users can filter by any staffId
          if (user.userType === 'admin' || (user.userType !== 'staff')) {
            staffId = requestedStaffId;
          } else {
            // Staff users can only filter by their own ID
            if (requestedStaffId === user.id) {
              staffId = requestedStaffId;
            } else {
              return res.status(403).json({ message: "You can only view your own appointments" });
            }
          }
        }
      } else {
        // Default behavior: If user is staff, filter by their staffId
        if (user.userType === 'staff' && user.accessLevel === 'staff') {
          staffId = user.id;
        }
      }
      
      
      
      const appointments = await storage.getAppointments(effectiveUserId, undefined, staffId);
      
      
      res.json(appointments);
    } catch (error: any) {
      console.error("[API] Error fetching all appointments:", error);
      console.error("[API] Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to fetch appointments",
        error: error.message || "Unknown error"
      });
    }
  });

  app.get('/api/appointments/:date', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const user = req.user;
      // Parse date string (YYYY-MM-DD) and create date in local timezone
      const dateStr = req.params.date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      
      
      // If user is staff (userType === 'staff'), filter by their staffId
      const staffId = (user.userType === 'staff' && user.accessLevel === 'staff') ? user.id : undefined;
      
      const appointments = await storage.getAppointments(effectiveUserId, date, staffId);
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // ==================== STAFF-SPECIFIC APPOINTMENT ROUTES ====================
  // These routes are exclusive for staff users and filter appointments where
  // the logged-in staff is linked to at least one procedure
  
  // Get all appointments for staff (filtered by staff linkage to procedures)
  app.get('/api/staff/appointments', isAuthenticated, async (req: any, res) => {
    try {
      
      const user = req.user;
      if (!user) {
        console.error("[API] /api/staff/appointments - No user in request");
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      

      // Verify user is staff
      const isStaff = user.userType === 'staff' || user.accessLevel === 'staff';
      if (!isStaff) {
        return res.status(403).json({ message: "This endpoint is only for staff users" });
      }

      let effectiveUserId;
      try {
        effectiveUserId = getEffectiveUserId(req);
        
      } catch (err) {
        console.error("[API] Error in getEffectiveUserId:", err);
        throw new Error("Failed to determine effective User ID");
      }

      if (!effectiveUserId || isNaN(effectiveUserId)) {
        console.error("[API] /api/staff/appointments - Invalid effectiveUserId:", effectiveUserId);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get staffId (this is the staff.id from staff table, not users.id)
      const staffId = user.id;
      
      
      
      // Get appointments filtered by staff linkage to procedures
      const appointments = await storage.getAppointments(effectiveUserId, undefined, staffId);
      
      if (!appointments) {
         return res.json([]);
      }

      
      res.json(appointments);
    } catch (error: any) {
      console.error("[API] Error fetching staff appointments:", error);
      console.error("[API] Error stack:", error.stack);
      res.status(500).json({ 
        message: "Failed to fetch staff appointments",
        error: error.message || "Unknown error"
      });
    }
  });

  // Get appointments for a specific date for staff
  app.get('/api/staff/appointments/:date', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify user is staff
      const isStaff = user.userType === 'staff' || user.accessLevel === 'staff';
      if (!isStaff) {
        return res.status(403).json({ message: "This endpoint is only for staff users" });
      }

      const effectiveUserId = getEffectiveUserId(req);
      // Parse date string (YYYY-MM-DD) and create date in local timezone
      const dateStr = req.params.date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      
      
      // Get staffId (this is the staff.id from staff table, not users.id)
      const staffId = user.id;
      
      const appointments = await storage.getAppointments(effectiveUserId, date, staffId);
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching staff appointments by date:", error);
      res.status(500).json({ message: "Failed to fetch staff appointments" });
    }
  });

  // Helper function to check if staff has access to an appointment
  // Checks both appointment_staff table and appointment_procedures table
  async function checkStaffAppointmentAccess(
    appointmentId: number,
    staffId: number
  ): Promise<boolean> {
    try {
      
      // Check if staff is directly assigned in appointment_staff table
      const [appointmentStaffRecord] = await db
        .select()
        .from(appointmentStaff)
        .where(and(
          eq(appointmentStaff.appointmentId, appointmentId),
          eq(appointmentStaff.staffId, staffId)
        ))
        .limit(1);
      
      if (appointmentStaffRecord) {
        return true; // Staff has direct access
      }
      
      // Check if staff is associated through appointment_procedures
      const appointmentProceduresRecords = await db
        .select()
        .from(appointmentProcedures)
        .where(and(
          eq(appointmentProcedures.appointmentId, appointmentId),
          eq(appointmentProcedures.staffId, staffId)
        ))
        .limit(1);
      
      if (appointmentProceduresRecords.length > 0) {
        return true; // Staff has access through procedures
      }
      
      return false; // No access found
    } catch (error) {
      console.error('[API] Error checking staff appointment access:', error);
      return false;
    }
  }

  // Helper function to check appointment conflicts
  async function checkAppointmentConflict(
    userId: number,
    staffId: number | null | undefined,
    appointmentDate: Date,
    durationMinutes: number,
    excludeAppointmentId?: number
  ): Promise<{ hasConflict: boolean; conflictingAppointment?: any }> {
    try {
      const startTime = new Date(appointmentDate);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      
      
      // Get all appointments for the user
      const appointments = await storage.getAppointments(userId);
      
      
      // Filter appointments for same staff (or any staff if staffId is null)
      const relevantAppointments = appointments.filter((apt: any) => {
        // Skip the appointment being updated
        if (excludeAppointmentId && apt.id === excludeAppointmentId) {
          
          return false;
        }
        
        // Skip cancelled appointments
        if (apt.status === 'cancelled') {
          
          return false;
        }
        
        // If staffId provided, only check that staff's appointments
        if (staffId && apt.staffId !== staffId) {
          
          return false;
        }

        // Only check appointments for the same date
        const aptDate = new Date(apt.appointmentDate);
        const requestDate = new Date(appointmentDate);
        
        // Simple date comparison (same day)
        const aptDateStr = aptDate.toISOString().split('T')[0];
        const requestDateStr = requestDate.toISOString().split('T')[0];
        
        if (aptDateStr !== requestDateStr) {
          
          return false;
        }
        
        return true;
      });
      
      
      
      // Check for time overlap
      for (const apt of relevantAppointments) {
        const aptStart = new Date(apt.appointmentDate);
        const aptDuration = apt.totalDuration || apt.duration || 60;
        const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
        
        
        
        // Check if times overlap (more precise logic)
        // Two appointments conflict if one starts before the other ends
        const hasOverlap = (startTime < aptEnd && endTime > aptStart);
        
        if (hasOverlap) {
          
          return { hasConflict: true, conflictingAppointment: apt };
        }
      }
      
      
      return { hasConflict: false };
    } catch (error) {
      console.error('❌ Error in checkAppointmentConflict:', error);
      return { hasConflict: false }; // Allow on error to not block user
    }
  }

  // Check availability endpoint
  app.post('/api/appointments/check-availability', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const { appointmentDate, duration, staffId } = req.body;
      
      
      
      if (!appointmentDate || !duration) {
        
        return res.status(400).json({ message: 'appointmentDate and duration are required' });
      }
      
      const conflict = await checkAppointmentConflict(
        effectiveUserId,
        staffId ? parseInt(staffId) : null,
        new Date(appointmentDate),
        parseInt(duration)
      );
      
      
      
      if (conflict.hasConflict) {
        
        return res.json({
          available: false,
          conflictingAppointment: {
            id: conflict.conflictingAppointment.id,
            clientName: conflict.conflictingAppointment.client?.name,
            time: conflict.conflictingAppointment.appointmentDate,
            duration: conflict.conflictingAppointment.totalDuration || conflict.conflictingAppointment.duration
          }
        });
      }
      
      
      res.json({ available: true });
    } catch (error) {
      console.error("❌ Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      
      const effectiveUserId = getEffectiveUserId(req);
      
      
      
      // Validate image data if present
      const { beforeImages = [], afterImages = [], ...restData } = req.body;
      
      // Validate image arrays
      const validateImages = (images: any[], type: string) => {
        if (!Array.isArray(images)) {
          throw new Error(`${type} must be an array`);
        }
        return images.filter(img => typeof img === 'string' && img.startsWith('data:image/'));
      };
      
      const validBeforeImages = validateImages(beforeImages, 'beforeImages');
      const validAfterImages = validateImages(afterImages, 'afterImages');
      
      // Convert appointmentDate string to Date object
      const appointmentDate = restData.appointmentDate ? new Date(restData.appointmentDate) : undefined;
      
      // Check for appointment conflicts
      if (appointmentDate) {
        const duration = restData.duration || 60;
        const conflict = await checkAppointmentConflict(
          effectiveUserId,
          restData.staffId ? parseInt(restData.staffId) : null,
          appointmentDate,
          duration
        );
        
        if (conflict.hasConflict) {
          return res.status(409).json({
            message: 'Time slot not available',
            conflictingAppointment: {
              clientName: conflict.conflictingAppointment.client?.name,
              time: conflict.conflictingAppointment.appointmentDate
            }
          });
        }
      }
      
      // Calculate total amount based on service/procedure price
      let totalAmount = 0;
      if (restData.serviceType === 'procedure') {
        const procedure = await procedureStorage.getProcedure(restData.serviceId, effectiveUserId.toString());
        totalAmount = parseFloat(procedure?.price || '0');
      } else {
        const services = await storage.getServices(effectiveUserId);
        const selectedService = services.find(s => s.id === restData.serviceId);
        totalAmount = parseFloat(selectedService?.price || '0');
      }
      
      const appointmentData = insertAppointmentSchema.parse({ 
        ...restData, 
        appointmentDate,
        userId: effectiveUserId,
        totalAmount: totalAmount.toString(),
        paidAmount: '0',
        paymentStatus: 'pending',
        beforeImages: validBeforeImages,
        afterImages: validAfterImages
      });
      
      const appointment = await storage.createAppointment(appointmentData);

      // Handle products if provided
      if (products && Array.isArray(products) && products.length > 0) {
        for (const prod of products) {
          try {
            await storage.addAppointmentProduct({
              appointmentId: appointment.id,
              productId: prod.productId,
              quantity: prod.quantity || 1,
              price: prod.price ? prod.price.toString() : undefined
            });
          } catch (err) {
            console.error(`Error adding product ${prod.productId} to appointment ${appointment.id}:`, err);
          }
        }
        
        // Refetch appointment to return updated totals
        // Or we can just return the appointment object (client will refresh usually)
        // But since addAppointmentProduct updates totalPrice, we might want to refetch?
        // Let's rely on client logic to refresh or correct the UI.
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Simple appointment update endpoint - accepts partial updates
  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid appointment ID" });
      }
      
      // Verify appointment belongs to user
      const [existingAppointment] = await db
        .select()
        .from(appointments)
        .where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
      
      if (!existingAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Prepare update data - convert and validate fields manually
      // We don't use schema validation here to allow flexible partial updates
      const updates: any = {};
      
      // Handle each field individually
      if (req.body.status !== undefined) updates.status = req.body.status;
      if (req.body.notes !== undefined) updates.notes = req.body.notes;
      if (req.body.paidAmount !== undefined) {
        const newPaidAmount = parseFloat(req.body.paidAmount.toString());
        const oldPaidAmount = parseFloat(existingAppointment.paidAmount || '0');
        
        if (newPaidAmount > oldPaidAmount) {
          const diff = newPaidAmount - oldPaidAmount;
          // Create transaction for difference
          await storage.createTransaction({
            userId,
            clientId: existingAppointment.clientId,
            appointmentId: existingAppointment.id,
            type: 'income',
            category: 'service', 
            amount: diff.toString(),
            description: `Payment for appointment #${existingAppointment.id}`,
            transactionDate: new Date(), 
            isPaid: true
          });
        }
        updates.paidAmount = req.body.paidAmount.toString();
        // Auto-update payment status
        const totalAmount = parseFloat(existingAppointment.totalAmount || '0');
        if (newPaidAmount >= totalAmount) {
            updates.paymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
            updates.paymentStatus = 'partial'; 
        }
      }
      if (req.body.paymentStatus !== undefined) updates.paymentStatus = req.body.paymentStatus;
      if (req.body.beforeImages !== undefined) updates.beforeImages = req.body.beforeImages;
      if (req.body.afterImages !== undefined) updates.afterImages = req.body.afterImages;
      
      // Convert appointmentDate from string to Date if provided
      if (req.body.appointmentDate !== undefined) {
        const appointmentDate = req.body.appointmentDate instanceof Date 
          ? req.body.appointmentDate 
          : new Date(req.body.appointmentDate);
        
        // Validate that the date is valid
        if (isNaN(appointmentDate.getTime())) {
          return res.status(400).json({ message: 'Invalid appointmentDate format' });
        }
        updates.appointmentDate = appointmentDate;
      }
      
      if (req.body.clientId !== undefined) {
        const clientId = parseInt(req.body.clientId.toString());
        if (isNaN(clientId)) {
          return res.status(400).json({ message: 'Invalid clientId' });
        }
        updates.clientId = clientId;
      }
      
      if (req.body.staffId !== undefined) {
        const staffId = parseInt(req.body.staffId.toString());
        if (!isNaN(staffId)) {
          updates.staffId = staffId;
        }
      }
      
      // If no updates provided, return current appointment
      if (Object.keys(updates).length === 0) {
        return res.json(existingAppointment);
      }
      
      // Update appointment directly
      const [updatedAppointment] = await db
        .update(appointments)
        .set(updates)
        .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
        .returning();
      
      if (!updatedAppointment) {
        return res.status(500).json({ message: "Failed to update appointment" });
      }
      
      // Return updated appointment
      res.json(updatedAppointment);
    } catch (error: any) {
      console.error("[API] Error updating appointment:", error);
      res.status(500).json({ 
        message: "Failed to update appointment",
        error: error.message 
      });
    }
  });

  // Products in Appointment Routes
  
  // Add product to appointment
  app.post('/api/appointments/:id/products', isAuthenticated, async (req: any, res) => {
    try {
      const { productId, quantity, price } = req.body;
      const appointmentId = parseInt(req.params.id);
      
      if (!productId || !quantity || !price) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const product = await storage.addAppointmentProduct({
        appointmentId,
        productId,
        quantity,
        price: price.toString(),
      });
      
      res.json(product);
    } catch (error) {
      console.error("Error adding product to appointment:", error);
      res.status(500).json({ message: "Failed to add product" });
    }
  });

  // Remove product from appointment
  app.delete('/api/appointments/:id/products/:productLinkId', isAuthenticated, async (req: any, res) => {
    try {
      const productLinkId = parseInt(req.params.productLinkId);
      await storage.removeAppointmentProduct(productLinkId);
      res.status(200).send("OK");
    } catch (error) {
      console.error("Error removing product from appointment:", error);
      res.status(500).json({ message: "Failed to remove product" });
    }
  });

  // New route for multiple procedures appointments
  app.post('/api/appointments/with-procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const { procedureIds, clientId, appointmentDate, staffId, staffIds, procedureStaffMap, notes, status = 'pending', waitlist = false, dateOnly = false } = req.body;

      if (!Array.isArray(procedureIds) || procedureIds.length === 0) {
        return res.status(400).json({ message: 'procedureIds must be a non-empty array' });
      }

      if (!clientId || !appointmentDate) {
        return res.status(400).json({ message: 'clientId and appointmentDate are required' });
      }

      // Calculate total duration from procedures and check for conflicts
      const procedures = await procedureStorage.getProcedures(effectiveUserId.toString());
      const selectedProcedures = procedures.filter((p: any) => procedureIds.includes(p.id));
      const totalDuration = selectedProcedures.reduce((sum: number, p: any) => sum + (p.duration || 60), 0);
      
      // Support both single staffId (backward compatibility) and staffIds array
      const staffIdsArray = staffIds && Array.isArray(staffIds) 
        ? staffIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id))
        : staffId 
          ? [parseInt(staffId)].filter((id: number) => !isNaN(id))
          : [];

      // Check for appointment conflicts for all selected staff
      if (staffIdsArray.length > 0) {
        for (const sId of staffIdsArray) {
          const conflict = await checkAppointmentConflict(
            effectiveUserId,
            sId,
            new Date(appointmentDate),
            totalDuration
          );
          
          if (conflict.hasConflict) {
            return res.status(409).json({
              message: 'Time slot not available',
              conflictingAppointment: {
                clientName: conflict.conflictingAppointment.client?.name,
                time: conflict.conflictingAppointment.appointmentDate
              }
            });
          }
        }
      }

      // If dateOnly is true, the frontend already sent the date at noon UTC
      // We just need to use it as-is without additional timezone manipulation
      let finalAppointmentDate = new Date(appointmentDate);
      
      

      const appointmentData = {
        userId: effectiveUserId,
        clientId: parseInt(clientId),
        appointmentDate: finalAppointmentDate,
        staffId: staffIdsArray.length > 0 ? staffIdsArray[0] : undefined, // First staff as primary for backward compatibility
        status,
        notes: notes || '',
        paidAmount: '0',
        paymentStatus: 'pending' as const,
        beforeImages: [],
        afterImages: [],
        waitlist: waitlist || false,
      };

      // Parse procedureStaffMap if provided
      const parsedProcedureStaffMap: Record<number, number> | undefined = procedureStaffMap 
        ? Object.entries(procedureStaffMap).reduce((acc, [procId, staffId]) => {
            const pId = parseInt(procId as string);
            const sId = parseInt(staffId as string);
            if (!isNaN(pId) && !isNaN(sId)) {
              acc[pId] = sId;
            }
            return acc;
          }, {} as Record<number, number>)
        : undefined;

      const result = await storage.createAppointmentWithProcedures(
        appointmentData,
        procedureIds.map((id: any) => parseInt(id)),
        effectiveUserId,
        staffIdsArray.length > 0 ? staffIdsArray : undefined,
        parsedProcedureStaffMap
      );

      // Automatically deduct materials from inventory
      await storage.deductMaterialsForAppointment(result.appointment.id, effectiveUserId);

      res.json(result);
    } catch (error) {
      console.error("Error creating appointment with procedures:", error);
      res.status(500).json({ message: "Failed to create appointment with procedures" });
    }
  });

  // Update appointment with procedures
  app.put('/api/appointments/:id/with-procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const appointmentId = parseInt(req.params.id);
      const { procedureIds, clientId, appointmentDate, staffId, staffIds, procedureStaffMap, notes, status, beforeImages, afterImages, paidAmount, paymentStatus, products: incomingProducts = [], paymentEntries = [] } = req.body;

      

      // Get existing appointment first to use its data if not provided
      const existingAppointment = await storage.getAppointmentWithProcedures(appointmentId, effectiveUserId);
      if (!existingAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // If procedureIds not provided or empty, use existing procedures
      const procedureIdsToUse = (Array.isArray(procedureIds) && procedureIds.length > 0) 
        ? procedureIds 
        : existingAppointment.procedures.map((p: any) => p.procedureId);
      
      

      // If procedureIds is still empty after using existing, it's an error
      if (!Array.isArray(procedureIdsToUse) || procedureIdsToUse.length === 0) {
        return res.status(400).json({ message: 'procedureIds must be a non-empty array or appointment must have existing procedures' });
      }

      // Use existing values if not provided
      const clientIdToUse = clientId || existingAppointment.appointment.clientId;
      const appointmentDateToUse = appointmentDate || existingAppointment.appointment.appointmentDate;

      // Calculate total duration from procedures using procedureIdsToUse
      const procedures = await procedureStorage.getProcedures(effectiveUserId.toString());
      const selectedProcedures = procedures.filter((p: any) => procedureIdsToUse.includes(p.id));
      const totalDuration = selectedProcedures.reduce((sum: number, p: any) => sum + (p.duration || 60), 0);
      
      // Support both single staffId (backward compatibility) and staffIds array
      // If not provided, use existing staff from appointment_staff table
      let staffIdsArray = staffIds && Array.isArray(staffIds) 
        ? staffIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id))
        : staffId 
          ? [parseInt(staffId)].filter((id: number) => !isNaN(id))
          : [];
      
      // If no staffIds provided, get from existing appointment_staff
      if (staffIdsArray.length === 0) {
        const existingStaff = await db
          .select({ staffId: appointmentStaff.staffId })
          .from(appointmentStaff)
          .where(eq(appointmentStaff.appointmentId, appointmentId));
        staffIdsArray = existingStaff.map((s: any) => s.staffId).filter((id: number) => !isNaN(id));
      }

      // Only check for conflicts if date/time is actually being changed
      const isDateChanging = appointmentDate && 
        new Date(appointmentDate).getTime() !== new Date(existingAppointment.appointment.appointmentDate).getTime();
      
      // Check for appointment conflicts only if date/time is changing
      if (isDateChanging && staffIdsArray.length > 0) {
        for (const sId of staffIdsArray) {
          const conflict = await checkAppointmentConflict(
            effectiveUserId,
            sId,
            new Date(appointmentDateToUse),
            totalDuration,
            appointmentId // Exclude current appointment from conflict check
          );
          
          if (conflict.hasConflict) {
            return res.status(409).json({
              message: 'Time slot not available',
              conflictingAppointment: {
                clientName: conflict.conflictingAppointment.client?.name,
                time: conflict.conflictingAppointment.appointmentDate
              }
            });
          }
        }
      }

      // Parse procedureStaffMap if provided
      const parsedProcedureStaffMap: Record<number, number> | undefined = procedureStaffMap 
        ? Object.entries(procedureStaffMap).reduce((acc, [procId, staffId]) => {
            const pId = parseInt(procId as string);
            const sId = parseInt(staffId as string);
            if (!isNaN(pId) && !isNaN(sId)) {
              acc[pId] = sId;
            }
            return acc;
          }, {} as Record<number, number>)
        : undefined;

      // Calculate totals
      const totalPrice = selectedProcedures.reduce((sum: number, p: any) => sum + parseFloat(p.price || '0'), 0);

      // Update appointment basic info
      // IMPORTANT: Use the status from request body if provided, otherwise keep existing
      // Check if status was explicitly provided (not just undefined)
      const statusToUse = status !== undefined && status !== null ? status : existingAppointment.appointment.status;
      
      
      
      await storage.updateAppointment(appointmentId, {
        userId: effectiveUserId,
        clientId: parseInt(clientIdToUse),
        appointmentDate: new Date(appointmentDateToUse),
        staffId: staffIdsArray.length > 0 ? staffIdsArray[0] : undefined,
        status: statusToUse, // Always use the determined status
        notes: notes !== undefined ? notes : (existingAppointment.appointment.notes || ''),
        paidAmount: paidAmount !== undefined ? paidAmount.toString() : (existingAppointment.appointment.paidAmount || '0'),
        paymentStatus: paymentStatus !== undefined ? paymentStatus : (existingAppointment.appointment.paymentStatus || 'pending'),
        beforeImages: beforeImages || existingAppointment.appointment.beforeImages || [],
        afterImages: afterImages || existingAppointment.appointment.afterImages || [],
        totalPrice: totalPrice.toFixed(2),
        totalDuration,
        procedureCount: procedureIdsToUse.length,
        totalAmount: totalPrice.toFixed(2),
      } as any);
      
      
      
      

      // Delete existing appointment_procedures
      await db.delete(appointmentProcedures).where(eq(appointmentProcedures.appointmentId, appointmentId));

      // Create new appointment_procedures records
      const appointmentProceduresData = selectedProcedures.map((proc: any, index: number) => ({
        appointmentId,
        procedureId: proc.id,
        staffId: parsedProcedureStaffMap?.[proc.id] || (staffIdsArray.length > 0 ? staffIdsArray[0] : undefined),
        order: index,
        procedureName: proc.name,
        procedureCategory: proc.category,
        price: proc.price || '0',
        duration: proc.duration || 0,
        materials: proc.materials || [],
      }));

      await db.insert(appointmentProcedures).values(appointmentProceduresData);

      // Update appointment_staff
      await db.delete(appointmentStaff).where(eq(appointmentStaff.appointmentId, appointmentId));
      
      if (staffIdsArray.length > 0) {
        const appointmentStaffData = staffIdsArray.map((staffId, index) => ({
          appointmentId,
          staffId,
          isPrimary: index === 0,
          role: index === 0 ? 'main' : 'assistant',
        }));
        await db.insert(appointmentStaff).values(appointmentStaffData);
      }

      // Save appointment products
      await db.delete(appointmentProducts).where(eq(appointmentProducts.appointmentId, appointmentId));
      if (Array.isArray(incomingProducts) && incomingProducts.length > 0) {
        await db.insert(appointmentProducts).values(
          incomingProducts.map((p: any) => ({
            appointmentId,
            productId: parseInt(p.productId),
            quantity: parseInt(p.quantity) || 1,
            price: p.price !== undefined && p.price !== null ? p.price.toString() : '0',
            originalPrice: p.originalPrice !== undefined && p.originalPrice !== null
              ? p.originalPrice.toString()
              : (p.price !== undefined && p.price !== null ? p.price.toString() : '0'),
          }))
        );
        
      }

      // Save individual payment entries
      if (Array.isArray(paymentEntries) && paymentEntries.length > 0) {
        const clientIdForPayments = parseInt(clientIdToUse as string);
        await db.delete(payments).where(eq(payments.appointmentId, appointmentId));
        const validEntries = paymentEntries.filter((e: any) => parseFloat(e.amount) > 0);
        if (validEntries.length > 0) {
          await db.insert(payments).values(
            validEntries.map((e: any) => ({
              userId: effectiveUserId,
              appointmentId,
              clientId: clientIdForPayments,
              amount: parseFloat(e.amount).toFixed(2),
              method: e.method || 'cash',
              status: 'completed',
              processedAt: new Date(),
            }))
          );
        }
      }

      // Update client's datahr (data e hora do último agendamento)
      await db
        .update(clients)
        .set({ datahr: new Date(appointmentDate) })
        .where(eq(clients.id, parseInt(clientId)));

      // Get updated appointment to verify the update was successful
      const updatedAppointment = await storage.getAppointmentWithProcedures(appointmentId, effectiveUserId);
      
      if (!updatedAppointment) {
        console.error(`[API] Failed to fetch updated appointment ${appointmentId}`);
        return res.status(500).json({ message: "Failed to fetch updated appointment" });
      }
      
      // Verify the status was saved correctly
      if (statusToUse && updatedAppointment.appointment.status !== statusToUse) {
        console.error(`[API] Status mismatch after update! Expected: ${statusToUse}, Got: ${updatedAppointment.appointment.status}`);
      } else {
        
      }
      
      
      
      // Return the full appointment data structure
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment with procedures:", error);
      res.status(500).json({ message: "Failed to update appointment with procedures" });
    }
  });

  // Get appointment with all procedures
  app.get('/api/appointments/:id/with-procedures', isAuthenticated, async (req: any, res) => {
    try {
      const effectiveUserId = getEffectiveUserId(req);
      const appointmentId = parseInt(req.params.id);

      const result = await storage.getAppointmentWithProcedures(appointmentId, effectiveUserId);

      if (!result) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // If user is staff, verify the appointment belongs to them
      const user = req.user;
      if (user.userType === 'staff' && user.accessLevel === 'staff') {
        // Check if this appointment has this staff member assigned
        // Uses both appointment_staff and appointment_procedures tables
        const hasAccess = await checkStaffAppointmentAccess(appointmentId, user.id);
        
        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied: Appointment not assigned to you' });
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching appointment with procedures:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });




  // Get staff associated with an appointment
  app.get('/api/appointments/:id/staff', isAuthenticated, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const staff = await storage.getAppointmentStaff(appointmentId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching appointment staff:", error);
      res.status(500).json({ message: "Failed to fetch appointment staff" });
    }
  });
}
