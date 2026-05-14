import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TouristPrograms = () => {
    const navigate = useNavigate();
    
    // Auth & User State
    const [touristUser, setTouristUser] = useState({ id: null, name: '', role: '' });
    
    // Data States
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [programEvents, setProgramEvents] = useState([]); 
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASE_URL = 'http://localhost:8383/tourismgov/v1';

    const getAxiosConfig = useCallback(() => {
        const token = localStorage.getItem('token');
        return { 
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        };
    }, []);

    // --- UI Warning Handlers ---
    const showWarning = (msg) => {
        setError(msg);
        setTimeout(() => setError(null), 5000); 
    };

    // --- SECURITY CHECK & DATA FETCHING ---
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        // Ensure only Tourists can access this page
        if (!token || role !== 'TOURIST') {
            navigate('/login');
            return;
        }
        
        setTouristUser({ 
            id: storedUser?.id || storedUser?.userId || localStorage.getItem('userId'), 
            name: storedUser?.name || localStorage.getItem('name'), 
            role: role 
        });
        
        fetchPrograms();
    }, [navigate, getAxiosConfig]);

    // API: Fetch All Programs
    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/programs`, getAxiosConfig());
            // Filter out purely cancelled programs so tourists only see active/planned/completed ones
            const publicPrograms = res.data.filter(prog => prog.status !== 'CANCELLED');
            setPrograms(publicPrograms);
            setError(null);
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to fetch tourism programs.');
        } finally {
            setLoading(false);
        }
    };

    // API: Fetch Single Program's Events
    const handleSelectProgram = async (program) => {
        setSelectedProgram(program);
        setProgramEvents([]); // Clear old events while loading
        setError(null);
        
        try {
            const res = await axios.get(`${BASE_URL}/events/program/${program.programId}`, getAxiosConfig());
            
            // Filter out cancelled events for the public view
            const activeEvents = res.data.filter(evt => evt.status !== 'CANCELLED');
            setProgramEvents(activeEvents);
            
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            showWarning(`Failed to load events for this program: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        // Added pt-28 md:pt-36 to clear the global navbar
        <div className="pt-28 md:pt-36 pb-20 min-h-screen bg-[#FFFDF7] text-[#1A237E] font-sans selection:bg-[#FF6D00] selection:text-white flex flex-col">
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 md:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* LEFT PANEL: PROGRAMS LIST */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    <div className="flex justify-between items-end mb-2 lg:mb-0">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">Programs</h2>
                    </div>

                    {!loading && programs.length === 0 && (
                        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-[#1A237E]/20 text-center flex flex-col items-center justify-center py-12 md:py-16 shadow-sm">
                            <span className="text-2xl mb-4">🏛️</span>
                            <h3 className="font-black text-lg md:text-xl uppercase text-[#1A237E] mb-2">No Programs Available</h3>
                            <p className="font-medium text-xs md:text-sm opacity-60 mb-6 px-4">Check back later for new tourism initiatives.</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:gap-4 max-h-auto lg:max-h-[75vh] overflow-y-auto pr-1 lg:pr-2">
                        {programs.map(prog => (
                            <div 
                                key={prog.programId} 
                                onClick={() => handleSelectProgram(prog)}
                                className={`p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] cursor-pointer transition-all border ${selectedProgram?.programId === prog.programId ? 'bg-[#1A237E] text-white shadow-xl scale-[1.02]' : 'bg-white shadow-sm hover:shadow-md border-[#1A237E]/10 hover:border-[#FF6D00]/50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black uppercase text-base md:text-lg leading-tight line-clamp-2 pr-4">{prog.title}</h3>
                                </div>
                                <div className="flex justify-between items-center mt-3 md:mt-4">
                                    <span className={`px-2 py-1 md:px-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${selectedProgram?.programId === prog.programId ? 'bg-white/20' : 'bg-[#1A237E]/5 text-[#1A237E]'}`}>
                                        {prog.status}
                                    </span>
                                    <span className={`font-bold text-[9px] md:text-[10px] uppercase tracking-widest ${selectedProgram?.programId === prog.programId ? 'opacity-80' : 'text-[#FF6D00]'}`}>
                                        View Details &rarr;
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL: DETAILS & ASSOCIATED EVENTS */}
                <div id="details-panel" className="lg:col-span-8 scroll-mt-24">
                    
                    {error && (
                        <div className="mb-4 md:mb-6 p-4 bg-[#D81B60]/10 border border-[#D81B60]/20 rounded-[1rem] flex items-center justify-between shadow-sm animate-fade-in-up">
                            <p className="text-[#D81B60] font-bold text-[9px] md:text-[10px] uppercase tracking-widest">⚠️ Warning: {error}</p>
                            <button onClick={() => setError(null)} className="text-[#D81B60] hover:text-red-900">&times;</button>
                        </div>
                    )}

                    {selectedProgram ? (
                        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-[#1A237E]/10 animate-fade-in-up">
                            
                            {/* Header Panel */}
                            <div className="border-b border-[#1A237E]/10 pb-6 md:pb-8 mb-6 md:mb-8">
                                <span className="bg-[#FF6D00] text-white px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                                    Tourism Program
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black uppercase leading-tight md:leading-none text-[#1A237E] mb-3">
                                    {selectedProgram.title}
                                </h2>
                                <div className="flex gap-3 items-center">
                                    <span className="font-bold text-[10px] md:text-xs uppercase tracking-widest text-gray-500">
                                        📅 {selectedProgram.startDate} TO {selectedProgram.endDate}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className={`font-black text-[10px] md:text-xs uppercase tracking-widest ${selectedProgram.status === 'COMPLETED' ? 'text-green-600' : 'text-[#FF6D00]'}`}>
                                        {selectedProgram.status}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-8 md:mb-10">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1A237E] mb-3">About The Program</h3>
                                <p className="text-gray-600 font-medium leading-relaxed md:text-lg">
                                    {selectedProgram.description}
                                </p>
                            </div>

                            {/* ASSOCIATED EVENTS SECTION */}
                            <div className="bg-[#F8F9FF] p-6 md:p-8 rounded-[1.5rem] border border-[#1A237E]/10">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-0">
                                    <h3 className="text-lg md:text-xl font-black uppercase text-[#1A237E]">Events in this Program</h3>
                                    <span className="bg-[#1A237E] text-white font-bold px-3 py-1 rounded-full text-[9px] tracking-widest uppercase">
                                        {programEvents.length} Event(s)
                                    </span>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {programEvents.length === 0 ? (
                                        <div className="p-8 text-center bg-white rounded-[1rem] border border-dashed border-[#1A237E]/20">
                                            <p className="text-sm opacity-50 italic font-medium">No active events currently scheduled for this program.</p>
                                        </div>
                                    ) : null}

                                    {programEvents.map(evt => (
                                        <div key={evt.eventId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 bg-white border border-[#1A237E]/10 rounded-[1rem] shadow-sm hover:shadow-md transition-shadow gap-4 sm:gap-0">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="font-black text-sm md:text-base uppercase text-[#1A237E] leading-tight">{evt.title}</h4>
                                                <p className="font-bold text-[10px] md:text-xs uppercase text-gray-500">
                                                    🗓️ {evt.date?.replace('T', ' ')}
                                                </p>
                                                <p className="font-bold text-[9px] md:text-[10px] uppercase text-[#FF6D00]">
                                                    📍 {evt.location}
                                                </p>
                                            </div>
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                                <Link 
                                                    to="/tourist/events" 
                                                    className="block text-center sm:inline-block bg-[#1A237E]/5 text-[#1A237E] hover:bg-[#1A237E] hover:text-white px-5 py-2.5 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-colors"
                                                >
                                                    Book Now
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="hidden lg:flex h-full min-h-[500px] flex-col items-center justify-center border-2 border-dashed border-[#1A237E]/20 rounded-[2rem] bg-white/50">
                            <span className="text-4xl mb-4 opacity-50">👆</span>
                            <p className="font-bold text-sm uppercase tracking-widest opacity-40">Select a program to discover events</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TouristPrograms;