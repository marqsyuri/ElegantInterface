import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BusinessHour {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  lunchStart?: string;
  lunchEnd?: string;
}

interface Procedure {
  id: number;
  name: string;
  duration: number;
  price: string;
}

interface AppointmentCalendarProps {
  businessHours: BusinessHour[];
  selectedServices?: string[];
  procedures?: Procedure[];
  onDateTimeSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayMap = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

export default function AppointmentCalendar({
  businessHours,
  selectedServices,
  procedures,
  onDateTimeSelect,
  selectedDate,
  selectedTime
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Calculate total duration of selected services
  const totalDuration = useMemo(() => {
    if (!selectedServices || !procedures) return 0;
    return selectedServices.reduce((total, serviceId) => {
      const procedure = procedures.find(p => p.id.toString() === serviceId);
      return total + (procedure?.duration || 0);
    }, 0);
  }, [selectedServices, procedures]);

  // Get business hours for a specific day
  const getBusinessHoursForDay = (date: Date) => {
    const dayName = dayNames[date.getDay()].toLowerCase();
    return businessHours.find(bh => bh.dayOfWeek === dayName);
  };

  // Check if a date is available for booking
  const isDateAvailable = (date: Date) => {
    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    const businessHour = getBusinessHoursForDay(date);
    const available = businessHour?.isOpen || false;
    console.log('Date availability check:', date, 'available:', available, 'business hour:', businessHour);
    return available;
  };

  // Generate available time slots for a specific date
  const getAvailableTimeSlots = (date: Date) => {
    const businessHour = getBusinessHoursForDay(date);
    console.log('Getting slots for date:', date, 'Business hour:', businessHour);
    
    if (!businessHour?.isOpen) {
      console.log('No business hours or closed');
      return [];
    }

    const slots = [];
    const openTime = parseTime(businessHour.openTime);
    const closeTime = parseTime(businessHour.closeTime);
    const breakStart = businessHour.breakStartTime ? parseTime(businessHour.breakStartTime) : null;
    const breakEnd = businessHour.breakEndTime ? parseTime(businessHour.breakEndTime) : null;

    console.log('Times - Open:', openTime, 'Close:', closeTime, 'Break:', breakStart, '-', breakEnd, 'Duration needed:', totalDuration);

    // Generate 30-minute slots
    for (let time = openTime; time < closeTime; time += 30) {
      // Skip lunch break times
      if (breakStart && breakEnd && time >= breakStart && time < breakEnd) {
        console.log('Skipping lunch time:', time);
        continue;
      }
      
      // Check if there's enough time for the appointment before lunch break
      if (breakStart && time < breakStart && time + totalDuration > breakStart) {
        console.log('Not enough time before lunch:', time, 'need', totalDuration);
        continue;
      }
      
      // Check if there's enough time before closing
      if (time + totalDuration > closeTime) {
        console.log('Not enough time before closing:', time, 'need', totalDuration);
        continue;
      }

      const timeString = formatTimeSlot(time);
      slots.push({
        value: timeString,
        label: timeString,
        available: true
      });
    }

    console.log('Generated', slots.length, 'slots for', date);
    return slots;
  };

  // Parse time string to minutes since midnight
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Format time slot from minutes to display string
  const formatTimeSlot = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? 'AM' : 'PM';
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty slots for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const availableTimeSlots = selectedCalendarDate ? getAvailableTimeSlots(selectedCalendarDate) : [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setSelectedCalendarDate(date);
    // Clear selected time when date changes
    onDateTimeSelect(date.toISOString().split('T')[0], '');
  };

  const handleTimeSelect = (time: string) => {
    if (selectedCalendarDate) {
      onDateTimeSelect(selectedCalendarDate.toISOString().split('T')[0], time);
    }
  };

  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {(!selectedServices || selectedServices.length === 0) && (
        <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-700">Please select services first to see available appointment times.</p>
        </div>
      )}

      {selectedServices && selectedServices.length > 0 && (
        <>
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">{monthYear}</h3>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date ? (
                      <button
                        onClick={() => handleDateSelect(date)}
                        disabled={!isDateAvailable(date)}
                        className={cn(
                          "w-full h-full p-1 text-sm rounded-lg transition-colors",
                          isDateAvailable(date) 
                            ? "hover:bg-green-50 cursor-pointer" 
                            : "text-gray-300 cursor-not-allowed",
                          selectedCalendarDate?.toDateString() === date.toDateString()
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "",
                          date.toDateString() === new Date().toDateString()
                            ? "bg-blue-50 border border-blue-200"
                            : ""
                        )}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <div></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          {selectedCalendarDate && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Clock className="w-4 h-4 mr-2 text-green-600" />
                  <h4 className="font-medium">
                    Available times for {selectedCalendarDate.toLocaleDateString('en-NZ', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h4>
                </div>

                {availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => handleTimeSelect(slot.value)}
                        className={cn(
                          "p-2 text-sm rounded-lg border transition-colors",
                          selectedTime === slot.value
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50"
                        )}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No available time slots for this date
                  </p>
                )}

                {totalDuration > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    Appointment duration: {totalDuration} minutes
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}