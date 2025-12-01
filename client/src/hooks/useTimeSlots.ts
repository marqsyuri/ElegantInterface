import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { generateTimeSlots, toNZTime } from '@/lib/timezoneUtils';

interface BusinessHours {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface TimeSlot {
  value: string;
  label: string;
  available: boolean;
}

interface UseTimeSlotsProps {
  selectedDate: string;
  selectedStaffId: string;
  duration: number;
  businessHours?: BusinessHours[];
}

export function useTimeSlots({ 
  selectedDate, 
  selectedStaffId, 
  duration, 
  businessHours = [] 
}: UseTimeSlotsProps) {
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing appointments for the selected date and staff
  useEffect(() => {
    if (!selectedDate || !selectedStaffId) {
      setExistingAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching appointments for date:', selectedDate, 'staff:', selectedStaffId);
        const response = await apiRequest('GET', `/api/appointments/${selectedDate}`);
        const appointments = Array.isArray(response) ? response : [];
        
        console.log('📅 All appointments for date:', appointments.length);
        
        // Filter appointments for the selected staff
        const staffAppointments = appointments.filter((apt: any) => {
          const matchesStaff = apt.staffId?.toString() === selectedStaffId;
          const notCancelled = apt.status !== 'cancelled';
          console.log('🎯 Appointment check:', {
            id: apt.id,
            staffId: apt.staffId,
            selectedStaffId,
            status: apt.status,
            matchesStaff,
            notCancelled,
            appointmentDate: apt.appointmentDate
          });
          return matchesStaff && notCancelled;
        });
        
        console.log('✅ Filtered appointments for staff:', staffAppointments.length);
        setExistingAppointments(staffAppointments);
      } catch (error) {
        console.error('❌ Error fetching appointments:', error);
        setExistingAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDate, selectedStaffId]);

  // Generate time slots based on business hours and existing appointments
  const timeSlots = useMemo(() => {
    console.log('🔍 useTimeSlots debug:', {
      selectedDate,
      businessHoursLength: businessHours.length,
      businessHours,
      selectedStaffId,
      duration
    });

    if (!selectedDate) {
      console.log('❌ No selected date');
      return [];
    }

    if (!businessHours.length) {
      console.log('❌ No business hours available');
      return [];
    }

    const date = new Date(selectedDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessDay = businessHours.find(bh => bh.dayOfWeek === dayOfWeek);

    console.log('📅 Business day lookup:', {
      date: selectedDate,
      dayOfWeek,
      businessDay,
      allBusinessHours: businessHours
    });

    if (!businessDay?.isOpen) {
      console.log('❌ Business day not open or not found');
      return [];
    }

    console.log('🕐 Generating time slots:', {
      date: selectedDate,
      staffId: selectedStaffId,
      duration,
      businessDay: businessDay.dayOfWeek,
      existingAppointments: existingAppointments.length
    });

    // Use centralized time slot generation
    const slots = generateTimeSlots(date, businessDay, duration, existingAppointments);

    console.log('✅ Generated time slots:', {
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length,
      unavailableSlots: slots.filter(s => !s.available).length,
      slots: slots.slice(0, 5) // Show first 5 slots for debugging
    });

    return slots;
  }, [selectedDate, businessHours, duration, existingAppointments]);

  return { timeSlots, loading };
}

