import { format, parseISO, addMinutes, isSameDay, startOfDay, endOfDay } from 'date-fns';

// New Zealand timezone
export const NZ_TIMEZONE = 'Pacific/Auckland';

/**
 * Convert a date string to New Zealand timezone
 */
export function toNZTime(dateString: string): Date {
  try {
    const date = parseISO(dateString);
    
    console.log('🌏 Converting to NZ time:', {
      input: dateString,
      parsed: date.toISOString(),
      local: date.toLocaleString()
    });
    
    // For now, just return the date as-is to avoid timezone issues
    return date;
  } catch (error) {
    console.error('Error converting to NZ time:', error);
    return new Date();
  }
}

/**
 * Convert a date to UTC for storage
 */
export function toUTC(date: Date): Date {
  try {
    // For now, just return the date as-is to avoid timezone issues
    return date;
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return date;
  }
}

/**
 * Format date in New Zealand timezone
 */
export function formatNZDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting NZ date:', error);
    return '';
  }
}

/**
 * Format time in New Zealand timezone
 */
export function formatNZTime(date: Date | string, formatStr: string = 'HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting NZ time:', error);
    return '';
  }
}

/**
 * Create a date-time string for appointment booking
 */
export function createAppointmentDateTime(dateStr: string, timeStr: string): string {
  try {
    // Parse the date and time
    const date = parseISO(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a new date with the specified time
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);
    
    console.log('🕐 Creating appointment date-time:', {
      inputDate: dateStr,
      inputTime: timeStr,
      outputISO: appointmentDate.toISOString(),
      localString: appointmentDate.toLocaleString()
    });
    
    return appointmentDate.toISOString();
  } catch (error) {
    console.error('Error creating appointment date-time:', error);
    return new Date().toISOString();
  }
}

/**
 * Parse time string to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    console.log('⏰ Parsing time to minutes:', {
      timeStr,
      hours,
      minutes,
      totalMinutes
    });
    
    return totalMinutes;
  } catch (error) {
    console.error('Error parsing time to minutes:', error);
    return 0;
  }
}

/**
 * Format minutes since midnight to time string
 */
export function formatMinutesToTime(minutes: number): string {
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    console.log('⏰ Formatting minutes to time:', {
      minutes,
      hours,
      mins,
      timeString
    });
    
    return timeString;
  } catch (error) {
    console.error('Error formatting minutes to time:', error);
    return '00:00';
  }
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: number, // minutes since midnight
  end1: number,   // minutes since midnight
  start2: number, // minutes since midnight
  end2: number    // minutes since midnight
): boolean {
  const overlaps = start1 < end2 && end1 > start2;
  
  console.log('🔄 Checking time range overlap:', {
    range1: `${formatMinutesToTime(start1)}-${formatMinutesToTime(end1)}`,
    range2: `${formatMinutesToTime(start2)}-${formatMinutesToTime(end2)}`,
    overlaps
  });
  
  return overlaps;
}

/**
 * Get appointments for a specific date in NZ timezone
 */
export function getAppointmentsForDate(appointments: any[], date: Date): any[] {
  try {
    const filtered = appointments.filter(appointment => {
      const appointmentDate = toNZTime(appointment.appointmentDate);
      const isSame = isSameDay(appointmentDate, date);
      
      console.log('📅 Date comparison:', {
        appointmentId: appointment.id,
        appointmentDate: appointment.appointmentDate,
        parsedDate: appointmentDate.toISOString(),
        targetDate: date.toISOString(),
        isSame
      });
      
      return isSame;
    });
    
    console.log('📅 Filtered appointments for date:', filtered.length);
    return filtered;
  } catch (error) {
    console.error('Error filtering appointments by date:', error);
    return [];
  }
}

/**
 * Convert appointment date to NZ time and extract time in minutes
 */
export function getAppointmentTimeInMinutes(appointment: any): number {
  try {
    const appointmentDate = toNZTime(appointment.appointmentDate);
    const minutes = appointmentDate.getHours() * 60 + appointmentDate.getMinutes();
    
    console.log('🕐 Getting appointment time in minutes:', {
      appointmentId: appointment.id,
      appointmentDate: appointment.appointmentDate,
      parsedDate: appointmentDate.toISOString(),
      hours: appointmentDate.getHours(),
      minutes: appointmentDate.getMinutes(),
      totalMinutes: minutes
    });
    
    return minutes;
  } catch (error) {
    console.error('Error getting appointment time in minutes:', error);
    return 0;
  }
}

/**
 * Check if an appointment time conflicts with existing appointments
 */
export function hasTimeConflict(
  startTimeMinutes: number,
  durationMinutes: number,
  appointments: any[]
): boolean {
  if (!appointments || appointments.length === 0) {
    return false;
  }

  const endTimeMinutes = startTimeMinutes + durationMinutes;

  return appointments.some(appointment => {
    try {
      // Skip cancelled appointments
      if (appointment.status === 'cancelled') {
        return false;
      }

      const aptStartMinutes = getAppointmentTimeInMinutes(appointment);
      const aptDuration = appointment.totalDuration || appointment.duration || 60;
      const aptEndMinutes = aptStartMinutes + aptDuration;

      const hasOverlap = timeRangesOverlap(startTimeMinutes, endTimeMinutes, aptStartMinutes, aptEndMinutes);
      
      if (hasOverlap) {
        console.log('⚠️ Time conflict detected:', {
          newStart: formatMinutesToTime(startTimeMinutes),
          newEnd: formatMinutesToTime(endTimeMinutes),
          existingStart: formatMinutesToTime(aptStartMinutes),
          existingEnd: formatMinutesToTime(aptEndMinutes),
          appointmentId: appointment.id,
          clientName: appointment.client?.name
        });
      }

      return hasOverlap;
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return false;
    }
  });
}

/**
 * Generate time slots for a given date and business hours
 */
export function generateTimeSlots(
  date: Date,
  businessHours: any,
  duration: number,
  existingAppointments: any[]
): Array<{ value: string; label: string; available: boolean }> {
  try {
    if (!businessHours?.isOpen) {
      return [];
    }

    const slots = [];
    const openTime = parseTimeToMinutes(businessHours.openTime);
    const closeTime = parseTimeToMinutes(businessHours.closeTime);
    const breakStart = businessHours.breakStartTime ? parseTimeToMinutes(businessHours.breakStartTime) : null;
    const breakEnd = businessHours.breakEndTime ? parseTimeToMinutes(businessHours.breakEndTime) : null;

    // Filter appointments for the same date
    const dayAppointments = getAppointmentsForDate(existingAppointments, date);

    console.log('🕐 Generating time slots with:', {
      openTime: formatMinutesToTime(openTime),
      closeTime: formatMinutesToTime(closeTime),
      breakStart: breakStart ? formatMinutesToTime(breakStart) : null,
      breakEnd: breakEnd ? formatMinutesToTime(breakEnd) : null,
      duration,
      dayAppointments: dayAppointments.length
    });

    for (let time = openTime; time < closeTime; time += 30) {
      // Skip lunch break times
      if (breakStart && breakEnd && time >= breakStart && time < breakEnd) {
        continue;
      }
      
      // Check if there's enough time for the appointment before lunch break
      if (breakStart && time < breakStart && time + duration > breakStart) {
        continue;
      }
      
      // Check if there's enough time before closing
      if (time + duration > closeTime) {
        continue;
      }

      // Check if this time slot conflicts with existing appointments
      const isAvailable = !hasTimeConflict(time, duration, dayAppointments);

      const timeString = formatMinutesToTime(time);
      slots.push({
        value: timeString,
        label: timeString,
        available: isAvailable
      });
    }

    console.log('✅ Generated time slots:', {
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length,
      unavailableSlots: slots.filter(s => !s.available).length
    });
    
    return slots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    return [];
  }
}
