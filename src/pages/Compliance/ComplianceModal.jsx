import React, { useState } from 'react';
 
const ComplianceModal = ({ isOpen, onClose, onSubmit }) => {
    // State maps perfectly to your ComplianceRecordRequestDTO
    const [formData, setFormData] = useState({
        referenceNumber: '',
        entityId: '',
        type: 'SITE',
        result: 'PENDING_REVIEW',
        notes: ''
    });
   
    const [loading, setLoading] = useState(false);
 
    if (!isOpen) return null;
 
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Converts entityId to a Number for Spring Boot and passes it to Dashboard
            await onSubmit({ ...formData, entityId: Number(formData.entityId) });
           
            // Clear form and close on success
            setFormData({ referenceNumber: '', entityId: '', type: 'SITE', result: 'PENDING_REVIEW', notes: '' });
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
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-widest">New Compliance Check</h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-2 text-xl">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Reference Number *</label>
                        <input required maxLength="50" type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} placeholder="e.g., REF-2026-001" className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-[#FF6D00] text-sm font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Entity Type *</label>
                            <select required name="type" value={formData.type} onChange={handleChange} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm font-medium">
                                <option value="SITE">Site</option>
                                <option value="EVENT">Event</option>
                                <option value="PROGRAM">Program</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Entity ID *</label>
                            <input required type="number" name="entityId" value={formData.entityId} onChange={handleChange} placeholder="e.g., 101" className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm font-medium" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Initial Result *</label>
                        <select required name="result" value={formData.result} onChange={handleChange} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm font-medium">
                            <option value="PENDING_REVIEW">Pending Review</option>
                            <option value="COMPLIANT">Compliant</option>
                            <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                            <option value="NON_COMPLIANT">Non Compliant</option>
                            <option value="EXEMPT">Exempt</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#1A237E]/70">Notes</label>
                        <textarea maxLength="1000" name="notes" value={formData.notes} onChange={handleChange} rows="3" className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm font-medium resize-none"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-[#1A237E] bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-[#FF6D00] text-white font-bold uppercase tracking-widest px-6 py-3 text-[10px] rounded-full hover:bg-[#1A237E] disabled:opacity-70">{loading ? 'Saving...' : 'Save Record'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
 
export default ComplianceModal;
 