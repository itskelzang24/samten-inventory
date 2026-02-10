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
  LifeBuoy,
  Wifi,
  WifiOff,
  Minus,
  Trash
} from 'lucide-react';

// --- Configuration ---

const DEFAULT_SYNC_URL = "https://script.google.com/macros/s/AKfycbyJQ4PkVvuauaYKX-cqOzUOeYKA_d7Nlhy-FIqxkPAPhfleVQsIFId43SFXdPgjjgdl2g/exec"; 
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

type CartItem = {
  id: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
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

// --- Storage Keys ---
const STORAGE_KEY_USER = 'samten_session_user';
const STORAGE_KEY_ACTIVITY = 'samten_last_activity';
const STORAGE_KEY_API_URL = 'samten_api_url_secure';

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
            <p className="text-slate-500 text-sm font-medium">Inventory V12.1 Multi-Item POS</p>
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
                Global Connector Active
             </p>
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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    if (!stored) return null;
    const lastActive = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    if (!lastActive || (Date.now() - parseInt(lastActive) > IDLE_TIMEOUT)) {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_ACTIVITY);
      return null;
    }
    return JSON.parse(stored);
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdCounter = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(INITIAL_PERMISSIONS);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_API_URL);
    return (stored ? decodeUrl(stored) : '') || DEFAULT_SYNC_URL;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    toastIdCounter.current += 1;
    const currentId = toastIdCounter.current;
    setToasts(prev => [...prev, { id: currentId, message, type }]);
    if (type !== 'info') {
      setTimeout(() => removeToast(currentId), 4000);
    }
    return currentId;
  };

  useEffect(() => {
    if (!currentUser) return;
    const updateActivity = () => localStorage.setItem(STORAGE_KEY_ACTIVITY, Date.now().toString());
    const checkIdle = () => {
      const lastActive = parseInt(localStorage.getItem(STORAGE_KEY_ACTIVITY) || '0');
      if (Date.now() - lastActive > IDLE_TIMEOUT) {
        handleLogout();
        showToast("Session Expired (Idle 5m)", "error");
      }
    };
    updateActivity();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, updateActivity));
    const idleInterval = setInterval(checkIdle, 15000);
    return () => {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
      clearInterval(idleInterval);
    };
  }, [currentUser]);

  const syncData = async () => {
    if (!apiUrl) return;
    setIsSyncing(true);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Sync Failed");
      const data = await response.json();
      if (data.config) {
        const permsRow = data.config.find((row: any[]) => row[0] === 'staff_perms');
        if (permsRow && permsRow[1]) setStaffPermissions(JSON.parse(permsRow[1]));
      }
      if (data.products) {
        setProducts(data.products.slice(1).map((row: any[]) => ({
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
        })));
      }
      if (data.sales) {
        const sales = data.sales.slice(1).map((row: any[], idx: number) => ({
          id: `S-${idx}`, date: row[0], itemId: String(row[1]).trim(), itemName: row[2], qty: parseInt(row[3]) || 0, unitPrice: parseFloat(row[4]) || 0, gstTotal: parseFloat(row[5]) || 0, total: parseFloat(row[6]) || 0, method: row[7], user: row[8], type: 'SALE'
        }));
        const restocks = (data.restocks || []).slice(1).map((row: any[], idx: number) => ({
          id: `R-${idx}`, date: row[0], itemId: String(row[1]).trim(), itemName: row[2], qty: parseInt(row[3]) || 0, unitPrice: parseFloat(row[4]) || 0, total: parseFloat(row[5]) || 0, billNo: row[6], supplier: row[7], user: row[8], type: 'RESTOCK'
        }));
        setTransactions([...sales, ...restocks]);
      }
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
      showToast("Cloud Connection Error", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (apiUrl && currentUser) {
      syncData();
      const interval = setInterval(syncData, 60000);
      return () => clearInterval(interval);
    }
  }, [apiUrl, currentUser]);

  const pushTransaction = async (txData: any, silent: boolean = false) => {
    if (!apiUrl) return false;
    let progressId = 0;
    if(!silent) progressId = showToast("Updating Cloud...", "info");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      await fetch(apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(txData),
        signal: controller.signal
      });
      if(!silent) {
        removeToast(progressId);
        showToast("Success!", "success");
      }
      return true;
    } catch (e: any) {
      console.error(e);
      if(!silent) {
        removeToast(progressId);
        showToast("Sync Error", "error");
      }
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleBulkSale = async (cart: CartItem[], method: string, user: string) => {
    const progressId = showToast(`Processing ${cart.length} items...`, "info");
    let allSuccess = true;

    for (const item of cart) {
      const subtotal = item.qty * item.unitPrice;
      const gstTotal = subtotal * 0.05;
      const grandTotal = subtotal + gstTotal;
      
      const success = await pushTransaction({
        type: 'SALE',
        itemId: item.productId,
        itemName: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        gstTotal,
        total: grandTotal,
        method,
        user
      }, true);

      if (!success) allSuccess = false;
    }

    removeToast(progressId);
    if (allSuccess) {
      showToast("Transaction Completed!", "success");
      syncData();
      return true;
    } else {
      showToast("Partial Transaction Error", "error");
      syncData();
      return false;
    }
  };

  const handleRestock = async (itemId: string, qty: number, cost: number, billNo: string, supplier: string) => {
    const p = products.find(prod => prod.id === itemId);
    if (!p) return false;
    const success = await pushTransaction({ type: 'RESTOCK', itemId, itemName: p.name, qty, unitPrice: cost, total: qty * cost, billNo, supplier, user: currentUser?.name || 'Admin' });
    if (success) syncData();
    return success;
  };

  const handleAddProduct = async (p: Product) => {
    const success = await pushTransaction({ type: 'ADD_PRODUCT', ...p });
    if (success) syncData();
  };

  const handleEditProduct = async (p: Product, originalId: string) => {
    const success = await pushTransaction({ type: 'UPDATE_PRODUCT', ...p, oldId: originalId });
    if (success) syncData();
  };

  const handleUpdateCloudPermissions = async (newPerms: StaffPermissions) => {
    setStaffPermissions(newPerms);
    await pushTransaction({ type: 'UPDATE_CONFIG', key: 'staff_perms', value: JSON.stringify(newPerms) });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_ACTIVITY);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_ACTIVITY, Date.now().toString());
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

  const lowStockItems = products.filter(p => p.currentStock <= p.minStock);
  const totalSales = transactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + t.total, 0);
  const totalRestockCost = transactions.filter(t => t.type === 'RESTOCK').reduce((sum, t) => sum + t.total, 0);
  const grossProfit = totalSales - totalRestockCost - transactions.filter(t => t.type === 'SALE').reduce((sum, t) => sum + (t.gstTotal || 0), 0); 

  if (!currentUser) return <LoginView onLogin={handleLogin} isSyncing={isSyncing} onSync={syncData} onResetUrl={() => { setApiUrl(DEFAULT_SYNC_URL); localStorage.removeItem(STORAGE_KEY_API_URL); handleLogout(); }} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-[100] shadow-md">
        <div className="flex items-center gap-2">
          <Menu className="cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
          <h1 className="text-xl font-bold tracking-tight">Samten</h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">
          <UserCircle size={14} /> {currentUser.name}
        </div>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-[110] backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-[120] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block border-b border-slate-800/50">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Boxes className="text-blue-500" size={24} /> Samten
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Multi-Item POS Ready</p>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Operations</p>
          <NavButton active={activeTab === 'dashboard'} onClick={() => navigate('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" restricted={!isTabAccessible('dashboard')} />
          <NavButton active={activeTab === 'pos'} onClick={() => navigate('pos')} icon={<ShoppingCart size={20} />} label="Point of Sale" restricted={!isTabAccessible('pos')} />
          <NavButton active={activeTab === 'restock'} onClick={() => navigate('restock')} icon={<PackagePlus size={20} />} label="Stock-In" restricted={!isTabAccessible('restock')} />
          <NavButton active={activeTab === 'inventory'} onClick={() => navigate('inventory')} icon={<Boxes size={20} />} label="Inventory" restricted={!isTabAccessible('inventory')} />
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2">Administration</p>
          <NavButton active={activeTab === 'reports'} onClick={() => navigate('reports')} icon={<FileText size={20} />} label="Financials" restricted={!isTabAccessible('reports')} />
          <NavButton active={activeTab === 'setup'} onClick={() => navigate('setup')} icon={<FileCode size={20} />} label="Connector" restricted={!isTabAccessible('setup')} />
          
          {currentUser.role === 'Owner' && <NavButton active={activeTab === 'access'} onClick={() => navigate('access')} icon={<ShieldCheck size={20} />} label="Permissions" />}
        </nav>

        <div className="p-4 m-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-sm uppercase">{currentUser.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{currentUser.name}</p>
              <p className="text-[10px] font-bold uppercase text-slate-500">{currentUser.role}</p>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${lastSync ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{lastSync ? 'Live Sync' : 'Offline'}</span>
             </div>
             {lastSync && <span className="text-[10px] text-slate-600 font-bold">{lastSync.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="hidden md:flex bg-white shadow-sm px-8 py-5 justify-between items-center sticky top-0 z-10 border-b border-slate-100">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab}</h2>
             <span className="h-4 w-[1px] bg-slate-200"></span>
             <p className="text-xs text-slate-400 font-medium tracking-tight">Inventory Terminal V12.1</p>
          </div>
          <div className="flex gap-4">
             {apiUrl === DEFAULT_SYNC_URL && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Global Target Locked</span>}
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto bg-[#F8FAFC]">
          {activeTab === 'dashboard' && <DashboardView lowStockItems={lowStockItems} totalSales={totalSales} grossProfit={grossProfit} transactions={transactions} products={products} onAlertClick={() => setShowLowStockModal(true)} onNavigate={navigate} isTabAccessible={isTabAccessible} currentUser={currentUser} />}
          {activeTab === 'pos' && <POSView products={products} onBulkSale={handleBulkSale} user={currentUser.name} />}
          {activeTab === 'restock' && <RestockView products={products} onRestock={handleRestock} user={currentUser.name} />}
          {activeTab === 'inventory' && <InventoryView products={products} onAdd={handleAddProduct} onEdit={handleEditProduct} />}
          {activeTab === 'reports' && <ReportsView transactions={transactions} />}
          {activeTab === 'setup' && <SetupView onShowToast={showToast} apiUrl={apiUrl} setApiUrl={(url: string) => { setApiUrl(url); localStorage.setItem(STORAGE_KEY_API_URL, encodeUrl(url)); }} onSync={syncData} isSyncing={isSyncing} currentUser={currentUser} />}
          {activeTab === 'access' && <AccessControlView permissions={staffPermissions} onUpdatePermissions={handleUpdateCloudPermissions} onShowToast={showToast} />}
        </main>
      </div>

      {showLowStockModal && <LowStockModal items={lowStockItems} onClose={() => setShowLowStockModal(false)} />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, restricted }: any) => (
  <button onClick={onClick} disabled={restricted} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : restricted ? 'opacity-40 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <div className="flex items-center space-x-3">{icon}<span className="font-bold text-sm tracking-tight">{label}</span></div>
    {restricted && <Lock size={12} className="text-slate-500" />}
  </button>
);

const POSView = ({ products, onBulkSale, user }: any) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({ productId: '', qty: '', unitPrice: '', method: 'Cash' });
  const [productQuery, setProductQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  // Default to false to avoid unexpected print popups on sale completion
  const [autoPrint, setAutoPrint] = useState(false);

  // When a sale completes, automatically open the print dialog once.
  const hasAutoPrintedRef = useRef(false);
  useEffect(() => {
    if (autoPrint && showReceipt && receiptData && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      // Small delay to ensure the modal is rendered before printing.
      setTimeout(() => printReceipt(receiptData), 150);
    }
    if (!showReceipt) {
      hasAutoPrintedRef.current = false;
    }
  }, [autoPrint, showReceipt, receiptData]);

  const selectedProduct = useMemo(() => products.find((p: any) => p.id === formData.productId), [formData.productId, products]);

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !formData.qty) return;
    
    const qty = parseInt(formData.qty);
    if (qty > selectedProduct.currentStock) {
      alert(`Only ${selectedProduct.currentStock} units available in stock!`);
      return;
    }

    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      qty: qty,
      unitPrice: parseFloat(formData.unitPrice),
      total: qty * parseFloat(formData.unitPrice)
    };

    setCart(prev => [...prev, newItem]);
    setFormData({ ...formData, productId: '', qty: '', unitPrice: '' });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = subtotal * 0.05;
  const grandTotal = subtotal + gstAmount;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    const success = await onBulkSale(cart, formData.method, user);
    if (success) {
      // build receipt data from cart
      const receipt = {
        id: `RCPT-${Date.now()}`,
        date: new Date().toISOString(),
        items: cart,
        subtotal,
        gstAmount,
        grandTotal,
        method: formData.method,
        user
      } as any;
      setCart([]);
      setReceiptData(receipt);
      setShowReceipt(true);
      // Do not auto-print here; printing is handled by the auto-print effect
      // or when the user clicks the Print button in the receipt modal.
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Item Selection Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border shadow-sm">
            <h3 className="text-base sm:text-lg font-black mb-6 text-slate-900 flex items-center gap-3">
              <Plus className="text-blue-600" size={20} /> Item Selection
            </h3>
            <form onSubmit={handleAddToCart} className="space-y-4 sm:space-y-5">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Product</label>
                <input
                  type="text"
                  className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all text-sm"
                  placeholder="Type product name..."
                  value={productQuery || (formData.productId ? products.find((p:any)=>p.id===formData.productId)?.name || '' : '')}
                  onChange={e => {
                    setProductQuery(e.target.value);
                    setShowSuggestions(true);
                    // clear productId when typing
                    if (formData.productId) setFormData({ ...formData, productId: '', unitPrice: '' });
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  required
                />
                {showSuggestions && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {products.filter((p: any) => p.status === 'Active' && p.currentStock > 0 && p.name.toLowerCase().includes((productQuery || '').toLowerCase())).slice(0, 20).map((p: any) => (
                      <div key={p.id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer" onMouseDown={(ev) => { ev.preventDefault(); setFormData({ ...formData, productId: p.id, unitPrice: p.sellingPrice }); setProductQuery(p.name); setShowSuggestions(false); }}>
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-[11px] text-slate-500">Stk: {p.currentStock}</div>
                        </div>
                        <div className="text-[12px] text-slate-400">{formatCurrency(p.sellingPrice)}</div>
                      </div>
                    ))}
                    {products.filter((p: any) => p.status === 'Active' && p.currentStock > 0 && p.name.toLowerCase().includes((productQuery || '').toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-slate-400 text-sm">No matching products</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</label>
                  <input 
                    type="number" min="1" required
                    className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm"
                    placeholder="0"
                    value={formData.qty}
                    onChange={e => setFormData({ ...formData, qty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate (Nu.)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-sm"
                    placeholder="0.00"
                    value={formData.unitPrice}
                    onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 sm:py-4 bg-slate-900 text-white font-black rounded-xl sm:rounded-2xl uppercase tracking-widest text-[10px] sm:text-xs hover:bg-blue-600 shadow-lg active:scale-95 transition-all">
                 Add to Item List
              </button>
            </form>
          </div>
        </div>

        {/* Cart and Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col min-h-[300px] sm:min-h-[400px]">
            <div className="px-6 py-5 sm:px-10 sm:py-8 border-b bg-slate-50/50 flex justify-between items-center">
               <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-3">
                  <ListChecks className="text-blue-600" size={20} /> Current Bill
               </h3>
               <span className="bg-blue-600 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] font-black">{cart.length} Items</span>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
                <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 sm:px-10 sm:py-5">Item</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-5 text-center">Qty</th>
                    <th className="px-4 py-3 sm:px-10 sm:py-5 text-right">Total</th>
                    <th className="px-4 py-3 sm:px-10 sm:py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cart.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 sm:px-10 sm:py-5">
                        <p className="font-black text-slate-900 text-sm">{item.name}</p>
                        <p className="text-[10px] text-slate-400">@{formatCurrency(item.unitPrice)}</p>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-5 text-center font-bold text-slate-600">{item.qty}</td>
                      <td className="px-4 py-3 sm:px-10 sm:py-5 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-3 sm:px-10 sm:py-5 text-center">
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-300 italic">
                        <ShoppingCart size={40} className="mx-auto mb-4 opacity-10" />
                        Empty cart.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {cart.length > 0 && (
              <div className="p-4 sm:p-6 bg-slate-50 border-t space-y-1.5">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-black text-blue-600 px-1 uppercase tracking-widest">
                    <span>GST (5%)</span>
                    <span>+ {formatCurrency(gstAmount)}</span>
                 </div>
              </div>
            )}
          </div>

          {/* Compact Payment & Final Summary Card */}
          <div className="bg-slate-900 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
                   <div>
                      <h4 className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Payment Mode</h4>
                      <div className="flex gap-2">
                         <button onClick={() => setFormData({...formData, method: 'Cash'})} className={`flex-1 flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-lg border transition-all ${formData.method === 'Cash' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
                            <Banknote size={16} /> <span className="text-[8px] font-black uppercase">Cash</span>
                         </button>
                         <button onClick={() => setFormData({...formData, method: 'QR/Transfer'})} className={`flex-1 flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-lg border transition-all ${formData.method === 'QR/Transfer' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 opacity-50'}`}>
                            <QrCode size={16} /> <span className="text-[8px] font-black uppercase">QR Pay</span>
                         </button>
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-300 select-none">
                        <input
                          type="checkbox"
                          className="accent-blue-500"
                          checked={autoPrint}
                          onChange={(e) => setAutoPrint(e.target.checked)}
                        />
                        Auto-open print after sale
                      </label>
                   </div>
                   <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-0.5">Grand Total</p>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(grandTotal)}</h2>
                   </div>
                </div>
                <button 
                  disabled={cart.length === 0 || isProcessing}
                  onClick={handleCompleteSale}
                  className={`w-full mt-5 sm:mt-6 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.2rem] font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-2xl transition-all ${cart.length > 0 ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  {isProcessing ? 'Processing...' : `Complete Sale (${cart.length})`}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText size={18} className="text-blue-600" />
                <div>
                  <p className="text-xs font-black text-slate-900">Receipt Ready</p>
                  <p className="text-[10px] font-bold text-slate-500">{receiptData.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-500"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              {/* Simple on-screen preview (thermal-friendly) */}
              <div className="border rounded-2xl p-4 bg-white">
                <div className="text-center">
                  <p className="font-black text-slate-900">Samten Tshongkhang</p>
                  <p className="text-[10px] font-bold text-slate-500">{new Date(receiptData.date).toLocaleString()}</p>
                </div>
                <div className="border-t my-3" />
                <div className="space-y-2">
                  {receiptData.items.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-xs">
                      <div className="pr-2">
                        <p className="font-bold text-slate-900 leading-4">{it.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{it.qty} x {formatCurrency(it.unitPrice)}</p>
                      </div>
                      <div className="font-black text-slate-900">{formatCurrency(it.total)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t my-3" />
                <div className="space-y-1 text-[11px] font-bold">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="text-slate-900">{formatCurrency(receiptData.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">GST (5%)</span><span className="text-slate-900">{formatCurrency(receiptData.gstAmount)}</span></div>
                  <div className="flex justify-between text-sm font-black pt-1"><span>Total</span><span>{formatCurrency(receiptData.grandTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Paid By</span><span className="text-slate-900">{receiptData.method}</span></div>
                </div>
                <div className="border-t my-3" />
                <p className="text-center text-[10px] font-bold text-slate-500">Thank you</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => printReceipt(receiptData)}
                  className="py-3 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="py-3 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
              <p className="mt-3 text-[10px] text-slate-500 font-bold">
                Note: The browser print dialog will use the PC’s default printer. Set your thermal printer as default for one-click printing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Receipt print helper: open a minimal window and invoke print
const printReceipt = (receipt: any) => {
  try {
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    const styles = `
      <style>
        body { font-family: monospace; padding: 8px; font-size: 12px; }
        .center { text-align: center; }
        .line { margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
        @media print { @page { size: 72mm; margin: 4mm; } }
      </style>
    `;
    const itemsHtml = receipt.items.map((it: any) => `<tr><td>${it.name} (${it.qty}x)</td><td style="text-align:right">${formatCurrency(it.total)}</td></tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title>${styles}</head><body><div class="center"><h2>Samten Tshongkhang</h2><div class="line">Receipt #: ${receipt.id}</div><div class="line">${new Date(receipt.date).toLocaleString()}</div></div><hr/> <table>${itemsHtml}</table><hr/><div style="display:flex;justify-content:space-between;font-weight:bold"><div>Subtotal</div><div>${formatCurrency(receipt.subtotal)}</div></div><div style="display:flex;justify-content:space-between"><div>GST</div><div>${formatCurrency(receipt.gstAmount)}</div></div><div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:8px"><div>Total</div><div>${formatCurrency(receipt.grandTotal)}</div></div><div class="center line">Thank you</div></body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); /* optional: win.close(); */ }, 500);
  } catch (e) {
    console.error('Print failed', e);
  }
};

const RestockTypeahead = ({ products, formData, setFormData }: any) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const displayValue = query || (formData.id ? products.find((p: any) => p.id === formData.id)?.name || '' : '');

  return (
    <div className="relative">
      <input type="text" value={displayValue} onChange={e => { setQuery(e.target.value); setShowSuggestions(true); if (formData.id) setFormData({ ...formData, id: '', cost: '', supplier: '' }); }} onFocus={() => setShowSuggestions(true)} placeholder="Type product name or SKU..." className="w-full p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl font-bold outline-none text-sm" required />
      {showSuggestions && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {products.filter((p: any) => (query === '' || p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()))).slice(0, 30).map((p: any) => (
            <div key={p.id} className="px-3 py-2 hover:bg-slate-50 cursor-pointer" onMouseDown={(ev) => { ev.preventDefault(); setFormData({ ...formData, id: p.id, cost: p.costPrice || '', supplier: p.supplier || '' }); setQuery(p.name); setShowSuggestions(false); }}>
              <div className="flex justify-between items-center"><div className="font-bold text-sm">{p.name}</div><div className="text-[11px] text-slate-500">{p.id}</div></div>
              <div className="text-[12px] text-slate-400">{formatCurrency(p.costPrice)}</div>
            </div>
          ))}
          {products.filter((p: any) => (query === '' || p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()))).length === 0 && (
            <div className="px-3 py-2 text-slate-400 text-sm">No matching products</div>
          )}
        </div>
      )}
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
      <div className={`grid grid-cols-1 ${isOwner ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-4 sm:gap-6`}>
        {isOwner && (
          <>
            <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Revenue</p><h3 className="text-xl sm:text-2xl font-black">{formatCurrency(totalSales)}</h3></div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-xl sm:rounded-2xl text-green-600"><TrendingUp size={20} /></div>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
              <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Net Profit</p><h3 className="text-xl sm:text-2xl font-black">{formatCurrency(grossProfit)}</h3></div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-xl sm:rounded-2xl text-blue-600"><PieChart size={20} /></div>
            </div>
          </>
        )}
        <button onClick={onAlertClick} className="bg-white p-5 sm:p-6 rounded-[1.5rem] border border-red-50 flex items-center justify-between shadow-sm hover:bg-red-50 transition-colors text-left w-full">
          <div><p className="text-[10px] font-black text-red-400 uppercase mb-1">Stock Alerts</p><h3 className="text-xl sm:text-2xl font-black text-red-600">{lowStockItems.length} Issues</h3></div>
          <div className="p-2 sm:p-3 bg-red-50 rounded-xl sm:rounded-2xl text-red-600"><AlertTriangle size={20} /></div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border shadow-sm">
          <div className="flex justify-between items-center mb-8 sm:mb-10">
            <div><h4 className="font-black text-sm uppercase flex items-center gap-2"><BarChart3 size={16} className="text-blue-600" /> Sales Mix</h4></div>
          </div>
          <div className="space-y-5 sm:space-y-6">
            {categorySales.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase mb-2"><span className="text-slate-500">{cat}</span><span className="text-slate-900">{formatCurrency(val)}</span></div>
                <div className="h-2 sm:h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${(val / maxVal) * 100}%` }}></div></div>
              </div>
            ))}
            {categorySales.length === 0 && <p className="text-center py-12 text-slate-300 italic text-xs">No transactions recorded yet.</p>}
          </div>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border shadow-sm">
             <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase mb-6 flex items-center gap-2"><Rocket size={16} className="text-blue-600" /> Shortcuts</h4>
             <div className="space-y-2 sm:space-y-3">
                {isTabAccessible('pos') && <ActionButton icon={<ShoppingCart size={18}/>} label="POS Terminal" onClick={() => onNavigate('pos')} color="blue" />}
                {isTabAccessible('restock') && <ActionButton icon={<PackagePlus size={18}/>} label="Stock Replenish" onClick={() => onNavigate('restock')} color="blue" />}
                {isTabAccessible('inventory') && <ActionButton icon={<Boxes size={18}/>} label="Manage Goods" onClick={() => onNavigate('inventory')} color="slate" />}
             </div>
          </div>
          <div className="bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-white">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Database Health</h4>
            <div className="flex items-end gap-3 mb-2"><h2 className="text-3xl sm:text-4xl font-black">{products.length}</h2><span className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">SKUs Linked</span></div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed">Automatic multi-device synchronization active via Google Cloud Fabric.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick, color }: any) => (
  <button onClick={onClick} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 w-full rounded-xl sm:rounded-2xl border border-slate-100 hover:shadow-md transition-all group text-left">
    <div className={`p-2 rounded-lg sm:rounded-xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'} group-hover:scale-110 transition-transform`}>{icon}</div>
    <span className="font-bold text-slate-700 text-xs sm:text-sm flex-1">{label}</span>
    <ChevronRight size={14} className="text-slate-300" />
  </button>
);

const RestockView = ({ products, onRestock, user }: any) => {
  const [formData, setFormData] = useState({ id: '', qty: '', cost: '', billNo: '', supplier: '', user: user });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.qty) return;
    const success = await onRestock(formData.id, parseInt(formData.qty), parseFloat(formData.cost), formData.billNo, formData.supplier);
    if (success) setFormData({ id: '', qty: '', cost: '', billNo: '', supplier: '', user: user });
  };
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border">
      <h3 className="text-lg sm:text-xl font-black mb-6 sm:mb-8 flex items-center gap-3"><div className="p-2 bg-blue-600 text-white rounded-xl"><PackagePlus size={22} /></div> Inbound Goods</h3>
      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select SKU</label>
              <RestockTypeahead products={products} formData={formData} setFormData={setFormData} />
            </div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Quantity</label><input type="number" min="1" className="w-full p-3 sm:p-4 bg-slate-50 border rounded-xl sm:rounded-2xl font-bold outline-none text-sm" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} placeholder="0" /></div>
          <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Unit Cost</label><input type="number" step="0.01" className="w-full p-3 sm:p-4 bg-slate-50 border rounded-xl sm:rounded-2xl font-bold outline-none text-sm" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" /></div>
          <div className="sm:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Invoice/Bill</label><input className="w-full p-3 sm:p-4 bg-slate-50 border rounded-xl sm:rounded-2xl font-bold outline-none text-sm" placeholder="ID#" value={formData.billNo} onChange={e => setFormData({...formData, billNo: e.target.value})} /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Supplier</label><input className="w-full p-3 sm:p-4 bg-slate-50 border rounded-xl sm:rounded-2xl font-bold outline-none text-sm" placeholder="Vendor" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} /></div>
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"><Save size={18} /> Record Stock-In</button>
      </form>
    </div>
  );
};

const InventoryView = ({ products, onAdd, onEdit }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ id: '', name: '', category: 'General', unit: 'Pcs', costPrice: '', sellingPrice: '', currentStock: '', minStock: '5', supplier: '', status: 'Active' });
  const categories = useMemo(() => Array.from(new Set(products.map((p: any) => String(p.category || 'General').trim()))).sort(), [products]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [localCategories, setLocalCategories] = useState<string[]>(categories);

  // Export current inventory to CSV (Excel-compatible)
  const exportInventory = () => {
    if (!products || products.length === 0) {
      alert('No products to export');
      return;
    }
    const headers = ['SKU','Name','Category','Unit','Cost Price','Selling Price','Current Stock','Min Stock','Supplier','Status'];
    const data = products.map((p: Product) => ({
      'SKU': p.id,
      'Name': p.name,
      'Category': p.category,
      'Unit': p.unit,
      'Cost Price': p.costPrice,
      'Selling Price': p.sellingPrice,
      'Current Stock': `${p.currentStock} ${p.unit}`,
      'Min Stock': p.minStock,
      'Supplier': p.supplier || '',
      'Status': p.status || ''
    }));
    downloadCSV(data, 'inventory', headers);
  };

  // Keep localCategories in sync with upstream categories but preserve any user-added ones
  useEffect(() => {
    setLocalCategories(prev => Array.from(new Set([...prev, ...categories])));
  }, [categories]);

  // Set form when editing
  useEffect(() => {
    if (editItem) setFormData({ ...editItem });
  }, [editItem]);

  // Initialize form when starting to add. Do NOT reset when categories change to avoid clearing user input.
  useEffect(() => {
    if (isAdding) {
      setFormData({ id: '', name: '', category: categories[0] || 'General', unit: 'Pcs', costPrice: '', sellingPrice: '', currentStock: '', minStock: '5', supplier: '', status: 'Active' });
      setShowNewCategory(false);
      setNewCategory('');
    }
  }, [isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) onEdit({...formData}, editItem.id);
    else onAdd({...formData});
    setEditItem(null); setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase">Product Registry</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={exportInventory} className="hidden sm:inline-flex bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold text-[10px] uppercase hover:bg-slate-50 transition-all"><Download size={16} /> Export to Excel</button>
          <button onClick={() => { setEditItem(null); setIsAdding(true); }} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-black shadow-lg text-[10px] uppercase hover:bg-black transition-all"><Plus size={18} /> New Item</button>
        </div>
      </div>
      {(isAdding || editItem) && (
        <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border shadow-xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 sm:mb-8"><h4 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2"><Layers className="text-blue-600" /> {editItem ? 'Update Profile' : 'New Goods Entry'}</h4><button onClick={() => { setIsAdding(false); setEditItem(null); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button></div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">SKU/ID</label><input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} /></div>
              <div className="sm:col-span-1 lg:col-span-2"><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Name</label><input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Category</label>
                {!showNewCategory ? (
                  <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none text-sm" value={formData.category} onChange={e => {
                    if (e.target.value === '__add_new__') { setShowNewCategory(true); setFormData({...formData, category: ''}); }
                    else setFormData({...formData, category: e.target.value});
                  }}>
                    {localCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    <option value="__add_new__">+ Add new category...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none text-sm" placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                    <button type="button" onClick={() => { const v = newCategory.trim(); if (v) { setFormData({...formData, category: v}); setShowNewCategory(false); setNewCategory(''); setLocalCategories(prev => Array.from(new Set([v, ...prev]))); } }} className="px-3 py-2 bg-blue-600 text-white rounded-xl font-black text-sm">Add</button>
                  </div>
                )}
              </div>
              <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Unit</label><input className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
              <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Purchase Nu.</label><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} /></div>
              <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Retail Nu.</label><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} /></div>
              <div className="col-span-1"><label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Stock</label><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} /></div>
              <div className="col-span-1"><label className="block text-[10px) font-black text-slate-400 mb-1 uppercase tracking-widest">Alert Threshold</label><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} /></div>
            </div>
            <div className="pt-6 sm:pt-8 border-t flex flex-col sm:flex-row justify-end gap-3"><button type="button" onClick={() => { setIsAdding(false); setEditItem(null); }} className="px-8 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest order-2 sm:order-1">Cancel</button><button type="submit" className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl sm:rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl order-1 sm:order-2">Confirm Registry</button></div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
            <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
              <tr><th className="px-6 py-4 sm:px-8 sm:py-5">SKU</th><th className="px-6 py-4 sm:px-8 sm:py-5">Item</th><th className="px-6 py-4 sm:px-8 sm:py-5">Category</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right">Price</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-center">In Stock</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-center">Modify</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p: Product) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 sm:px-8 sm:py-5 font-mono text-[10px] text-slate-400">{p.id}</td>
                  <td className="px-6 py-4 sm:px-8 sm:py-5 font-black text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 sm:px-8 sm:py-5 font-bold text-slate-500 text-[10px] uppercase">{p.category}</td>
                  <td className="px-6 py-4 sm:px-8 sm:py-5 text-right font-black text-slate-900">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-4 sm:px-8 sm:py-5 text-center"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${p.currentStock <= p.minStock ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700'}`}>{p.currentStock} {p.unit}</span></td>
                  <td className="px-6 py-4 sm:px-8 sm:py-5 text-center"><button className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition-all" onClick={() => setEditItem(p)}><Pencil size={14} /></button></td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={6} className="py-20 text-center text-slate-300 italic">Inventory is empty.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportsView = ({ transactions }: { transactions: Transaction[] }) => {
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  // Date filters for Transaction Audit
  const todayISO = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(todayISO);
  const [toDate, setToDate] = useState<string>(todayISO);
  const reportData = useMemo(() => {
    const grouped: any = {};
    transactions.forEach((t: Transaction) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      let key = period === 'daily' ? d.toISOString().split('T')[0] : period === 'monthly' ? `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}` : `${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = { period: key, sales: 0, expense: 0, tax: 0, net: 0 };
      if (t.type === 'SALE') { grouped[key].sales += t.total; grouped[key].tax += (t.gstTotal || 0); } else { grouped[key].expense += t.total; }
      grouped[key].net = (grouped[key].sales - grouped[key].tax) - grouped[key].expense;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.period.localeCompare(a.period));
  }, [transactions, period]);

  const salesHistory = useMemo(() => {
    // default filter: only today's transactions (fromDate..toDate)
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T23:59:59');
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        return d >= start && d <= end && t.type === 'SALE';
      })
      .map(t => ({ date: new Date(t.date).toLocaleString(), item: t.itemName, qty: t.qty, rate: t.unitPrice, tax: t.gstTotal || 0, total: t.total, user: t.user, method: t.method || 'Cash' }))
      .reverse();
  }, [transactions, fromDate, toDate]);

  const handleExportSummary = () => {
    downloadCSV(reportData.map((r: any) => ({ 'Period': r.period, 'Revenue': r.sales, 'Expenses': r.expense, 'GST': r.tax, 'Profit': r.net })), `Financials_${period}`, ['Period', 'Revenue', 'Expenses', 'GST', 'Profit']);
  };

  const handleExportAudit = () => {
    if (!salesHistory || salesHistory.length === 0) return;
    // Export without the Staff column as requested
    const rows = salesHistory.map(s => ({ Timestamp: s.date, Product: s.item, Qty: s.qty, Rate: s.rate, GST: s.tax, Total: s.total, Method: s.method }));
    downloadCSV(rows, `TransactionAudit_${fromDate}_to_${toDate}`, ['Timestamp', 'Product', 'Qty', 'Rate', 'GST', 'Total', 'Method']);
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 text-white rounded-xl"><Calculator size={20} /></div><div><h3 className="text-lg sm:text-xl font-black uppercase">Profit & Loss</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Performance</p></div></div>
          <div className="flex gap-2 w-full sm:w-auto"><div className="flex bg-slate-200/50 p-1 rounded-xl sm:rounded-2xl flex-1 sm:flex-initial">
              {['daily', 'monthly', 'yearly'].map(p => (<button key={p} onClick={() => setPeriod(p as any)} className={`flex-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{p}</button>))}
            </div><button onClick={handleExportSummary} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black shadow-md transition-colors"><FileDown size={18} /></button></div>
        </div>
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
                <tr><th className="px-6 py-4 sm:px-8 sm:py-5">Timeline</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right">Revenue</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right text-blue-500">GST</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right text-red-500">Cost</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right font-black">Net Profit</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportData.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 sm:px-8 sm:py-5 font-black text-slate-900">{r.period}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-right text-slate-600">{formatCurrency(r.sales)}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-right text-blue-500 font-bold">{formatCurrency(r.tax)}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-right text-red-500 font-bold">{formatCurrency(r.expense)}</td>
                    <td className={`px-6 py-4 sm:px-8 sm:py-5 text-right font-black ${r.net >= 0 ? 'text-green-600' : 'text-red-700'}`}>{formatCurrency(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 text-white rounded-xl"><History size={20} /></div><div><h3 className="text-lg sm:text-xl font-black uppercase">Transaction Audit</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Full History</p></div></div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="p-2 rounded-md border text-sm" />
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="p-2 rounded-md border text-sm" />
            <button onClick={() => { setFromDate(todayISO); setToDate(todayISO); }} className="px-3 py-2 bg-slate-100 rounded-md text-xs font-black">Today</button>
            <button onClick={handleExportAudit} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black shadow-md ml-2"><FileDown size={16} /></button>
          </div>
        </div>
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50">
                <tr><th className="px-6 py-4 sm:px-8 sm:py-5">Timestamp</th><th className="px-6 py-4 sm:px-8 sm:py-5">Product</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-center">Qty</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right">Rate</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right">GST</th><th className="px-6 py-4 sm:px-8 sm:py-5 text-right font-black">Total</th><th className="px-6 py-4 sm:px-8 sm:py-5">Staff</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salesHistory.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 sm:px-8 sm:py-5 font-mono text-[10px] text-slate-400">{s.date}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 font-bold text-slate-900">{s.item}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-center font-bold">{s.qty}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-right text-slate-500">{formatCurrency(s.rate)}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-right text-slate-500">{formatCurrency(s.tax)}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-right font-black text-slate-900">{formatCurrency(s.total)}</td>
                    <td className="px-6 py-4 sm:px-8 sm:py-5 text-[10px] font-bold text-slate-500 uppercase">{s.user}</td>
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

const SetupView = ({ onShowToast, apiUrl, setApiUrl, onSync, isSyncing, currentUser }: any) => {
  const [showUrl, setShowUrl] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [pendingUrl, setPendingUrl] = useState(apiUrl);
  const confirmUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordConfirm.trim() === currentUser.password.trim()) {
      setApiUrl(pendingUrl); setIsVerifying(false); setPasswordConfirm(''); onShowToast("Target URL Updated."); setTimeout(onSync, 500);
    } else { onShowToast("Wrong Password", "error"); }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-20">
      <div className="bg-slate-900 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-5 text-left">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-xl ring-4 ring-blue-600/20"><ShieldCheck size={28} /></div>
            <div><h3 className="text-xl sm:text-2xl font-black text-white">System Connector</h3><p className="text-slate-400 font-medium text-xs sm:text-sm">Cloud Database Target</p></div>
          </div>
          <div className="bg-slate-800/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-sm flex-1 lg:max-w-md">
            <div className="relative mb-3"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type={showUrl ? "text" : "password"} className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-900 border border-slate-700 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono text-slate-300 outline-none" value={pendingUrl} onChange={(e) => setPendingUrl(e.target.value)} />
              <button onClick={() => setShowUrl(!showUrl)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">{showUrl ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
            </div>
            <button onClick={() => setIsVerifying(true)} className="w-full py-2.5 sm:py-3 bg-white text-slate-900 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Save size={14} /> Override Link</button>
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-8 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[1.5rem] sm:rounded-[2rem] text-blue-900">
         <h4 className="font-black mb-2 flex items-center gap-2 text-xs sm:text-sm"><Info size={16} /> Persistent Logic Active</h4>
         <p className="text-[10px] sm:text-xs leading-relaxed font-medium">Session state persists across browser refreshes. Idle logout set to 5 minutes for security. Multi-item cart functionality now processes each entry individually to ensure accurate stock records.</p>
      </div>
      {isVerifying && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-6"><ShieldAlert size={24} /></div>
             <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-1 sm:mb-2">Auth Required</h4><p className="text-xs sm:text-sm text-slate-500 mb-6">Enter password to apply system-wide changes.</p>
             <form onSubmit={confirmUpdate} className="space-y-3 sm:space-y-4">
                <input autoFocus type="password" placeholder="Password" required className="w-full p-3 sm:p-4 bg-slate-50 border rounded-xl sm:rounded-2xl text-sm font-bold outline-none" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
                <div className="flex gap-2 sm:gap-3"><button type="button" onClick={() => setIsVerifying(false)} className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 font-black rounded-xl sm:rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button><button type="submit" className="flex-[2] py-3 sm:py-4 bg-slate-900 text-white font-black rounded-xl sm:rounded-2xl text-[10px] uppercase shadow-lg active:scale-95">Confirm</button></div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AccessControlView = ({ permissions, onUpdatePermissions, onShowToast }: any) => {
  const handleToggle = (key: keyof StaffPermissions) => { onUpdatePermissions({ ...permissions, [key]: !permissions[key] }); onShowToast(`Access Policy Updated.`); };
  return (
    <div className="max-w-xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-top-4">
      <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border shadow-sm"><h3 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 flex items-center gap-3"><ShieldCheck className="text-blue-600" /> Staff Access Policy</h3><p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 leading-relaxed">Toggle module visibility for 'Service Staff' role. Changes are stored in the cloud instantly.</p>
        <div className="space-y-3 sm:space-y-4">
          {Object.keys(permissions).map((module) => (
            <div key={module} className="flex items-center justify-between p-4 sm:p-5 border rounded-xl sm:rounded-2xl hover:bg-slate-50 transition-all">
              <div><span className="text-xs sm:text-sm font-black text-slate-700 capitalize">{module} Module</span><p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1">Permission Active</p></div>
              <button onClick={() => handleToggle(module as keyof StaffPermissions)} className={`relative inline-flex h-6 sm:h-8 w-11 sm:w-14 items-center rounded-full transition-colors ${permissions[module] ? 'bg-blue-600' : 'bg-slate-200'}`}><span className={`inline-block h-4 sm:h-6 w-4 sm:w-6 transform rounded-full bg-white transition-transform shadow-md ${permissions[module] ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`} /></button>
            </div>))}
        </div>
      </div>
    </div>
  );
};

const LowStockModal = ({ items, onClose }: any) => (
  <div className="fixed inset-0 bg-slate-900/60 z-[300] backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-2xl rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border animate-in zoom-in-95"><div className="px-6 py-5 sm:px-10 sm:py-8 border-b flex justify-between items-center bg-slate-50"><div className="flex items-center gap-3 sm:gap-4"><div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center"><AlertTriangle size={24} /></div><div><h3 className="text-lg sm:text-xl font-black text-slate-900">Health Alerts</h3><p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Safety Threshold Violations</p></div></div><button onClick={onClose} className="p-2 sm:p-3 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button></div>
      <div className="p-0 max-h-[50vh] overflow-y-auto">
        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap"><thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 sticky top-0 z-10"><tr><th className="px-6 py-4 sm:px-10 sm:py-5">Product</th><th className="px-6 py-4 sm:px-10 sm:py-5 text-center">Remaining</th><th className="px-6 py-4 sm:px-10 sm:py-5 text-right font-black">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item: Product) => (<tr key={item.id} className="hover:bg-red-50/20"><td className="px-6 py-4 sm:px-10 sm:py-5"><p className="font-black mb-1">{item.name}</p><p className="text-[9px] text-slate-400 font-mono">{item.id}</p></td><td className="px-6 py-4 sm:px-10 sm:py-5 text-center"><span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-red-50 text-red-600 font-black text-[9px] sm:text-[10px]">{item.currentStock} {item.unit}</span></td><td className="px-6 py-4 sm:px-10 sm:py-5 text-right font-black text-red-600 uppercase text-[9px] sm:text-[10px]">Restock Target</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className="p-6 sm:p-10 bg-slate-50 border-t flex justify-end"><button onClick={onClose} className="w-full sm:w-auto px-12 py-3 sm:py-4 bg-slate-900 text-white font-black rounded-xl sm:rounded-2xl uppercase tracking-widest text-[10px] sm:text-xs hover:bg-black transition-colors shadow-xl">Dismiss</button></div>
    </div>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);