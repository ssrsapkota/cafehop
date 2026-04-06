import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Coffee, ArrowRight } from "lucide-react";
import logo from "../assets/Cafehop_logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      const isAdmin = userData?.role === 'admin' || userData?.email === 'admin@cafehop.com';
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/discover");
      }
    } catch (err) {
      alert("Invalid credentials / Archival failure");
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex md:flex-row flex-col font-body selection:bg-accent selection:text-white relative overflow-hidden">

      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-soft/30 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full -z-10" />
      
      {/* Decorative Layer */}
      <div className="absolute inset-0 architectural-grid opacity-[0.1] -z-10 pointer-events-none"></div>
      <div className="absolute top-[15%] left-[3%] hidden lg:block -rotate-90 origin-left opacity-20 select-none pointer-events-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">Access Protocol • SEC-01</p>
      </div>
      <div className="absolute bottom-[10%] right-[3%] hidden lg:block rotate-90 origin-right opacity-20 select-none pointer-events-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">Identity Verification • AUTH</p>
      </div>

      {/* Visual / Branding Side */}
      <div className="w-full md:w-1/2 p-12 md:p-20 hidden md:flex flex-col justify-between relative bg-white/5 border-r border-white/10">
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 architectural-grid opacity-10 pointer-events-none"></div>

        <Link to="/" className="flex items-center gap-4 relative z-10 w-fit group">
          <div className="w-24 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <img src={logo} alt="CafeHop Logo" className="w-full h-full object-contain" />
          </div>
        </Link>
        <div className="relative z-10 max-w-md mb-20 animate-fade-in-up">
          <h2 className="text-6xl lg:text-7xl font-display font-medium text-primary leading-[1] mb-10 tracking-tighter">
            Step inside <br /><span className="italic font-normal text-accent serif">curated</span> spaces.
          </h2>
          <p className="text-text-muted text-lg font-medium leading-relaxed font-body opacity-80 max-w-sm">
            Join a collective of creatives documenting the city's finest architectural and atmospheric cafes.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] opacity-40">CAFEHOP STUDIO • MMXXIV</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 relative animate-fade-in">
        <Link to="/" className="md:hidden flex items-center gap-4 absolute top-10 left-10 group">
          <div className="w-24 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <img src={logo} alt="CafeHop Logo" className="w-full h-full object-contain" />
          </div>
        </Link>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-[3rem] p-12 shadow-float group hover:shadow-glow transition-all duration-500">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-display font-medium text-text-main mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-text-subtle text-[10px] uppercase font-bold tracking-[0.2em] opacity-60">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[9px] uppercase font-bold text-text-muted tracking-[0.3em] pl-2 drop-shadow-sm">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-text-main text-sm outline-none focus:bg-white focus:border-accent focus:shadow-glow transition-all duration-500 placeholder:text-text-subtle/50 font-body"
                placeholder="name@studio.com"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] uppercase font-bold text-text-muted tracking-[0.3em] pl-2 drop-shadow-sm">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-text-main text-sm outline-none focus:bg-white focus:border-accent focus:shadow-glow transition-all duration-500 placeholder:text-text-subtle/50 font-body"
                placeholder="••••••••••"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-5 bg-primary text-page-bg font-bold text-[10px] uppercase tracking-[0.3em] rounded-full shadow-float hover:shadow-glow flex justify-center items-center gap-3 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 -z-10" />
                Sign In <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Don't have an account? <Link to="/register" className="text-accent hover:text-primary transition-all ml-1 border-b border-accent/20">Sign up here.</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
