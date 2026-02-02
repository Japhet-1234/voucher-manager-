
/**
 * HOTSPOT MTAANI VOUCHER MANAGER - VERSION 5.1
 * FIXED: Mobile white screen & data parsing issues.
 */

const STORAGE_KEY = 'hotspot_mtaani_v5_final';

// Interfaces
interface Voucher {
  id: string;
  code: string;
  bundleName: string;
  duration: number;
  price: number;
  status: 'available' | 'active' | 'expired';
  createdAt: number;
  activatedAt: number | null;
  expiresAt: number | null;
}

const BUNDLES = [
  { id: 'b1', name: 'SAA 1 (High Speed)', price: 200, minutes: 60 },
  { id: 'b2', name: 'SAA 6 UNLIMITED', price: 500, minutes: 360 },
  { id: 'b3', name: 'SAA 24 UNLIMITED', price: 1000, minutes: 1440 },
  { id: 'b4', name: 'WIKI 1 UNLIMITED', price: 5000, minutes: 10080 }
];

let state = {
  vouchers: [] as Voucher[],
  activeTab: 'home',
  selectedBundleId: 'b1',
  batchSize: 10
};

// --- Error Reporting for Mobile Debugging ---
// Fixed: Renamed reportError to displaySystemError to avoid conflict with browser global reportError
const displaySystemError = (msg: string) => {
  const root = document.getElementById('main-content');
  if (root) {
    root.innerHTML = `
      <div class="p-8 bg-red-50 border-2 border-red-100 rounded-3xl text-center">
        <h2 class="text-red-600 font-black uppercase text-xs mb-2">Kuna Tatizo la Kiufundi</h2>
        <p class="text-[10px] text-red-400 font-bold mb-4">${msg}</p>
        <button onclick="localStorage.clear(); location.reload();" class="bg-red-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase">Futa Data na Anza Upya</button>
      </div>
    `;
  }
};

// --- Core Engine ---
const loadData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      state.vouchers = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Data load failed", e);
    state.vouchers = [];
  }
};

const saveData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vouchers));
  } catch (e) {
    alert("Storage imejaa! Futa vocha zilizokwisha.");
  }
};

const generateCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 4; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return `HM-${res}`;
};

const createBatch = () => {
  const bundle = BUNDLES.find(b => b.id === state.selectedBundleId);
  if (!bundle) return;

  const newItems: Voucher[] = [];
  for (let i = 0; i < state.batchSize; i++) {
    newItems.push({
      id: Math.random().toString(36).substr(2, 9),
      code: generateCode(),
      bundleName: bundle.name,
      duration: bundle.minutes,
      price: bundle.price,
      status: 'available',
      createdAt: Date.now(),
      activatedAt: null,
      expiresAt: null
    });
  }
  state.vouchers = [...state.vouchers, ...newItems];
  saveData();
  render();
};

const activateVoucher = (id: string) => {
  state.vouchers = state.vouchers.map(v => {
    if (v.id === id) {
      const now = Date.now();
      return {
        ...v,
        status: 'active' as const,
        activatedAt: now,
        expiresAt: now + (v.duration * 60000)
      };
    }
    return v;
  });
  saveData();
  render();
};

const getTimeLeft = (expiresAt: number | null) => {
  if (!expiresAt) return "";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "IMEKWISHA";
  
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  
  return h > 0 ? `${h}h ${m}m left` : `${m}m ${s}s left`;
};

// --- Rendering Engine ---
const render = () => {
  const root = document.getElementById('main-content');
  if (!root) return;

  try {
    // Update Nav UI
    ['nav-home', 'nav-expired', 'nav-settings'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const isActive = id.includes(state.activeTab);
        el.className = `text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${
          isActive ? 'text-[#5d4037] border-b-2 border-[#5d4037]' : 'text-stone-400'
        }`;
      }
    });

    if (state.activeTab === 'home') renderHome(root);
    else if (state.activeTab === 'expired') renderExpired(root);
    else renderSettings(root);

    // Lucide Icons
    if ((window as any).lucide) (window as any).lucide.createIcons();
  } catch (e: any) {
    // Use renamed displaySystemError function
    displaySystemError(e.message);
  }
};

const renderHome = (container: HTMLElement) => {
  const available = state.vouchers.filter(v => v.status === 'available');
  const active = state.vouchers.filter(v => v.status === 'active');
  const totalSales = state.vouchers.filter(v => v.status !== 'available').reduce((sum, v) => sum + (v.price || 0), 0);

  container.innerHTML = `
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
        <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Stock</p>
        <h3 class="text-2xl font-black">${available.length}</h3>
      </div>
      <div class="bg-[#5d4037] text-white p-5 rounded-2xl shadow-lg">
        <p class="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">Active</p>
        <h3 class="text-2xl font-black">${active.length}</h3>
      </div>
      <div class="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
        <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Mapato (Tzs)</p>
        <h3 class="text-2xl font-black text-emerald-600">${totalSales.toLocaleString()}</h3>
      </div>
    </div>

    <!-- Generator -->
    <div class="bg-white border border-stone-200 rounded-2xl p-6 mb-8 shadow-sm">
       <h2 class="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
         <i data-lucide="zap" class="w-3.5 h-3.5 text-[#8d6e63]"></i> Zalisha Vocha
       </h2>
       <div class="grid grid-cols-1 gap-4">
          <select id="bundle-select" class="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs font-black outline-none">
            ${BUNDLES.map(b => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name} - ${b.price} Tzs</option>`).join('')}
          </select>
          <div class="flex items-center gap-4">
             <input id="batch-range" type="range" min="1" max="50" value="${state.batchSize}" class="flex-grow h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
             <span class="text-xs font-black text-[#8d6e63] min-w-[20px]" id="batch-val">${state.batchSize}</span>
          </div>
          <button id="btn-create" class="bg-[#8d6e63] text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-md active:scale-95">Zalisha Kodi</button>
       </div>
    </div>

    <!-- Active List -->
    <div class="mb-8">
      <h3 class="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3 ml-2">Wateja Waliopo Hewani</h3>
      <div class="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-50">
        ${active.length === 0 ? '<p class="p-8 text-center text-stone-300 text-[9px] font-bold uppercase">Hakuna mteja active</p>' : 
          active.map(v => `
            <div class="p-4 flex items-center justify-between">
              <div>
                <p class="font-mono font-black text-stone-800 tracking-widest text-base">${v.code}</p>
                <p class="text-[8px] text-stone-400 font-bold uppercase">${v.bundleName}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-black text-[#8d6e63]">${getTimeLeft(v.expiresAt)}</p>
                <p class="text-[7px] text-stone-300 font-black uppercase">Muda unabaki</p>
              </div>
            </div>
          `).join('')}
      </div>
    </div>

    <!-- Stock List -->
    <div>
      <h3 class="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3 ml-2">Stock ya Vocha Mpya</h3>
      <div class="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-50">
        ${available.length === 0 ? '<p class="p-8 text-center text-stone-300 text-[9px] font-bold uppercase">Zalisha vocha hapo juu</p>' : 
          available.map(v => `
            <div class="p-4 flex items-center justify-between group">
              <button onclick="window.app.useVoucher('${v.id}', '${v.code}')" class="text-left">
                <p class="font-mono font-black text-stone-600 tracking-widest text-base group-active:text-[#8d6e63]">${v.code}</p>
                <p class="text-[8px] text-stone-300 font-bold uppercase">${v.bundleName}</p>
              </button>
              <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-500 p-2">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('')}
      </div>
    </div>
  `;

  // Listeners
  document.getElementById('bundle-select')?.addEventListener('change', (e) => state.selectedBundleId = (e.target as HTMLSelectElement).value);
  document.getElementById('batch-range')?.addEventListener('input', (e) => {
    state.batchSize = parseInt((e.target as HTMLInputElement).value);
    const v = document.getElementById('batch-val'); if(v) v.innerText = state.batchSize.toString();
  });
  document.getElementById('btn-create')?.addEventListener('click', createBatch);
};

const renderExpired = (container: HTMLElement) => {
  const expired = state.vouchers.filter(v => v.status === 'expired');
  container.innerHTML = `
    <div class="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div class="p-4 bg-stone-50 border-b flex justify-between items-center">
        <h2 class="text-[10px] font-black uppercase">Zilizokwisha</h2>
        <button onclick="window.app.clearExpired()" class="text-red-500 text-[9px] font-black uppercase">Safisha</button>
      </div>
      <div class="divide-y divide-stone-50 max-h-[400px] overflow-y-auto">
        ${expired.length === 0 ? '<p class="p-10 text-center text-stone-300 text-[9px] uppercase font-bold">Hakuna rekodi</p>' : 
          expired.map(v => `<div class="p-4 flex justify-between items-center opacity-50">
            <span class="font-mono text-sm font-black line-through">${v.code}</span>
            <span class="text-[7px] font-black uppercase text-stone-400">${v.bundleName}</span>
          </div>`).join('')}
      </div>
    </div>
  `;
};

const renderSettings = (container: HTMLElement) => {
  container.innerHTML = `
    <div class="bg-white border border-stone-200 rounded-2xl p-8 text-center">
      <h2 class="text-lg font-black uppercase mb-4">Mfumo</h2>
      <p class="text-[10px] text-stone-400 font-bold uppercase leading-relaxed mb-8">Data zote zipo kwenye browser hii pekee. Usifute Cookies za browser yako.</p>
      <button onclick="if(confirm('Futa kila kitu?')){localStorage.clear();location.reload();}" class="w-full bg-red-50 text-red-500 py-4 rounded-xl text-[10px] font-black uppercase border border-red-100">Factory Reset</button>
    </div>
  `;
};

// --- Global API ---
(window as any).app = {
  deleteVoucher: (id: string) => { if(confirm("Futa?")){ state.vouchers = state.vouchers.filter(v => v.id !== id); saveData(); render(); }},
  useVoucher: (id: string, code: string) => {
    if(confirm(`Anzisha muda wa ${code}?`)){
      navigator.clipboard.writeText(code).catch(() => {});
      activateVoucher(id);
    }
  },
  clearExpired: () => { state.vouchers = state.vouchers.filter(v => v.status !== 'expired'); saveData(); render(); }
};

// --- Initialization ---
loadData();
render();
setInterval(() => {
  const now = Date.now();
  let changed = false;
  state.vouchers = state.vouchers.map(v => {
    if (v.status === 'active' && v.expiresAt && now > v.expiresAt) { changed = true; return { ...v, status: 'expired' as const }; }
    return v;
  });
  if (changed) saveData();
  render();
}, 2000);

// Nav Events
document.getElementById('nav-home')?.addEventListener('click', () => { state.activeTab = 'home'; render(); });
document.getElementById('nav-expired')?.addEventListener('click', () => { state.activeTab = 'expired'; render(); });
document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });
