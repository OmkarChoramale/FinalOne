import React, { useState } from 'react';
 
const AuditModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({ scope: '', status: 'PLANNED', findings: '' });
    const [loading, setLoading] = useState(false);
 
    if (!isOpen) return null;
 
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
            setFormData({ scope: '', status: 'PLANNED', findings: '' });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
 
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A237E]/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-[#1A237E] p-6 text-white flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-widest">New Official Audit</h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-xl">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Audit Scope *</label>
                        <input required maxLength="100" type="text" name="scope" value={formData.scope} onChange={handleChange} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-[#FF6D00] text-sm font-medium" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Initial Status *</label>
                        <select required name="status" value={formData.status} onChange={handleChange} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm font-medium">
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Initial Findings</label>
                        <textarea maxLength="2000" name="findings" value={formData.findings} onChange={handleChange} rows="4" className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm font-medium resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-[#1A237E] bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-[#FF6D00] text-white font-bold uppercase tracking-widest px-6 py-3 text-[10px] rounded-full hover:bg-[#1A237E] disabled:opacity-70">{loading ? 'Creating...' : 'Create Audit'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
 
export default AuditModal;
 