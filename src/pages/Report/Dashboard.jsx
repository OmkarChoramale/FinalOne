import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin, Calendar, Users, ShieldCheck,
  Loader2, FileSearch, Layers, CalendarDays, Ticket, Map, Shield, User
} from 'lucide-react';
 
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
 
  // --- API DATA FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
        const BASE_URL = 'http://localhost:8383/tourismgov/v1';
 
        // 1. Fetch data concurrently
        const [sitesRes, programsRes, eventsRes, usersRes, bookingsPagedRes] = await Promise.all([
            axios.get(`${BASE_URL}/sites`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/programs`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/events`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/users`, axiosConfig).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/bookings/paged?size=1`, axiosConfig).catch(() => ({ data: { totalElements: 0 } }))
        ]);
 
        // 2. Safely calculate the counts
        const totalSites = sitesRes.data?.length || 0;
        const totalEvents = eventsRes.data?.length || 0;
        const totalUsers = usersRes.data?.length || 0;
       
        const activeProgs = programsRes.data?.filter
            ? programsRes.data.filter(p => p.status === 'ACTIVE' || p.status === 'PLANNED').length
            : 0;
 
        // Extract total elements from Spring Boot's Pageable response
        const totalBookings = bookingsPagedRes.data?.totalElements || 0;
 
        // 3. Set the data so the dashboard renders properly
        setData({
            role: localStorage.getItem('role') || 'TOURIST',
            userName: localStorage.getItem('name') || 'User',
            metrics: {
                heritageSites: totalSites,
                activePrograms: activeProgs,
                upcomingEvents: totalEvents,
                totalUsers: totalUsers,
                pendingAudits: 0, // Update this if you have a specific Audit API later
                totalBookings: totalBookings
            }
        });
 
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
   
    fetchDashboardData();
  }, []);
 
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDF7]">
      <Loader2 size={48} className="text-[#FF6D00] animate-spin mb-4" />
      <p className="font-black uppercase text-xs tracking-widest text-[#1A237E]">Synchronizing Intelligence...</p>
    </div>
  );
 
  // Normalize role string to handle database enum formats
  const rawRole = data?.role || 'TOURIST';
  const userRole = rawRole.toUpperCase();
  const userName = data?.userName || 'User';
  const metrics = data?.metrics || {};
  const isTourist = userRole === 'TOURIST';
 
  // --- KPI CARDS DEFINITIONS ---
  const allKpis = {
    sites: { label: "Heritage Sites", value: metrics.heritageSites || 0, icon: <MapPin size={26} />, color: "bg-[#1A237E] shadow-indigo-500/20" },
    programs: { label: "Active Programs", value: metrics.activePrograms || 0, icon: <Layers size={26} />, color: "bg-emerald-600 shadow-emerald-500/20" },
    events: { label: "Upcoming Events", value: metrics.upcomingEvents || 0, icon: <Calendar size={26} />, color: "bg-[#FF6D00] shadow-orange-500/20" },
    audits: { label: "Pending Audits", value: metrics.pendingAudits || 0, icon: <ShieldCheck size={26} />, color: "bg-rose-600 shadow-rose-500/20" },
    users: { label: "Registered Users", value: metrics.totalUsers || 0, icon: <Users size={26} />, color: "bg-blue-500 shadow-blue-500/20" },
    bookings: { label: "Total Bookings", value: metrics.totalBookings || 0, icon: <Ticket size={26} />, color: "bg-teal-500 shadow-teal-500/20" }
  };
 
  // --- ACTION CARDS DEFINITIONS (MODULES) ---
  const allModules = {
    touristDetail: { to: isTourist ? "/tourist" : "/admin-tourists", icon: <User size={24} />, title: "Tourist Detail", desc: "View profile, verify documents, and manage bookings.", color: "bg-indigo-500" },
    programs: { to: isTourist ? "/tourist/programs" : "/programs", icon: <Layers size={24} />, title: "Programs", desc: "Manage national tourism campaigns and budgets.", color: "bg-[#1A237E]" },
    events: { to: isTourist ? "/tourist/events" : "/events", icon: <CalendarDays size={24} />, title: "Events", desc: "Schedule festivals and oversee tourist bookings.", color: "bg-[#FF6D00]" },
    sites: { to: "/sites", icon: <Map size={24} />, title: "Sites", desc: "Register monuments and track preservation logs.", color: "bg-cyan-600" },
    compliance: { to: "/compliance", icon: <Shield size={24} />, title: "Governance", desc: "Conduct official audits and compliance records.", color: "bg-rose-600" },
    reports: { to: "/reports", icon: <FileSearch size={24} />, title: "Reports", desc: "Generate and download secure intelligence briefs.", color: "bg-emerald-600" }
  };
 
  // --- SMART RBAC FILTERING ---
  let displayKpis = [];
  let displayModules = [];
 
  switch (userRole) {
    case 'ADMINISTRATOR':
    case 'ADMIN':
        displayKpis = [allKpis.sites, allKpis.programs, allKpis.events, allKpis.audits, allKpis.users, allKpis.bookings];
        displayModules = [allModules.touristDetail, allModules.programs, allModules.events, allModules.sites, allModules.compliance, allModules.reports];
        break;
    case 'PROGRAM_MANAGER':
    case 'MANAGER':
        displayKpis = [allKpis.programs, allKpis.events, allKpis.bookings];
        displayModules = [allModules.programs, allModules.events, allModules.reports];
        break;
    case 'TOURISM_OFFICER':
    case 'OFFICER':
        displayKpis = [allKpis.sites, allKpis.events, allKpis.bookings];
        displayModules = [allModules.touristDetail, allModules.sites, allModules.events];
        break;
    case 'GOVERNMENT_AUDITOR':
    case 'AUDITOR':
        displayKpis = [allKpis.audits, allKpis.programs];
        displayModules = [allModules.compliance, allModules.reports];
        break;
    case 'COMPLIANCE_OFFICER':
    case 'COMPLIANCE':
        displayKpis = [allKpis.audits];
        displayModules = [allModules.compliance];
        break;
    case 'TOURIST':
    default:
        displayKpis = [allKpis.programs, allKpis.events, allKpis.bookings];
        displayModules = [allModules.touristDetail, allModules.programs, allModules.events];
        break;
  }
 
  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] font-sans flex flex-col pt-32 pb-20">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6">
       
        {/* HEADER */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#FF6D00] text-white text-[8px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest">
              Live System Status
            </span>
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              {userRole.replace('_', ' ')} CLEARANCE LEVEL
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            Operational <br /><span className="text-[#FF6D00]">Intelligence.</span>
          </h1>
          <p className="mt-4 font-bold opacity-60 text-lg">
            System initialized for {userName}.
          </p>
        </header>
 
        {/* METRICS GRID - DYNAMIC BASED ON ROLE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayKpis.map((kpi, index) => (
            <StatCard key={index} label={kpi.label} value={kpi.value} icon={kpi.icon} color={kpi.color} />
          ))}
        </div>
 
        {/* MODULES NAVIGATION - DYNAMIC BASED ON ROLE */}
        <div className="mt-16 border-t border-[#1A237E]/10 pt-16 animate-fade-in-up">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#1A237E]">
                    {isTourist ? 'Personal Modules' : 'System Modules'}
                  </h2>
                  <p className="font-bold text-xs uppercase tracking-widest text-[#1A237E]/50 mt-2">
                    {isTourist ? 'Manage your profile and bookings.' : 'System Management & Oversight Console.'}
                  </p>
              </div>
          </div>
         
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayModules.map((module, index) => (
               <ActionCard
                 key={index}
                 to={module.to}
                 icon={module.icon}
                 title={module.title}
                 desc={module.desc}
                 color={module.color}
               />
            ))}
          </div>
        </div>
 
      </main>
    </div>
  );
};
 
// --- COMPONENTS ---
const StatCard = ({ label, value, icon, color }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-6 transition-shadow hover:shadow-2xl">
    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <span className="text-3xl md:text-4xl font-black text-[#1A237E] tracking-tighter leading-none block">{value.toLocaleString()}</span>
    </div>
  </motion.div>
);
 
const ActionCard = ({ to, icon, title, desc, color }) => (
  <Link to={to} className="block group h-full">
    <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-full flex flex-col transition-all hover:border-[#1A237E]/20 hover:shadow-2xl">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg mb-6 transition-transform group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black uppercase tracking-tight text-[#1A237E] mb-3 group-hover:text-[#FF6D00] transition-colors">{title}</h3>
      <p className="text-xs font-medium text-slate-500 mb-8 flex-1 leading-relaxed">{desc}</p>
      <div className="text-[9px] font-black uppercase tracking-widest text-[#1A237E]/40 group-hover:text-[#1A237E] transition-colors flex items-center gap-2 mt-auto">
        Access Module <span className="text-lg leading-none">&rarr;</span>
      </div>
    </motion.div>
  </Link>
);
 
export default Dashboard;
 