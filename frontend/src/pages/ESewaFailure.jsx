import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";

export default function ESewaFailure() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto py-32 px-6 flex flex-col items-center justify-center text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 bg-white border border-black/5 p-12 rounded-[2.5rem] shadow-float">
        <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-red-500" />
        </div>
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.4em]">Payment Cancelled</p>
        <h2 className="text-4xl font-display font-medium text-text-main tracking-tight">Failed.</h2>
        <p className="text-text-muted mb-8">The eSewa transaction was cancelled or failed. Your bill is saved but not marked as paid.</p>
        <Button variant="outline" className="rounded-full px-8 h-14 w-full text-[10px] tracking-[0.2em]" onClick={() => navigate("/split-bill")}>
          <ArrowLeft size={16} className="mr-2 inline" /> Return to Split Bill
        </Button>
      </motion.div>
    </div>
  );
}
