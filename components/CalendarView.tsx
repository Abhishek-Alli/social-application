
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CalendarEvent, User } from '../types';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, Users, X, Edit2, Trash2,
  ChevronDown, ChevronUp
} from 'lucide-react';

interface CalendarViewProps {
  currentUser: User;
  events: CalendarEvent[];
  allUsers: User[];
  onCreateEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'projectId' | 'userId'>) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  events,
  allUsers,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'day'>('month');
  const [showTodaysEvents, setShowTodaysEvents] = useState(true);

  // Debug: Log events when they change
  useEffect(() => {
    console.log('CalendarView - Total events:', events.length);
    if (events.length > 0) {
      console.log('CalendarView - Sample event:', events[0]);
      console.log('CalendarView - All events:', events);
    }
  }, [events]);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventAttendees, setEventAttendees] = useState<string[]>([]);
  const [eventColor, setEventColor] = useState('#f97316'); // Default orange
  const [allDay, setAllDay] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);
  const attendeeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attendeeDropdownRef.current && !attendeeDropdownRef.current.contains(event.target as Node)) {
        setShowAttendeeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    // Get date string in YYYY-MM-DD format using local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const filteredEvents = events.filter(event => {
      // Filter: show events where user is creator OR is in attendees list
      const isCreator = event.userId === currentUser.id;
      const isAttendee = event.attendees && event.attendees.includes(currentUser.id);
      
      if (!isCreator && !isAttendee) return false;
      
      if (!event.startDate || !event.endDate) return false;
      
      // Parse event dates and get date strings in YYYY-MM-DD format
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      
      // Handle invalid dates
      if (isNaN(eventStartDate.getTime()) || isNaN(eventEndDate.getTime())) {
        console.warn('Invalid date in event:', event);
        return false;
      }
      
      const eventStartYear = eventStartDate.getFullYear();
      const eventStartMonth = String(eventStartDate.getMonth() + 1).padStart(2, '0');
      const eventStartDay = String(eventStartDate.getDate()).padStart(2, '0');
      const eventStart = `${eventStartYear}-${eventStartMonth}-${eventStartDay}`;
      
      const eventEndYear = eventEndDate.getFullYear();
      const eventEndMonth = String(eventEndDate.getMonth() + 1).padStart(2, '0');
      const eventEndDay = String(eventEndDate.getDate()).padStart(2, '0');
      const eventEnd = `${eventEndYear}-${eventEndMonth}-${eventEndDay}`;
      
      // Check if the date falls within the event's date range
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
    
    return filteredEvents;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setIsCreatingEvent(true);
    // Format date as YYYY-MM-DD for input field (using local timezone)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEventStartDate(dateStr);
    setEventEndDate(dateStr);
    setEventStartTime('09:00');
    setEventEndTime('10:00');
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.startDate));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStartDate || !eventEndDate) return;

    const startDateTime = allDay 
      ? new Date(eventStartDate).toISOString()
      : new Date(`${eventStartDate}T${eventStartTime}`).toISOString();
    const endDateTime = allDay
      ? new Date(eventEndDate).toISOString()
      : new Date(`${eventEndDate}T${eventEndTime}`).toISOString();

    onCreateEvent({
      title: eventTitle,
      description: eventDescription,
      startDate: startDateTime,
      endDate: endDateTime,
      location: eventLocation,
      attendees: eventAttendees,
      color: eventColor,
      allDay: allDay
    });

    // Reset form
    setIsCreatingEvent(false);
    setEventTitle('');
    setEventDescription('');
    setEventStartDate('');
    setEventStartTime('');
    setEventEndDate('');
    setEventEndTime('');
    setEventLocation('');
    setEventAttendees([]);
    setEventColor('#f97316');
    setAllDay(false);
    setSelectedDate(null);
  };

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !eventTitle || !eventStartDate || !eventEndDate) return;

    const startDateTime = allDay 
      ? new Date(eventStartDate).toISOString()
      : new Date(`${eventStartDate}T${eventStartTime}`).toISOString();
    const endDateTime = allDay
      ? new Date(eventEndDate).toISOString()
      : new Date(`${eventEndDate}T${eventEndTime}`).toISOString();

    onUpdateEvent(selectedEvent.id, {
      title: eventTitle,
      description: eventDescription,
      startDate: startDateTime,
      endDate: endDateTime,
      location: eventLocation,
      attendees: eventAttendees,
      color: eventColor,
      allDay: allDay
    });

    setSelectedEvent(null);
    setIsCreatingEvent(false);
    resetForm();
  };

  const handleDeleteEvent = () => {
    if (selectedEvent && window.confirm('Are you sure you want to delete this event?')) {
      onDeleteEvent(selectedEvent.id);
      setSelectedEvent(null);
      setIsCreatingEvent(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventStartDate('');
    setEventStartTime('');
    setEventEndDate('');
    setEventEndTime('');
    setEventLocation('');
    setEventAttendees([]);
    setEventColor('#f97316');
    setAllDay(false);
    setSelectedDate(null);
  };

  const loadEventToForm = (event: CalendarEvent) => {
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    // Format dates using local timezone to avoid timezone conversion issues
    const startDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setEventStartDate(startDateStr);
    setEventEndDate(endDateStr);
    setEventStartTime(event.allDay ? '09:00' : start.toTimeString().slice(0, 5));
    setEventEndTime(event.allDay ? '10:00' : end.toTimeString().slice(0, 5));
    setEventLocation(event.location || '');
    setEventAttendees(event.attendees || []);
    setEventColor(event.color || '#f97316');
    setAllDay(event.allDay || false);
  };

  const renderCalendarGrid = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-1">
          <div className="h-full bg-slate-50 rounded-lg"></div>
        </div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(day)}
          className={`aspect-square p-1 cursor-pointer group ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
        >
          <div className={`h-full rounded-lg p-1.5 flex flex-col ${isToday ? 'bg-orange-50 border-2 border-orange-500' : 'bg-white border border-slate-100 hover:border-orange-300'} transition-all`}>
            <span className={`text-xs font-bold mb-1 ${isToday ? 'text-orange-600' : 'text-slate-700'}`}>
              {day}
            </span>
            <div className="flex-1 overflow-visible space-y-1 mt-1.5">
              {dateEvents.length > 0 && dateEvents.slice(0, 3).map((event, eventIndex) => (
                <div
                  key={`${date.toISOString().split('T')[0]}-${event.id}-${eventIndex}`}
                  onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                  className="h-4 w-full rounded-md cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all flex-shrink-0"
                  style={{ 
                    backgroundColor: event.color || '#f97316',
                    minHeight: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                  title={event.title}
                />
              ))}
              {dateEvents.length > 3 && (
                <div className="text-[8px] px-1 py-0.5 text-slate-500 font-bold">
                  +{dateEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  // Get today's events
  const todaysEvents = useMemo(() => {
    const today = new Date();
    const todayEvents = getEventsForDate(today);
    
    // Remove duplicates by ID (in case of any data inconsistencies)
    const uniqueEvents = Array.from(
      new Map(todayEvents.map(event => [event.id, event])).values()
    );
    
    return uniqueEvents.sort((a, b) => {
      // Sort by time (all-day events first, then by start time)
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay && b.allDay) return 0;
      
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return timeA - timeB;
    });
  }, [events, currentUser.id]);

  // Filter available users for attendee selection (exclude current user)
  const availableUsers = useMemo(() => {
    return allUsers.filter(user => 
      user.id !== currentUser.id && 
      (!attendeeSearch || 
       user.username.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
       user.name.toLowerCase().includes(attendeeSearch.toLowerCase()))
    );
  }, [allUsers, currentUser.id, attendeeSearch]);

  // Get user info for selected attendees
  const selectedAttendeeUsers = useMemo(() => {
    return eventAttendees.map(attendeeId => 
      allUsers.find(u => u.id === attendeeId)
    ).filter(Boolean) as User[];
  }, [eventAttendees, allUsers]);

  const handleAddAttendee = (userId: string) => {
    if (!eventAttendees.includes(userId)) {
      setEventAttendees([...eventAttendees, userId]);
    }
    setAttendeeSearch('');
    setShowAttendeeDropdown(false);
  };

  const handleRemoveAttendee = (userId: string) => {
    setEventAttendees(eventAttendees.filter(id => id !== userId));
  };

  if (isCreatingEvent || selectedEvent) {
    if (selectedEvent && !isCreatingEvent) {
      loadEventToForm(selectedEvent);
      setIsCreatingEvent(true);
    }

    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            {selectedEvent ? 'Edit Event' : 'Create Event'}
          </h3>
          <button 
            onClick={() => { setIsCreatingEvent(false); setSelectedEvent(null); resetForm(); }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-3">
          <input
            type="text"
            placeholder="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-bold"
            required
          />

          <textarea
            placeholder="Description (optional)"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm min-h-[80px] resize-none"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-600"
            />
            <label className="text-xs font-bold text-slate-700">All day</label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Start Date</label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                className="w-full p-2 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Start Time</label>
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs"
                  required={!allDay}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">End Date</label>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className="w-full p-2 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">End Time</label>
                <input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-xs"
                  required={!allDay}
                />
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Location (optional)"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm"
          />

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Attendees (optional)</label>
            <div className="relative">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedAttendeeUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold"
                  >
                    <span>@{user.username}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(user.id)}
                      className="hover:text-orange-900"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="relative" ref={attendeeDropdownRef}>
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={attendeeSearch}
                  onChange={(e) => {
                    setAttendeeSearch(e.target.value);
                    setShowAttendeeDropdown(true);
                  }}
                  onFocus={() => setShowAttendeeDropdown(true)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm"
                />
                {showAttendeeDropdown && availableUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {availableUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleAddAttendee(user.id)}
                        className="w-full px-3 py-2 text-left hover:bg-orange-50 transition-colors flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">@{user.username}</p>
                          <p className="text-xs text-slate-500">{user.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Color</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEventColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    eventColor === color ? 'border-slate-800 scale-110' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {selectedEvent && (
              <button
                type="button"
                onClick={handleDeleteEvent}
                className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100"
              >
                <Trash2 size={14} className="inline mr-1" />
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700"
            >
              {selectedEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 h-full flex flex-col">
      {/* Today's Events Section */}
      {todaysEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTodaysEvents(!showTodaysEvents)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-orange-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Today's Events ({todaysEvents.length})
              </h3>
            </div>
            {showTodaysEvents ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          
          {showTodaysEvents && (
            <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
              {todaysEvents.map((event, index) => (
                <div
                  key={`today-event-${event.id}-${index}`}
                  onClick={() => handleEventClick(event)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: event.color || '#f97316' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-sm">{event.title}</p>
                        {event.userId === currentUser.id && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{event.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        {event.allDay ? (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            All Day
                          </span>
                        ) : (
                          event.startDate && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {event.endDate && event.endDate !== event.startDate && (
                                <> - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                              )}
                            </span>
                          )
                        )}
                        
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </span>
                        )}
                        
                        {event.attendees && event.attendees.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-orange-600" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Calendar</h3>
        </div>
        <button
          onClick={() => setIsCreatingEvent(true)}
          className="p-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={previousMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-black text-slate-800">
            {monthNames[month]} {year}
          </h4>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
          >
            Today
          </button>
        </div>
        <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
          <ChevronRight size={18} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center p-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 overflow-visible">
        {renderCalendarGrid()}
      </div>

      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h5 className="text-xs font-black text-slate-700 mb-2 uppercase">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h5>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {selectedDateEvents.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="py-1.5 px-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: event.color || '#f97316' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{event.title}</p>
                  {event.startDate && !event.allDay && (
                    <p className="text-[10px] text-slate-500">
                      {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

