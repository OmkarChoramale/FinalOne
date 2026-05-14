import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const FormInput = ({ label, type = "text", name, value, onChange, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="mb-5 w-full">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#1A237E] mb-1.5 ml-4">
        {label}
      </label>
      
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-6 pr-12 py-4 text-sm bg-[#F8F9FF] border-2 border-transparent rounded-full focus:border-[#FF6D00] focus:bg-white outline-none transition-all font-medium text-[#1A237E] placeholder-[#1A237E]/30"
          required
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A237E]/40 hover:text-[#FF6D00] transition-colors focus:outline-none"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await axios.post('http://localhost:8383/tourismgov/v1/auth/login', formData);

      if (response.data && response.data.token) {
        const token = response.data.token;
        const userRole = response.data.role;

        // Save Auth details globally
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('role', userRole);
        localStorage.setItem('name', response.data.name || 'User');

        // Staff skip profile check
        if (userRole !== 'TOURIST') {
          localStorage.setItem('hasProfile', 'true');
          window.location.href = '/main-dashboard'; // Hard reload to update App state
          return;
        }
        
        // Check Tourist Profile
        try {
          await axios.get('http://localhost:8383/tourismgov/v1/tourist/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          localStorage.setItem('hasProfile', 'true');
          window.location.href = '/main-dashboard'; 

        } catch (profileError) {
          localStorage.setItem('hasProfile', 'false');
          window.location.href = '/complete-profile';
        }
      }

    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A237E] font-sans selection:bg-[#FF6D00] selection:text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF6D00]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#1A237E]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(26,35,126,0.2)] overflow-hidden flex flex-col lg:flex-row-reverse border border-white min-h-[600px]">
          
          <div className="hidden lg:flex lg:w-1/2 relative bg-[#1A237E] p-12 flex-col justify-end overflow-hidden">
            <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" alt="Taj Mahal" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 transition-transform duration-1000 hover:scale-110" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF6D00] rounded-full blur-[80px] opacity-60 -translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 text-white">
              <Link to="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
                <span className="w-3 h-3 rounded-full bg-[#FF6D00]"></span>
                <span className="font-black tracking-tighter text-lg uppercase">TourismGov</span>
              </Link>
              <h3 className="text-5xl font-black uppercase tracking-tighter leading-tight mb-4">Welcome<br/>Back.</h3>
              <p className="font-medium text-base opacity-80 leading-relaxed max-w-sm">Log in to access your dashboard, track verifications, and explore Incredible India.</p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-8 lg:p-14 flex flex-col justify-center">
            <div className="mb-10">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#1A237E]">Sign In</h2>
              <p className="text-[#1A237E]/60 font-bold text-xs uppercase tracking-widest mt-2">Access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              <FormInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" />
              <div className="relative mb-2">
                <FormInput label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                <div className="absolute top-0 right-4">
                    <a href="#" className="text-[9px] font-black uppercase text-[#FF6D00] hover:underline tracking-widest">Forgot Password?</a>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-bold px-4 py-3 rounded-xl text-center mt-2 mb-4 animate-fadeIn">
                  {errorMsg}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-[#1A237E] text-white font-black uppercase tracking-[0.2em] py-4 text-sm rounded-full hover:bg-[#FF6D00] shadow-xl transition-all duration-300 hover:-translate-y-1 mt-4 disabled:opacity-50 disabled:hover:translate-y-0">
                {loading ? "Authenticating..." : "Login"}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <p className="text-xs font-bold text-[#1A237E]/50 uppercase tracking-widest">
                Don't have an account?
                <Link to="/register" className="ml-2 text-[#FF6D00] hover:text-[#1A237E] transition-colors hover:underline">Create One</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;