import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Coffee, Activity, MessageSquare, 
  CreditCard, PieChart, Settings, Bell, Search, Menu, LogOut, 
  Plus, Edit, Trash2, CheckCircle, AlertCircle, X, ShieldAlert, FileText, ArrowUpRight, MapPin
} from "lucide-react";
import Dialog from "../components/ui/Dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { formatCurrency } from "../utils/formatters";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [stats, setStats] = useState({ users: 0, cafes: 0, visits: 0, posts: 0, revenue: 0 });
  const [usersList, setUsersList] = useState([]);
  const [cafesList, setCafesList] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [billsList, setBillsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms and Modals
  const [showCafeModal, setShowCafeModal] = useState(false);
  const [editingCafe, setEditingCafe] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', website: '', contact_number: '', image_url: '' });

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    message: "",
    confirmLabel: "",
    onConfirm: () => {},
    variant: "primary"
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [uRes, cRes, lRes, bRes] = await Promise.all([
          api.get('/users/'),
          api.get('/cafes/'),
          api.get('/logs/'),
          api.get('/bills/').catch(() => ({ data: [] }))
        ]);
        setUsersList(uRes.data);
        setCafesList(cRes.data);
        setLogsList(lRes.data);
        setBillsList(bRes.data);
        
        // Calculate dynamic revenue from bills
        const totalRevenue = bRes.data.reduce((acc, bill) => acc + (bill.items ? bill.items.reduce((sum, item) => sum + item.price, 0) : 0), 0);

        setStats({
          users: uRes.data.length,
          cafes: cRes.data.length,
          visits: lRes.data.length,
          posts: lRes.data.length,
          revenue: formatCurrency(totalRevenue)
        });
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "cafes", label: "Cafes", icon: Coffee },
    { id: "visits", label: "Visits", icon: Activity },
    { id: "community", label: "Community", icon: MessageSquare },
    { id: "split_bills", label: "Split Bills", icon: FileText }
  ];

  // Dynamic Chart Generation
  const generateAnalytics = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const acc = { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 };
    logsList.forEach(log => {
      const d = new Date(log.created_at).getDay();
      acc[days[d]]++;
    });
    return days.map(day => ({ name: day, visits: acc[day] }));
  };
  const dynamicAnalytics = generateAnalytics();

  // Helper to map User ID to Name
  const getUserName = (id) => {
    const user = usersList.find(u => u.id === id);
    return user ? user.name : `Unknown (ID: ${id})`;
  };

  const getCafeName = (id) => {
    const cafe = cafesList.find(c => c.id === id);
    return cafe ? cafe.name : `Unknown Cafe (ID: ${id})`;
  };

  // --- CRUD ACTIONS ---
  
  const handleDeleteUser = (id) => {
    setDialogConfig({
      title: "Delete User Account",
      message: "Are you sure you want to permanently remove this user? This action cannot be reversed.",
      confirmLabel: "Delete User",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/users/${id}`);
          setUsersList(prev => prev.filter(u => u.id !== id));
          setStats(s => ({ ...s, users: s.users - 1 }));
        } catch(err) { alert("Failed to delete user."); }
      }
    });
    setDialogOpen(true);
  };

  const handleDeleteCafe = (id) => {
    setDialogConfig({
      title: "Delete Cafe Node",
      message: "Permanently delete this cafe from the directory? All associated logs will remain but the node will be detached.",
      confirmLabel: "Delete Cafe",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/cafes/${id}`);
          setCafesList(prev => prev.filter(c => c.id !== id));
          setStats(s => ({ ...s, cafes: s.cafes - 1 }));
        } catch(err) { alert("Failed to delete cafe."); }
      }
    });
    setDialogOpen(true);
  };

  const handlePurgeLog = (id) => {
    setDialogConfig({
      title: "Purge System Record",
      message: "Purge this community record from the platform? This will remove the visit log and any attached notes.",
      confirmLabel: "Purge Record",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/logs/${id}`);
          setLogsList(prev => prev.filter(l => l.id !== id));
          setStats(s => ({ ...s, posts: s.posts - 1, visits: s.visits - 1 }));
        } catch(err) { alert("Failed to purge log."); }
      }
    });
    setDialogOpen(true);
  };

  const handleSaveCafe = async () => {
    if(!formData.name.trim()) return alert("Name is required");
    try {
      const payload = {
        name: formData.name,
        city: formData.location || 'Unknown',
        address: formData.location, // Optionally use as address too
        website: formData.website,
        contact_number: formData.contact_number,
        image_url: formData.image_url
      };

      if(editingCafe) {
        const res = await api.put(`/cafes/${editingCafe.id}`, payload);
        setCafesList(prev => prev.map(c => c.id === editingCafe.id ? res.data : c));
      } else {
        const res = await api.post('/cafes/', payload);
        setCafesList([res.data, ...cafesList]);
        setStats(s => ({ ...s, cafes: s.cafes + 1 }));
      }
      setShowCafeModal(false);
      setEditingCafe(null);
      setFormData({ name: '', location: '', website: '', contact_number: '', image_url: '' });
    } catch(err) { alert("Failed to save cafe."); }
  };

  const openAddCafe = () => {
    setEditingCafe(null);
    setFormData({ name: '', location: '', website: '', contact_number: '', image_url: '' });
    setShowCafeModal(true);
  };

  const openEditCafe = (cafe) => {
    setEditingCafe(cafe);
    setFormData({
      name: cafe.name || '',
      location: cafe.city || cafe.address || '',
      website: cafe.website || '',
      contact_number: cafe.contact_number || '',
      image_url: cafe.image_url || ''
    });
    setShowCafeModal(true);
  };

  // --- SUB-VIEWS ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Users", value: stats.users, icon: Users, color: "text-accent", bg: "bg-accent/10" },
          { title: "Active Cafes", value: stats.cafes, icon: Coffee, color: "text-primary", bg: "bg-primary/10" },
          { title: "Visits Logged", value: stats.visits, icon: Activity, color: "text-accent", bg: "bg-accent/10" },
          { title: "Community Posts", value: stats.posts, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
        ].map((s, i) => (
          <Card key={i} className="p-6 flex flex-col gap-4 hover:shadow-float transition-all duration-500 group">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl border border-border/50 ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-500`}>
                <s.icon size={22} strokeWidth={2} />
              </div>
              <ArrowUpRight size={18} className="text-text-subtle group-hover:text-accent transition-colors" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-text-subtle mb-1">{s.title}</p>
              <h4 className="text-3xl font-display font-medium text-text-main tracking-tight">{s.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8">
          <h3 className="text-xl font-display font-medium text-text-main mb-6">Traffic Overview (Live)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-subtle)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-subtle)', fontSize: 12}} dx={-10} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', backgroundColor: 'var(--color-surface-card)' }} />
                <Line type="monotone" dataKey="visits" name="Visits Logged" stroke="var(--color-primary)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-8">
          <h3 className="text-xl font-display font-medium text-text-main mb-6">Recent Activity</h3>
          <div className="space-y-5">
            {logsList.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0 group">
                <div className="w-10 h-10 rounded-full bg-surface-hover text-text-muted flex items-center justify-center shrink-0 border border-border group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/20 transition-colors">
                  <Activity size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-main line-clamp-1 mb-0.5">User visited {getCafeName(log.cafe_id)}</p>
                  <p className="text-xs text-text-muted line-clamp-1 italic">"{log.text}"</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-text-subtle mt-2">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {logsList.length === 0 && <p className="text-sm text-text-muted">No recent activity found.</p>}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="animate-fade-in space-y-6">
      <Card className="overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <h3 className="text-xl font-display font-medium text-text-main">User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-muted">
            <thead className="bg-page-bg text-text-main border-b border-border">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">User Profile</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Email Account</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Permission Level</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors group">
                  <td className="px-8 py-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-hover border border-border overflow-hidden shrink-0 flex items-center justify-center shadow-inner-soft">
                      {u.avatar ? <img src={u.avatar.startsWith('http') ? u.avatar : `http://localhost:8000${u.avatar}`} className="w-full h-full object-cover" alt="" /> : <Users size={16} className="text-text-subtle" />}
                    </div>
                    <div>
                      <span className="font-medium text-text-main block">{u.name}</span>
                      <span className="text-[10px] text-text-subtle uppercase tracking-widest">ID: {u.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">{u.email}</td>
                  <td className="px-8 py-5">
                    <Badge variant={u.role === 'admin' ? 'primary' : 'neutral'}>{u.role || 'user'}</Badge>
                  </td>
                  <td className="px-8 py-5 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => handleDeleteUser(u.id)} className="text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 shadow-none hover:shadow-soft" title="Delete User">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderCafes = () => (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <h3 className="text-xl font-display font-medium text-text-main">Cafe Directory</h3>
          <button onClick={openAddCafe} className="bg-primary hover:bg-black text-page-bg px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-soft hover:shadow-float active:scale-[0.98]">
             <Plus size={16} /> Add Cafe Record
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-muted">
            <thead className="bg-page-bg text-text-main border-b border-border">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Cafe Identifier</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Location Sector</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Verification Status</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {cafesList.map((c) => (
                <tr key={c.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-8 py-5 flex items-center gap-4 min-w-[200px]">
                    <div className="w-12 h-12 rounded-xl border border-border bg-page-bg p-0.5 overflow-hidden shrink-0">
                      {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <Coffee className="w-6 h-6 m-auto mt-2 text-text-subtle" />}
                    </div>
                    <div>
                      <p className="font-medium text-text-main mb-1">{c.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle opacity-80">{c.rating ? c.rating.toFixed(1) : "0.0"} Global Rating</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                     <span className="flex items-center gap-2"><MapPin size={14} className="text-text-subtle" /> {c.city?.split(',')[0] || c.address?.split(',')[0] || "N/A"}</span>
                  </td>
                  <td className="px-8 py-5">
                    <Badge variant={c.website || c.contact_number ? 'success' : 'warning'}>{c.website || c.contact_number ? 'Verified Node' : 'Missing Comms'}</Badge>
                  </td>
                  <td className="px-8 py-5 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEditCafe(c)} className="text-text-muted hover:text-accent p-2 rounded-lg hover:bg-accent/10 transition-colors border border-transparent hover:border-accent/20 shadow-none hover:shadow-soft" title="Edit Cafe"><Edit size={16} strokeWidth={2.5} /></button>
                    <button onClick={() => handleDeleteCafe(c.id)} className="text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 shadow-none hover:shadow-soft" title="Delete Cafe"><Trash2 size={16} strokeWidth={2.5} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCafeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl border border-border shadow-float w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-8 border-b border-border bg-page-bg/50">
              <h3 className="font-display font-medium text-xl text-text-main">{editingCafe ? "Edit Cafe Node" : "Push New Cafe Node"}</h3>
              <button onClick={() => setShowCafeModal(false)} className="text-text-muted hover:text-text-main p-1 hover:bg-surface-hover rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-main mb-2">Cafe Designation *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full bg-page-bg border border-border rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-text-main placeholder:text-text-subtle shadow-inner-soft" placeholder="e.g. Server Side Roasters" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-main mb-2">Sector / Geo-Location</label>
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} type="text" className="w-full bg-page-bg border border-border rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-text-main placeholder:text-text-subtle shadow-inner-soft" placeholder="Kathmandu, Nepal Sector 4" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-main mb-2">Communications URI (Website)</label>
                <input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} type="text" className="w-full bg-page-bg border border-border rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-text-main placeholder:text-text-subtle shadow-inner-soft" placeholder="https://" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-main mb-2">Contact Number</label>
                <input value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} type="text" className="w-full bg-page-bg border border-border rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-text-main placeholder:text-text-subtle shadow-inner-soft" placeholder="+977..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-text-main mb-2">Asset Image URL</label>
                <input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} type="text" className="w-full bg-page-bg border border-border rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow text-text-main placeholder:text-text-subtle shadow-inner-soft" placeholder="https://image..." />
              </div>
            </div>
            <div className="p-8 border-t border-border bg-page-bg/50 flex justify-end gap-4">
              <button onClick={() => setShowCafeModal(false)} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-surface-hover rounded-xl border border-transparent transition-all">Discard</button>
              <button onClick={handleSaveCafe} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-page-bg bg-primary hover:bg-black rounded-xl shadow-soft hover:shadow-float active:scale-[0.98] border border-transparent transition-all">Save Cafe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCommunity = () => (
    <Card className="overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-border flex justify-between items-center bg-surface-card">
        <h3 className="text-xl font-display font-medium text-text-main">Community Moderation Queue</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="bg-page-bg text-text-main border-b border-border">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">User Content String</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Timestamp</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Automated Flag Status</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80 text-right">Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logsList.map((log) => (
              <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                <td className="px-8 py-5 max-w-sm">
                  <p className="font-medium text-text-main mb-1">Note Attached to {getCafeName(log.cafe_id)}</p>
                  <p className="text-xs text-text-muted truncate">"{log.text}"</p>
                </td>
                <td className="px-8 py-5 text-sm">{new Date(log.created_at).toLocaleDateString()}</td>
                <td className="px-8 py-5">
                  <Badge variant={log.text.includes("bad") ? "danger" : "success"}>{log.text.includes("bad") ? "Flagged" : "Protocol Safe"}</Badge>
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handlePurgeLog(log.id)} className="text-red-500 hover:text-white px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold border border-red-200 hover:bg-red-500 hover:border-red-500 hover:shadow-soft transition-all">Purge Record</button>
                </td>
              </tr>
            ))}
            {logsList.length === 0 && (
               <tr><td colSpan="4" className="px-8 py-10 text-center text-text-muted text-sm">No community records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderVisits = () => (
    <Card className="overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-border flex justify-between items-center bg-surface-card">
        <h3 className="text-xl font-display font-medium text-text-main">Platform Visits</h3>
      </div>
      <div className="p-8 text-sm text-text-muted border-b border-border/50 bg-page-bg/50">
          A complete ledger of physical space visits registered by users.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="bg-page-bg text-text-main border-b border-border">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">User Account</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Location Checked</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logsList.map((log) => (
              <tr key={log.id} className="hover:bg-surface-hover/50 transition-colors">
                <td className="px-8 py-5 font-medium text-text-main flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-surface-hover border border-border flex items-center justify-center shrink-0">
                     <Users size={12} className="text-text-subtle" />
                   </div>
                   {getUserName(log.user_id)}
                </td>
                <td className="px-8 py-5">{getCafeName(log.cafe_id)}</td>
                <td className="px-8 py-5">
                  <span className="flex items-center gap-2 text-xs">
                     <Activity size={14} className="text-text-subtle" /> 
                     {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderPayments = () => (
    <Card className="overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-border flex justify-between items-center bg-surface-card">
        <h3 className="text-xl font-display font-medium text-text-main">Financial Ledger</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-muted">
          <thead className="bg-page-bg text-text-main border-b border-border">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Transaction String</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Initiator Name</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Participants</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Value Added</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest opacity-80">Processing State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {billsList.map((p) => {
              const totalItemsValue = p.items ? p.items.reduce((sum, item) => sum + item.price, 0) : 0;
              return (
              <tr key={p.id} className="hover:bg-surface-hover/50 transition-colors">
                <td className="px-8 py-5 font-bold text-text-main">TRX-BILL-{p.id}</td>
                <td className="px-8 py-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-hover border border-border flex items-center justify-center shrink-0">
                     <Users size={12} className="text-text-subtle" />
                  </div>
                  <span className="font-medium text-text-main">{getUserName(p.creator_id)}</span>
                </td>
                <td className="px-8 py-5 font-medium">{p.participants ? p.participants.length : 0} Users</td>
                <td className="px-8 py-5 font-medium text-accent">+{formatCurrency(totalItemsValue)}</td>
                <td className="px-8 py-5">
                  <Badge variant="success">Completed</Badge>
                </td>
              </tr>
            )})}
            {billsList.length === 0 && (
               <tr><td colSpan="5" className="px-8 py-10 text-center text-text-muted text-sm">No transaction records found in ledger.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  // --- MAIN RENDER ---
  return (
    <div className="w-full h-screen bg-page-bg flex text-text-main font-body fixed inset-0 z-[100]">
      {/* Sidebar (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-surface-card border-r border-border z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:translate-x-0 shadow-float ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-8 border-b border-border justify-between">
          <h1 className="text-xl font-display font-medium tracking-tight text-text-main">
            CafeHop <span className="text-accent italic font-normal">Admin.</span>
          </h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-text-muted hover:bg-surface-hover p-2 rounded-xl transition-colors border border-transparent hover:border-border">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-2 overflow-y-auto h-[calc(100vh-5rem)] pb-24 no-scrollbar">
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.2em] mb-4 mt-2 px-3">Management</p>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 border border-transparent ${
                activeTab === tab.id 
                ? 'bg-accent/10 border-accent/20 text-accent shadow-inner-soft' 
                : 'text-text-muted hover:bg-page-bg hover:border-border hover:shadow-sm hover:text-text-main hover:translate-x-1'
              }`}
            >
              <tab.icon size={18} strokeWidth={2.5} className={activeTab === tab.id ? "text-accent scale-110" : "text-text-subtle group-hover:text-text-main transition-colors"} />
              {tab.label}
            </button>
          ))}
          
          <div className="my-8 h-px bg-border/50"></div>
          
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.2em] mb-4 px-3">System</p>
          <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500/80 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent transition-all duration-300">
            <LogOut size={18} strokeWidth={2.5} className="text-red-400" /> Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-page-bg relative">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none mix-blend-overlay"></div>
        
        {/* Topbar */}
        <header className="h-20 bg-surface-card/80 backdrop-blur-3xl border-b border-border flex items-center justify-between px-6 md:px-10 shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-text-muted p-2 hover:bg-surface-hover hover:text-text-main rounded-xl transition-all border border-transparent hover:border-border">
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center bg-page-bg px-4 py-2.5 rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary focus-within:border-primary focus-within:bg-surface-card focus-within:shadow-float transition-all duration-500 w-64 lg:w-[28rem] group">
              <Search size={16} strokeWidth={2.5} className="text-text-subtle mr-3 group-focus-within:text-primary transition-colors" />
              <input type="text" placeholder="Search accounts, nodes, ledgers..." className="bg-transparent border-none outline-none text-sm w-full font-medium text-text-main placeholder:text-text-muted placeholder:font-normal" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative text-text-muted hover:text-text-main transition-colors bg-page-bg hover:bg-surface-hover hover:border-border hover:shadow-soft border border-transparent p-2.5 rounded-xl">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-surface-card"></span>
            </button>
            <div className="h-8 w-px bg-border/50 hidden sm:block"></div>
            <div className="flex items-center gap-4 cursor-pointer hover:bg-surface-hover p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-border hover:shadow-sm">
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-display font-medium text-sm shadow-soft">
                A
              </div>
              <span className="font-bold text-[10px] uppercase tracking-widest text-text-main hidden sm:block">{user?.name || "Root Admin"}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 relative">
          <div className="max-w-[1400px] mx-auto">
            
            {/* Page Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-display font-medium text-text-main capitalize tracking-tight">{activeTab.replace('_', ' ')} Overview.</h2>
              <p className="text-sm font-medium text-text-muted mt-2 max-w-lg">Manage platform constraints and monitor system activity within the sector network.</p>
            </div>

            {/* Dynamic Rendering */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-6 animate-pulse">
                <div className="w-10 h-10 border-[3px] border-border border-t-accent rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-center leading-relaxed">Decrypting Ledger... <br/> Standing By</p>
              </div>
            ) : (
              <div>
                {activeTab === "dashboard" ? renderDashboard() : null}
                {activeTab === "users" && renderUsers()}
                {activeTab === "cafes" && renderCafes()}
                {activeTab === "community" && renderCommunity()}
                {activeTab === "visits" && renderVisits()}
                {activeTab === "payments" || activeTab === "split_bills" ? renderPayments() : null}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-md z-40 md:hidden transition-opacity"></div>
      )}

      {/* Reusable Dialog */}
      <Dialog 
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        onConfirm={dialogConfig.onConfirm}
        variant={dialogConfig.variant}
      />
    </div>
  );
}
