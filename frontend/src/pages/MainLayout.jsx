import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import ScrollToTop from "../components/common/ScrollToTop";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAdmin = user?.role === 'admin' || user?.email === 'admin@cafehop.com';

  return (
    <div className="min-h-screen bg-page-bg font-body text-text-main flex overflow-hidden selection:bg-accent selection:text-page-bg relative">
      {/* Global Architectural Layers */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none z-[100]"></div>
      
      {/* Sidebar - Only show for authenticated users and if not on home page OR admin */}
      {user && !isHomePage && !isAdmin && (
        <Sidebar 
          isAdmin={isAdmin} 
          onLogout={logout} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth">
        {!isAdmin && <Header onMenuClick={() => setIsSidebarOpen(true)} />}
        
        <main className={cn(
          "flex-1 w-full transition-all duration-700",
          !isAdmin && "pt-20 pb-24 md:pb-20",
          user && !isHomePage && !isAdmin && "md:pl-64"
        )}>
          <ScrollToTop />
          <div key={location.pathname} className={cn("mx-auto animate-fade-in", !isAdmin && "max-w-[1600px] px-6 sm:px-10 lg:px-16 py-12")}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
