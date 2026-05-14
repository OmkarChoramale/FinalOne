import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminHeritageSites = () => {
    const navigate = useNavigate();
    
    // Auth & User State
    const [adminUser, setAdminUser] = useState({ name: '', role: '' });
    
    const [sites, setSites] = useState([]);
    const [selectedSite, setSelectedSite] = useState(null);
    const [activities, setActivities] = useState([]); 
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(''); 
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    // Forms
    const initialSiteFormState = { id: null, name: '', location: '', description: '', status: 'ACTIVE' };
    const [formData, setFormData] = useState(initialSiteFormState);
    
    // Updated Activity Form State to match PreservationActivityRequest DTO
    const initialActivityState = { 
        description: '', 
        date: '', 
        status: 'PENDING', 
        isRequiresSiteClosure: false 
    };
    const [activityForm, setActivityForm] = useState(initialActivityState);

    const BASE_URL = 'http://localhost:8383/tourismgov/v1';

    const getAxiosConfig = useCallback(() => {
        const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user'))?.token;
        return { 
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        };
    }, []);

    // --- UI Warning/Success Handlers ---
    const showWarning = (msg) => {
        setError(msg);
        setTimeout(() => setError(null), 5000); 
    };

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    // --- SECURITY CHECK & DATA FETCHING ---
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!token || !storedUser || (storedUser.role !== 'ADMIN' && storedUser.role !== 'OFFICER' && storedUser.role !== 'MANAGER')) {
            navigate('/login');
            return;
        }
        
        setAdminUser({ name: storedUser.name, role: storedUser.role });
        fetchSites();
    }, [navigate, getAxiosConfig]);

    const fetchSites = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/sites`, getAxiosConfig());
            setSites(res.data);
            setError(null);
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to fetch heritage sites.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSite = async (siteId) => {
        try {
            const [siteRes, activityRes] = await Promise.all([
                axios.get(`${BASE_URL}/sites/${siteId}`, getAxiosConfig()),
                axios.get(`${BASE_URL}/preservation/site/${siteId}`, getAxiosConfig())
            ]);
            setSelectedSite(siteRes.data);
            setActivities(activityRes.data);
            setIsFormOpen(false);
            setShowActivityForm(false);
            setError(null);
            setSuccessMsg('');
            
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            setIsFormOpen(false); 
            setSelectedSite(null);
            showWarning(`Data Fetch Error: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- API: Create or Update Site ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; 

        setError(null);
        setSuccessMsg('');
        setIsSubmitting(true); 

        const payload = {
            name: formData.name,
            location: formData.location,
            description: formData.description,
            status: formData.status
        };

        try {
            if (isEditing && formData.id) {
                await axios.put(`${BASE_URL}/sites/${formData.id}`, payload, getAxiosConfig());
                showSuccess('Heritage site updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/sites`, payload, getAxiosConfig());
                showSuccess('Heritage site registered successfully!'); 
            }
            
            setFormData(initialSiteFormState);
            setIsFormOpen(false);
            setIsEditing(false);
            await fetchSites(); 
            
            if (isEditing && formData.id === selectedSite?.siteId) {
                handleSelectSite(formData.id);
            }
            
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to save heritage site.');
        } finally {
            setIsSubmitting(false); 
        }
    };

    const handleDeleteSite = async (siteId) => {
        if (!window.confirm('Are you sure you want to completely delete this site? This action cannot be undone.')) return;
        try {
            await axios.delete(`${BASE_URL}/sites/${siteId}`, getAxiosConfig());
            setSelectedSite(null);
            fetchSites();
            showSuccess('Site deleted successfully.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to delete site.');
        }
    };

    // --- API: Preservation Activity Management ---
    const handleLogActivity = async (e) => {
        e.preventDefault();
        
        if(!activityForm.date) {
            showWarning("Activity date is mandatory.");
            return;
        }

        const payload = {
            description: activityForm.description,
            date: activityForm.date, 
            status: activityForm.status,
            isRequiresSiteClosure: activityForm.isRequiresSiteClosure
        };

        try {
            await axios.post(`${BASE_URL}/preservation/site/${selectedSite.siteId}`, payload, getAxiosConfig());
            setActivityForm(initialActivityState);
            setShowActivityForm(false);
            handleSelectSite(selectedSite.siteId); 
            showSuccess('Preservation activity logged successfully.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to log activity.');
        }
    };

    const handleUpdateActivityStatus = async (activityId, newStatus) => {
        try {
            await axios.patch(`${BASE_URL}/preservation/${activityId}/status?status=${newStatus}`, null, getAxiosConfig());
            handleSelectSite(selectedSite.siteId);
            showSuccess('Activity status updated.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to update activity status.');
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!window.confirm('Remove this preservation log?')) return;
        try {
            await axios.delete(`${BASE_URL}/preservation/${activityId}`, getAxiosConfig());
            handleSelectSite(selectedSite.siteId);
            showSuccess('Activity record deleted.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to delete activity.');
        }
    };
    
    const handleToggleForm = () => {
        if (isFormOpen && !isEditing) {
            setIsFormOpen(false);
            setError(null);
        } else {
            setFormData(initialSiteFormState);
            setIsEditing(false);
            setIsFormOpen(true);
            setSelectedSite(null);
            setError(null);
            
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    };

    const openEditForm = (site) => {
        setFormData({
            id: site.siteId || site.id,
            name: site.name, 
            location: site.location,
            description: site.description,
            status: site.status || 'ACTIVE'
        });
        setIsEditing(true);
        setIsFormOpen(true);
        setError(null);
    };

    return (
        // REMOVED old Navbar, ADDED pt-28 md:pt-36 to slot under Global Navbar
        <div className="pt-28 md:pt-36 pb-20 bg-[#FFFDF7] text-[#1A237E] font-sans selection:bg-[#FF6D00] selection:text-white flex flex-col">
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 md:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* LEFT PANEL - SITE LIST */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    <div className="flex justify-between items-end mb-2 lg:mb-0">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">Sites List</h2>
                        <button 
                            onClick={handleToggleForm} 
                            className="bg-[#FF6D00] text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg hover:bg-[#1A237E] transition-all whitespace-nowrap"
                        >
                            {isFormOpen && !isEditing ? 'Cancel Form' : '+ Register Site'}
                        </button>
                    </div>

                    {!loading && sites.length === 0 && (
                        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-[#1A237E]/20 text-center flex flex-col items-center justify-center py-12 md:py-16 shadow-sm">
                            <span className="text-2xl mb-4">🏛️</span>
                            <h3 className="font-black text-lg md:text-xl uppercase text-[#1A237E] mb-2">No Sites Found</h3>
                            <p className="font-medium text-xs md:text-sm opacity-60 mb-6 px-4">Initialize your first heritage site.</p>
                            <button onClick={handleToggleForm} className="bg-[#1A237E] text-white px-5 md:px-6 py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-[#FF6D00] transition-colors">
                                Register Site
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:gap-4 max-h-auto lg:max-h-[75vh] overflow-y-auto pr-1 lg:pr-2">
                        {sites.map(site => {
                            const id = site.siteId || site.id;
                            const isSelected = selectedSite?.siteId === id || selectedSite?.id === id;
                            return (
                            <div 
                                key={id} 
                                onClick={() => handleSelectSite(id)}
                                className={`p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] cursor-pointer transition-all border ${isSelected ? 'bg-[#1A237E] text-white shadow-xl scale-[1.02]' : 'bg-white shadow-sm hover:shadow-md border-[#1A237E]/10 hover:border-[#FF6D00]/50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black uppercase text-base md:text-lg leading-tight line-clamp-2 pr-4">{site.name}</h3>
                                </div>
                                <div className="flex flex-col mt-2">
                                    <span className={`font-bold text-[10px] md:text-xs mb-3 ${isSelected ? 'text-[#FF6D00]' : 'text-gray-500'}`}>
                                        📍 {site.location}
                                    </span>
                                    <div className="flex items-center">
                                        <span className={`px-2 py-1 md:px-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isSelected ? 'bg-white/20' : 'bg-[#1A237E]/10 text-[#1A237E]'}`}>
                                            {site.status || 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                {/* RIGHT PANEL - DETAILS & FORMS */}
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
                                {isEditing ? 'Edit Heritage Site' : 'Register New Site'}
                            </h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4">Site Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-bold text-sm md:text-base" />
                                </div>
                                
                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4">Location</label>
                                    <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-bold text-sm md:text-base" />
                                </div>

                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4">Description</label>
                                    <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="4"
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-[1.5rem] border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-medium text-sm md:text-base" />
                                </div>

                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4">Status</label>
                                    <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-bold text-sm md:text-base cursor-pointer">
                                        <option value="OPEN">OPEN</option>
                                        <option value="CLOSED_FOR_MAINTENANCE">CLOSED_FOR_MAINTENANCE</option>
                                        <option value="PERMANENTLY_CLOSED">PERMANENTLY_CLOSED</option>

                                        
                                    </select>
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
                                        {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Register Site')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedSite ? (
                        
                        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-[#1A237E]/10 animate-fade-in-up">
                            {/* Header Panel */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1A237E]/10 pb-6 md:pb-8 mb-6 md:mb-8 gap-4">
                                <div className="w-full md:w-auto">
                                    <span className="bg-[#FF6D00] text-white px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Site ID: {selectedSite.siteId || selectedSite.id}</span>
                                    <h2 className="text-2xl md:text-4xl font-black uppercase leading-tight md:leading-none text-[#1A237E] mb-2 md:mb-3">{selectedSite.name}</h2>
                                    <p className="font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-60 flex items-center gap-2">
                                        <span className="text-xl">📍</span> {selectedSite.location}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <span className={`px-4 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 ${selectedSite.status === 'CLOSED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#F8F9FF] border-[#1A237E]/10 text-[#1A237E]'}`}>
                                        STATUS: {selectedSite.status?.replace('_', ' ') || 'ACTIVE'}
                                    </span>
                                </div>
                            </div>

                            {/* Description Panel */}
                            <div className="mb-6 md:mb-8">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF6D00] mb-2">Historical Context</h3>
                                <p className="text-sm md:text-base font-medium leading-relaxed text-gray-700 bg-[#FFFDF7] border-l-4 border-[#1A237E] pl-4 py-2">
                                    {selectedSite.description}
                                </p>
                            </div>

                            {/* PRESERVATION ACTIVITIES SECTION */}
                            <div className="mt-6 md:mt-8 border-t border-[#1A237E]/10 pt-6 md:pt-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 sm:gap-0">
                                    <h3 className="text-xl md:text-2xl font-black uppercase text-[#1A237E]">Preservation Logs</h3>
                                    <button onClick={() => setShowActivityForm(!showActivityForm)} className="bg-transparent border-2 border-[#1A237E] text-[#1A237E] px-4 py-2 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-[#1A237E] hover:text-white transition-all">
                                        {showActivityForm ? 'Cancel Form' : '+ Log Activity'}
                                    </button>
                                </div>

                                {/* PRESERVATION ACTIVITY FORM */}
                                {showActivityForm && (
                                    <form onSubmit={handleLogActivity} className="bg-[#F8F9FF] p-5 md:p-6 rounded-[1rem] md:rounded-[1.5rem] border border-[#1A237E]/10 mb-6 flex flex-col gap-4">
                                        
                                        <div>
                                            <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-2 text-[#1A237E]">Activity Details</label>
                                            <textarea required placeholder="Describe preservation work performed..." className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 focus:ring-[#FF6D00] text-sm outline-none resize-y min-h-[100px]"
                                                value={activityForm.description} onChange={e => setActivityForm({...activityForm, description: e.target.value})} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-2 text-[#1A237E]">Scheduled Date</label>
                                                <input type="datetime-local" required className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 focus:ring-[#FF6D00] text-sm outline-none font-bold"
                                                    value={activityForm.date} onChange={e => setActivityForm({...activityForm, date: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-2 text-[#1A237E]">Initial Status</label>
                                                <select className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 focus:ring-[#FF6D00] text-sm outline-none font-bold uppercase cursor-pointer"
                                                    value={activityForm.status} onChange={e => setActivityForm({...activityForm, status: e.target.value})}>
                                                    <option value="PENDING">Pending</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="COMPLETED">Completed</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 mt-2">
                                            <input type="checkbox" id="closure-check" className="w-4 h-4 text-[#FF6D00] focus:ring-[#FF6D00] rounded cursor-pointer"
                                                checked={activityForm.isRequiresSiteClosure} onChange={e => setActivityForm({...activityForm, isRequiresSiteClosure: e.target.checked})} />
                                            <label htmlFor="closure-check" className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#D81B60] cursor-pointer">
                                                Requires Complete Site Closure
                                            </label>
                                        </div>

                                        <div className="flex justify-end mt-2">
                                            <button type="submit" className="w-full md:w-auto bg-[#FF6D00] text-white font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded-full hover:bg-[#1A237E] shadow-md transition-colors">Submit Log</button>
                                        </div>
                                    </form>
                                )}

                                {/* ACTIVITIES LIST */}
                                <div className="space-y-4">
                                    {activities.length === 0 ? (
                                        <div className="py-8 text-center border-2 border-dashed border-[#1A237E]/20 rounded-[1.5rem] bg-white">
                                            <span className="text-2xl opacity-50 block mb-2">📝</span>
                                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">No preservation activities logged yet.</p>
                                        </div>
                                    ) : null}
                                    
                                    {activities.map(act => (
                                        <div key={act.activityId || act.id} className="flex flex-col md:flex-row items-start justify-between p-4 md:p-5 bg-white border border-[#1A237E]/10 rounded-[1rem] shadow-sm hover:border-[#FF6D00]/30 transition-colors gap-4">
                                            <div className="flex-1 w-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-bold text-sm text-[#1A237E] leading-relaxed pr-4">{act.description}</p>
                                                    {act.isRequiresSiteClosure && (
                                                        <span className="bg-red-50 text-[#D81B60] px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest shrink-0 border border-red-100">
                                                            Closure Required
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                                        📅 {act.date ? new Date(act.date).toLocaleString() : 'N/A'}
                                                    </span>
                                                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">
                                                        ID: {act.activityId || act.id}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#1A237E]/5 pt-3 md:pt-0 mt-2 md:mt-0">
                                                <div className="flex flex-col gap-1 items-start md:items-end w-full">
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-50 ml-1">Status</span>
                                                    <select 
                                                        className={`w-full md:w-auto bg-[#F8F9FF] border border-[#1A237E]/10 px-3 py-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase outline-none cursor-pointer transition-colors ${act.status === 'COMPLETED' ? 'text-green-700 bg-green-50' : 'text-[#1A237E] hover:bg-gray-100'}`}
                                                        value={act.status || 'PENDING'} 
                                                        onChange={(e) => handleUpdateActivityStatus(act.activityId || act.id, e.target.value)}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="COMPLETED">Completed</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </select>
                                                </div>
                                                <button onClick={() => handleDeleteActivity(act.activityId || act.id)} className="bg-red-50 text-[#D81B60] hover:bg-[#D81B60] hover:text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all shrink-0 mt-3 md:mt-0" title="Delete Log">&times;</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {adminUser.role === 'ADMIN' && (
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 md:pt-8 mt-6 md:mt-8 border-t border-[#1A237E]/10">
                                    <button onClick={() => openEditForm(selectedSite)} className="w-full sm:flex-1 bg-[#1A237E]/5 text-[#1A237E] py-3 md:py-4 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-[#1A237E] hover:text-white transition-colors">
                                        Edit Site Details
                                    </button>
                                    <button onClick={() => handleDeleteSite(selectedSite.siteId || selectedSite.id)} className="w-full sm:flex-1 bg-red-50 text-red-600 py-3 md:py-4 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-colors">
                                        Delete Site
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden lg:flex h-full min-h-[500px] flex-col items-center justify-center border-2 border-dashed border-[#1A237E]/20 rounded-[2rem] bg-white/50">
                            <span className="text-4xl mb-4 opacity-50">👆</span>
                            <p className="font-bold text-sm uppercase tracking-widest opacity-40">Select a site to view details</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminHeritageSites;