
import React, { useState, useMemo } from 'react';
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
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setIsCreatingEvent(true);
    const dateStr = clickedDate.toISOString().split('T')[0];
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
    setEventStartDate(start.toISOString().split('T')[0]);
    setEventEndDate(end.toISOString().split('T')[0]);
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
          <div className={`h-full rounded-lg p-2 flex flex-col ${isToday ? 'bg-orange-50 border-2 border-orange-500' : 'bg-white border border-slate-100 hover:border-orange-300'} transition-all`}>
            <span className={`text-xs font-bold ${isToday ? 'text-orange-600' : 'text-slate-700'}`}>
              {day}
            </span>
            <div className="flex-1 overflow-hidden mt-1 space-y-0.5">
              {dateEvents.slice(0, 2).map((event, eventIndex) => (
                <div
                  key={`${date.toISOString().split('T')[0]}-${event.id}-${eventIndex}`}
                  onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                  className="text-[8px] px-1.5 py-0.5 rounded truncate font-bold text-white"
                  style={{ backgroundColor: event.color || '#f97316' }}
                >
                  {event.title}
                </div>
              ))}
              {dateEvents.length > 2 && (
                <div className="text-[8px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">
                  +{dateEvents.length - 2} more
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

      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
        {renderCalendarGrid()}
      </div>

      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h5 className="text-xs font-black text-slate-700 mb-2 uppercase">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedDateEvents.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="p-2 rounded-lg text-xs cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderLeft: `3px solid ${event.color || '#f97316'}` }}
              >
                <p className="font-bold text-slate-800">{event.title}</p>
                {event.startDate && (
                  <p className="text-[10px] text-slate-500">
                    {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

