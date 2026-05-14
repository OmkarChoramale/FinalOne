import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const FormInput = ({ label, type = "text", placeholder, options, className = "", name, value, onChange }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-[#1A237E] mb-1 uppercase tracking-wider">
      {label}
    </label>
    {type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#FF6D00] outline-none text-[#1A237E]"
        required
      >
        <option value="" disabled>Select {label}</option>
        {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#FF6D00] outline-none text-[#1A237E]"
        required
      />
    )}
  </div>
);

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    contactInfo: '',
    address: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData(prev => ({
        ...prev,
        name: user.name || ''
      }));
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      await api.post('/tourismgov/v1/tourist/create', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Successfully created profile! Mark it in local storage.
      localStorage.setItem('hasProfile', 'true');
      alert("Profile Completed Successfully!");
      
      // Hard redirect reloads the App state so that TouristProfileGuard grants access
      window.location.href = '/main-dashboard'; 
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl relative">
        <div className="bg-white rounded-2xl shadow-xl flex flex-col lg:flex-row overflow-hidden border border-gray-100">
          
          <div className="hidden lg:flex lg:w-5/12 relative bg-[#1A237E] p-10 text-white">
            <img
              src="https://images.unsplash.com/photo-1515091943-9d5c0ad74bfa?auto=format&fit=crop&q=80&w=800"
              alt="Wanderlust"
              className="absolute inset-0 object-cover w-full h-full opacity-20 mix-blend-overlay"
            />
            <div className="relative z-10 flex flex-col justify-end">
              <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                <span className="w-3 h-3 rounded-full bg-[#FF6D00]"></span>
                <span className="font-bold text-lg uppercase tracking-wide">TourismGov</span>
              </Link>
              <h3 className="text-3xl font-bold mb-3 leading-tight">Complete<br/>Profile.</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Provide details to book events, save itineraries, and access guides.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-7/12 p-8 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#1A237E] uppercase tracking-tighter">Profile Details</h2>
              <p className="text-[#1A237E]/60 text-xs font-bold mt-1 uppercase tracking-widest">Enter details below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
                <FormInput label="Phone Number" type="tel" name="contactInfo" value={formData.contactInfo} onChange={handleChange} placeholder="98765 43210" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                <FormInput label="Gender" type="select" name="gender" value={formData.gender} onChange={handleChange} options={[{val: 'MALE', label: 'Male'}, {val: 'FEMALE', label: 'Female'}, {val: 'OTHER', label: 'Other'}]} />
              </div>
              <FormInput label="Full Address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Heritage Lane, City" />

              <button
                type="submit"
                disabled={loading}
                className="w-1/2 mx-auto block p-3 bg-[#1A237E] hover:bg-[#FF6D00] text-white rounded-xl mt-8 font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;