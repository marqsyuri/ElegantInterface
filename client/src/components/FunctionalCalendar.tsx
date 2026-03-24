import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  subDays,
  parseISO,
} from "date-fns";
import { toNZTime, formatNZTime } from "@/lib/timezoneUtils";
import { useLocale } from "@/contexts/LocaleContext";
import { getDateLocale, getDayNames } from "@/lib/dateLocale";

interface Appointment {
  id: number;
  appointmentDate: string;
  duration: number;
  totalDuration?: number; // Total duration in minutes
  status: string;
  client: {
    name: string;
  };
  allProcedures?: Array<{
    name: string;
  }>;
  service?: {
    name: string;
  };
  totalAmount?: string;
  allStaff?: Array<{
    name: string;
    id: number;
  }>;
}

interface FunctionalCalendarProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onCreateAppointment: () => void;
  selectedDate?: Date;
  viewType?: "month" | "week";
}

const FunctionalCalendar: React.FC<FunctionalCalendarProps> = ({
  appointments,
  onDateSelect,
  onAppointmentClick,
  onCreateAppointment,
  selectedDate,
  viewType = "month",
}) => {
  const { language, t } = useLocale();
  const dateLocale = getDateLocale(language);
  const dayNames = getDayNames(language);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  // Ensure appointments is always an array
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  // Detect screen size for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize("mobile");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get appointments for a specific date - memoized to avoid recalculations
  const appointmentsByDate = useMemo(() => {
    try {
      const map = new Map<string, Appointment[]>();

      safeAppointments.forEach((appointment) => {
        try {
          if (!appointment || !appointment.appointmentDate) {
            return;
          }

          const appointmentDate = toNZTime(appointment.appointmentDate);
          const dateKey = format(appointmentDate, "yyyy-MM-dd");
          if (!map.has(dateKey)) {
            map.set(dateKey, []);
          }
          map.get(dateKey)!.push(appointment);
        } catch (error) {
          console.error(
            "FunctionalCalendar: Error processing appointment:",
            appointment,
            error
          );
        }
      });
      return map;
    } catch (error) {
      console.error(
        "FunctionalCalendar: Error creating appointmentsByDate:",
        error
      );
      return new Map<string, Appointment[]>();
    }
  }, [safeAppointments]);

  const getAppointmentsForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return appointmentsByDate.get(dateKey) || [];
  };

  // Simple status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 border-green-400 text-green-800";
      case "confirmed":
        return "bg-blue-100 border-blue-400 text-blue-800";
      case "cancelled":
        return "bg-red-100 border-red-400 text-red-800";
      case "pending":
        return "bg-yellow-100 border-yellow-400 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 border-blue-400 text-blue-800";
      default:
        return "bg-gray-100 border-gray-400 text-gray-800";
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  // Go to today
  const goToToday = () => {
    setCurrentMonth(new Date());
    setCurrentWeek(new Date());
  };

  // Week view functions
  const generateTimeSlots = (startHour = 8, endHour = 20) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 }); // Domingo
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    // Return different number of days based on screen size
    switch (screenSize) {
      case "mobile":
        // Show only today and tomorrow on mobile
        const today = new Date();
        const tomorrow = addDays(today, 1);
        return [today, tomorrow];
      case "tablet":
        // Show weekdays only (Mon-Fri)
        return allDays.slice(1, 6); // Skip Sunday (0) and Saturday (6)
      case "desktop":
      default:
        // Show full week
        return allDays;
    }
  };

  const calculatePosition = (appointmentDate: Date, startHour = 8) => {
    const hour = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();

    // Cada slot de 30min = 50px (ajustado para melhor visualização)
    const pixelsPerSlot = 50;
    const pixelsPerMinute = pixelsPerSlot / 30; // 30 minutos por slot

    const hoursFromStart = hour - startHour;
    const totalMinutesFromStart = hoursFromStart * 60 + minutes;

    return totalMinutesFromStart * pixelsPerMinute;
  };

  const calculateHeight = (durationMinutes: number) => {
    // Cada slot de 30min = 50px
    const pixelsPerSlot = 50;
    const pixelsPerMinute = pixelsPerSlot / 30;

    // Altura mínima de 40px para ser clicável, mas proporcional à duração
    return Math.max(durationMinutes * pixelsPerMinute, 40);
  };

  const getAppointmentsForDay = (date: Date) => {
    const appts = getAppointmentsForDate(date);
    return appts;
  };

  // Separate appointments into timed and all-day
  const separateAppointments = (appointments: Appointment[]) => {
    const timed: Appointment[] = [];
    const allDay: Appointment[] = [];
    
    appointments.forEach(apt => {
      const aptDate = toNZTime(apt.appointmentDate);
      const hour = aptDate.getHours();
      const minute = aptDate.getMinutes();
      
      // If time is exactly midnight (00:00) or noon (12:00), treat as all-day
      // This catches our date-only appointments
      if ((hour === 0 && minute === 0) || (hour === 12 && minute === 0)) {
        allDay.push(apt);
      } else {
        timed.push(apt);
      }
    });
    
    return { timed, allDay };
  };

  // Detect overlapping appointments and calculate positioning
  const getOverlappingAppointments = (appointments: Appointment[]) => {
    if (appointments.length === 0) return [];

    // Sort appointments by start time
    const sorted = [...appointments].sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    );

    const groups: Appointment[][] = [];
    let currentGroup: Appointment[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const currentStart = new Date(current.appointmentDate);
      const currentEnd = new Date(
        currentStart.getTime() + (current.totalDuration || 60) * 60000
      );

      if (currentGroup.length === 0) {
        currentGroup.push(current);
      } else {
        const lastInGroup = currentGroup[currentGroup.length - 1];
        const lastStart = new Date(lastInGroup.appointmentDate);
        const lastEnd = new Date(
          lastStart.getTime() + (lastInGroup.totalDuration || 60) * 60000
        );

        // Check if current appointment overlaps with the last one in the group
        if (currentStart < lastEnd) {
          currentGroup.push(current);
        } else {
          // No overlap, start a new group
          groups.push([...currentGroup]);
          currentGroup = [current];
        }
      }
    }

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Week navigation
  const goToPreviousWeek = () => {
    setCurrentWeek(subDays(currentWeek, 7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  // MonthViewAppointment component - memoized to avoid recalculations
  const MonthViewAppointment: React.FC<{
    appointment: Appointment;
    onAppointmentClick: (appointment: Appointment) => void;
    getStatusColor: (status: string) => string;
  }> = React.memo(
    ({ appointment, onAppointmentClick, getStatusColor }) => {
      const appointmentTime = useMemo(
        () => formatNZTime(appointment.appointmentDate, "HH:mm"),
        [appointment.appointmentDate]
      );

      return (
        <div
          className={`
          text-xs p-1 rounded cursor-pointer
          ${getStatusColor(appointment.status)}
          hover:opacity-80
        `}
          onClick={(e) => {
            e.stopPropagation();
            onAppointmentClick(appointment);
          }}
          title={`${appointment.client.name} - ${appointmentTime}`}
        >
          <div className="truncate font-medium">{appointment.client.name}</div>
          {appointment.allStaff && appointment.allStaff.length > 0 && (
            <div className="truncate text-[10px] opacity-90">
               {appointment.allStaff[0].name}
            </div>
          )}
          <div className="text-xs opacity-75">{appointmentTime}</div>
        </div>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.appointment.id === nextProps.appointment.id &&
        prevProps.appointment.appointmentDate ===
          nextProps.appointment.appointmentDate &&
        prevProps.appointment.status === nextProps.appointment.status
      );
    }
  );

  // AppointmentBlock component - memoized to avoid recalculations
  const AppointmentBlock: React.FC<{
    appointment: Appointment;
    onClick: () => void;
    overlapIndex?: number;
    overlapTotal?: number;
  }> = React.memo(
    ({ appointment, onClick, overlapIndex = 0, overlapTotal = 1 }) => {
      // Memoize timezone conversions and formatting
      const startTime = useMemo(
        () => toNZTime(appointment.appointmentDate),
        [appointment.appointmentDate]
      );
      const formattedTime = useMemo(
        () => formatNZTime(startTime, "HH:mm"),
        [startTime]
      );
      const titleTime = useMemo(
        () => formatNZTime(appointment.appointmentDate, "HH:mm"),
        [appointment.appointmentDate]
      );
      const duration = appointment.totalDuration || 60;

      const top = useMemo(() => calculatePosition(startTime, 6), [startTime]);
      const height = useMemo(() => calculateHeight(duration), [duration]);

      const statusColors = {
        pending: "bg-yellow-100 border-yellow-400 text-yellow-800",
        confirmed: "bg-blue-100 border-blue-400 text-blue-800",
        completed: "bg-green-100 border-green-400 text-green-800",
        cancelled: "bg-red-100 border-red-400 text-red-800",
      };

      // Calculate width and position for overlapping events
      const width = overlapTotal > 1 ? `${100 / overlapTotal}%` : "100%";
      const left =
        overlapTotal > 1 ? `${(overlapIndex * 100) / overlapTotal}%` : "0%";

      return (
        <div
          className={`
          absolute mx-1 
          border-l-4 rounded px-2 py-1
          cursor-pointer hover:shadow-lg transition-shadow
          overflow-hidden text-xs
          flex flex-col justify-start
          ${
            statusColors[appointment.status as keyof typeof statusColors] ||
            statusColors.pending
          }
        `}
          style={{
            top: `${top}px`,
            height: `${height}px`,
            minHeight: "40px", // mínimo para ser clicável
            left,
            width,
          }}
          onClick={onClick}
          title={`${appointment.client.name} - ${titleTime}`}
        >
          <div className="font-semibold truncate text-xs">{formattedTime}</div>
          <div className="truncate text-xs">
          {appointment.client.name}
        </div>
        {appointment.allStaff && appointment.allStaff.length > 0 && (
          <div className="truncate text-[10px] opacity-90 font-medium">
             👤 {appointment.allStaff[0].name}
          </div>
        )}
        {height > 50 && appointment.allProcedures && appointment.allProcedures.length > 0 && (
          <div className="text-[10px] opacity-75 truncate mt-1">
            ✂️ {appointment.allProcedures.map(p => p.name).join(", ")}
          </div>
        )}
        {height > 80 && appointment.allProcedures && appointment.allProcedures.length > 1 && (
          <div className="text-[9px] opacity-60 mt-1">
            +{appointment.allProcedures.length - 1} mais
          </div>
        )}
        </div>
      );
    },
    (prevProps, nextProps) => {
      // Custom comparison function for React.memo
      return (
        prevProps.appointment.id === nextProps.appointment.id &&
        prevProps.appointment.appointmentDate ===
          nextProps.appointment.appointmentDate &&
        prevProps.appointment.status === nextProps.appointment.status &&
        prevProps.appointment.totalDuration ===
          nextProps.appointment.totalDuration &&
        prevProps.overlapIndex === nextProps.overlapIndex &&
        prevProps.overlapTotal === nextProps.overlapTotal
      );
    }
  );

  // Render week view
  const renderWeekView = () => {
    const timeSlots = generateTimeSlots(6, 22); // Expanded range: 6h to 22h
    const weekDays = getWeekDays(currentWeek);

    return (
      <div className="space-y-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <h2 className="text-lg font-semibold">
            {screenSize === "mobile"
              ? t("today_tomorrow")
              : screenSize === "tablet"
              ? `${format(weekDays[0], "MMM d", {
                  locale: dateLocale,
                })} - ${format(weekDays[weekDays.length - 1], "MMM d", {
                  locale: dateLocale,
                })}`
              : `${t("week_of")} ${format(weekDays[0], "MMM d", {
                  locale: dateLocale,
                })} - ${format(weekDays[6], "MMM d, yyyy", {
                  locale: dateLocale,
                })}`}
          </h2>

          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Week Grid - Responsive */}
        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
          <div
            className={`
            grid gap-0
            ${
              screenSize === "mobile"
                ? "grid-cols-[60px_repeat(2,1fr)]"
                : screenSize === "tablet"
                ? "grid-cols-[70px_repeat(5,1fr)]"
                : "grid-cols-[80px_repeat(7,1fr)]"
            }
          `}
          >
            {/* Header */}
            <div
              className="bg-gray-50 p-2 text-sm font-medium text-gray-600 border-b"
              style={{ gridColumn: 1 }}
            >
              {t("time")}
            </div>
            {weekDays.map((day, dayIdx) => {
              const dayAppts = getAppointmentsForDay(day);
              const { allDay } = separateAppointments(dayAppts);
              return (
                <div
                  key={day.toISOString()}
                  className="bg-gray-50 p-2 text-sm font-medium text-gray-600 border-b border-l"
                  style={{ gridColumn: dayIdx + 2 }}
                >
                  <div>{format(day, "EEE", { locale: dateLocale })}</div>
                  <div className="text-xs">{format(day, "d")}</div>
                  {allDay.length > 0 && (
                    <div className="text-xs text-blue-600 font-semibold mt-1">
                      {allDay.length} todo dia
                    </div>
                  )}
                </div>
              );
            })}

            {/* Time slots with day cells */}
            {timeSlots.map((time, timeIndex) => {
              const rowIndex = timeIndex + 2; // +2 because row 1 is header

              return (
                <React.Fragment key={time}>
                  {/* Time label - only in first column */}
                  <div
                    className="text-xs text-gray-500 p-2 border-b border-r bg-white"
                    style={{ gridColumn: 1, gridRow: rowIndex }}
                  >
                    {time}
                  </div>

                  {/* Day cells - empty cells */}
                  {weekDays.map((day, dayIdx) => (
                    <div
                      key={`${day.toISOString()}-${time}`}
                      className="relative border-l border-b min-h-[50px] bg-white"
                      style={{ gridColumn: dayIdx + 2, gridRow: rowIndex }}
                    >
                      {/* Empty cells - appointments rendered in overlay */}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>

          {/* Appointments overlay - positioned over grid cells */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ marginTop: "41px" }}
          >
            <div
              className={`
              grid h-full gap-0
              ${
                screenSize === "mobile"
                  ? "grid-cols-[60px_repeat(2,1fr)]"
                  : screenSize === "tablet"
                  ? "grid-cols-[70px_repeat(5,1fr)]"
                  : "grid-cols-[80px_repeat(7,1fr)]"
              }
            `}
            >
              {/* Empty time column */}
              <div></div>

              {/* Appointment containers for each day column */}
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const { timed, allDay } = separateAppointments(dayAppointments);
                
                if (dayAppointments.length === 0) {
                  return <div key={`empty-${day.toISOString()}`}></div>;
                }

                const overlappingGroups = getOverlappingAppointments(timed);
                const totalHeight = timeSlots.length * 50;

                return (
                  <div
                    key={`appointments-col-${day.toISOString()}`}
                    className="relative"
                    style={{ height: `${totalHeight}px` }}
                  >
                    {/* All-day appointments section at top */}
                    {allDay.length > 0 && (
                      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-auto">
                        {allDay.map((appointment, idx) => {
                          const aptTime = toNZTime(appointment.appointmentDate);
                          const timeStr = formatNZTime(aptTime, "HH:mm");
                          const procedureNames = appointment.allProcedures?.map(p => p.name).join(", ") || "";
                          
                          return (
                            <div
                              key={appointment.id}
                              className={`
                                text-xs p-2 mb-1 rounded cursor-pointer border-l-4
                                ${getStatusColor(appointment.status)}
                                hover:opacity-80
                              `}
                              onClick={() => onAppointmentClick(appointment)}
                              title={`${appointment.client.name} - ${procedureNames || 'Todo o dia'}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="truncate font-medium">{appointment.client.name}</div>
                                <div className="text-[10px] opacity-75 ml-2">{timeStr}</div>
                              </div>
                              {appointment.allStaff && appointment.allStaff.length > 0 && (
                                <div className="truncate text-[10px] opacity-90">
                                  👤 {appointment.allStaff[0].name}
                                </div>
                              )}
                              {procedureNames && (
                                <div className="truncate text-[10px] opacity-75 mt-1">
                                  ✂️ {procedureNames}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Timed appointments */}
                    <div className="relative h-full w-full pointer-events-auto" style={{ marginTop: allDay.length > 0 ? `${allDay.length * 45}px` : '0' }}>
                      {overlappingGroups.map((group) =>
                        group.map((appointment, appointmentIndex) => (
                          <AppointmentBlock
                            key={appointment.id}
                            appointment={appointment}
                            onClick={() => onAppointmentClick(appointment)}
                            overlapIndex={appointmentIndex}
                            overlapTotal={group.length}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render month view (existing code)
  const renderMonthView = () => {
    return (
      <>
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Day headers */}
          {dayNames.map((day, index) => (
            <div
              key={index}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {day.substring(0, 3)}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-1 border border-gray-200 cursor-pointer transition-colors
                  ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                  ${isToday ? "bg-blue-50 border-blue-300" : ""}
                  ${isSelected ? "bg-green-50 border-green-300" : ""}
                  hover:bg-gray-50
                `}
                onClick={() => onDateSelect(day)}
              >
                <div className="flex flex-col h-full">
                  {/* Day number */}
                  <div
                    className={`
                    text-sm font-medium mb-1
                    ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                    ${isToday ? "text-blue-600 font-bold" : ""}
                    ${isSelected ? "text-green-600 font-bold" : ""}
                  `}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Appointments - Simple display */}
                  <div className="flex-1 space-y-1">
                    {dayAppointments.slice(0, 2).map((appointment) => (
                      <MonthViewAppointment
                        key={appointment.id}
                        appointment={appointment}
                        onAppointmentClick={onAppointmentClick}
                        getStatusColor={getStatusColor}
                      />
                    ))}

                    {/* Show more indicator */}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simple Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t("appointment_calendar")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateAppointment}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewType === "month" ? renderMonthView() : renderWeekView()}
      </CardContent>
    </Card>
  );
};

export default FunctionalCalendar;
