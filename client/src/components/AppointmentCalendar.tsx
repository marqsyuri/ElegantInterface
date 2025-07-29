import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { enNZ } from "date-fns/locale";

interface Appointment {
  id: number;
  appointmentDate: string;
  duration: number;
  status: string;
  notes?: string;
  client: {
    id: number;
    name: string;
    phone?: string;
  };
  service: {
    id: number;
    name: string;
  };
}

interface AppointmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: Appointment[];
}

export default function AppointmentCalendar({ selectedDate, onDateChange, appointments }: AppointmentCalendarProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  
  // Generate time slots for the calendar (8 AM to 8 PM in 30-minute intervals)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? 0 : 30;
    return { hour, minute };
  });

  const formatNZTime = (date: Date) => {
    return format(date, "h:mm a", { locale: enNZ });
  };

  const formatNZDate = (date: Date) => {
    return format(date, "EEEE, d MMMM yyyy", { locale: enNZ });
  };

  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForTimeSlot = (day: Date, hour: number, minute: number) => {
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.appointmentDate);
      const appointmentHour = appointmentDate.getHours();
      const appointmentMinute = appointmentDate.getMinutes();
      
      // Check if appointment starts at this time slot or overlaps with it
      const slotStartTime = hour * 60 + minute;
      const appointmentStartTime = appointmentHour * 60 + appointmentMinute;
      const appointmentEndTime = appointmentStartTime + (appointment.duration || 60);
      
      return isSameDay(appointmentDate, day) && 
             appointmentStartTime === slotStartTime; // Only show at start time to avoid duplicates
    });
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.appointmentDate);
      return isSameDay(appointmentDate, day);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Scheduled';
    }
  };

  const calculateEndTime = (startDate: string, duration: number) => {
    const start = parseISO(startDate);
    const end = new Date(start.getTime() + (duration || 60) * 60000);
    return end;
  };

  if (viewMode === 'day') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDateChange(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[200px] text-center font-medium">
                {formatNZDate(selectedDate)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDateChange(addDays(selectedDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeSlots.map(({ hour, minute }) => {
              const timeSlotDate = new Date(selectedDate);
              timeSlotDate.setHours(hour, minute, 0, 0);
              const appointmentsAtTime = getAppointmentsForTimeSlot(selectedDate, hour, minute);

              return (
                <div key={`${hour}-${minute}`} className="flex items-start gap-4 py-2 border-b border-slate-100">
                  <div className="w-20 text-sm font-medium text-slate-600">
                    {formatNZTime(timeSlotDate)}
                  </div>
                  <div className="flex-1">
                    {appointmentsAtTime.length > 0 ? (
                      appointmentsAtTime.map(appointment => {
                        const endTime = calculateEndTime(appointment.appointmentDate, appointment.duration);
                        return (
                          <div key={appointment.id} className="p-3 bg-slate-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-600" />
                                <span className="font-medium">{appointment.client.name}</span>
                              </div>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusText(appointment.status)}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatNZTime(parseISO(appointment.appointmentDate))} - {formatNZTime(endTime)}
                                  ({appointment.duration || 60} mins)
                                </span>
                              </div>
                              <div>{appointment.service.name}</div>
                              {appointment.client.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3" />
                                  <span>{appointment.client.phone}</span>
                                </div>
                              )}
                              {appointment.notes && (
                                <div className="text-xs text-slate-500 mt-2">
                                  {appointment.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-400 italic">Available</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Week view
  const weekDays = getWeekDays(selectedDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(subDays(selectedDate, 7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="min-w-[200px] text-center font-medium">
              {format(weekDays[0], "d MMM", { locale: enNZ })} - {format(weekDays[6], "d MMM yyyy", { locale: enNZ })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(addDays(selectedDate, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day View
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-0 border border-slate-200 rounded-lg overflow-hidden">
          {/* Time column header */}
          <div className="text-sm font-medium text-slate-700 p-3 bg-slate-100 border-r border-slate-200">
            Time
          </div>
          
          {/* Day headers */}
          {weekDays.map(day => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toISOString()} 
                className={`text-sm font-medium text-center p-3 border-r border-slate-200 ${
                  isToday ? 'bg-primary/10 text-primary' : 'bg-slate-100'
                }`}
              >
                <div className="font-semibold">{format(day, "EEE", { locale: enNZ })}</div>
                <div className="text-xs text-slate-600">{format(day, "d", { locale: enNZ })}</div>
                {dayAppointments.length > 0 && (
                  <div className="text-xs mt-1 px-1 py-0.5 bg-primary/20 rounded text-primary">
                    {dayAppointments.length}
                  </div>
                )}
              </div>
            );
          })}

          {/* Time slots */}
          {timeSlots.map(({ hour, minute }) => {
            const timeSlotDate = new Date();
            timeSlotDate.setHours(hour, minute, 0, 0);

            return (
              <React.Fragment key={`time-slot-${hour}-${minute}`}>
                {/* Time label */}
                <div className="text-xs text-slate-600 p-2 border-r border-slate-200 bg-slate-50 font-medium">
                  {formatNZTime(timeSlotDate)}
                </div>
                
                {/* Day columns */}
                {weekDays.map(day => {
                  const appointmentsAtTime = getAppointmentsForTimeSlot(day, hour, minute);
                  const dayAppointments = getAppointmentsForDay(day);
                  
                  return (
                    <div 
                      key={`${format(day, 'yyyy-MM-dd')}-${hour}-${minute}`}
                      className="min-h-[50px] border border-slate-200 p-1 cursor-pointer hover:bg-slate-50 relative"
                      onClick={() => onDateChange(day)}
                      title={`${format(day, 'EEE d MMM')} at ${formatNZTime(timeSlotDate)}`}
                    >
                      {appointmentsAtTime.length > 0 ? (
                        appointmentsAtTime.map(appointment => {
                          const statusColorClass = getStatusColor(appointment.status);
                          const duration = appointment.duration || 60;
                          
                          return (
                            <div 
                              key={appointment.id} 
                              className={`text-xs p-1 rounded border shadow-sm ${statusColorClass} w-full`}
                              title={`${appointment.client?.name} - ${appointment.service?.name} (${duration}min)`}
                            >
                              <div className="font-semibold truncate">
                                {appointment.client?.name || 'No Client'}
                              </div>
                              <div className="truncate text-xs opacity-90">
                                {appointment.service?.name || 'No Service'}  
                              </div>
                              <div className="text-xs opacity-75">
                                {duration}min
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Show day total if no appointment at this specific time
                        hour === 8 && minute === 0 && dayAppointments.length > 0 ? (
                          <div className="text-xs text-slate-400 p-1">
                            {dayAppointments.length} appointment{dayAppointments.length > 1 ? 's' : ''} today
                          </div>
                        ) : null
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}