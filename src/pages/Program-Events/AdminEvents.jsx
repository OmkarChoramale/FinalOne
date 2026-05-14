import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminEvents = () => {
    const navigate = useNavigate();
    
    // --- Data States ---
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [bookings, setBookings] = useState([]); 
    
    // --- UI States ---
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(''); 
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const initialFormState = { id: null, title: '', date: '', siteId: '', programId: '' };
    const [formData, setFormData] = useState(initialFormState);

    const BASE_URL = 'http://localhost:8383/tourismgov/v1';

    // --- Helpers ---
    const getAxiosConfig = useCallback(() => {
        const token = localStorage.getItem('token');
        return { 
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        };
    }, []);

    const showWarning = (msg) => {
        setError(msg);
        setTimeout(() => setError(null), 6000); 
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const scrollToDetails = () => {
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    // --- Initialization ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        // Ensure only authorized users are here
        if (!token || !['ADMIN', 'OFFICER', 'MANAGER'].includes(role)) {
            navigate('/login');
            return;
        }
        
        fetchEvents();
    }, [navigate, getAxiosConfig]);

    // --- API Calls ---
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/events`, getAxiosConfig());
            setEvents(res.data);
            setError(null);
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to fetch events.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEvent = async (eventId) => {
        try {
            const [eventRes, bookingsRes] = await Promise.all([
                axios.get(`${BASE_URL}/events/${eventId}`, getAxiosConfig()),
                axios.get(`${BASE_URL}/events/${eventId}/bookings`, getAxiosConfig()).catch(() => ({ data: [] }))
            ]);
            
            setSelectedEvent(eventRes.data);
            setBookings(bookingsRes.data);
            setIsFormOpen(false);
            setError(null);
            setSuccessMsg('');
            scrollToDetails();
            
        } catch (err) {
            setIsFormOpen(false); 
            setSelectedEvent(null);
            showWarning(`Data Fetch Error: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; 

        setError(null);
        setSuccessMsg('');
        setIsSubmitting(true); 

        // Enforce LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
        let formattedDate = formData.date;
        if (formattedDate && formattedDate.length === 16) {
            formattedDate += ':00'; 
        }

        const payload = {
            title: formData.title,
            date: formattedDate,
            siteId: Number(formData.siteId),
            programId: Number(formData.programId)
        };

        try {
            if (isEditing && formData.id) {
                await axios.put(`${BASE_URL}/events/${formData.id}`, payload, getAxiosConfig());
                showSuccess('Event updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/events`, payload, getAxiosConfig());
                showSuccess('Tourism event created successfully!'); 
            }
            
            setFormData(initialFormState);
            setIsFormOpen(false);
            setIsEditing(false);
            await fetchEvents(); 
            
            if (isEditing && formData.id === selectedEvent?.eventId) {
                handleSelectEvent(formData.id);
            }
            
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to save event. Check constraints and inputs.');
        } finally {
            setIsSubmitting(false); 
        }
    };

    const handleEventStatusChange = async (eventId, newStatus) => {
        try {
            await axios.patch(`${BASE_URL}/events/${eventId}/status`, { status: newStatus }, getAxiosConfig());
            await fetchEvents();
            if (selectedEvent?.eventId === eventId) handleSelectEvent(eventId);
            showSuccess(`Event status updated to ${newStatus}`);
        } catch (err) {
            showWarning(err.response?.data?.message || "Cannot change event status.");
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to completely delete this event? This action cannot be undone.')) return;
        try {
            await axios.delete(`${BASE_URL}/events/${eventId}`, getAxiosConfig());
            setSelectedEvent(null);
            await fetchEvents();
            showSuccess('Event deleted successfully.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to delete event.');
        }
    };

    const handleBookingStatusChange = async (bookingId, newStatus) => {
        try {
            await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, { status: newStatus }, getAxiosConfig());
            handleSelectEvent(selectedEvent.eventId); 
            showSuccess('Booking status updated.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to update booking status.');
        }
    };
    
    // --- Handlers ---
    const handleToggleForm = () => {
        if (isFormOpen && !isEditing) {
            setIsFormOpen(false);
            setError(null);
        } else {
            setFormData(initialFormState);
            setIsEditing(false);
            setIsFormOpen(true);
            setSelectedEvent(null);
            setError(null);
            scrollToDetails();
        }
    };

    const openEditForm = (evt) => {
        setFormData({
            id: evt.eventId,
            title: evt.title || '', 
            date: evt.date ? evt.date.substring(0, 16) : '', 
            siteId: evt.siteId || '',
            programId: evt.programId || ''
        });
        setIsEditing(true);
        setIsFormOpen(true);
        setError(null);
    };

    const isEventImmutable = selectedEvent?.status === 'CANCELLED' || selectedEvent?.status === 'COMPLETED';

    return (
        <div className="pt-28 md:pt-36 pb-20 font-sans selection:bg-[#FF6D00] selection:text-white flex flex-col">
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 md:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* LEFT PANEL: EVENTS LIST */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    <div className="flex justify-between items-end mb-2 lg:mb-0">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none text-[#1A237E]">Event Management</h2>
                        <button 
                            onClick={handleToggleForm} 
                            className="bg-[#FF6D00] text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg hover:bg-[#1A237E] transition-all whitespace-nowrap"
                        >
                            {isFormOpen && !isEditing ? 'Cancel Form' : '+ New Event'}
                        </button>
                    </div>

                    {!loading && events.length === 0 && (
                        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-[#1A237E]/20 text-center flex flex-col items-center justify-center py-12 md:py-16 shadow-sm">
                            <span className="text-2xl mb-4">📅</span>
                            <h3 className="font-black text-lg md:text-xl uppercase text-[#1A237E] mb-2">No Events Found</h3>
                            <p className="font-medium text-xs md:text-sm opacity-60 mb-6 px-4">Initialize your first tourism event.</p>
                            <button onClick={handleToggleForm} className="bg-[#1A237E] text-white px-5 md:px-6 py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-[#FF6D00] transition-colors">
                                Create First Event
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:gap-4 max-h-auto lg:max-h-[75vh] overflow-y-auto pr-1 lg:pr-2">
                        {events.map(evt => (
                            <div 
                                key={evt.eventId} 
                                onClick={() => handleSelectEvent(evt.eventId)}
                                className={`p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] cursor-pointer transition-all border ${selectedEvent?.eventId === evt.eventId ? 'bg-[#1A237E] text-white shadow-xl scale-[1.02]' : 'bg-white shadow-sm hover:shadow-md border-[#1A237E]/10 hover:border-[#FF6D00]/50 text-[#1A237E]'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black uppercase text-base md:text-lg leading-tight line-clamp-2 pr-4">{evt.title}</h3>
                                </div>
                                <div className="flex justify-between items-center mt-3 md:mt-4">
                                    <span className={`px-2 py-1 md:px-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${selectedEvent?.eventId === evt.eventId ? 'bg-white/20' : 'bg-[#FF6D00]/10 text-[#FF6D00]'}`}>
                                        {evt.status}
                                    </span>
                                    <span className={`font-bold text-[9px] md:text-[10px] uppercase tracking-widest ${selectedEvent?.eventId === evt.eventId ? 'opacity-80' : 'opacity-50'}`}>
                                        {evt.date?.replace('T', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL: DETAILS & FORMS */}
                <div id="details-panel" className="lg:col-span-8 scroll-mt-24">
                    
                    {/* UI ALERTS */}
                    {successMsg && (
                        <div className="mb-4 md:mb-6 p-4 bg-green-50 border border-green-200 rounded-[1rem] flex items-center justify-between shadow-sm animate-fade-in-up">
                            <p className="text-green-700 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">✅ {successMsg}</p>
                            <button onClick={() => setSuccessMsg('')} className="text-green-700 hover:text-green-900">&times;</button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 md:mb-6 p-4 bg-[#D81B60]/10 border border-[#D81B60]/20 rounded-[1rem] flex items-center justify-between shadow-sm animate-fade-in-up">
                            <p className="text-[#D81B60] font-bold text-[9px] md:text-[10px] uppercase tracking-widest">⚠️ Warning: {error}</p>
                            <button onClick={() => setError(null)} className="text-[#D81B60] hover:text-red-900">&times;</button>
                        </div>
                    )}

                    {isFormOpen ? (
                        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-[#1A237E]/10 animate-fade-in-up">
                            <h2 className="text-2xl md:text-3xl font-black uppercase leading-none text-[#1A237E] mb-6 md:mb-8">
                                {isEditing ? 'Edit Event' : 'Create New Event'}
                            </h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
                                
                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Event Title</label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-bold text-sm md:text-base text-[#1A237E]" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Mandatory: Site ID</label>
                                        <input type="number" required min="1" value={formData.siteId} onChange={e => setFormData({...formData, siteId: e.target.value})} placeholder="e.g. 101"
                                            className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] outline-none font-bold text-gray-600 text-sm md:text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Mandatory: Program ID</label>
                                        <input type="number" required min="1" value={formData.programId} onChange={e => setFormData({...formData, programId: e.target.value})} placeholder="e.g. 5"
                                            className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] outline-none font-bold text-[#1A237E] text-sm md:text-base" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Event Date & Time</label>
                                    <input type="datetime-local" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] outline-none font-bold text-gray-600 text-sm md:text-base" />
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 mt-2 md:mt-4">
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-full font-black uppercase text-[10px] tracking-widest text-[#1A237E] hover:bg-gray-100 transition-colors">
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={`w-full sm:w-auto bg-[#1A237E] text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FF6D00] hover:-translate-y-1'}`}
                                    >
                                        {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Event')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedEvent ? (
                        
                        /* EVENT DETAILS DASHBOARD */
                        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-[#1A237E]/10 animate-fade-in-up text-[#1A237E]">
                            
                            {/* Header Panel */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1A237E]/10 pb-6 md:pb-8 mb-6 md:mb-8 gap-4">
                                <div className="w-full md:w-auto">
                                    <span className="bg-[#FF6D00] text-white px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 inline-block mr-2">Event ID: {selectedEvent.eventId}</span>
                                    {selectedEvent.programId && (
                                        <span className="bg-[#1A237E] text-white px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Program ID: {selectedEvent.programId}</span>
                                    )}
                                    <h2 className="text-2xl md:text-4xl font-black uppercase leading-tight md:leading-none text-[#1A237E] mb-2 md:mb-3">{selectedEvent.title}</h2>
                                    <p className="font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-50">DATE: {selectedEvent.date?.replace('T', ' ')} | SITE ID: {selectedEvent.siteId}</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <select 
                                        className={`w-full md:w-auto px-4 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none border-2 cursor-pointer transition-colors ${isEventImmutable ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-[#F8F9FF] border-[#1A237E]/10 text-[#1A237E]'}`}
                                        value={selectedEvent.status} 
                                        onChange={(e) => handleEventStatusChange(selectedEvent.eventId, e.target.value)}
                                        disabled={isEventImmutable}
                                        title={isEventImmutable ? "Terminal status cannot be changed manually" : "Change Event Status"}
                                    >
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="ONGOING">Ongoing</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Show the auto-generated location from the backend */}
                            <div className="mb-6 md:mb-8 bg-[#F8F9FF] p-4 rounded-[1rem] border border-[#1A237E]/10">
                                <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1A237E] mb-1">Generated Location</h3>
                                <p className="text-gray-800 font-bold text-sm md:text-base">{selectedEvent.location}</p>
                            </div>

                            {/* BOOKINGS SECTION */}
                            <div className="mt-6 md:mt-8 border-t border-[#1A237E]/10 pt-6 md:pt-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 sm:gap-0">
                                    <h3 className="text-xl md:text-2xl font-black uppercase text-[#1A237E]">Registered Bookings</h3>
                                    <span className="bg-[#1A237E] text-white font-bold px-3 py-1 rounded-full text-[9px] tracking-widest uppercase">
                                        Total: {bookings.length}
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {bookings.length === 0 ? (
                                        <div className="p-8 text-center bg-[#F8F9FF] rounded-[1.5rem] border border-dashed border-[#1A237E]/20">
                                            <p className="text-sm opacity-50 italic font-medium">No bookings found for this event.</p>
                                        </div>
                                    ) : null}

                                    {bookings.map(book => (
                                        <div key={book.bookingId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-white border border-[#1A237E]/10 rounded-[1rem] md:rounded-full shadow-sm hover:border-[#FF6D00]/30 transition-colors gap-3 sm:gap-0">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <span className="bg-[#1A237E] text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-[8px] md:text-[10px] font-black uppercase shrink-0">
                                                    #{book.bookingId}
                                                </span>
                                                <div>
                                                    <p className="font-black text-xs md:text-sm uppercase text-[#1A237E] leading-tight">Tourist ID: {book.touristId}</p>
                                                    <p className="font-bold text-[9px] md:text-[10px] uppercase opacity-50">Tickets: {book.numberOfTickets}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-center w-full sm:w-auto justify-between sm:justify-end pl-11 sm:pl-0">
                                                <select 
                                                    className="bg-transparent text-[8px] md:text-[9px] font-bold uppercase outline-none text-[#FF6D00] cursor-pointer"
                                                    value={book.status} 
                                                    onChange={(e) => handleBookingStatusChange(book.bookingId, e.target.value)}
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="CONFIRMED">Confirmed</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                    <option value="ATTENDED">Attended</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 md:pt-8 mt-6 md:mt-8 border-t border-[#1A237E]/10">
                                <button 
                                    onClick={() => openEditForm(selectedEvent)} 
                                    disabled={isEventImmutable}
                                    className={`w-full sm:flex-1 py-3 md:py-4 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-colors ${isEventImmutable ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#1A237E]/5 text-[#1A237E] hover:bg-[#1A237E] hover:text-white'}`}
                                    title={isEventImmutable ? "Completed or Cancelled events cannot be edited" : "Edit Event Details"}
                                >
                                    Edit Details
                                </button>
                                <button onClick={() => handleDeleteEvent(selectedEvent.eventId)} className="w-full sm:flex-1 bg-red-50 text-red-600 py-3 md:py-4 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-colors">
                                    Delete Event
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden lg:flex h-full min-h-[500px] flex-col items-center justify-center border-2 border-dashed border-[#1A237E]/20 rounded-[2rem] bg-white/50 text-[#1A237E]">
                            <span className="text-4xl mb-4 opacity-50">👆</span>
                            <p className="font-bold text-sm uppercase tracking-widest opacity-40">Select an event to view details and bookings</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminEvents;