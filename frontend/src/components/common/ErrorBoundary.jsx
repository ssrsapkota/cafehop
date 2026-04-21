import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";
import Button from "../ui/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page-bg font-body text-text-main flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-white relative">
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
          <div className="absolute inset-0 architectural-grid opacity-[0.05] pointer-events-none"></div>
          
          <div className="max-w-md w-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-float rounded-[3rem] p-12 text-center relative z-10 animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-accent-soft mx-auto flex items-center justify-center mb-8 shadow-soft">
              <AlertTriangle size={36} className="text-accent stroke-[1.5]" />
            </div>
            
            <h1 className="text-4xl font-display font-medium text-text-main mb-4 tracking-tight">System Anomaly</h1>
            <p className="text-text-muted font-light mb-10 leading-relaxed text-sm">
              The interface encountered an unexpected instability. The structural integrity has been preserved.
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-text-main text-white h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-soft hover:bg-black transition-colors"
              >
                Reinitialize Context
              </button>
              
              <Link to="/">
                <Button variant="outline" className="w-full h-14 rounded-2xl text-[10px] uppercase font-bold tracking-[0.3em] border-border hover:border-accent hover:text-accent flex items-center justify-center gap-3">
                  <Home size={16} /> Return to Hub
                </Button>
              </Link>
            </div>
            
            {import.meta.env.DEV && this.state.error && (
               <div className="mt-10 p-4 bg-white/50 rounded-2xl border border-accent/20 text-left overflow-auto max-h-48 custom-scrollbar">
                  <p className="text-[10px] font-mono text-accent/80 font-bold mb-2">DEV TRACE:</p>
                  <pre className="text-[9px] font-mono text-text-muted">{this.state.error.toString()}</pre>
               </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
