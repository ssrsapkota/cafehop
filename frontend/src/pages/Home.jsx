import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  MapPin, Users, Zap, ArrowRight,
  PlusSquare, Receipt, Search, Command
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { BentoGrid, BentoCard } from "../components/ui/BentoGrid";
import api from "../api/axios";
import logo from "../assets/Cafehop_logo.png";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [featuredCafes, setFeaturedCafes] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/cafes');
        setFeaturedCafes(res.data.slice(0, 4));
      } catch (err) {
        console.error("Home data fetch error", err);
        setFeaturedCafes([]);
      }
    };
    fetchHomeData();
  }, []);

  const actionCards = [
    {
      title: "Log Your Visit",
      desc: "Record cafe details and vibe.",
      icon: PlusSquare,
      path: "/log-visit",
      delay: 0.05
    },
    {
      title: "Browse Cafes",
      desc: "Find sanctuaries for work or chat.",
      icon: Search,
      path: "/discover",
      delay: 0.1
    },
    {
      title: "Split the Bill",
      desc: "Easily distribute group expenses.",
      icon: Receipt,
      path: "/split-bill",
      delay: 0.15
    },
    {
      title: "Community",
      desc: "See where others are exploring.",
      icon: Users,
      path: "/community",
      delay: 0.2
    }
  ];

  return (
    <div className="font-body text-text-main w-full min-h-screen bg-[#FAFAFA] selection:bg-black selection:text-white relative">
      {/* Subtle modern dot background instead of the archaic grid */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none"></div>

      {/* Dynamic Hero Section */}
      <section className="relative w-full min-h-[75vh] flex flex-col items-center justify-center px-6 md:px-12 pt-24 pb-20 border-b border-black/5 z-10 bg-gradient-to-b from-transparent to-[#FAFAFA]">
        <div className="max-w-5xl w-full mx-auto flex flex-col items-center text-center mt-8">
          {user ? (
            // Authenticated Dashboard Hero - Linear/Notion Style
            <div className="w-full flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black/5 rounded-md shadow-sm text-xs font-semibold tracking-wide text-text-muted mb-8"
              >
                <Command size={12} className="text-text-subtle" />
                <span>Welcome back, {user.name}</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="font-body font-bold text-4xl md:text-5xl tracking-tight text-text-main mb-12"
              >
                Where to today?
              </motion.h1>

              {/* Quick Action Grid - Crisp, left-aligned, SaaS style */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {actionCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: card.delay, duration: 0.4 }}
                    >
                      <Link 
                        to={card.path} 
                        className="flex flex-col items-start text-left p-5 bg-white border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-black/10 rounded-xl transition-all duration-200 h-full group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/[0.03] border border-black/5 flex items-center justify-center mb-4 group-hover:bg-black/[0.05] transition-colors">
                          <Icon size={16} className="text-text-main" />
                        </div>
                        <h3 className="font-semibold text-[15px] text-text-main mb-1 tracking-tight">{card.title}</h3>
                        <p className="text-[13px] text-text-muted leading-relaxed">{card.desc}</p>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            // Public Marketing Hero - Clean SaaS Look
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-6 mb-8"
              >
                <div className="h-10 flex items-center justify-center mb-4">
                  <img src={logo} alt="CafeHop Logo" className="h-full w-auto object-contain grayscale-[20%] opacity-90" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-black/5 rounded-full shadow-sm text-[11px] font-semibold tracking-wide text-text-muted">
                  <Zap size={12} className="text-amber-500 fill-amber-500" />
                  <span>Curating the city's finest spaces</span>
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-body font-bold text-5xl md:text-7xl tracking-tighter text-text-main mb-6 leading-[1.1]"
              >
                Find the perfect <br /> cafe for your vibe.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-text-muted text-[17px] md:text-[19px] max-w-2xl leading-relaxed mb-10 font-medium"
              >
                Explore a handpicked directory of cafes designed for deep work, <br className="hidden md:block"/> coffee dates, and quiet moments.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
              >
                <Link to="/discover" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 h-12 bg-black hover:bg-black/90 text-white rounded-lg text-[14px] font-semibold tracking-wide transition-all shadow-sm">
                    Browse All Cafes
                  </Button>
                </Link>
                <Link to="/community" className="w-full sm:w-auto">
                  <span className="inline-flex items-center justify-center gap-2 px-6 h-12 bg-white border border-black/10 hover:border-black/20 hover:bg-black/[0.02] rounded-lg text-[14px] font-semibold tracking-wide text-text-main transition-all cursor-pointer">
                    Join Community
                  </span>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Directory Section - Clean architectural look */}
      <section className="relative w-full py-24 px-6 md:px-12 bg-[#FAFAFA] z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="max-w-xl space-y-3">
                <h2 className="text-3xl font-bold tracking-tight text-text-main">
                    Curated Sanctuaries
                </h2>
                <p className="text-text-muted text-[15px] max-w-sm">
                    Explore spaces selected for their aesthetic and atmosphere.
                </p>
            </div>
            <Link to="/discover" className="md:mb-1 group flex items-center gap-1 text-[13px] font-semibold text-text-muted hover:text-text-main transition-colors">
              View directory <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-4">
            <BentoCard
              className="md:col-span-2 row-span-2 min-h-[400px] bg-white border border-black/5 shadow-sm rounded-2xl overflow-hidden group"
              title="Work & Coffee"
              description="Quiet corners perfect for deep concentration."
              href="/discover"
              icon={<Zap size={16} className="text-text-main" />}
              image="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=1000&auto=format&fit=crop"
            />
            {featuredCafes.slice(0, 2).map((cafe, i) => (
              <BentoCard
                key={cafe.id || i}
                title={cafe.name}
                description={cafe.area}
                href="/discover"
                icon={<MapPin size={14} className="text-text-main/70" />}
                className="col-span-1 min-h-[192px] bg-white border border-black/5 shadow-sm rounded-2xl overflow-hidden group"
                image={cafe.image_url}
              />
            ))}
            
            <BentoCard
              title="Community Feed"
              description="See where fellow explorers are spending their time."
              href="/community"
              className="md:col-span-3 min-h-[160px] bg-white border border-black/5 shadow-sm rounded-2xl overflow-hidden flex flex-col p-8 items-start justify-center text-left group hover:border-black/10 transition-colors"
              icon={<Users size={20} className="text-text-main mb-2" />}
            />
          </BentoGrid>
        </div>
      </section>

      <footer className="w-full py-8 px-6 md:px-12 bg-[#FAFAFA] flex flex-col items-center gap-4 border-t border-black/5 z-10 relative">
        <div className="text-center">
           <p className="text-[12px] text-text-muted font-medium">
             &copy; {new Date().getFullYear()} CafeHop. Handpicked spaces.
           </p>
        </div>
      </footer>
    </div>
  );
}

