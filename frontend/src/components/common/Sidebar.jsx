import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Coffee, Home, Search, PlusSquare, User, LogOut, Shield, Receipt, Users, Bell, X } from "lucide-react";
import { cn } from "../../utils";
import logo from "../../assets/Cafehop_logo.png";

const navItems = [
  { label: "Browse Cafes", icon: Search, to: "/discover" },
  { label: "Log Visit", icon: PlusSquare, to: "/log-visit" },
  { label: "Community", icon: Users, to: "/community" },
  { label: "Split Bill", icon: Receipt, to: "/split-bill" },
  { label: "Notifications", icon: Bell, to: "/notifications" },
  { label: "Profile", icon: User, to: "/profile" },
];

export default function Sidebar({ isAdmin, onLogout, isOpen, onClose }) {
  const location = useLocation();

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.to;
    const Icon = item.icon;
    
    return (
      <Link
        to={item.to}
        onClick={onClose}
        className={cn(
          "flex items-center gap-4 px-6 py-4 transition-all duration-500 group relative",
          isActive 
            ? "text-primary" 
            : "text-text-muted hover:text-primary"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-accent rounded-r-full shadow-glow-accent" />
        )}
        <div className={cn(
          "transition-all duration-400 p-2 rounded-xl group-hover:bg-accent/5",
          isActive ? "text-accent bg-accent/10" : "group-hover:scale-110"
        )}>
          <Icon size={18} className="stroke-[1.5px]" />
        </div>
        <span className={cn(
          "text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] font-body transition-all duration-400",
          isActive ? "text-primary tracking-[0.25em]" : "group-hover:translate-x-1"
        )}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-primary/20 backdrop-blur-[8px] z-[90] md:hidden transition-opacity duration-700",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Desktop & Mobile Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-64 bg-page-bg/95 backdrop-blur-3xl border-r border-black/[0.05] z-[100] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col shadow-float",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-center p-8 pb-10">
          <Link to="/" onClick={onClose} className="flex flex-col items-center gap-4 group mt-2">
            <div className="w-14 h-9 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <img src={logo} alt="CafeHop" className="w-full h-full object-contain" />
            </div>
          </Link>
          <button onClick={onClose} className="md:hidden absolute top-6 right-6 p-2 text-text-muted hover:text-primary transition-colors hover:bg-black/5 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          <div className="mb-10">
            <p className="px-8 text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted mb-4 font-body opacity-60">
              Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.label} item={item} />
              ))}
            </nav>
          </div>

          {isAdmin && (
            <div className="mb-10">
              <p className="px-8 text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted mb-4 font-body opacity-60">
                System Ops
              </p>
              <NavLink item={{ label: "Control Studio", icon: Shield, to: "/admin" }} />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-black/[0.05] mt-auto">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-red-500 hover:bg-red-50 transition-all duration-400 group"
          >
            <LogOut size={16} className="stroke-[1.5px] transition-transform group-hover:-translate-x-1" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
