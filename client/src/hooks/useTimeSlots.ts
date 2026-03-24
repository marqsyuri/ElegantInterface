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
        const response = await apiRequest('GET', `/api/appointments/${selectedDate}`);
        const appointments = Array.isArray(response) ? response : [];
        
        // Filter appointments for the selected staff
        const staffAppointments = appointments.filter((apt: any) => {
          const matchesStaff = apt.staffId?.toString() === selectedStaffId;
          const notCancelled = apt.status !== 'cancelled';
          return matchesStaff && notCancelled;
        });
        
        setExistingAppointments(staffAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setExistingAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDate, selectedStaffId]);

  // Generate time slots based on business hours and existing appointments
  const timeSlots = useMemo(() => {
    if (!selectedDate || !businessHours.length) {
      return [];
    }

    const date = new Date(selectedDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const businessDay = businessHours.find(bh => bh.dayOfWeek === dayOfWeek);

    if (!businessDay?.isOpen) {
      return [];
    }

    // Use centralized time slot generation
    return generateTimeSlots(date, businessDay, duration, existingAppointments);
  }, [selectedDate, businessHours, duration, existingAppointments]);

  return { timeSlots, loading };
}

