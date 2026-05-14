import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from "../../components/Footer";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Adjust base URL if your Spring Boot runs on a different port
  const API_BASE_URL = 'http://localhost:8383/tourismgov/v1/users';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    // Security check
    if (!token || !storedUser || (storedUser.role !== 'ADMIN' && storedUser.role !== 'OFFICER')) {
      navigate('/login');
      return;
    }
    
    fetchUsers();
  }, [navigate]);

  // Handle User Approval/Activation
  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve/activate this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to approve user');
      
      // Refresh the list after successful approval
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle User Deletion
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      // Refresh the list after successful deletion
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] selection:bg-[#FF6D00] selection:text-white flex flex-col">
      <main className="flex-grow max-w-screen-2xl mx-auto px-4 md:px-6 pt-32 pb-16 w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#1A237E] leading-none">
              User <br /> <span className="text-[#FF6D00]">Management</span>
            </h1>
            <p className="mt-2 text-sm font-bold opacity-70 uppercase tracking-widest">
              Review, approve, and manage system accounts
            </p>
          </div>
          
          <button
            onClick={fetchUsers}
            className="bg-[#1A237E] text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#FF6D00] transition-colors shadow-lg"
          >
            Refresh List
          </button>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A237E] text-white uppercase text-[10px] tracking-widest">
                  <th className="p-4 font-bold">User ID</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#1A237E]/50 font-bold">Loading users...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-red-500 font-bold">Error: {error}</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-[#1A237E]/50 font-bold">No users found.</td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.userId || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-[#1A237E]/70">#{user.userId}</td>
                      <td className="p-4 font-bold">{user.email}</td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                          {user.role || 'USER'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            user.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                            'bg-[#FF6D00]/10 text-[#FF6D00]' // Fallback for PENDING
                        }`}>
                          {user.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        {user.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleApprove(user.userId)}
                            className="bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.userId)}
                          className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUsers;