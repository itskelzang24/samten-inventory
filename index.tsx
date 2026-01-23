import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackagePlus, 
  Boxes, 
  FileCode, 
  TrendingUp, 
  AlertTriangle, 
  Plus,
  BarChart3, 
  PieChart, 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  Pencil, 
  Save, 
  Calendar, 
  Menu, 
  User, 
  ChevronRight, 
  Copy, 
  Terminal, 
  ReceiptText, 
  WalletMinimal, 
  LogOut, 
  Lock, 
  UserCircle, 
  ShieldCheck, 
  Users, 
  Settings2, 
  Trash2, 
  ShieldAlert, 
  RefreshCw, 
  Globe, 
  Link,
  Info,
  ExternalLink,
  ListChecks,
  CircleAlert,
  Share2,
  Rocket,
  Smartphone,
  Eye, 
  EyeOff,
  KeyRound,
  Layers,
  FileDown,
  History,
  Calculator,
  Tag,
  QrCode,
  Banknote,
  Truck,
  Hash,
  Key,
  Loader2,
  LifeBuoy
} from 'lucide-react';

// --- Configuration ---

/** 
 * PASTE YOUR GOOGLE APPS SCRIPT URL HERE 
 * This allows the app to work immediately when shared.
 */
const DEFAULT_SYNC_URL = ""; 

/** Session timeout in milliseconds (5 minutes) */
const IDLE_TIMEOUT = 5 * 60 * 1000; 

// --- Types ---

type UserRole = 'Owner' | 'Staff';

type AppUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
};

type StaffPermissions = {
  dashboard: boolean;
  pos: boolean;
  restock: boolean;
  inventory: boolean;
  reports: boolean;
  setup: boolean;
};

type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  supplier: string;
  status: 'Active' | 'Inactive';
};

type Transaction = {
  id: string;
  date: string;
  type: 'SALE' | 'RESTOCK';
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  total: number;
  gstTotal?: number; 
  method?: string;
  billNo?: string;
  supplier?: string;
  user: string;
};

type ToastMessage = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

type TabType = 'pos' | 'restock' | 'inventory' | 'reports' | 'dashboard' | 'setup' | 'access';

// --- Security Helpers ---

const encodeUrl = (url: string) => btoa(url); 
const decodeUrl = (encoded: string) => {
  try { return atob(encoded); } catch { return ''; }
};

// --- Export Helper ---

const downloadCSV = (data: any[], filename: string, headers: string[]) => {
  if (!data || !data.length) return;
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = Object.values(row).map(value => {
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Constants ---

const HARDCODED_USERS: AppUser[] = [
  { id: 'u1', username: 'admin', name: 'System Admin', role: 'Owner', password: 'admin123' },
  { id: 'u2', username: 'staff', name: 'Service Staff', role: 'Staff', password: 'staff123' },
];

const INITIAL_PERMISSIONS: StaffPermissions = {
  dashboard: true,
  pos: true,
  restock: false,
  inventory: false,
  reports: false,
  setup: false,
};

const formatCurrency = (val: number) => `Nu. ${val.toFixed(2)}`;

// --- Components ---

const LoginView = ({ onLogin, isSyncing, onSync, onResetUrl }: { onLogin: (user: AppUser) => void, isSyncing: boolean, onSync: () => void, onResetUrl: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.toLowerCase().trim();
    const cleanPass = password.trim();
    const user = HARDCODED_USERS.find(u => u.username === cleanUser && u.password === cleanPass);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center p-4 z-[200]">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
              <Boxes size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Samten</h1>
            <p className="text-slate-500 text-sm font-medium">Inventory V11.2</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium" 
                  placeholder="admin or staff"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 font-medium" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Secure Session Active
             </p>
             <button 
              onClick={() => { if(confirm("Clear Cloud Link?")) onResetUrl(); }}
              className="text-[10px] text-red-400 font-black uppercase hover:text-red-600 transition-colors tracking-widest"
            >
              Reset Cloud Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: number) => void }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transform transition-all animate-in slide-in-from-right fade-in ${
            toast.type === 'success' ? 'bg-green-600' : 
            toast.type === 'info' ? 'bg-blue-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : 
           toast.type === 'info' ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
          <span className="font-medium text-sm line-clamp-2">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-auto hover:bg-white/20 rounded-full p-1">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// --- App ---

const App = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(INITIAL_PERMISSIONS);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const stored = localStorage.getItem('samten_api_url_secure');
    return stored ? decodeUrl(stored) : DEFAULT_SYNC_URL;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    toastCounter.current += 1;
    const id = toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    if (type !== 'info') {
      setTimeout(() => removeToast(id), 4000);
    }
    return id;
  };

  // --- Session Timeout Logic ---
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: number;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleLogout();
        showToast("Session Expired due to inactivity", "error");
      }, IDLE_TIMEOUT);
    };

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Start timer

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [currentUser]);

  const syncData = async () => {
    if (!apiUrl) return;
    setIsSyncing(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Sync Failed");
      const data = await response.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      if (data.config && data.config.length > 1) {
        const permsRow = data.config.find((row: any[]) => row[0] === 'staff_perms');
        if (permsRow && permsRow[1]) {
          try {
            setStaffPermissions(JSON.parse(permsRow[1]));
          } catch (e) {
            console.error("Failed to parse cloud perms", e);
          }
        }
      }
      if (data.products && data.products.length > 1) {
        const parsedProducts: Product[] = data.products.slice(1).map((row: any[]) => ({
          id: String(row[0]).trim(),
          name: row[1],
          category: String(row[2] || 'General').trim(),
          unit: row[3],
          costPrice: parseFloat(row[4]) || 0,
          sellingPrice: parseFloat(row[5]) || 0,
          currentStock: parseInt(row[6]) || 0,
          minStock: parseInt(row[7]) || 0,
          supplier: row[8] || '',
          status: 'Active'
        }));
        setProducts(parsedProducts);
      }
      if (data.sales && data.sales.length > 1) {
        const parsedSales: Transaction[] = data.sales.slice(1).map((row: any[], idx: number) => ({
          id: `S-${idx}`,
          date: row[0],
          itemId: String(row[1]).trim(),
          itemName: row[2],
          qty: parseInt(row[3]) || 0,
          unitPrice: parseFloat(row[4]) || 0,
          gstTotal: parseFloat(row[5]) || 0,
          total: parseFloat(row[6]) || 0,
          method: row[7],
          user: row[8],
          type: 'SALE'
        }));
        const parsedRestocks: Transaction[] = (data.restocks || []).slice(1).map((row: any[], idx: number) => ({
          id: `R-${idx}`,
          date: row[0],
          itemId: String(row[1]).trim(),
          itemName: row[2],
          qty: parseInt(row[3]) || 0,
          unitPrice: parseFloat(row[4]) || 0,
          total: parseFloat(row[5]) || 0,
          billNo: row[6],
          supplier: row[7],
          user: row[8],
          type: 'RESTOCK'
        }));
        setTransactions([...parsedSales, ...parsedRestocks]);
      }
      setLastSync(new Date());
    } catch (error) {
      console.error(error);
      showToast("Cloud Connection Error", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (apiUrl) {
      syncData();
      const interval = setInterval(syncData, 60000);
      return () => clearInterval(interval);
    }
  }, [apiUrl]);

  const handleResetUrl = () => {
    setApiUrl('');
    localStorage.removeItem('samten_api_url_secure');
    setCurrentUser(null);
    showToast("System Link Reset.");
  };

  const pushTransaction = async (txData: any) => {
    if (!apiUrl) return false;
    const infoToastId = showToast("Updating Cloud...", "info");
    try {
      await fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(txData)
      });
      removeToast(infoToastId);
      showToast("Synced!", "success");
      setTimeout(syncData, 1000); 
      return true;
    } catch (e) {
      console.error(e);
      removeToast(infoToastId);
      showToast("Update Failed", "error");
      return false;
    }
  };

  const handleSale = async (itemId: string, qty: number, paymentMethod: string, user: string, ref: string, customPrice: number) => {
    const product = products.find(p => String(p.id).trim().toLowerCase() === String(itemId).trim().toLowerCase());
    if (!product || product.currentStock < qty) return showToast('Out of stock!', 'error');
    const subtotal = qty * customPrice;
    const gstTotal = subtotal * 0.05;
    const grandTotal = subtotal + gstTotal;
    const newTx: any = { type: 'SALE', itemId: String(itemId).trim(), itemName: product.name, qty, unitPrice: customPrice, gstTotal, total: grandTotal, method: paymentMethod, user };
    const success = await pushTransaction(newTx);
    if (success) {
        setProducts(prev => prev.map(p => String(p.id).trim().toLowerCase() === String(itemId).trim().toLowerCase() ? { ...p, currentStock: p.currentStock - qty } : p));
        return true;
    }
    return false;
  };

  const handleRestock = async (itemId: string, qty: number, cost: number, billNo: string, supplier: string) => {
    const product = products.find(p => String(p.id).trim().toLowerCase() === String(itemId).trim().toLowerCase());
    if (!product) return false;
    const newTx: any = { type: 'RESTOCK', itemId: String(itemId).trim(), itemName: product.name, qty, unitPrice: cost, total: qty * cost, billNo, supplier, user: currentUser?.name || 'Admin' };
    const success = await pushTransaction(newTx);
    if (success) {
        setProducts(prev => prev.map(p => String(p.id).trim().toLowerCase() === String(itemId).trim().toLowerCase() ? { ...p, currentStock: p.currentStock + qty, costPrice: cost } : p));
        return true;
    }
    return false;
  };

  const handleAddProduct = async (p: Product) => {
    const success = await pushTransaction({ type: 'ADD_PRODUCT', ...p });
    if (success) setProducts(prev => [...prev, p]);
  };

  const handleEditProduct = async (p: Product, originalId: string) => {
    const success = await pushTransaction({ type: 'UPDATE_PRODUCT', ...p, oldId: originalId });
    if (success) setProducts(prev => prev.map(old => old.id === originalId ? p : old));
  };

  const handleUpdateCloudPermissions = async (newPerms: StaffPermissions) => {
    setStaffPermissions(newPerms);
    await pushTransaction({ type: 'UPDATE_CONFIG', key: 'staff_perms', value: JSON.stringify(newPerms) });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    if (apiUrl) syncData();
  };

  const isTabAccessible = (tab: TabType) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Owner') return true;
    if (tab === 'access') return false;
    return staffPermissions[tab as keyof StaffPermissions] ?? false;
  };

  const navigate = (tab: TabType) => {
    if (!isTabAccessible(tab)) {
      showToast('Access restricted.', 'error');
      return;
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const lowStockItems = products.filter(p => p.currentStock <= p.minStock && p.status === 'Active');
  const totalSales = transactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.total, 0);
  const totalRestockCost = transactions.filter(t => t.type === 'RESTOCK').reduce((sum, t) => sum + t.total, 0);
  const grossProfit = totalSales - totalRestockCost - transactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + (t.gstTotal || 0), 0); 

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} isSyncing={isSyncing} onSync={syncData} onResetUrl={handleResetUrl} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-[100] shadow-md">
        <div className="flex items-center gap-2">
          <Menu className="cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
          <h1 className="text-xl font-bold tracking-tight">Samten</h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-xs">
          <User size={14} /> {currentUser.name}
        </div>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-[120] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block border-b border-slate-800/50">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Boxes className="text-blue-500" size={24} /> Samten
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">V11.2 Secure Session</p>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Main</p>
          <NavButton active={activeTab === 'dashboard'} onClick={() => navigate('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" restricted={!isTabAccessible('dashboard')} />
          <NavButton active={activeTab === 'pos'} onClick={() => navigate('pos')} icon={<ShoppingCart size={20} />} label="New Sale" restricted={!isTabAccessible('pos')} />
          <NavButton active={activeTab === 'restock'} onClick={() => navigate('restock')} icon={<PackagePlus size={20} />} label="Restock" restricted={!isTabAccessible('restock')} />
          <NavButton active={activeTab === 'inventory'} onClick={() => navigate('inventory')} icon={<Boxes size={20} />} label="Products" restricted={!isTabAccessible('inventory')} />
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2">Admin Only</p>
          <NavButton active={activeTab === 'reports'} onClick={() => navigate('reports')} icon={<FileText size={20} />} label="Analytics" restricted={!isTabAccessible('reports')} />
          <NavButton active={activeTab === 'setup'} onClick={() => navigate('setup')} icon={<FileCode size={20} />} label="Cloud Setup" restricted={!isTabAccessible('setup')} />
          
          {currentUser.role === 'Owner' && (
            <div className="pt-4 border-t border-slate-800/50 mt-4">
               <NavButton active={activeTab === 'access'} onClick={() => navigate('access')} icon={<ShieldCheck size={20} />} label="Staff Access" />
            </div>
          )}
        </nav>

        <div className="p-4 m-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-sm">
              {currentUser?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{currentUser.name}</p>
              <p className={`text-[10px] font-bold uppercase ${currentUser.role === 'Owner' ? 'text-blue-400' : 'text-slate-500'}`}>{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-50 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden md:flex bg-white shadow-sm px-8 py-5 justify-between items-center sticky top-0 z-10 border-b border-slate-100">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab}</h2>
             <span className="h-4 w-[1px] bg-slate-200"></span>
             <p className="text-xs text-slate-400 font-medium">Auto-timeout active (5m)</p>
          </div>
          <div className="flex gap-4">
            {lastSync && <span className="text-[10px] text-slate-400 font-bold uppercase">Cloud Sync: {lastSync.toLocaleTimeString()}</span>}
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto bg-[#F8FAFC]">
          {activeTab === 'dashboard' && <DashboardView lowStockItems={lowStockItems} totalSales={totalSales} grossProfit={grossProfit} transactions={transactions} products={products} onAlertClick={() => setShowLowStockModal(true)} onNavigate={navigate} isTabAccessible={isTabAccessible} currentUser={currentUser} />}
          {activeTab === 'pos' && <POSView products={products} onSale={handleSale} user={currentUser.name} />}
          {activeTab === 'restock' && <RestockView products={products} onRestock={handleRestock} user={currentUser.name} />}
          {activeTab === 'inventory' && <InventoryView products={products} onAdd={handleAddProduct} onEdit={handleEditProduct} />}
          {activeTab === 'reports' && <ReportsView transactions={transactions} />}
          {activeTab === 'setup' && <SetupView onShowToast={showToast} apiUrl={apiUrl} setApiUrl={(url: string) => { setApiUrl(url); localStorage.setItem('samten_api_url_secure', encodeUrl(url)); }} onSync={syncData} isSyncing={isSyncing} currentUser={currentUser} />}
          {activeTab === 'access' && <AccessControlView permissions={staffPermissions} onUpdatePermissions={handleUpdateCloudPermissions} onShowToast={showToast} />}
        </main>
      </div>

      {showLowStockModal && <LowStockModal items={lowStockItems} onClose={() => setShowLowStockModal(false)} />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, restricted }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, restricted?: boolean }) => (
  <button 
    onClick={onClick} 
    disabled={restricted}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 
      restricted ? 'opacity-40 cursor-not-allowed text-slate-600' :
      'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center space-x-3">
      {icon}
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
    {restricted && <Lock size={12} className="text-slate-500" />}
  </button>
);

const SetupView = ({ onShowToast, apiUrl, setApiUrl, onSync, isSyncing, currentUser }: any) => {
  const [showUrl, setShowUrl] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [pendingUrl, setPendingUrl] = useState(apiUrl);

  const confirmUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordConfirm.trim() === currentUser.password.trim()) {
      setApiUrl(pendingUrl);
      setIsVerifying(false);
      setPasswordConfirm('');
      onShowToast("Cloud URL Updated.");
      setTimeout(onSync, 500);
    } else {
      onShowToast("Wrong Password", "error");
    }
  };

  const appsScriptCode = `/**
 * Samten Cloud Connector (V11.2 - Timeout Ready)
 * Required sheets:
 * Products: ID | Name | Category | Unit | Cost | Selling | Stock | MinStock | Supplier
 * Sales_Transactions: Date | ItemID | ItemName | Qty | Rate | GST(5%) | Total | Method | User
 * Purchase_Transactions: Date | ItemID | ItemName | Qty | Cost | Total | BillNo | Supplier | User
 * System_Config: Key | Value
 */

const SHEET_NAME_PRODUCTS = "Products";
const SHEET_NAME_SALES = "Sales_Transactions";
const SHEET_NAME_RESTOCKS = "Purchase_Transactions";
const SHEET_NAME_CONFIG = "System_Config";

function ensureHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configs = [
    { name: SHEET_NAME_PRODUCTS, headers: ["ID", "Name", "Category", "Unit", "Cost", "Selling", "Stock", "MinStock", "Supplier"] },
    { name: SHEET_NAME_SALES, headers: ["Date", "ItemID", "ItemName", "Qty", "Rate", "GST(5%)", "Total", "Method", "User"] },
    { name: SHEET_NAME_RESTOCKS, headers: ["Date", "ItemID", "ItemName", "Qty", "Cost", "Total", "BillNo", "Supplier", "User"] },
    { name: SHEET_NAME_CONFIG, headers: ["Key", "Value"] }
  ];

  configs.forEach(conf => {
    let sheet = ss.getSheetByName(conf.name);
    if (!sheet) {
      sheet = ss.insertSheet(conf.name);
      sheet.appendRow(conf.headers);
    }
  });
}

function doGet(e) {
  ensureHeaders();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = {
      products: ss.getSheetByName(SHEET_NAME_PRODUCTS).getDataRange().getValues(),
      sales: ss.getSheetByName(SHEET_NAME_SALES).getDataRange().getValues(),
      restocks: ss.getSheetByName(SHEET_NAME_RESTOCKS).getDataRange().getValues(),
      config: ss.getSheetByName(SHEET_NAME_CONFIG).getDataRange().getValues()
    };
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  ensureHeaders();
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (data.type === 'SALE') {
      const sheet = ss.getSheetByName(SHEET_NAME_SALES);
      sheet.appendRow([new Date(), String(data.itemId).trim(), data.itemName, Number(data.qty), Number(data.unitPrice), Number(data.gstTotal), Number(data.total), data.method, data.user]);
      updateStock(String(data.itemId).trim(), -Number(data.qty));
    } else if (data.type === 'RESTOCK') {
      const sheet = ss.getSheetByName(SHEET_NAME_RESTOCKS);
      sheet.appendRow([new Date(), String(data.itemId).trim(), data.itemName, Number(data.qty), Number(data.unitPrice), Number(data.total), data.billNo, data.supplier, data.user]);
      updateStock(String(data.itemId).trim(), Number(data.qty));
    } else if (data.type === 'ADD_PRODUCT') {
      const sheet = ss.getSheetByName(SHEET_NAME_PRODUCTS);
      sheet.appendRow([String(data.id).trim(), data.name, String(data.category || 'General').trim(), data.unit, Number(data.costPrice), Number(data.sellingPrice), Number(data.currentStock), Number(data.minStock), data.supplier]);
    } else if (data.type === 'UPDATE_PRODUCT') {
      const searchId = data.oldId ? String(data.oldId).trim() : String(data.id).trim();
      updateRow(SHEET_NAME_PRODUCTS, searchId, [
        String(data.id).trim(), data.name, String(data.category || 'General').trim(), data.unit, Number(data.costPrice), Number(data.sellingPrice), Number(data.currentStock), Number(data.minStock), data.supplier
      ]);
    } else if (data.type === 'UPDATE_CONFIG') {
      updateConfig(data.key, data.value);
    }
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function updateStock(id, delta) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PRODUCTS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() == String(id).trim()) {
      const current = Number(data[i][6]) || 0; 
      sheet.getRange(i + 1, 7).setValue(current + delta);
      break;
    }
  }
}

function updateConfig(key, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_CONFIG);
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(String(value));
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([key, String(value)]);
}

function updateRow(sheetName, id, rowData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() == String(id).trim()) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      break;
    }
  }
}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl ring-4 ring-blue-600/20">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white leading-tight">Sync Connector</h3>
              <p className="text-slate-400 font-medium text-sm">Deployment URL for storage.</p>
            </div>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm flex-1 md:max-w-md">
            <div className="relative mb-3">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type={showUrl ? "text" : "password"}
                className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 outline-none focus:border-blue-500 transition-colors" 
                value={pendingUrl}
                onChange={(e) => setPendingUrl(e.target.value)}
              />
              <button onClick={() => setShowUrl(!showUrl)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                {showUrl ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <button 
              onClick={() => setIsVerifying(true)}
              className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
               <Save size={16} /> Update Link
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2rem] text-blue-900">
         <h4 className="font-black mb-2 flex items-center gap-2 text-sm"><Info size={18} /> Auto-Sync (V11.2)</h4>
         <p className="text-xs leading-relaxed font-medium">
            System includes a <strong>5-minute idle timeout</strong> for enhanced security. The default Cloud URL is hardcoded for immediate use.
         </p>
      </div>

      {isVerifying && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldAlert size={28} />
             </div>
             <h4 className="text-xl font-black text-slate-900 mb-2">Auth Required</h4>
             <p className="text-sm text-slate-500 mb-6">Enter password to apply cloud changes.</p>
             <form onSubmit={confirmUpdate} className="space-y-4">
                <input 
                  autoFocus
                  type="password"
                  placeholder="Enter Password"
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                />
                <div className="flex gap-3">
                   <button 
                    type="button" 
                    onClick={() => setIsVerifying(false)} 
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit" 
                    className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg active:scale-95"
                   >
                     Apply
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
        <div className="px-8 py-5 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <Terminal size={18} className="text-blue-400" />
            <h4 className="font-bold text-sm text-slate-200">Apps Script Source</h4>
          </div>
          <button 
            onClick={() => { navigator.clipboard.writeText(appsScriptCode); onShowToast("Script Copied!"); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all"
          >
            <Copy size={14} /> Copy Script
          </button>
        </div>
        <div className="p-1">
          <pre className="p-8 text-[11px] sm:text-xs text-blue-300 font-mono overflow-x-auto bg-slate-900/50 max-h-[400px] leading-relaxed scrollbar-thin">
            {appsScriptCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ lowStockItems, totalSales, grossProfit, transactions, products, onAlertClick, onNavigate, isTabAccessible, currentUser }: any) => {
  const isOwner = currentUser?.role === 'Owner';
  const categorySales = useMemo(() => {
    const data: Record<string, number> = {};
    const sales = transactions.filter((t: any) => t.type === 'SALE');
    sales.forEach((t: any) => {
      const p = products.find((prod: any) => String(prod.id).trim().toLowerCase() === String(t.itemId).trim().toLowerCase());
      const cleanCat = String(p?.category || 'General').trim();
      data[cleanCat] = (data[cleanCat] || 0) + t.total;
    });
    return Object.entries(data).sort((a, b) => b[1] - a[1]);
  }, [transactions, products]);
  const maxVal = Math.max(...categorySales.map(c => c[1]), 1);

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 ${isOwner ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
        {isOwner && (
          <>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(totalSales)}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl text-green-600"><TrendingUp size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Profit</p>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(grossProfit)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><PieChart size={24} /></div>
            </div>
          </>
        )}
        <button onClick={onAlertClick} className={`bg-white p-6 rounded-[1.5rem] border border-red-50 flex items-center justify-between shadow-sm hover:bg-red-50/50 transition-colors ${!isOwner ? 'w-full' : ''}`}>
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Alerts</p>
            <h3 className="text-2xl font-black text-red-600">{lowStockItems.length} Issues</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-2xl text-red-600"><AlertTriangle size={24} /></div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2"><BarChart3 size={16} className="text-blue-600" /> Category Stats</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live Analytics</p>
            </div>
            <span className="text-[10px] bg-slate-50 border px-3 py-1 rounded-full font-bold text-slate-400 uppercase">Live</span>
          </div>
          <div className="space-y-6">
            {categorySales.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                  <span className="text-slate-500">{cat}</span>
                  <span className="text-slate-900">{formatCurrency(val)}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(val / maxVal) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {categorySales.length === 0 && <p className="text-center py-20 text-slate-300 italic text-sm">Waiting for transactions...</p>}
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
             <h4 className="font-black text-slate-900 text-sm uppercase mb-6 flex items-center gap-2"><Rocket size={16} className="text-blue-600" /> Actions</h4>
             <div className="space-y-3">
                {isTabAccessible('pos') && <ActionButton icon={<ShoppingCart size={18}/>} label="New Sale" onClick={() => onNavigate('pos')} color="blue" />}
                {isTabAccessible('restock') && <ActionButton icon={<PackagePlus size={18}/>} label="Restock Goods" onClick={() => onNavigate('restock')} color="blue" />}
                {isTabAccessible('inventory') && <ActionButton icon={<Boxes size={18}/>} label="Products" onClick={() => onNavigate('inventory')} color="slate" />}
                {!isTabAccessible('pos') && !isTabAccessible('restock') && !isTabAccessible('inventory') && <p className="text-xs text-slate-400 italic py-4 text-center">No actions authorized.</p>}
             </div>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl text-white">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Stock Health</h4>
            <div className="flex items-end gap-3 mb-2">
               <h2 className="text-4xl font-black">{products.length}</h2>
               <span className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Products</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">Monitoring inventory health based on minimum stock rules.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick, color }: any) => (
  <button onClick={onClick} className="flex items-center gap-4 p-4 w-full rounded-2xl border border-slate-100 hover:shadow-md transition-all group text-left">
    <div className={`p-2 rounded-xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="font-bold text-slate-700 text-sm flex-1">{label}</span>
    <ChevronRight size={14} className="text-slate-300" />
  </button>
);

const POSView = ({ products, onSale, user }: any) => {
  const [formData, setFormData] = useState<any>({ id: '', qty: '', unitPrice: '', method: 'Cash', staff: user });
  const subtotal = (Number(formData.qty) || 0) * (Number(formData.unitPrice) || 0);
  const gstAmount = subtotal * 0.05;
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.qty) return;
    const success = await onSale(formData.id, Number(formData.qty), formData.method, formData.staff, '', Number(formData.unitPrice));
    if (success) setFormData({ id: '', qty: '', unitPrice: '', method: 'Cash', staff: user });
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <h3 className="text-xl font-black mb-8 text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl"><ShoppingCart size={20}/></div> Record Sale
        </h3>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Product</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold" required value={formData.id} onChange={e => {
                const p = products.find((prod: any) => String(prod.id).trim().toLowerCase() === String(e.target.value).trim().toLowerCase());
                setFormData({...formData, id: e.target.value, unitPrice: p ? p.sellingPrice : ''});
              }}>
                <option value="">Search goods...</option>
                {products.filter((p: any) => p.status === 'Active').map((p: any) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Quantity</label>
              <input type="number" min="1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 font-bold" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} placeholder="Qty" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Rate (Nu.)</label>
              <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 font-bold" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} placeholder="0.00" />
            </div>
            <div className="sm:col-span-2">
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Payment Method</label>
               <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData({...formData, method: 'Cash'})} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border font-bold transition-all ${formData.method === 'Cash' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    <Banknote size={18} /> Cash
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, method: 'QR/Transfer'})} className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border font-bold transition-all ${formData.method === 'QR/Transfer' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    <QrCode size={18} /> QR/Transfer
                  </button>
               </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
             <CheckCircle2 size={18} /> Complete Sale
          </button>
        </form>
      </div>
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] flex flex-col justify-between shadow-2xl relative overflow-hidden">
        <div>
           <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Total Calculation</h4>
           <div className="space-y-4">
              <div className="flex justify-between border-b border-white/5 pb-3"><span>Subtotal</span><span className="font-bold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between border-b border-white/5 pb-3"><span className="text-blue-400">Tax (GST 5%)</span><span className="font-bold text-blue-400">+ {formatCurrency(gstAmount)}</span></div>
           </div>
        </div>
        <div className="pt-8">
           <p className="text-slate-500 text-[10px] mb-1 font-black uppercase tracking-widest">Grand Total</p>
           <h2 className="text-4xl font-black">{formatCurrency(grandTotal)}</h2>
        </div>
      </div>
    </div>
  );
};

const RestockView = ({ products, onRestock, user }: any) => {
  const [formData, setFormData] = useState<any>({ id: '', qty: '', cost: '', billNo: '', supplier: '', user: user });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.qty) return;
    const success = await onRestock(formData.id, Number(formData.qty), Number(formData.cost), formData.billNo, formData.supplier);
    if (success) setFormData({ id: '', qty: '', cost: '', billNo: '', supplier: '', user: user });
  };
  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
      <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900">
         <div className="p-2 bg-blue-600 text-white rounded-xl"><PackagePlus size={22} /></div> Replenish Stock
      </h3>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Target Item</label>
            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none" required value={formData.id} onChange={e => {
              const p = products.find((prod: any) => String(prod.id).trim().toLowerCase() === String(e.target.value).trim().toLowerCase());
              setFormData({...formData, id: e.target.value, cost: p?.costPrice || '', supplier: p?.supplier || ''});
            }}>
               <option value="">Find goods...</option>
               {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Qty Received</label>
          <input type="number" min="1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} placeholder="Qty" /></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Cost Price (Nu.)</label>
          <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" /></div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Bill/Invoice</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-10 pr-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="ID" value={formData.billNo} onChange={e => setFormData({...formData, billNo: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Supplier Name</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="w-full pl-10 pr-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Vendor" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
            </div>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
           <Save size={18} /> Update Inventory
        </button>
      </form>
    </div>
  );
};

const InventoryView = ({ products, onAdd, onEdit }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [originalId, setOriginalId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({ id: '', name: '', category: 'General', unit: 'Pcs', costPrice: '', sellingPrice: '', currentStock: '', minStock: '5', supplier: '', status: 'Active' });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const categories = useMemo(() => {
    const set = new Set(products.map((p: any) => String(p.category || 'General').trim()).filter(Boolean));
    if (set.size === 0) set.add('General');
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    if (editItem) { setFormData({...editItem}); setOriginalId(editItem.id); setIsNewCategory(false); }
    else if (isAdding) { setFormData({ id: '', name: '', category: categories[0] || 'General', unit: 'Pcs', costPrice: '', sellingPrice: '', currentStock: '', minStock: '5', supplier: '', status: 'Active' }); setOriginalId(null); setIsNewCategory(false); }
  }, [editItem, isAdding]); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData, id: String(formData.id).trim(), category: String(formData.category || 'General').trim(), costPrice: Number(formData.costPrice) || 0, sellingPrice: Number(formData.sellingPrice) || 0, currentStock: Number(formData.currentStock) || 0, minStock: Number(formData.minStock) || 0 };
    if (editItem && originalId) { onEdit(finalData, originalId); setEditItem(null); }
    else { onAdd(finalData); setIsAdding(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-black text-slate-900 uppercase">Master Catalog</h3>
        <button onClick={() => { setEditItem(null); setIsAdding(true); }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black shadow-lg text-xs uppercase tracking-widest hover:bg-black transition-all"><Plus size={18} /> New Product</button>
      </div>
      {(isAdding || editItem) && (
        <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <Layers size={20} className="text-blue-600" /> {editItem ? 'Edit Profile' : 'Register Profile'}
            </h4>
            <button onClick={() => { setIsAdding(false); setEditItem(null); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">SKU/ID</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-blue-500" required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Name</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-blue-500" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Category</label>
                {!isNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none flex-1" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" onClick={() => { setIsNewCategory(true); setFormData({...formData, category: ''}); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"><Plus size={18} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input autoFocus className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    <button type="button" onClick={() => setIsNewCategory(false)} className="p-3 bg-slate-100 text-slate-400 rounded-xl"><X size={18} /></button>
                  </div>
                )}
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Unit</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:border-blue-500" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Cost Price</label>
                <input type="number" step="0.01" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase">Selling Rate</label>
                <input type="number" step="0.01" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Stock</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Min Stock</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
              </div>
            </div>
            <div className="pt-8 border-t flex justify-end gap-3">
               <button type="button" onClick={() => { setIsAdding(false); setEditItem(null); }} className="px-8 py-3 text-slate-400 font-black uppercase text-xs tracking-widest">Discard</button>
               <button type="submit" className="px-10 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase text-xs tracking-widest hover:bg-blue-700 transition-all">Save Changes</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
              <tr>
                <th className="px-8 py-5">SKU</th><th className="px-8 py-5">Product</th><th className="px-8 py-5">Category</th><th className="px-8 py-5 text-right font-black">Price</th><th className="px-8 py-5 text-center">In Stock</th><th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p: Product) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5 font-mono text-[11px] text-slate-400 uppercase">{p.id}</td>
                  <td className="px-8 py-5 font-black text-slate-900">{p.name}</td>
                  <td className="px-8 py-5 font-bold text-slate-500 text-[11px] uppercase">{p.category}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.currentStock <= p.minStock ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700'}`}>
                      {p.currentStock} {p.unit}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all" onClick={() => setEditItem(p)}><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportsView = ({ transactions }: { transactions: Transaction[] }) => {
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const reportData = useMemo(() => {
    const grouped: any = {};
    transactions.forEach((t: Transaction) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      let key = period === 'daily' ? d.toISOString().split('T')[0] : 
                period === 'monthly' ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}` : `${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = { period: key, sales: 0, expense: 0, tax: 0, net: 0 };
      if (t.type === 'SALE') { grouped[key].sales += t.total; grouped[key].tax += (t.gstTotal || 0); }
      else { grouped[key].expense += t.total; }
      grouped[key].net = (grouped[key].sales - grouped[key].tax) - grouped[key].expense;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.period.localeCompare(a.period));
  }, [transactions, period]);

  const salesHistory = useMemo(() => {
    return transactions.filter(t => t.type === 'SALE').map(t => ({
        date: new Date(t.date).toLocaleString(),
        item: t.itemName,
        qty: t.qty,
        rate: t.unitPrice,
        tax: t.gstTotal || 0,
        total: t.total,
        user: t.user,
        method: t.method || 'Cash'
      })).reverse();
  }, [transactions]);

  const handleExportSummary = () => {
    const exportData = reportData.map((r: any) => ({ 'Period': r.period, 'Revenue': r.sales, 'Expenses': r.expense, 'GST Taxes': r.tax, 'Net Profit': r.net }));
    downloadCSV(exportData, `Analytics_${period}`, ['Period', 'Revenue', 'Expenses', 'GST Taxes', 'Net Profit']);
  };

  const handleExportHistory = () => {
    downloadCSV(salesHistory, 'Sales_Journal', ['Date', 'Item', 'Qty', 'Rate', 'GST(5%)', 'Total', 'User', 'Method']);
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 text-white rounded-xl"><Calculator size={22} /></div>
             <div>
               <h3 className="text-xl font-black text-slate-900 uppercase">Financial Audit</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Business Summary</p>
             </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex bg-slate-200/50 p-1 rounded-2xl flex-1 sm:flex-initial">
              {['daily', 'monthly', 'yearly'].map(p => (
                <button key={p} onClick={() => setPeriod(p as any)} className={`flex-1 px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{p}</button>
              ))}
            </div>
            <button onClick={handleExportSummary} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black shadow-md"><FileDown size={20} /></button>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
                <tr><th className="px-8 py-5">Period</th><th className="px-8 py-5 text-right">Revenue</th><th className="px-8 py-5 text-right text-blue-500">GST (5%)</th><th className="px-8 py-5 text-right text-red-500">Expenses</th><th className="px-8 py-5 text-right font-black">Profit</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportData.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-black text-slate-900">{r.period}</td>
                    <td className="px-8 py-5 text-right text-slate-600">{formatCurrency(r.sales)}</td>
                    <td className="px-8 py-5 text-right text-blue-500 font-bold">{formatCurrency(r.tax)}</td>
                    <td className="px-8 py-5 text-right text-red-500 font-bold">{formatCurrency(r.expense)}</td>
                    <td className={`px-8 py-5 text-right font-black ${r.net >= 0 ? 'text-green-600' : 'text-red-700'}`}>{formatCurrency(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl"><History size={22} /></div>
              <div><h3 className="text-xl font-black text-slate-900 uppercase">Sales Journal</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Transaction History</p></div>
           </div>
           <button onClick={handleExportHistory} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-black shadow-lg transition-all">
              <FileDown size={14} /> Export Journal
           </button>
        </div>
        <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
                <tr><th className="px-8 py-5">Time</th><th className="px-8 py-5">Product</th><th className="px-8 py-5 text-center">Qty</th><th className="px-8 py-5 text-right">Rate</th><th className="px-8 py-5 text-right text-blue-500">GST</th><th className="px-8 py-5 text-right font-black">Total</th><th className="px-8 py-5">Method</th><th className="px-8 py-5">Staff</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salesHistory.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 font-mono text-[11px] text-slate-400">{s.date}</td>
                    <td className="px-8 py-5 font-bold text-slate-900">{s.item}</td>
                    <td className="px-8 py-5 text-center">{s.qty}</td>
                    <td className="px-8 py-5 text-right text-slate-500">{formatCurrency(s.rate)}</td>
                    <td className="px-8 py-5 text-right text-blue-500 font-bold">{formatCurrency(s.tax)}</td>
                    <td className="px-8 py-5 text-right font-black text-slate-900">{formatCurrency(s.total)}</td>
                    <td className="px-8 py-5"><span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${s.method === 'Cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{s.method}</span></td>
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{s.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccessControlView = ({ permissions, onUpdatePermissions, onShowToast }: any) => {
  const handleTogglePermission = (key: keyof StaffPermissions) => {
    onUpdatePermissions({ ...permissions, [key]: !permissions[key] });
    onShowToast(`Cloud settings updated.`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4">
      <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3"><ShieldCheck className="text-blue-600" /> Remote Access Policy</h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Modify module access for <strong>'Service Staff' (staff123)</strong>. Changes are pushed to cloud storage instantly.</p>
        <div className="space-y-4">
          {Object.keys(permissions).map((module) => (
            <div key={module} className="flex items-center justify-between p-5 border rounded-2xl hover:bg-slate-50 transition-all">
              <div><span className="text-sm font-black text-slate-700 capitalize">{module} Module</span><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Permission Active</p></div>
              <button onClick={() => handleTogglePermission(module as keyof StaffPermissions)} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${permissions[module] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${permissions[module] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Hardcoded User Policy</h4>
         <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">A</div>
               <div><p className="text-sm font-bold">Admin (admin / admin123)</p><p className="text-[10px] text-blue-400 uppercase font-bold">Full Owner</p></div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center font-black">S</div>
               <div><p className="text-sm font-bold">Staff (staff / staff123)</p><p className="text-[10px] text-slate-500 uppercase font-bold">Limited Role</p></div>
            </div>
         </div>
      </div>
    </div>
  );
};

const LowStockModal = ({ items, onClose }: { items: Product[], onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-900/60 z-[300] backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border">
      <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center"><AlertTriangle size={28} /></div>
          <div><h3 className="text-xl font-black text-slate-900">Low Stock Alert</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Action Required</p></div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full"><X size={24} /></button>
      </div>
      <div className="p-0 max-h-[50vh] overflow-y-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 sticky top-0 z-10">
            <tr><th className="px-10 py-5">Product</th><th className="px-10 py-5 text-center">Remaining</th><th className="px-10 py-5 text-right font-black">Priority</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-red-50/20">
                <td className="px-10 py-5"><p className="font-black mb-1">{item.name}</p><p className="text-[10px] text-slate-400 font-mono">{item.id}</p></td>
                <td className="px-10 py-5 text-center"><span className="px-3 py-1 rounded-lg bg-red-50 text-red-600 font-black text-[10px]">{item.currentStock} {item.unit}</span></td>
                <td className="px-10 py-5 text-right font-black text-red-600 uppercase text-[10px]">Restock Now</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-10 bg-slate-50 border-t flex justify-end">
        <button onClick={onClose} className="px-12 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all hover:bg-black">Dismiss</button>
      </div>
    </div>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);