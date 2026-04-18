import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Users, Receipt, Sparkles, RefreshCw,
  ChevronRight, History, CheckCircle2, ArrowLeft, Clock,
  CreditCard, Coffee, Eye, AlertCircle, X, Search, TrendingUp, MapPin
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";
import { saveBill, getMyBills, deleteBill } from "../services/billService";
import { useAuth } from "../context/AuthContext";
import { cn } from "../utils";
import api from "../api/axios";
import { useLocation } from "react-router-dom";
import { formatCurrency, formatDate } from "../utils/formatters";
import { simplifyDebts } from "../utils/debt";


// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 20 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-float border text-sm font-bold uppercase tracking-widest whitespace-nowrap ${
        type === "success"
          ? "bg-primary text-page-bg border-white/10"
          : "bg-red-900/80 text-white border-red-700/40"
      }`}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill History Card
// ─────────────────────────────────────────────────────────────────────────────
function BillHistoryCard({ bill, onDelete, askConfirm }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const splits = bill.participants?.splits || [];
  const items  = bill.participants?.items  || [];

  const handleDelete = (e) => {
    e.stopPropagation();
    askConfirm(
      "Remove Bill",
      "Are you sure you want to remove this bill from history? This action cannot be undone.",
      async () => {
        setDeleting(true);
        try { await onDelete(bill.id); }
        finally { setDeleting(false); }
      },
      "danger",
      "Remove"
    );
  };

  const date = formatDate(bill.created_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white/5 border border-white/10 hover:border-accent/20 rounded-[1.75rem] overflow-hidden transition-all duration-500 cursor-pointer group"
      onClick={() => setExpanded(v => !v)}
    >
      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
            {bill.cafe?.image_url ? (
              <img src={bill.cafe.image_url} alt={bill.cafe.name} className="w-full h-full object-cover grayscale" />
            ) : (
              <Receipt size={20} className="text-accent" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-main uppercase tracking-tight truncate">{bill.title}</p>
            {bill.cafe && <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-0.5">{bill.cafe.name}</p>}
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                <Clock size={10} /> {date}
              </span>
              <span className="text-text-subtle opacity-30">·</span>
              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                <Users size={10} /> {splits.length} people
              </span>
              <span className="text-text-subtle opacity-30">·</span>
              <span className="flex items-center gap-1 text-[10px] text-text-muted capitalize">
                {bill.payment_mode === "esewa" ? (
                  bill.participants?.payment_status === "esewa_verified" ? (
                    <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> eSewa (Paid)</span>
                  ) : (
                    "eSewa (Pending)"
                  )
                ) : (
                  bill.payment_mode
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-xl font-display font-medium text-text-main tracking-tight">
            {formatCurrency(bill.total_amount)}
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-text-subtle hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
          >
            {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronRight size={16} className="text-text-subtle" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-4 border-t border-white/10 space-y-3">
              {splits.length === 0 ? (
                <p className="text-xs text-text-muted italic opacity-60">No split data recorded.</p>
              ) : splits.map((s, i) => {
                const theirItems = items.filter(item => (item.assignedTo || []).includes(s.name));
                return (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/80 text-page-bg text-[10px] font-bold flex items-center justify-center uppercase">
                          {s.name[0]}
                        </div>
                        <span className="text-xs font-bold text-text-main uppercase tracking-tight">{s.name}</span>
                      </div>
                      <span className="text-base font-bold text-accent">{formatCurrency(s.amount)}</span>
                    </div>
                    {theirItems.length > 0 && (
                      <div className="space-y-1 pl-9 border-t border-white/5 pt-2">
                        {theirItems.map((item, j) => {
                          const share = item.price / (item.assignedTo?.length || 1);
                          const isShared = (item.assignedTo?.length || 1) > 1;
                          return (
                            <div key={j} className="flex items-center justify-between">
                              <span className="text-[10px] text-text-muted italic">
                                {item.name}
                                {isShared && <span className="text-accent/50 ml-1">(÷{item.assignedTo.length})</span>}
                              </span>
                              <span className="text-[10px] text-text-subtle">{formatCurrency(share)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Card (after save)
// ─────────────────────────────────────────────────────────────────────────────
function SummaryCard({ bill, onNewSplit, onViewHistory }) {
  const splits = bill.participants?.splits || [];
  const items  = bill.participants?.items  || [];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 22 }}
      className="max-w-lg mx-auto"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 15 }}
          className="w-20 h-20 bg-accent/10 border-2 border-accent/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={36} className="text-accent" />
        </motion.div>
        <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-3">Split Finalized</p>
        <h2 className="text-3xl font-display font-medium text-text-main tracking-tight">{bill.title}</h2>
        <p className="text-text-muted text-sm mt-2">
          Total: <span className="text-text-main font-bold">{formatCurrency(bill.total_amount)}</span>
        </p>
      </div>

      <div className="space-y-4 mb-10">
        {splits.map((s, i) => {
          const theirItems = items.filter(item => (item.assignedTo || []).includes(s.name));
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="p-5 bg-white/5 border border-white/10 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary text-page-bg text-xs font-bold flex items-center justify-center uppercase">
                    {s.name[0]}
                  </div>
                  <span className="text-sm font-bold text-text-main uppercase tracking-tight">{s.name}</span>
                </div>
                <span className="text-xl font-bold text-accent">{formatCurrency(s.amount)}</span>
              </div>
              {theirItems.length > 0 && (
                <div className="space-y-1.5 pl-12 border-t border-white/5 pt-3">
                  {theirItems.map((item, j) => {
                    const share = item.price / (item.assignedTo?.length || 1);
                    const isShared = (item.assignedTo?.length || 1) > 1;
                    return (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-[11px] text-text-muted italic">
                          {item.name}
                          {isShared && <span className="text-accent/50 ml-1">(÷{item.assignedTo.length})</span>}
                        </span>
                        <span className="text-[11px] text-text-subtle font-medium">{formatCurrency(share)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="primary" className="flex-1 h-14 rounded-full text-[10px] tracking-[0.3em]" onClick={onNewSplit}>
          <Plus size={16} /> New Split
        </Button>
        <Button variant="secondary" className="flex-1 h-14 rounded-full text-[10px] tracking-[0.3em]" onClick={onViewHistory}>
          <History size={16} /> View History
        </Button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SplitBill() {
  const { user } = useAuth(); // ensures page is under AuthContext
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.hash === "#expenses") return "EXPENSES";
    if (location.hash === "#balances") return "BALANCES";
    return "SPLIT";
  }); // "SPLIT" | "EXPENSES" | "BALANCES"
  
  useEffect(() => {
    if (location.hash === "#expenses") setActiveTab("EXPENSES");
    else if (location.hash === "#balances") setActiveTab("BALANCES");
  }, [location.hash]);

  const [view, setView] = useState("new"); // "new" | "history" | "summary"

  // ── New split state ──
  const [items, setItems] = useState([]);
  const [participants, setParticipants] = useState(["You"]);
  const [participantUsers, setParticipantUsers] = useState([{ id: user?.id, name: "You" }]);
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignments, setAssignments] = useState({});
  const [paymentMode, setPaymentMode] = useState("cash");
  const [isSaving, setIsSaving] = useState(false);

  // ── Café selector state ──
  const [cafes, setCafes] = useState([]);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [cafeSearchTerm, setCafeSearchTerm] = useState("");
  const [isCafeDropdownOpen, setIsCafeDropdownOpen] = useState(false);

  // ── History ──
  const [pastBills, setPastBills] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Post-save ──
  const [savedBill, setSavedBill] = useState(null);

  // ── Fetch Friends ──
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const [usersRes, followingRes, followersRes] = await Promise.all([
          api.get('/users/'),
          api.get(`/social/user/${user.id}/following`),
          api.get(`/social/user/${user.id}/followers`)
        ]);
        const followingIds = followingRes.data;
        const followersIds = followersRes.data;
        // Mutual friends: people you follow who also follow you
        const mutualIds = followingIds.filter(id => followersIds.includes(id));
        const myFriends = usersRes.data.filter(u => mutualIds.includes(u.id) && u.id !== user.id);
        setFriends(myFriends);
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    };
    if (user) fetchFriends();
  }, [user]);

  // ── Fetch Cafés ──
  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const res = await api.get('/cafes', { params: { limit: 100 } });
        setCafes(res.data);
      } catch (err) {
        console.error("Failed to load cafes", err);
      }
    };
    fetchCafes();
  }, []);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // ── Confirm Dialog ──
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", confirmLabel: "Proceed", variant: "primary", onConfirm: () => {} });
  const askConfirm = (title, message, onConfirm, variant = "primary", confirmLabel = "Proceed") => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, variant, confirmLabel });
  };

  // ─── Calculations ───
  const calculateSettlement = () => {
    const totals = {};
    participants.forEach(p => (totals[p] = 0));
    items.forEach((item, idx) => {
      const assignedTo = assignments[idx] || [];
      if (assignedTo.length > 0) {
        const share = item.price / assignedTo.length;
        assignedTo.forEach(p => (totals[p] += share));
      }
    });
    return totals;
  };

  const settlement    = calculateSettlement();
  const grandTotal    = items.reduce((sum, i) => sum + i.price, 0);
  const assignedTotal = items
    .filter((_, idx) => (assignments[idx] || []).length > 0)
    .reduce((sum, i) => sum + i.price, 0);
  const unassignedCount = items.filter((_, idx) => (assignments[idx] || []).length === 0).length;
  const canFinalize = items.length > 0;

  // ─── Save ───
  const handleFinalize = async () => {
    if (items.length === 0) {
      showToast("Add at least one item first", "error");
      return;
    }

    const processFinalize = async () => {
      setIsSaving(true);
      try {
        const now = new Date();
        const title = `Café Split — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        const richParticipants = {
          items: items.map((item, idx) => ({
            ...item,
            assignedTo: assignments[idx] || [],
          })),
          splits: Object.entries(settlement)
            .filter(([, amt]) => amt > 0)
            .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 })),
          users: participantUsers,
        };
        const { data } = await saveBill({
          title,
          total_amount: Math.round(assignedTotal * 100) / 100,
          payment_mode: paymentMode,
          participants: richParticipants,
          cafe_id: selectedCafe?.id || null,
        });

        if (paymentMode === "esewa") {
          showToast("Redirecting to eSewa...");
          try {
            const sigRes = await api.post(`/bills/${data.id}/esewa/signature`);
            const esewaData = sigRes.data;

            const form = document.createElement("form");
            form.setAttribute("method", "POST");
            form.setAttribute("action", "https://rc-epay.esewa.com.np/api/epay/main/v2/form");

            for (const key in esewaData) {
              const hiddenField = document.createElement("input");
              hiddenField.setAttribute("type", "hidden");
              hiddenField.setAttribute("name", key);
              hiddenField.setAttribute("value", esewaData[key]);
              form.appendChild(hiddenField);
            }

            const successUrl = document.createElement("input");
            successUrl.setAttribute("type", "hidden");
            successUrl.setAttribute("name", "success_url");
            successUrl.setAttribute("value", `${window.location.origin}/esewa-success`);
            form.appendChild(successUrl);

            const failureUrl = document.createElement("input");
            failureUrl.setAttribute("type", "hidden");
            failureUrl.setAttribute("name", "failure_url");
            failureUrl.setAttribute("value", `${window.location.origin}/esewa-failure`);
            form.appendChild(failureUrl);

            document.body.appendChild(form);
            form.submit();
            return;
          } catch(e) {
            console.error("eSewa Error", e);
            showToast("Failed to initiate eSewa payment", "error");
          }
        }

        setSavedBill(data);
        setView("summary");
        showToast("Bill saved!");
      } catch (err) {
        console.error(err);
        showToast("Failed to save — is the backend running?", "error");
      } finally {
        setIsSaving(false);
      }
    };

    const confirmFinalStep = () => {
      askConfirm(
        "Finalize Order",
        `Ready to finalize this split for ${formatCurrency(assignedTotal)} using ${paymentMode.toUpperCase()}?`,
        processFinalize
      );
    };

    if (unassignedCount > 0) {
      askConfirm(
        "Unassigned Items",
        `${unassignedCount} item${unassignedCount > 1 ? "s" : ""} aren't assigned to anyone — they'll be excluded from the split. Continue?`,
        confirmFinalStep
      );
    } else {
      confirmFinalStep();
    }
  };

  // ─── History ───
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await getMyBills();
      setPastBills(data);
    } catch {
      showToast("Couldn't load history", "error");
    } finally {
      setLoadingHistory(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (view === "history" || activeTab === "EXPENSES" || activeTab === "BALANCES") fetchHistory();
  }, [view, activeTab, fetchHistory]);

  const handleDeleteBill = async (id) => {
    await deleteBill(id);
    setPastBills(prev => prev.filter(b => b.id !== id));
    showToast("Bill removed");
  };

  // ─── Reset ───
  const resetSplit = () => {
    setAssignments({});
    setPaymentMode("cash");
    setSelectedCafe(null);
    setCafeSearchTerm("");
    setSavedBill(null);
    setView("new");
  };

  // ─── Data Derivation for Analytics ───
  const now = new Date();
  const thisMonthBills = pastBills.filter(b => 
    new Date(b.created_at).getMonth() === now.getMonth() &&
    new Date(b.created_at).getFullYear() === now.getFullYear()
  );
  const thisMonthTotal = thisMonthBills.reduce((s, b) => s + b.total_amount, 0);
  const avgPerBill = pastBills.length ? pastBills.reduce((s,b) => s + b.total_amount, 0) / pastBills.length : 0;
  
  const byCafeData = Object.entries(pastBills.reduce((acc, b) => {
    const name = b.cafe?.name || "Unlinked";
    acc[name] = (acc[name] || 0) + b.total_amount;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const byMonth = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const total = pastBills
      .filter(b => {
        const bd = new Date(b.created_at);
        return bd.getMonth() === m && bd.getFullYear() === y;
      })
      .reduce((s, b) => s + b.total_amount, 0);
    return { month: monthNames[m], total };
  }).reverse();

  // ─── Balances Logic ───
  const netBalances = {};
  
  // Advanced: Global Net for Debt Simplification (Splitwise Logic)
  const globalNet = {}; // positive = owed money, negative = owes money

  pastBills.forEach(bill => {
    const splits = bill.participants?.splits || [];
    
    // Resolve Creator True Identity
    let creatorName = "Unknown Creator";
    if (bill.creator_id === user.id) {
       creatorName = "You";
    } else {
       const globalFriend = friends.find(f => f.id === bill.creator_id);
       if (globalFriend) {
          creatorName = globalFriend.name;
       } else if (bill.participants?.users) {
          const cUser = bill.participants.users.find(u => u.id === bill.creator_id);
          if (cUser && cUser.name && cUser.name !== "You") creatorName = cUser.name;
       }
    }

    if (!globalNet[creatorName]) globalNet[creatorName] = 0;
    
    // Friend Balances (Bilateral)
    const isCreator = bill.creator_id === user.id;
    if (isCreator) {
      splits.forEach(split => {
         if (split.name === user.name || split.name === "You") return;
         netBalances[split.name] = (netBalances[split.name] || 0) + split.amount;
      });
    } else {
       const myShare = splits.find(s => s.name === "You" || s.name === user.name);
       if (myShare) {
          netBalances[creatorName] = (netBalances[creatorName] || 0) - myShare.amount;
       }
    }

    // Global Settlement Nodes (Network Graph)
    let billTotalOwedToCreator = 0;
    splits.forEach(split => {
       const debtor = (split.name === user.name) ? "You" : split.name;
       if (!globalNet[debtor]) globalNet[debtor] = 0;
       globalNet[debtor] -= split.amount;
       billTotalOwedToCreator += split.amount;
    });
    globalNet[creatorName] += billTotalOwedToCreator;
  });

  const totalOwedToYou = Object.values(netBalances).filter(v => v > 0).reduce((s,v) => s+v, 0);
  const totalYouOwe = Math.abs(Object.values(netBalances).filter(v => v < 0).reduce((s,v) => s+v, 0));
  const netTotal = totalOwedToYou - totalYouOwe;

  const optimizedSettlements = simplifyDebts(globalNet);

  const handleSettle = async (friendName) => {
    try {
      const amountToSettle = Math.abs(netBalances[friendName] || 0);
      if (!amountToSettle) return;

      const friendUser = friends.find(f => f.name === friendName) || participantUsers.find(f => f.name === friendName) || { id: null, name: friendName };
      
      await saveBill({
        title: `Settlement`,
        total_amount: 0,
        payment_mode: "cash",
        participants: {
          items: [],
          splits: [{ name: friendName, amount: amountToSettle }],
          users: [{ id: user.id, name: user.name }, { id: friendUser.id, name: friendName }]
        },
        cafe_id: null
      });

      showToast(`Successfully settled ${formatCurrency(amountToSettle)} with ${friendName}`);
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast("Settlement failed", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto py-20 px-6 selection:bg-accent selection:text-page-bg">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <Dialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(v => ({ ...v, isOpen: false }))}
      />

      {/* Tab Bar */}
      <div className="mb-12 flex justify-center">
        <div className="flex w-full max-w-md gap-2 p-1 bg-white/5 rounded-full border border-white/10 relative overflow-hidden backdrop-blur-md">
          {["SPLIT", "EXPENSES", "BALANCES"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative z-10 flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
                activeTab === tab ? "text-white" : "text-text-muted hover:text-text-main"
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-text-main rounded-full shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-20">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-3">
          <p className="text-accent text-[10px] uppercase font-bold tracking-[0.4em] opacity-60">
            {activeTab === "SPLIT" 
              ? (view === "history" ? "Archives" : view === "summary" ? "Settled" : "The Algorithm")
              : activeTab === "EXPENSES" ? "Insights" : "Ledger"
            }
          </p>
          <h1 className="text-5xl md:text-7xl font-display font-medium text-text-main tracking-tighter leading-none">
            {activeTab === "SPLIT" ? (
              view === "history"
                ? <>Bill <span className="italic font-normal text-accent">History.</span></>
                : view === "summary"
                ? <>Split <span className="italic font-normal text-accent">complete.</span></>
                : <>Divide the <span className="italic font-normal text-accent">ritual.</span></>
            ) : activeTab === "EXPENSES" ? (
              <>Spending <span className="italic font-normal text-accent">Visuals.</span></>
            ) : (
              <>Net <span className="italic font-normal text-accent">Debts.</span></>
            )}
          </h1>
        </div>

        <div className="flex gap-3">
          {activeTab === "SPLIT" && (
            <>
              {view === "summary" && (
                <Button variant="outline" className="rounded-full px-8 h-14 text-[10px] tracking-[0.2em] flex items-center gap-3" onClick={resetSplit}>
                  <ArrowLeft size={16} /> New Split
                </Button>
              )}
              {view === "history" && (
                <Button variant="outline" className="rounded-full px-8 h-14 text-[10px] tracking-[0.2em] flex items-center gap-3" onClick={() => setView("new")}>
                  <Plus size={16} /> New Split
                </Button>
              )}
              {view === "new" && (
                <Button variant="secondary" className="rounded-full px-8 h-14 flex items-center gap-3 group" onClick={() => setView("history")}>
                  <History size={18} />
                  <span className="text-[10px] tracking-[0.2em]">History</span>
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ══ TAB: SPLIT ══ */}
        {activeTab === "SPLIT" && (
          <motion.div 
            key="split-tab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* ══ VIEW: SUMMARY ══ */}
            {view === "summary" && savedBill && (
              <SummaryCard bill={savedBill} onNewSplit={resetSplit} onViewHistory={() => setView("history")} />
            )}

            {/* ══ VIEW: HISTORY ══ */}
        {view === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <RefreshCw size={32} className="text-accent animate-spin" />
                <p className="text-text-muted text-sm uppercase tracking-widest">Loading archives…</p>
              </div>
            ) : pastBills.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-40 text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Coffee size={36} className="text-text-subtle opacity-30" />
                </div>
                <p className="text-text-muted text-sm italic opacity-60">No past splits yet.</p>
                <Button variant="outline" className="rounded-full px-8 h-12 text-[10px] tracking-widest mx-auto" onClick={() => setView("new")}>
                  Create your first split
                </Button>
              </motion.div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] mb-6 text-center opacity-60">
                  {pastBills.length} saved split{pastBills.length !== 1 ? "s" : ""}
                </p>
                <AnimatePresence>
                  {pastBills.map(bill => (
                    <BillHistoryCard 
                      key={bill.id} 
                      bill={bill} 
                      onDelete={handleDeleteBill} 
                      askConfirm={askConfirm}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

            {/* ══ VIEW: NEW SPLIT ══ */}
            {view === "new" && (
              <div key="new" className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* ── Left: Ledger ── */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Café Selector */}
                  <div className="relative z-[150]">
                    <div className="flex items-center gap-3 p-1 bg-white border border-black/5 shadow-sm rounded-2xl transition-all duration-300 hover:border-black/10 focus-within:border-accent/40 focus-within:shadow-md">
                      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                        {selectedCafe?.image_url ? (
                          <img src={selectedCafe.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <MapPin size={20} className="text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-3">
                        <input
                          type="text"
                          placeholder="LINK TO A CAFÉ..."
                          value={cafeSearchTerm || selectedCafe?.name || ""}
                          onChange={(e) => {
                            setCafeSearchTerm(e.target.value);
                            setSelectedCafe(null);
                            setIsCafeDropdownOpen(true);
                          }}
                          onFocus={() => setIsCafeDropdownOpen(true)}
                          className="w-full bg-transparent text-sm font-bold tracking-tight text-text-main outline-none placeholder:text-text-muted/40 uppercase"
                        />
                      </div>
                      {selectedCafe && (
                         <button onClick={() => { setSelectedCafe(null); setCafeSearchTerm(""); }} className="p-3 text-text-muted hover:text-accent">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {isCafeDropdownOpen && (cafeSearchTerm || !selectedCafe) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-float overflow-hidden z-[100]"
                        >
                          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {cafes.filter(c => c.name.toLowerCase().includes(cafeSearchTerm.toLowerCase())).map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCafe(c);
                                  setCafeSearchTerm("");
                                  setIsCafeDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-3 hover:bg-surface-hover rounded-xl transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-surface-hover border border-black/5 shadow-soft overflow-hidden flex-shrink-0">
                                  {c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-text-main uppercase tracking-tight truncate">{c.name}</p>
                                  <p className="text-[9px] text-text-muted uppercase tracking-widest">{c.area}</p>
                                </div>
                              </button>
                            ))}
                            {cafes.filter(c => c.name.toLowerCase().includes(cafeSearchTerm.toLowerCase())).length === 0 && (
                              <div className="p-4 text-center text-text-muted text-[10px] font-bold tracking-widest uppercase">
                                No cafes found
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Visual Step Indicators */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
                  <span className={cn("px-3 py-1.5 rounded-lg border transition-colors", items.length === 0 ? "bg-accent/10 text-accent border-accent/20" : "bg-white border-black/5 shadow-sm")}>Step 1: Items</span>
                  <ChevronRight size={12} className="opacity-50" />
                  <span className={cn("px-3 py-1.5 rounded-lg border transition-colors", items.length > 0 && participants.length <= 1 ? "bg-accent/10 text-accent border-accent/20" : "bg-white border-black/5 shadow-sm")}>Step 2: People</span>
                  <ChevronRight size={12} className="opacity-50" />
                  <span className={cn("px-3 py-1.5 rounded-lg border transition-colors", participants.length > 1 && canFinalize ? "bg-accent/10 text-accent border-accent/20" : "bg-white border-black/5 shadow-sm")}>Step 3: Assign</span>
                  <ChevronRight size={12} className="opacity-50" />
                  <span className="bg-white border-black/5 shadow-sm px-3 py-1.5 rounded-lg border">Step 4: Pay</span>
                </div>

                <div className="relative p-10 bg-white border border-black/5 shadow-float rounded-[2.5rem] min-h-[520px] group transition-all duration-700">
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-2xl font-display font-medium flex items-center gap-3 tracking-tight">
                      <Receipt size={22} className="text-accent stroke-[1.5px]" />
                      Ledger Items
                    </h3>
                    {items.length > 0 && (
                      <span className="text-[10px] text-text-muted uppercase tracking-widest bg-surface-hover px-3 py-1 rounded-full">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Manual add item form */}
                  <form
                    className="flex gap-3 mb-8 relative z-10"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = e.target.iname.value.trim();
                      const price = parseFloat(e.target.iprice.value);
                      if (name && !isNaN(price) && price > 0) {
                        setItems(prev => [...prev, { name, price }]);
                        e.target.reset();
                        e.target.iname.focus();
                      }
                    }}
                  >
                    <input
                      name="iname"
                      placeholder="Item name (e.g. Oat Latte)"
                      required
                      className="flex-1 bg-white/5 border border-white/10 focus:border-accent/30 rounded-2xl px-5 py-3.5 text-sm text-text-main outline-none transition-all duration-400 placeholder:text-text-subtle/50"
                    />
                    <input
                      name="iprice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Price"
                      required
                      className="w-28 bg-white/5 border border-white/10 focus:border-accent/30 rounded-2xl px-4 py-3.5 text-sm text-text-main outline-none transition-all duration-400 placeholder:text-text-subtle/50"
                    />
                    <button
                      type="submit"
                      className="w-12 h-12 bg-primary text-page-bg rounded-2xl hover:bg-accent transition-all duration-400 flex items-center justify-center shadow-soft shrink-0"
                    >
                      <Plus size={18} />
                    </button>
                  </form>

                  {/* Items list */}
                  <div className="space-y-3 relative z-10">
                    <AnimatePresence mode="popLayout">
                      {items.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-20 text-center space-y-4"
                        >
                          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                            <Receipt size={34} className="text-text-subtle opacity-20" />
                          </div>
                          <p className="text-sm text-text-muted italic opacity-50">
                            Type items above to get started
                          </p>
                        </motion.div>
                      ) : (
                        items.map((item, idx) => (
                          <motion.div
                            key={idx}
                            layout
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16, scale: 0.96 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`p-5 rounded-2xl border transition-all duration-400 group/item ${
                              (assignments[idx] || []).length === 0
                                ? "bg-white/5 border-white/8 hover:border-yellow-400/20"
                                : "bg-white/5 border-white/10 hover:border-accent/20"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => {
                                    setItems(prev => prev.filter((_, i) => i !== idx));
                                    const next = { ...assignments };
                                    delete next[idx];
                                    // Re-index assignments above this index
                                    const reIndexed = {};
                                    Object.entries(next).forEach(([k, v]) => {
                                      const ki = parseInt(k);
                                      reIndexed[ki > idx ? ki - 1 : ki] = v;
                                    });
                                    setAssignments(reIndexed);
                                  }}
                                  className="opacity-0 group-hover/item:opacity-100 p-1.5 text-text-subtle hover:text-red-400 transition-all duration-300 shrink-0"
                                  title="Remove item"
                                >
                                  <X size={14} />
                                </button>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-text-main tracking-tight truncate">{item.name}</p>
                                  <p className="text-[11px] font-bold text-accent mt-0.5">Rs. {item.price.toFixed(2)}</p>
                                </div>
                              </div>

                              {/* Assignment pills */}
                              <div className="flex flex-wrap gap-2 sm:justify-end mt-4">
                                {participants.map(p => {
                                  const isAssigned = (assignments[idx] || []).includes(p);
                                  return (
                                    <button
                                      key={p}
                                      onClick={() => {
                                        const current = assignments[idx] || [];
                                        const next = current.includes(p)
                                          ? current.filter(n => n !== p)
                                          : [...current, p];
                                        setAssignments({ ...assignments, [idx]: next });
                                      }}
                                      className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-400 ${
                                        isAssigned
                                          ? "bg-accent text-page-bg shadow-glow-accent scale-105"
                                          : "bg-white/5 text-text-subtle border border-white/10 hover:border-white/25 hover:text-text-main"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Unassigned hint */}
                            {(assignments[idx] || []).length === 0 && (
                              <p className="text-[9px] text-yellow-400/60 mt-2 pl-9 uppercase tracking-widest">
                                ↑ Tap a name to assign
                              </p>
                            )}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer total */}
                  {items.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                      <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] mb-1 opacity-60">Grand Total</p>
                        <p className="text-4xl font-display font-medium text-text-main tracking-tighter">Rs. {grandTotal.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {unassignedCount > 0 && (
                          <span className="text-[10px] text-yellow-400 opacity-80 flex items-center gap-1">
                            <AlertCircle size={12} /> {unassignedCount} unassigned
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          className="rounded-xl px-5 py-2.5 text-[9px] tracking-widest"
                          onClick={() => { setItems([]); setAssignments({}); }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Collective + Settlement ── */}
              <div className="space-y-8">
                <div className="relative p-8 bg-white shadow-float rounded-[2.5rem] border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

                  <h3 className="text-2xl font-display font-medium mb-8 flex items-center gap-3 tracking-tight relative z-10">
                    <Users size={22} className="text-accent stroke-[1.5px]" />
                    People
                  </h3>

                  {/* Participants */}
                  <div className="space-y-2 mb-6 relative z-10">
                    <AnimatePresence>
                      {participants.map((p, i) => (
                        <motion.div
                          key={p}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between p-3 rounded-2xl bg-surface-hover border border-black/[0.03] hover:border-black/10 hover:shadow-sm transition-all duration-400 group/p"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary text-page-bg flex items-center justify-center text-[11px] font-bold shadow-soft group-hover/p:bg-accent group-hover/p:-rotate-6 transition-all duration-400">
                              {p[0]}
                            </div>
                            <span className="text-sm font-bold text-text-main uppercase tracking-tight">{p}</span>
                          </div>
                          {i > 0 && (
                            <button
                              onClick={() => {
                                setParticipants(ps => ps.filter(n => n !== p));
                                setParticipantUsers(ps => ps.filter(n => n.name !== p));
                              }}
                              className="opacity-0 group-hover/p:opacity-100 p-2 bg-white rounded-lg text-text-subtle hover:text-red-500 hover:shadow-sm transition-all duration-300"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <div className="mt-6 space-y-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="SEARCH FRIENDS..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-surface-hover rounded-xl px-5 py-3.5 text-[10px] font-bold tracking-widest outline-none border border-black/[0.05] focus:border-accent/30 focus:bg-white transition-all duration-400 uppercase placeholder:text-text-muted/50"
                        />
                        <Search size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted/30" />
                      </div>

                      {friends.filter(f => !participants.includes(f.name) && (searchTerm === "" || f.name.toLowerCase().includes(searchTerm.toLowerCase()))).length > 0 ? (
                        <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {friends
                            .filter(f => !participants.includes(f.name) && (searchTerm === "" || f.name.toLowerCase().includes(searchTerm.toLowerCase())))
                            .map(f => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  setParticipants(prev => [...prev, f.name]);
                                  setParticipantUsers(prev => [...prev, { id: f.id, name: f.name }]);
                                  setSearchTerm("");
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/5 border border-transparent hover:border-accent/10 transition-all duration-300 group/friend"
                              >
                                <div className="w-8 h-8 rounded-lg bg-surface-hover group-hover/friend:bg-accent/10 flex items-center justify-center text-[10px] font-bold text-text-muted group-hover/friend:text-accent transition-colors">
                                  {f.name[0]}
                                </div>
                                <span className="text-[11px] font-bold text-text-main uppercase tracking-tight">{f.name}</span>
                                <Plus size={12} className="ml-auto text-text-muted/30 group-hover/friend:text-accent group-hover/friend:translate-x-1 transition-all" />
                              </button>
                            ))
                          }
                        </div>
                      ) : (
                        searchTerm !== "" && (
                          <div className="text-center py-4 text-[9px] uppercase font-bold tracking-widest text-text-muted opacity-50">
                            No matching friends found.
                          </div>
                        )
                      )}
                      
                      {friends.length === 0 && !searchTerm && (
                        <div className="text-center py-4 text-[9px] uppercase font-bold tracking-widest text-text-muted bg-surface-hover/30 rounded-xl border border-dashed border-black/5">
                          No mutual friends to add yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Split preview */}
                  <div className="pt-6 border-t border-border relative z-10">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] mb-4 opacity-60">Who owes whom?</p>
                    <div className="space-y-2.5">
                      {participants.map(p => {
                        const amount = settlement[p] || 0;
                        if (amount === 0) return null;
                        return (
                          <div
                            key={p}
                            className="flex items-center justify-between bg-surface-hover/50 px-4 py-3 rounded-xl border border-transparent hover:border-accent/10 transition-all duration-400"
                          >
                            <span className="text-[11px] font-medium text-text-muted">{p}</span>
                            {p === "You" ? (
                              <span className="text-[11px] font-bold text-text-main">
                                You spent Rs. {amount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-accent">
                                owes You Rs. {amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment mode */}
                  <div className="mt-8 pt-8 border-t border-border relative z-10">
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.4em] mb-4 opacity-70 flex items-center gap-2">
                       <CreditCard size={12} /> Payment Method
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "cash", label: "Cash" },
                        { id: "esewa", label: "eSewa" }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setPaymentMode(mode.id)}
                          className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-400 border ${
                            paymentMode === mode.id
                              ? "bg-text-main text-white border-text-main shadow-md scale-105"
                              : "bg-surface-hover text-text-subtle border-black/5 hover:border-black/15 hover:bg-white"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Finalize */}
                  <Button
                    id="finalize-split-btn"
                    variant="primary"
                    className="w-full mt-10 rounded-[1.5rem] py-5 h-16 shadow-glow-accent text-[11px] tracking-[0.3em] font-bold relative overflow-hidden"
                    onClick={handleFinalize}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RefreshCw size={20} className="animate-spin mx-auto" />
                    ) : (
                      "FINALIZE SPLIT"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
        {/* ══ TAB: EXPENSES ══ */}
        {activeTab === "EXPENSES" && (
          <motion.div 
            key="expenses-tab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-12"
          >
            {/* HERO STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-black/5 rounded-[1.75rem] p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                   <TrendingUp size={20} className="text-accent" />
                </div>
                <p className="text-2xl font-display text-text-main tracking-tight">Rs. {thisMonthTotal.toFixed(0)}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1 opacity-60">This Month</p>
              </div>
              <div className="bg-white border border-black/5 rounded-[1.75rem] p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                   <Receipt size={20} className="text-accent" />
                </div>
                <p className="text-2xl font-display text-text-main tracking-tight">{pastBills.length} Bills</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1 opacity-60">Total Splits</p>
              </div>
              <div className="bg-white border border-black/5 rounded-[1.75rem] p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                   <Coffee size={20} className="text-accent" />
                </div>
                <p className="text-2xl font-display text-text-main tracking-tight">Rs. {avgPerBill.toFixed(0)}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-1 opacity-60">Avg Per Visit</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* BY CAFE PIE */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-60 ml-2">Spending by Café</p>
                <div className="bg-white border border-black/5 shadow-float rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-10">
                  <div className="w-[180px] h-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byCafeData}
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {byCafeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={["#c8a96e", "#a08050", "#6b5a3e", "#4a3f2f", "#2d261c"][index % 5]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}
                          itemStyle={{ fontSize: '10px', color: '#2C2A29', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    {byCafeData.slice(0, 5).map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ background: ["#c8a96e", "#a08050", "#6b5a3e", "#4a3f2f", "#2d261c"][i % 5] }} />
                           <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight truncate max-w-[120px]">{d.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-accent">Rs. {d.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MONTH TREND BAR */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-60 ml-2">Monthly Spending</p>
                <div className="bg-white border border-black/5 shadow-float rounded-[2rem] p-8 h-[244px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 9, fontWeight: 700 }}
                        dy={10}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)' }}
                        itemStyle={{ fontSize: '10px', color: '#2C2A29', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="total" fill="#c8a96e" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RECENT LIST */}
            <div className="space-y-4 pb-12">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-60 ml-2">Recent Transactions</p>
              <div className="space-y-3">
                {pastBills.slice(0, 5).map(b => (
                  <div key={b.id} className="bg-surface-hover border border-black/[0.03] rounded-2xl p-4 flex items-center justify-between group hover:border-black/10 hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-text-main uppercase tracking-tight">{b.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[9px] text-text-muted uppercase font-medium">{b.cafe?.name || "No Café Linked"}</p>
                          <span className="text-black/10 opacity-30 text-[8px]">·</span>
                          <span className="flex items-center gap-1 text-[9px] text-text-muted opacity-60">
                             <Clock size={8} /> {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display text-accent tracking-tight">Rs. {b.total_amount.toFixed(0)}</p>
                      <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60 font-bold flex items-center justify-end gap-1">
                         <Users size={10} /> {b.participants?.splits?.length || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ TAB: BALANCES ══ */}
        {activeTab === "BALANCES" && (
          <motion.div 
            key="balances-tab"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-12"
          >
            {/* NET POSITION HERO */}
            <div className="bg-white border border-black/5 shadow-float rounded-[2.5rem] p-12 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.5em] mb-4 relative z-10">Net Balance</p>
               <h2 className={cn("text-4xl font-display font-medium mb-8 relative z-10", netTotal >= 0 ? "text-green-400" : "text-red-400")}>
                  {netTotal >= 0 ? `You are owed Rs. ${netTotal.toFixed(0)}` : `You owe Rs. ${Math.abs(netTotal).toFixed(0)}`}
               </h2>
               <div className="flex items-center justify-center gap-8 relative z-10 border-t border-white/5 pt-8">
                  <div className="text-center">
                     <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Owed to you</p>
                     <p className="text-lg font-bold text-green-400">Rs. {totalOwedToYou.toFixed(0)}</p>
                  </div>
                  <div className="w-px h-8 bg-black/10" />
                  <div className="text-center">
                     <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">You owe</p>
                     <p className="text-lg font-bold text-red-400">Rs. {totalYouOwe.toFixed(0)}</p>
                  </div>
               </div>
            </div>

            {/* BALANCE LIST */}
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-60 ml-2">Balances</p>
               <div className="space-y-3">
                  {Object.entries(netBalances).filter(([, amt]) => Math.abs(amt) > 0.01).length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-black/5 bg-surface-hover/30 rounded-[2rem]">
                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40 italic">All debts are settled.</p>
                    </div>
                  ) : (
                    Object.entries(netBalances)
                      .filter(([, amt]) => Math.abs(amt) > 0.01)
                      .map(([name, amount]) => (
                        <div key={name} className="bg-surface-hover border border-black/[0.03] rounded-2xl p-5 flex items-center justify-between group hover:border-black/10 hover:shadow-sm hover:bg-white transition-all duration-300">
                          <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase", amount > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20")}>
                             {name[0]}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-text-main uppercase tracking-tight">{name}</p>
                            <p className={cn("text-[9px] uppercase tracking-widest font-bold mt-0.5", amount > 0 ? "text-green-500/60" : "text-red-500/60")}>
                               {amount > 0 ? "Owes you money" : "You owe them"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className={cn("text-lg font-display tracking-tight", amount > 0 ? "text-green-400" : "text-red-400")}>
                                Rs. {Math.abs(amount).toFixed(0)}
                              </p>
                           </div>
                           {amount < 0 && (
                             <button 
                              onClick={() => handleSettle(name)}
                              className="bg-accent/10 hover:bg-accent text-accent hover:text-page-bg text-[9px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-400 opacity-0 group-hover:opacity-100"
                             >
                                Settle Up
                             </button>
                           )}
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

            {/* SMART SETTLEMENT ALGORITHM (SPLITWISE) */}
            {optimizedSettlements.length > 0 && (
              <div className="space-y-4 pt-8">
                <div className="flex items-center justify-between mb-4 px-2">
                   <div>
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-80">Smart Settlement Plan</p>
                   </div>
                   <div className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                     {optimizedSettlements.length} MINIMAL TRANSACTIONS
                   </div>
                </div>
                
                <div className="space-y-3">
                  {optimizedSettlements.map((settlement, idx) => (
                    <div key={idx} className="bg-white border border-accent/20 rounded-2xl p-5 flex items-center justify-between shadow-soft relative overflow-hidden group hover:border-accent/40 transition-colors">
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-accent/60" />
                      
                      <div className="flex flex-1 items-center justify-between">
                         <div className="text-center w-[100px] sm:w-32 shrink-0">
                            <p className="text-[11px] font-bold text-text-main uppercase tracking-tight truncate">{settlement.from === "You" ? "You" : settlement.from}</p>
                            <p className="text-[8px] font-bold text-red-500/70 uppercase tracking-widest mt-0.5">{settlement.from === "You" ? "Owe" : "Pays"}</p>
                         </div>
                         
                         <div className="flex-1 flex flex-col items-center justify-center px-4">
                            <p className="text-sm sm:text-base font-display font-medium text-accent tracking-tighter mb-2">Rs. {settlement.amount.toFixed(0)}</p>
                            <div className="w-full max-w-[120px] flex items-center">
                               <div className="flex-1 h-px bg-black/10" />
                               <ChevronRight size={14} className="text-text-muted mx-1 opacity-40 shrink-0" />
                               <div className="flex-1 h-px bg-black/10" />
                            </div>
                         </div>
                         
                         <div className="text-center w-[100px] sm:w-32 shrink-0">
                            <p className="text-[11px] font-bold text-text-main uppercase tracking-tight truncate">{settlement.to === "You" ? "You" : settlement.to}</p>
                            <p className="text-[8px] font-bold text-green-500/70 uppercase tracking-widest mt-0.5">{settlement.to === "You" ? "Receive" : "Receives"}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTLED LOGS */}
            <div className="pb-20">
               <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer list-none ml-2">
                     <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-40">Recently Settled</p>
                     <ChevronRight size={12} className="text-text-muted opacity-40 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="mt-6 space-y-3 px-2">
                     {pastBills.filter(b => b.title === "Settlement" && b.creator_id === user.id).length === 0 ? (
                        <p className="text-[10px] text-text-muted opacity-30 italic py-4">No recent settlements found.</p>
                     ) : (
                        pastBills
                           .filter(b => b.title === "Settlement" && b.creator_id === user.id)
                           .slice(0, 5)
                           .map(b => {
                              const settledWith = b.participants?.splits?.[0]?.name || "Someone";
                              const amount = b.participants?.splits?.[0]?.amount || 0;
                              return (
                                 <div key={b.id} className="flex items-center justify-between py-3 opacity-60 border-b border-black/5 last:border-0 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3">
                                       <CheckCircle2 size={14} className="text-green-500/60" />
                                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Settled Up with {settledWith}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight text-accent">Rs. {amount.toFixed(0)}</p>
                                    </div>
                                 </div>
                              );
                           })
                     )}
                  </div>
               </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
