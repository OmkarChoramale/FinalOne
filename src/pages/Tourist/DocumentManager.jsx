import React, { useState } from 'react';
import api from '../../services/api';

const DocumentManager = ({ title = "Documents", documents = [], touristId, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState('file');
    const [docType, setDocType] = useState('ID_PROOF');
    const [file, setFile] = useState(null);
    const [fileUri, setFileUri] = useState('');
    const [uploading, setUploading] = useState(false);

    const handlePreviewBeforeUpload = () => {
        if (uploadMode === 'file' && file) {
            window.open(URL.createObjectURL(file), '_blank');
        } else if (uploadMode === 'link' && fileUri) {
            window.open(fileUri, '_blank');
        }
    };

    const handleViewDocument = async (documentId) => {
        try {
            const response = await api.get(`/tourismgov/v1/touristdoc/documents/${documentId}/view`);
            if (response.data?.fileUri) {
                window.open(response.data.fileUri, '_blank');
            } else {
                alert("Document link is not available.");
            }
        } catch (error) {
            console.error("Error viewing document", error);
            alert("Could not retrieve document for viewing.");
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        formData.append('docType', docType);
        
        if (uploadMode === 'file' && file) formData.append('file', file);
        else formData.append('fileUri', fileUri);

        try {
            await api.post('/tourismgov/v1/touristdoc/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Document uploaded successfully!");
            setIsModalOpen(false);
            setFile(null);
            setFileUri('');
            onRefresh(); 
        } catch (err) {
            alert(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black uppercase">{title}</h2>
                
                {/* Automatically hide the "Add New" button if there are 2 or more documents */}
                {documents.length < 2 && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#1A237E] text-white text-[10px] font-black uppercase px-4 py-2 rounded-full hover:bg-[#FF6D00] transition-colors">
                        + Add New
                    </button>
                )}
            </div>

            {/* Existing Documents List */}
            <div className="space-y-3">
                {documents.map((doc) => (
                    <div key={doc.documentId} className="flex items-center justify-between p-4 bg-[#F8F9FF] rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">📄</div>
                            <p className="text-xs font-black uppercase">{doc.docType.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${doc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                {doc.verificationStatus}
                            </span>
                            <button onClick={() => handleViewDocument(doc.documentId)} className="text-[#1A237E] font-bold text-[10px] uppercase tracking-widest hover:text-[#FF6D00] hover:underline transition-colors">
                                View
                            </button>
                            {/* Delete option has been intentionally removed */}
                        </div>
                    </div>
                ))}
                {(!documents || documents.length === 0) && (
                    <p className="text-center text-xs font-bold text-gray-400 py-6">No documents uploaded yet.</p>
                )}
            </div>

            {/* Upload Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1A237E]/40 backdrop-blur-sm" onClick={() => !uploading && setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl">
                        <h2 className="text-2xl font-black uppercase mb-6">Upload Document</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="flex bg-[#F8F9FF] p-1 rounded-full mb-4">
                                <button type="button" onClick={() => setUploadMode('file')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-full ${uploadMode === 'file' ? 'bg-[#1A237E] text-white' : 'text-[#1A237E]'}`}>File</button>
                                <button type="button" onClick={() => setUploadMode('link')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-full ${uploadMode === 'link' ? 'bg-[#1A237E] text-white' : 'text-[#1A237E]'}`}>Link</button>
                            </div>
                            
                            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full px-6 py-3 text-xs bg-[#F8F9FF] rounded-full outline-none font-bold">
                                <option value="ID_PROOF">Identity Proof</option>
                                <option value="PASSPORT">Passport</option>
                            </select>
                            
                            {uploadMode === 'file' ? (
                                <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-[10px]" required />
                            ) : (
                                <input type="url" placeholder="https://..." value={fileUri} onChange={(e) => setFileUri(e.target.value)} className="w-full px-6 py-3 text-xs bg-[#F8F9FF] rounded-full" required />
                            )}

                            {((uploadMode === 'file' && file) || (uploadMode === 'link' && fileUri)) && (
                                <button type="button" onClick={handlePreviewBeforeUpload} className="text-[10px] font-black text-[#FF6D00] uppercase tracking-widest hover:underline mt-2 block text-right w-full">
                                    👁 Preview Document
                                </button>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase bg-gray-100 rounded-full hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={uploading} className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-[#FF6D00] rounded-full disabled:opacity-50">
                                    {uploading ? "Uploading..." : "Confirm"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManager;