import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import api from "../api/axios";
import Button from "../components/ui/Button";

export default function ESewaSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);
  
  useEffect(() => {
    const q = searchParams.get("data");
    if (!q) {
      setResult({ status: "error", message: "No payment data received from eSewa." });
      setVerifying(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.get(`/bills/esewa/verify?q=${q}`);
        setResult({ status: "success", message: "Payment Verified Successfully!", data: response.data });
      } catch (error) {
        console.error("Verification failed:", error);
        setResult({ status: "error", message: error.response?.data?.detail || "Payment verification failed." });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="max-w-xl mx-auto py-32 px-6 flex flex-col items-center justify-center text-center">
      {verifying ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <RefreshCw size={48} className="text-accent animate-spin mx-auto" />
          <h2 className="text-2xl font-display text-text-main">Verifying Transaction...</h2>
          <p className="text-text-muted">Please wait while we confirm your payment with eSewa.</p>
        </motion.div>
      ) : result?.status === "success" ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 bg-white border border-black/5 p-12 rounded-[2.5rem] shadow-float">
          <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-[0.4em]">Payment Successful</p>
          <h2 className="text-4xl font-display font-medium text-text-main tracking-tight">Verified.</h2>
          <p className="text-text-muted mb-8">Your eSewa transaction has been confirmed and the bill has been updated in your history.</p>
          <Button variant="primary" className="rounded-full px-8 h-14 w-full text-[10px] tracking-[0.2em]" onClick={() => navigate("/split-bill")}>
            <ArrowLeft size={16} className="mr-2 inline" /> Back to Split Bill
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 bg-white border border-black/5 p-12 rounded-[2.5rem] shadow-float">
          <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-[0.4em]">Verification Failed</p>
          <h2 className="text-4xl font-display font-medium text-text-main tracking-tight">Oops.</h2>
          <p className="text-text-muted mb-8">{result?.message}</p>
          <Button variant="outline" className="rounded-full px-8 h-14 w-full text-[10px] tracking-[0.2em]" onClick={() => navigate("/split-bill")}>
            <ArrowLeft size={16} className="mr-2 inline" /> Return to Bills
          </Button>
        </motion.div>
      )}
    </div>
  );
}
