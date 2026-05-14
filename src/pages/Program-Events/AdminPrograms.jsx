import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPrograms = () => {
    const navigate = useNavigate();
    
    // Data States
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [budgetReport, setBudgetReport] = useState(null);
    const [resources, setResources] = useState([]); 
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(''); 
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showResourceForm, setShowResourceForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    // Forms
    const initialFormState = { id: null, title: '', description: '', startDate: '', endDate: '', budget: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [resourceForm, setResourceForm] = useState({ type: 'FUNDS', quantity: '' });

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
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token || !['ADMIN', 'OFFICER'].includes(role)) {
            navigate('/login');
            return;
        }
        
        fetchPrograms();
    }, [navigate, getAxiosConfig]);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/programs`, getAxiosConfig());
            setPrograms(res.data);
            setError(null);
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to fetch programs.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProgram = async (programId) => {
        try {
            const [progRes, budgetRes, resourceRes] = await Promise.all([
                axios.get(`${BASE_URL}/programs/${programId}`, getAxiosConfig()),
                axios.get(`${BASE_URL}/programs/${programId}/budget-report`, getAxiosConfig()),
                axios.get(`${BASE_URL}/programs/${programId}/resources`, getAxiosConfig())
            ]);
            setSelectedProgram(progRes.data);
            setBudgetReport(budgetRes.data);
            setResources(resourceRes.data);
            setIsFormOpen(false);
            setShowResourceForm(false);
            setError(null);
            setSuccessMsg('');
            
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            setIsFormOpen(false); 
            setSelectedProgram(null);
            showWarning(`Data Fetch Error: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- API: Create or Update Program ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; 

        setError(null);
        setSuccessMsg('');
        setIsSubmitting(true); 

        const payload = {
            title: formData.title,
            description: formData.description,
            startDate: formData.startDate,
            endDate: formData.endDate,
            budget: Number(formData.budget) 
        };

        try {
            if (isEditing && formData.id) {
                await axios.put(`${BASE_URL}/programs/${formData.id}`, payload, getAxiosConfig());
                showSuccess('Program updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/programs`, payload, getAxiosConfig());
                showSuccess('Tourism program created successfully!'); 
            }
            
            setFormData(initialFormState);
            setIsFormOpen(false);
            setIsEditing(false);
            await fetchPrograms(); 
            
            if (isEditing && formData.id === selectedProgram?.programId) {
                handleSelectProgram(formData.id);
            }
            
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to save program. Check dates and duplicates.');
        } finally {
            setIsSubmitting(false); 
        }
    };

    const handleStatusChange = async (programId, newStatus) => {
        try {
            await axios.patch(`${BASE_URL}/programs/${programId}/status?status=${newStatus}`, null, getAxiosConfig());
            fetchPrograms();
            if (selectedProgram?.programId === programId) handleSelectProgram(programId);
            showSuccess(`Status updated to ${newStatus}`);
        } catch (err) {
            showWarning(err.response?.data?.message || "Cannot change status.");
        }
    };

    const handleDelete = async (programId) => {
        if (!window.confirm('Are you sure you want to completely delete this program? This action cannot be undone.')) return;
        try {
            await axios.delete(`${BASE_URL}/programs/${programId}`, getAxiosConfig());
            setSelectedProgram(null);
            fetchPrograms();
            showSuccess('Program deleted successfully.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to delete program.');
        }
    };

    // --- API: Resource Management ---
    const handleAllocateResource = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...resourceForm,
            quantity: Number(resourceForm.quantity)
        };

        try {
            await axios.post(`${BASE_URL}/programs/${selectedProgram.programId}/resources`, payload, getAxiosConfig());
            setResourceForm({ type: 'FUNDS', quantity: '' });
            setShowResourceForm(false);
            handleSelectProgram(selectedProgram.programId); 
            showSuccess('Resource allocated successfully.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to allocate resource.');
        }
    };

    const handleUpdateResourceStatus = async (resourceId, newStatus) => {
        try {
            await axios.patch(`${BASE_URL}/resources/${resourceId}/status?status=${newStatus}`, null, getAxiosConfig());
            handleSelectProgram(selectedProgram.programId);
            showSuccess('Resource status updated.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to update resource status.');
        }
    };

    const handleDeleteResource = async (resourceId) => {
        try {
            await axios.delete(`${BASE_URL}/resources/${resourceId}`, getAxiosConfig());
            handleSelectProgram(selectedProgram.programId);
            showSuccess('Resource removed.');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Failed to delete resource.');
        }
    };
    
    const handleToggleForm = () => {
        if (isFormOpen && !isEditing) {
            setIsFormOpen(false);
            setError(null);
        } else {
            setFormData(initialFormState);
            setIsEditing(false);
            setIsFormOpen(true);
            setSelectedProgram(null);
            setError(null);
            
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    document.getElementById('details-panel')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    };

    const openEditForm = (program) => {
        setFormData({
            id: program.programId,
            title: program.title, 
            description: program.description,
            startDate: program.startDate, 
            endDate: program.endDate, 
            budget: program.budget
        });
        setIsEditing(true);
        setIsFormOpen(true);
        setError(null);
    };

    return (
        <div className="pt-28 md:pt-36 pb-20 font-sans selection:bg-[#FF6D00] selection:text-white flex flex-col">
            <main className="flex-1 max-w-screen-2xl w-full mx-auto p-4 md:p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* LEFT PANEL */}
                <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    <div className="flex justify-between items-end mb-2 lg:mb-0">
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none text-[#1A237E]">Programs</h2>
                        <button 
                            onClick={handleToggleForm} 
                            className="bg-[#FF6D00] text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg hover:bg-[#1A237E] transition-all whitespace-nowrap"
                        >
                            {isFormOpen && !isEditing ? 'Cancel Form' : '+ New Program'}
                        </button>
                    </div>

                    {!loading && programs.length === 0 && (
                        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-[#1A237E]/20 text-center flex flex-col items-center justify-center py-12 md:py-16 shadow-sm">
                            <span className="text-2xl mb-4">📋</span>
                            <h3 className="font-black text-lg md:text-xl uppercase text-[#1A237E] mb-2">No Programs Found</h3>
                            <p className="font-medium text-xs md:text-sm opacity-60 mb-6 px-4">Initialize your first tourism program.</p>
                            <button onClick={handleToggleForm} className="bg-[#1A237E] text-white px-5 md:px-6 py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-[#FF6D00] transition-colors">
                                Initialize First Program
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:gap-4 max-h-auto lg:max-h-[75vh] overflow-y-auto pr-1 lg:pr-2">
                        {programs.map(prog => (
                            <div 
                                key={prog.programId} 
                                onClick={() => handleSelectProgram(prog.programId)}
                                className={`p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] cursor-pointer transition-all border ${selectedProgram?.programId === prog.programId ? 'bg-[#1A237E] text-white shadow-xl scale-[1.02]' : 'bg-white shadow-sm hover:shadow-md border-[#1A237E]/10 hover:border-[#FF6D00]/50 text-[#1A237E]'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black uppercase text-base md:text-lg leading-tight line-clamp-2 pr-4">{prog.title}</h3>
                                </div>
                                <div className="flex justify-between items-center mt-3 md:mt-4">
                                    <span className={`px-2 py-1 md:px-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${selectedProgram?.programId === prog.programId ? 'bg-white/20' : 'bg-[#FF6D00]/10 text-[#FF6D00]'}`}>
                                        {prog.status}
                                    </span>
                                    <span className={`font-bold text-[9px] md:text-[10px] uppercase tracking-widest ${selectedProgram?.programId === prog.programId ? 'opacity-80' : 'opacity-50'}`}>
                                        ${prog.budget?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL */}
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
                                {isEditing ? 'Edit Program' : 'Create New Program'}
                            </h2>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Program Title</label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-bold text-sm md:text-base text-[#1A237E]" />
                                </div>
                                
                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Description</label>
                                    <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3"
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-[1.5rem] border-2 border-transparent focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-medium text-sm md:text-base text-[#1A237E]" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Start Date</label>
                                        <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                                            className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] outline-none font-bold text-[#1A237E] text-sm md:text-base" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">End Date</label>
                                        <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                                            className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] outline-none font-bold text-[#1A237E] text-sm md:text-base" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-4 text-[#1A237E]">Total Budget Allocation (USD)</label>
                                    <input type="number" required min="0" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}
                                        className="w-full px-5 py-3 md:px-6 md:py-4 bg-[#F8F9FF] rounded-full border-2 border-transparent focus:border-[#FF6D00] outline-none font-bold text-[#1A237E] text-sm md:text-base" />
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
                                        {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Initialize Program')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedProgram ? (
                        
                        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-[#1A237E]/10 animate-fade-in-up text-[#1A237E]">
                            {/* Header Panel */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1A237E]/10 pb-6 md:pb-8 mb-6 md:mb-8 gap-4">
                                <div className="w-full md:w-auto">
                                    <span className="bg-[#FF6D00] text-white px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Program ID: {selectedProgram.programId}</span>
                                    <h2 className="text-2xl md:text-4xl font-black uppercase leading-tight md:leading-none text-[#1A237E] mb-2 md:mb-3">{selectedProgram.title}</h2>
                                    <p className="font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-50">{selectedProgram.startDate} TO {selectedProgram.endDate}</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <select 
                                        className={`w-full md:w-auto px-4 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest outline-none border-2 cursor-pointer transition-colors ${selectedProgram.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#F8F9FF] border-[#1A237E]/10 text-[#1A237E]'}`}
                                        value={selectedProgram.status} 
                                        onChange={(e) => handleStatusChange(selectedProgram.programId, e.target.value)}
                                        disabled={selectedProgram.status === 'CANCELLED'}
                                    >
                                        <option value="PLANNED">Planned</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Budget Report Analysis */}
                            {budgetReport && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                                    <div className="bg-[#1A237E] text-white p-5 md:p-6 rounded-[1rem] md:rounded-[1.5rem] shadow-lg">
                                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Budget</p>
                                        <p className="text-2xl md:text-3xl font-black truncate">${budgetReport.totalBudget?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-[#FFFDF7] border-2 border-[#1A237E]/10 p-5 md:p-6 rounded-[1rem] md:rounded-[1.5rem]">
                                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#1A237E] mb-1">Funds Expended</p>
                                        <p className="text-2xl md:text-3xl font-black text-[#D81B60] truncate">${budgetReport.amountSpent?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-[#FFFDF7] border-2 border-[#FF6D00]/20 p-5 md:p-6 rounded-[1rem] md:rounded-[1.5rem]">
                                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#FF6D00] mb-1">Remaining</p>
                                        <p className="text-2xl md:text-3xl font-black text-[#004D40] truncate">${budgetReport.remainingBudget?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {/* RESOURCES SECTION */}
                            <div className="mt-6 md:mt-8 border-t border-[#1A237E]/10 pt-6 md:pt-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 sm:gap-0">
                                    <h3 className="text-xl md:text-2xl font-black uppercase text-[#1A237E]">Resources</h3>
                                    <button onClick={() => setShowResourceForm(!showResourceForm)} className="text-[#FF6D00] font-bold uppercase text-[9px] md:text-[10px] tracking-widest hover:text-[#1A237E]">
                                        {showResourceForm ? 'Cancel' : '+ Allocate Resource'}
                                    </button>
                                </div>

                                {showResourceForm && (
                                    <form onSubmit={handleAllocateResource} className="bg-[#F8F9FF] p-4 md:p-5 rounded-[1rem] md:rounded-[1.5rem] border border-[#1A237E]/10 mb-6 flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
                                        <select required className="w-full md:flex-1 px-4 py-3 bg-white rounded-full border-none focus:ring-2 focus:ring-[#FF6D00] text-xs font-bold uppercase outline-none text-[#1A237E]"
                                            value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value})}>
                                            <option value="FUNDS">Funds</option>
                                            <option value="STAFF">Staff</option>
                                            <option value="EQUIPMENT">Equipment</option>
                                            <option value="TRANSPORT">Transport</option>
                                        </select>
                                        <input type="number" placeholder="Quantity/Amount" required className="w-full md:flex-1 px-4 py-3 bg-white rounded-full border-none focus:ring-2 focus:ring-[#FF6D00] text-sm outline-none text-[#1A237E]"
                                            value={resourceForm.quantity} onChange={e => setResourceForm({...resourceForm, quantity: e.target.value})} />
                                        <button type="submit" className="w-full md:w-auto bg-[#1A237E] text-white font-black uppercase text-[10px] px-6 py-3 rounded-full hover:bg-[#FF6D00]">Add</button>
                                    </form>
                                )}

                                <div className="space-y-3">
                                    {resources.length === 0 ? <p className="text-sm opacity-50 italic">No resources allocated yet.</p> : null}
                                    {resources.map(res => (
                                        <div key={res.resourceId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-white border border-[#1A237E]/10 rounded-[1rem] md:rounded-full shadow-sm hover:border-[#FF6D00]/30 transition-colors gap-3 sm:gap-0">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <span className="bg-[#1A237E] text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-[8px] md:text-[10px] font-black uppercase shrink-0">{res.type.substring(0,3)}</span>
                                                <div>
                                                    <p className="font-black text-xs md:text-sm uppercase text-[#1A237E] leading-tight">{res.type}</p>
                                                    <p className="font-bold text-[9px] md:text-[10px] uppercase opacity-50">Qty: {res.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-center w-full sm:w-auto justify-between sm:justify-end pl-11 sm:pl-0">
                                                <select 
                                                    className="bg-transparent text-[8px] md:text-[9px] font-bold uppercase outline-none text-[#FF6D00] cursor-pointer"
                                                    value={res.status} onChange={(e) => handleUpdateResourceStatus(res.resourceId, e.target.value)}
                                                >
                                                    <option value="ALLOCATED">Allocated</option>
                                                    <option value="RELEASED">Released</option>
                                                    <option value="EXPENDED">Expended</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                                <button onClick={() => handleDeleteResource(res.resourceId)} className="text-[#D81B60] hover:text-red-800 text-lg md:text-xl leading-none font-bold" title="Delete Resource">&times;</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 md:pt-8 mt-6 md:mt-8 border-t border-[#1A237E]/10">
                                <button onClick={() => openEditForm(selectedProgram)} className="w-full sm:flex-1 bg-[#1A237E]/5 text-[#1A237E] py-3 md:py-4 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-[#1A237E] hover:text-white transition-colors">
                                    Edit Details
                                </button>
                                <button onClick={() => handleDelete(selectedProgram.programId)} className="w-full sm:flex-1 bg-red-50 text-red-600 py-3 md:py-4 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-colors">
                                    Delete Program
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden lg:flex h-full min-h-[500px] flex-col items-center justify-center border-2 border-dashed border-[#1A237E]/20 rounded-[2rem] bg-white/50 text-[#1A237E]">
                            <span className="text-4xl mb-4 opacity-50">👆</span>
                            <p className="font-bold text-sm uppercase tracking-widest opacity-40">Select a program to view details</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPrograms;