import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, 
  Ticket, 
  Printer, 
  Trash2, 
  Zap, 
  Wifi, 
  Settings, 
  X, 
  Search,
  CheckCircle2,
  Clock,
  Copy
} from 'lucide-react';

// --- Types & Interfaces ---

interface Bundle {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  description: string;
}

interface Voucher {
  id: string;
  code: string;
  bundleId: string;
  bundleName: string;
  createdAt: number;
  status: 'Available' | 'Active' | 'Used' | 'Expired';
  activatedAt?: number;
  expiresAt?: number;
}

const STORAGE_KEY_VOUCHERS = 'hotspot_mtaani_vouchers_v3';
const STORAGE_KEY_BUNDLES = 'hotspot_mtaani_bundles_v3';

const DEFAULT_BUNDLES: Bundle[] = [
  { id: '1', name: '6 HOURS UNLIMITED', duration: 360, price: 500, description: 'Unlimited' },
  { id: '2', name: '24 HOURS UNLIMITED', duration: 1440, price: 1000, description: 'Unlimited' },
  { id: '3', name: '3 DAYS UNLIMITED', duration: 4320, price: 2000, description: 'Unlimited' },
  { id: '4', name: '7 DAYS UNLIMITED', duration: 10080, price: 5000, description: 'Unlimited' },
];

// --- App Component ---

const App = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [batchCount, setBatchCount] = useState(10);
  const [selectedBundleId, setSelectedBundleId] = useState('1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedV = localStorage.getItem(STORAGE_KEY_VOUCHERS);
    const savedB = localStorage.getItem(STORAGE_KEY_BUNDLES);
    if (savedV) setVouchers(JSON.parse(savedV));
    setBundles(savedB ? JSON.parse(savedB) : DEFAULT_BUNDLES);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(bundles));
  }, [bundles]);

  const stats = useMemo(() => ({
    available: vouchers.filter(v => v.status === 'Available').length,
    active: vouchers.filter(v => v.status === 'Active').length,
    revenue: vouchers.reduce((acc, v) => {
      const b = bundles.find(bn => bn.id === v.bundleId);
      return v.status !== 'Available' ? acc + (b?.price || 0) : acc;
    }, 0)
  }), [vouchers, bundles]);

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    // Generate a 4-character random part
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Prepend 'HM-' prefix for Hotspot Mtaani Identity
    return `HM-${randomPart}`;
  };

  const createBatch = () => {
    const bundle = bundles.find(b => b.id === selectedBundleId);
    if (!bundle) return;
    const news: Voucher[] = Array.from({ length: batchCount }, () => ({
      id: crypto.randomUUID(),
      code: generateVoucherCode(),
      bundleId: bundle.id,
      bundleName: bundle.name,
      createdAt: Date.now(),
      status: 'Available'
    }));
    setVouchers(prev => [...prev, ...news]);
  };

  const handleVoucherClick = async (voucher: Voucher) => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopiedId(voucher.id);
      
      // Mark as used if it was available
      if (voucher.status === 'Available') {
        setVouchers(prev => prev.map(v => 
          v.id === voucher.id ? { ...v, status: 'Used' } : v
        ));
      }

      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const deleteVoucher = (id: string) => setVouchers(v => v.filter(i => i.id !== id));
  
  const clearUsed = () => {
    if (confirm("Futa vocha zilizotumika/expired?")) {
      setVouchers(v => v.filter(i => i.status === 'Available' || i.status === 'Active'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] text-stone-900 font-sans p-4 md:p-8">
      {/* Mini Header */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8 no-print border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-[#5d4037] p-1.5 rounded text-white"><Wifi size={18}/></div>
          <h1 className="font-black text-sm uppercase tracking-tighter">Hotspot Mtaani <span className="text-stone-400 font-normal">Admin Portal</span></h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('main')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'main' ? 'text-[#5d4037]' : 'text-stone-400'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('settings')} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'settings' ? 'text-[#5d4037]' : 'text-stone-400'}`}>Mipangilio</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6 no-print">
        {activeTab === 'main' ? (
          <>
            {/* 1. Active Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-stone-200 p-4 rounded-lg">
                <p className="text-[9px] font-black text-stone-400 uppercase">Vocha Zilizopo</p>
                <p className="text-2xl font-black text-stone-800">{stats.available}</p>
              </div>
              <div className="bg-white border border-stone-200 p-4 rounded-lg">
                <p className="text-[9px] font-black text-stone-400 uppercase">Inatumika</p>
                <p className="text-2xl font-black text-[#8d6e63]">{stats.active}</p>
              </div>
              <div className="bg-white border border-stone-200 p-4 rounded-lg">
                <p className="text-[9px] font-black text-stone-400 uppercase">Mapato (Tzs)</p>
                <p className="text-2xl font-black text-stone-800">{stats.revenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 2. Voucher Engine */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[#3d2b1f] text-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-[#8d6e63]"/> Voucher Engine
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Chagua Kifurushi</label>
                      <select 
                        value={selectedBundleId} 
                        onChange={(e) => setSelectedBundleId(e.target.value)}
                        className="w-full bg-[#2d1f16] border border-stone-800 p-2 text-xs rounded font-bold outline-none"
                      >
                        {bundles.map(b => <option key={b.id} value={b.id}>{b.name} - {b.price} Tzs</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-stone-400 uppercase">Idadi ({batchCount})</label>
                      <input 
                        type="range" min="1" max="50" value={batchCount} 
                        onChange={(e) => setBatchCount(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]"
                      />
                    </div>
                    <button 
                      onClick={createBatch}
                      className="w-full bg-[#8d6e63] hover:bg-[#5d4037] text-white font-black py-3 rounded text-[10px] uppercase tracking-widest transition-colors mt-2"
                    >
                      Zalisha Vocha Sasa
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-xl space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Quick Actions</h3>
                  <button onClick={() => window.print()} className="w-full text-left p-3 text-xs font-bold border border-stone-100 rounded hover:bg-stone-50 transition flex items-center justify-between">
                    <span>Print Available</span>
                    <Printer size={14}/>
                  </button>
                  <button onClick={clearUsed} className="w-full text-left p-3 text-xs font-bold border border-stone-100 rounded hover:bg-stone-50 transition flex items-center justify-between text-red-500">
                    <span>Futa Zilizotumika</span>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              {/* 3. Quick Logs */}
              <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Kumbukumbu (Logs)</h3>
                  <span className="text-[9px] font-bold text-stone-400">{vouchers.length} Jumla</span>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-white sticky top-0 border-b border-stone-100">
                      <tr>
                        <th className="px-4 py-3 font-black uppercase tracking-tighter text-stone-400">Kodi (Bofya kunakili)</th>
                        <th className="px-4 py-3 font-black uppercase tracking-tighter text-stone-400">Kifurushi</th>
                        <th className="px-4 py-3 font-black uppercase tracking-tighter text-stone-400">Hali</th>
                        <th className="px-4 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {vouchers.slice().reverse().map(v => (
                        <tr key={v.id} className="hover:bg-stone-50/50 group">
                          <td 
                            onClick={() => handleVoucherClick(v)}
                            className="px-4 py-3 font-mono font-black text-stone-800 tracking-widest cursor-pointer relative"
                          >
                            <span className="group-hover:underline">{v.code}</span>
                            {copiedId === v.id && (
                              <span className="absolute left-1/2 -top-2 -translate-x-1/2 bg-stone-800 text-white text-[8px] px-1 rounded animate-bounce">COPIED!</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-stone-500 uppercase">{v.bundleName}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                              v.status === 'Available' ? 'bg-stone-100 text-stone-600' :
                              v.status === 'Active' ? 'bg-[#5d4037] text-white' : 
                              v.status === 'Used' ? 'bg-stone-200 text-stone-400 line-through' :
                              'text-stone-300'
                            }`}>
                              {v.status === 'Available' ? 'Ipo' : v.status === 'Used' ? 'Tayari' : v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteVoucher(v.id)} className="text-stone-300 hover:text-red-500 transition">
                              <Trash2 size={12}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {vouchers.length === 0 && (
                        <tr><td colSpan={4} className="p-10 text-center text-stone-300 font-bold italic uppercase text-[10px]">Log haina data kwa sasa</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-stone-200 p-8 rounded-xl max-w-lg mx-auto">
            <h2 className="text-lg font-black uppercase tracking-tight mb-6">Mfumo wa Vocha</h2>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase mb-2">Seva ya Mikrotik</p>
                <div className="p-3 bg-stone-50 border border-stone-100 rounded text-[11px] font-mono text-stone-600">
                  https://japhet-1234.github.io/hotspotmtaani/
                </div>
              </div>
              <div className="pt-6 border-t border-stone-100">
                <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }}
                  className="text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-100 px-4 py-2 rounded hover:bg-red-50 transition"
                >
                  Factory Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printer Component (Pure Minimalist) */}
      <div className="print-only p-4 font-mono">
        <div className="grid grid-cols-3 gap-2">
          {vouchers.filter(v => v.status === 'Available').map(v => (
            <div key={v.id} className="border border-stone-800 p-4 text-center rounded">
              <p className="text-[8px] font-bold border-b border-stone-200 mb-2 uppercase">Mtaani Hotspot Identity</p>
              <h4 className="text-xl font-black tracking-widest">{v.code}</h4>
              <p className="text-[7px] text-stone-500 mt-1 uppercase">{v.bundleName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}