import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
 
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
 
    // Context for live notifications
    const { unreadCount, latestNotification, refresh } = useNotifications();
    const [showLatest, setShowLatest] = useState(false);
 
    // 1. SMART DETECTION
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token;
    const userName = localStorage.getItem('name') || 'User';
   
    // Normalize role string to handle different database enum formats (e.g., 'PROGRAM_MANAGER' vs 'MANAGER')
    const rawRole = localStorage.getItem('role') || 'TOURIST';
    const userRole = rawRole.toUpperCase();
 
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
        window.location.reload();
    };
 
    const handleBellClick = () => {
        setShowLatest(!showLatest);
        if (!showLatest) refresh(); // fetch latest when opening
    };
 
    // 2. DYNAMIC LINKS BASED ON PDF ROLES
    let navLinks = [
        { name: 'Dashboard', path: '/main-dashboard' } // Mandatory for everyone
    ];
 
    switch (userRole) {
        case 'ADMINISTRATOR':
        case 'ADMIN':
            navLinks.push(
                { name: 'Tourist Details', path: '/admin-tourists' },
                { name: 'Programs', path: '/programs' },
                { name: 'Events', path: '/events' },
                { name: 'Heritage Sites', path: '/sites' },
                { name: 'Compliance', path: '/compliance' },
                { name: 'Audits', path: '/audits' },
                { name: 'Reports', path: '/reports' },
                { name: 'Users', path: '/admin-users' },
                { name: 'Audit Logs', path: '/audit-logs' }
            );
            break;
        case 'PROGRAM_MANAGER':
        case 'MANAGER':
            navLinks.push(
                { name: 'Programs', path: '/programs' },
                { name: 'Events', path: '/events' }
            );
            break;
        case 'TOURISM_OFFICER':
        case 'OFFICER':
            navLinks.push(
                { name: 'Tourist Details', path: '/admin-tourists' },
                { name: 'Heritage Sites', path: '/sites' }
            );
            break;
        case 'GOVERNMENT_AUDITOR':
        case 'AUDITOR':
            navLinks.push(
                { name: 'Audits', path: '/audits' },
                { name: 'Compliance', path: '/compliance' }
            );
            break;
        case 'COMPLIANCE_OFFICER':
        case 'COMPLIANCE':
            navLinks.push(
                { name: 'Compliance', path: '/compliance' }
            );
            break;
        case 'TOURIST':
        default:
            navLinks.push(
                { name: 'Tourist Details', path: '/tourist' },
                { name: 'Programs', path: '/tourist/programs' },
                { name: 'Events', path: '/tourist/events' }
            );
            break;
    }
 
    const isTourist = userRole === 'TOURIST';
 
    // ==========================================
    // PUBLIC NAVBAR (When Logged Out)
    // ==========================================
    if (!isLoggedIn) {
        return (
            <div className="absolute top-0 left-0 w-full z-50 p-4 md:p-6">
                <nav className="max-w-7xl mx-auto bg-white/90 backdrop-blur-xl rounded-full px-5 md:px-8 py-4 flex justify-between items-center shadow-2xl border border-white/20">
                    <Link to="/" className="text-[#1A237E] text-xl font-black tracking-tighter flex items-center gap-2">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                            alt="Government of India Emblem"
                            className="h-8 md:h-10 w-auto opacity-90"
                        />
                        TourismGov
                    </Link>
                    <div className="flex gap-3 md:gap-4">
                        <Link to="/login" className="bg-[#FF6D00] text-white font-bold uppercase tracking-widest px-6 py-2.5 text-[10px] rounded-full hover:bg-[#1A237E] shadow-md transition-colors">Login</Link>
                        <Link to="/register" className="bg-[#1A237E] text-white font-bold uppercase tracking-widest px-6 py-2.5 text-[10px] rounded-full hover:bg-[#FF6D00] shadow-md transition-colors">Register</Link>
                    </div>
                </nav>
            </div>
        );
    }
 
    // ==========================================
    // PRIVATE NAVBAR (When Logged In)
    // ==========================================
    return (
        <div className="absolute top-0 left-0 w-full z-50 p-4 md:p-6">
            <nav className="max-w-[95%] xl:max-w-7xl mx-auto bg-white/95 backdrop-blur-xl rounded-full px-4 md:px-6 py-3 flex justify-between items-center shadow-xl border border-white">
               
                {/* LOGO */}
                <Link to="/main-dashboard" className="text-[#1A237E] text-lg md:text-xl font-black tracking-tighter flex items-center gap-2 shrink-0">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                        alt="Government of India Emblem"
                        className="h-7 md:h-9 w-auto opacity-90"
                    />
                    <span className="hidden md:block">TourismGov</span>
                </Link>
 
                {/* DYNAMIC MIDDLE LINKS */}
                <div className="hidden lg:flex items-center justify-center gap-6 flex-1 flex-wrap px-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                                location.pathname === link.path
                                    ? 'text-[#FF6D00]'
                                    : 'text-[#1A237E] hover:text-[#FF6D00]'
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
 
                {/* RIGHT SIDE ACTIONS */}
                <div className="flex items-center gap-3 md:gap-5 shrink-0">
                   
                    {/* LIVE NOTIFICATIONS BELL DROPDOWN (MANDATORY FOR ALL) */}
                    <div className="relative">
                        <button
                            onClick={handleBellClick}
                            className="relative p-2.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors shadow-inner border border-slate-100 text-[#1A237E]"
                        >
                            <Bell size={18} className={unreadCount > 0 ? 'text-[#FF6D00]' : 'text-[#1A237E]'} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-[#FF6D00] text-white text-[8px] font-bold rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4 border-2 border-white animate-bounce">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
 
                        {/* DROPDOWN PANEL */}
                        {showLatest && (
                            <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-5 z-[60]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1A237E]">
                                        Latest Alert
                                    </h4>
                                    {unreadCount > 0 && (
                                        <span className="bg-[#FF6D00]/10 text-[#FF6D00] text-[9px] font-black px-2 py-0.5 rounded-full">
                                            {unreadCount} unread
                                        </span>
                                    )}
                                </div>
                                {latestNotification ? (
                                    <div className="bg-[#F8F9FF]/80 p-4 rounded-2xl border border-orange-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-[#FF6D00] animate-pulse flex-shrink-0" />
                                            <p className="text-[11px] font-black text-[#1A237E] truncate">
                                                {latestNotification.subject}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed pl-4">
                                            {latestNotification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                {latestNotification.category?.replace('_', ' ')}
                                            </span>
                                            <Link
                                                to="/notifications"
                                                onClick={() => setShowLatest(false)}
                                                className="text-[9px] font-black uppercase text-[#FF6D00] hover:underline"
                                            >
                                                View All →
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <Bell size={24} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            No New Alerts
                                        </p>
                                    </div>
                                )}
                                <Link
                                    to="/notifications"
                                    onClick={() => setShowLatest(false)}
                                    className="block mt-3 w-full text-center py-2.5 bg-[#1A237E] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#FF6D00] transition-all"
                                >
                                    Open Notification Center
                                </Link>
                            </div>
                        )}
                    </div>
 
                    {/* SMART USER PROFILE PILL */}
                    <Link
                        to={isTourist ? '/tourist' : '/main-dashboard'}
                        className="hidden md:flex items-center gap-3 bg-gray-50 pl-4 pr-1.5 py-1.5 rounded-full border border-gray-100 cursor-pointer hover:bg-gray-200 hover:border-gray-300 transition-all group"
                        title={isTourist ? "Go to My Profile" : "Go to Dashboard"}
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A237E] leading-none mb-0.5 group-hover:text-[#FF6D00] transition-colors">
                                {userName}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#FF6D00] leading-none">
                                {userRole.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="w-8 h-8 bg-[#1A237E] rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                            <User size={14} />
                        </div>
                    </Link>
 
                    <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
 
                    {/* LOGOUT */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors group"
                        title="Log Out"
                    >
                        <span className="hidden xl:block text-[9px] font-black uppercase tracking-widest group-hover:text-rose-600">
                            Log Out
                        </span>
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </nav>
        </div>
    );
};
 
export default Navbar;
 