import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCheck, Info, Clock, X, Maximize2, 
  ChevronDown, ShieldAlert
} from 'lucide-react';
import { notificationApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const NotificationsPage = () => {
    const { refresh: refreshGlobalCount } = useNotifications();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL'); 
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [focusedNotif, setFocusedNotif] = useState(null);

    // Categories matching your NotificationCategory.java enum
    const categories = [
        { id: 'ALL', label: 'All Intelligence', color: 'bg-slate-500' },
        { id: 'ACTION_REQUIRED', label: 'Action Required', color: 'bg-rose-600' },
        { id: 'TRANSACTIONAL', label: 'Transactional', color: 'bg-blue-600' },
        { id: 'SYSTEM_UPDATE', label: 'System Update', color: 'bg-amber-600' },
        { id: 'SYSTEM_CREATE', label: 'New Creation', color: 'bg-emerald-600' },
        { id: 'COMPLIANCE', label: 'Compliance', color: 'bg-violet-600' },
        { id: 'ANNOUNCEMENT', label: 'Announcement', color: 'bg-sky-600' },
        { id: 'SYSTEM', label: 'System Alert', color: 'bg-indigo-600' }
    ];

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await notificationApi.getAll(); 
            setNotifications(response.data);
        } catch (err) {
            console.error("Intelligence Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const openNotification = async (notif) => {
        setFocusedNotif(notif);
        if (notif.status === 'UNREAD') {
            try {
                await notificationApi.markAsRead(notif.notificationId); 
                setNotifications(prev => prev.map(n => 
                    n.notificationId === notif.notificationId ? { ...n, status: 'READ' } : n
                ));
                refreshGlobalCount(); // update bell icon count immediately
            } catch (err) {
                console.error("Status Update Failed:", err);
            }
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead(); 
            setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
            refreshGlobalCount(); // update bell icon count immediately
        } catch (err) {
            console.error("Bulk Update Failed:", err);
        }
    };

    const formatTimestamp = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true, day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const filteredList = notifications.filter(n => {
        const matchesStatus = statusFilter === 'ALL' || n.status === 'UNREAD';
        const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
        return matchesStatus && matchesCategory;
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7]">
            <div className="w-12 h-12 border-4 border-[#FF6D00] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] font-sans">
            <Navbar />
            
            <main className="max-w-6xl mx-auto px-6 pt-36 pb-20">
                <header className="mb-16">
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-10">
                        Operational <br /><span className="text-[#FF6D00]">Alerts.</span>
                    </h1>

                    <div className="bg-white rounded-[3rem] p-4 shadow-2xl border border-white flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:w-80">
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full appearance-none bg-[#F8F9FF] border-none rounded-full px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#1A237E] cursor-pointer outline-none"
                            >
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                        </div>

                        <div className="flex bg-[#F8F9FF] p-1.5 rounded-full">
                            <button onClick={() => setStatusFilter('ALL')} className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-white shadow-md text-[#FF6D00]' : 'text-slate-400'}`}>All</button>
                            <button onClick={() => setStatusFilter('UNREAD')} className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'UNREAD' ? 'bg-white shadow-md text-[#FF6D00]' : 'text-slate-400'}`}>Unread</button>
                        </div>

                        <div className="flex-1" />
                        <button onClick={handleMarkAllAsRead} className="bg-[#1A237E] text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#FF6D00] transition-all flex items-center gap-3">
                            <CheckCheck size={16} /> Mark All Read
                        </button>
                    </div>
                </header>

                <div className="space-y-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredList.map((notif) => {
                            const catStyle = categories.find(c => c.id === notif.category) || categories[0];
                            const isUnread = notif.status === 'UNREAD';
                            
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    key={notif.notificationId}
                                    onClick={() => openNotification(notif)}
                                    className={`group relative p-8 rounded-[3.5rem] border transition-all flex items-start gap-8 cursor-pointer ${
                                        isUnread ? 'bg-white shadow-2xl border-white hover:border-[#FF6D00]/20' : 'bg-slate-50/50 border-transparent opacity-60'
                                    }`}
                                >
                                    {/* --- UNREAD IDENTIFIER DOT --- */}
                                    {isUnread && (
                                        <div className="absolute top-8 right-8 flex items-center gap-2">
                                            <span className="text-[8px] font-black text-[#FF6D00] uppercase tracking-widest">New Intelligence</span>
                                            <div className="w-3 h-3 bg-[#FF6D00] rounded-full animate-pulse shadow-[0_0_15px_rgba(255,109,0,0.6)]" />
                                        </div>
                                    )}

                                    <div className={`p-5 rounded-2xl text-white shadow-lg ${catStyle.color} ${!isUnread && 'grayscale opacity-50'}`}>
                                        <Bell size={22} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white ${catStyle.color}`}>
                                                {notif.category.replace('_', ' ')}
                                            </span>
                                            <h3 className={`font-black uppercase text-sm tracking-tight ${isUnread ? 'text-[#1A237E]' : 'text-slate-500'}`}>
                                                {notif.subject}
                                            </h3>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-1">{notif.message}</p>
                                        <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            <Clock size={12} /> {formatTimestamp(notif.createdDate)}
                                        </div>
                                    </div>
                                    <Maximize2 size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all mt-6" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </main>

            {/* --- FOCUS MODAL --- */}
            <AnimatePresence>
                {focusedNotif && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFocusedNotif(null)} className="absolute inset-0 bg-[#1A237E]/60 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-[4rem] p-12 shadow-3xl">
                            <button onClick={() => setFocusedNotif(null)} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-full hover:bg-rose-50 transition-all">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-6 mb-10">
                                <div className={`p-6 rounded-3xl text-white shadow-2xl ${categories.find(c => c.id === focusedNotif.category)?.color}`}>
                                    <Bell size={32} />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">{focusedNotif.subject}</h2>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[3rem] mb-10 border border-slate-100">
                                <p className="text-base font-medium text-slate-600 leading-relaxed italic">"{focusedNotif.message}"</p>
                            </div>
                            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Clock size={14} /> {formatTimestamp(focusedNotif.createdDate)}
                                </div>
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Marked as Read</div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
};

export default NotificationsPage;