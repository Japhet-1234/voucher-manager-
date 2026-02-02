
/**
 * HOTSPOT MTAANI VOUCHER MANAGER - VERSION 5.0
 * Professional System for Managing Hotspot Vouchers and Expiries.
 */

const STORAGE_KEY = 'hotspot_mtaani_pro_v5';

// Configuration for Bundles (Duration in minutes)
const BUNDLES = [
  { id: 'b1', name: 'SAA 6 UNLIMITED', price: 500, minutes: 360 },
  { id: 'b2', name: 'SAA 24 UNLIMITED', price: 1000, minutes: 1440 },
  { id: 'b3', name: 'SIKU 3 UNLIMITED', price: 2000, minutes: 4320 },
  { id: 'b4', name: 'WIKI 1 UNLIMITED', price: 5000, minutes: 10080 }
];

let state = {
  vouchers: [],
  activeTab: 'home', // home, expired, settings
  selectedBundleId: 'b1',
  batchSize: 10
};

// --- Core Logic ---

const loadData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      state.vouchers = JSON.parse(data);
    } catch (e) {
      console.error("Data corruption detected, resetting storage.");
      state.vouchers = [];
    }
  }
};

const saveData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vouchers));
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

  const newItems = [];
  for (let i = 0; i < state.batchSize; i++) {
    newItems.push({
      id: Math.random().toString(36).substr(2, 9),
      code: generateCode(),
      bundleId: bundle.id,
      bundleName: bundle.name,
      duration: bundle.minutes,
      price: bundle.price,
      status: 'available', // available, active, expired
      createdAt: Date.now(),
      activatedAt: null,
      expiresAt: null
    });
  }
  state.vouchers = [...state.vouchers, ...newItems];
  saveData();
  render();
};

const activateVoucher = (id) => {
  state.vouchers = state.vouchers.map(v => {
    if (v.id === id) {
      const now = Date.now();
      return {
        ...v,
        status: 'active',
        activatedAt: now,
        expiresAt: now + (v.duration * 60000)
      };
    }
    return v;
  });
  saveData();
  render();
};

const deleteVoucher = (id) => {
  if (confirm("Je, una uhakika unataka kufuta vocha hii?")) {
    state.vouchers = state.vouchers.filter(v => v.id !== id);
    saveData();
    render();
  }
};

const updateExpiries = () => {
  const now = Date.now();
  let changed = false;
  state.vouchers = state.vouchers.map(v => {
    if (v.status === 'active' && v.expiresAt && now > v.expiresAt) {
      changed = true;
      return { ...v, status: 'expired' };
    }
    return v;
  });
  if (changed) {
    saveData();
    render();
  }
};

// --- UI Logic ---

const getTimeLeft = (expiresAt) => {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "IMEKWISHA";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
};

const render = () => {
  const root = document.getElementById('main-content');
  const printRoot = document.getElementById('print-layout');
  if (!root || !printRoot) return;

  // Header Nav active states
  const navItems = {
    'nav-home': 'home',
    'nav-expired': 'expired',
    'nav-settings': 'settings'
  };
  
  Object.keys(navItems).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (state.activeTab === navItems[id]) {
        el.className = "text-[10px] font-black uppercase tracking-widest text-[#5d4037] border-b-2 border-[#5d4037] pb-1";
      } else {
        el.className = "text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-all pb-1";
      }
    }
  });

  if (state.activeTab === 'home') {
    renderHome(root);
  } else if (state.activeTab === 'expired') {
    renderExpired(root);
  } else {
    renderSettings(root);
  }

  renderPrintLayout(printRoot);

  // Re-init lucide icons
  // Fixed: Cast window to any to access globally defined 'lucide' library
  if ((window as any).lucide) {
    (window as any).lucide.createIcons();
  }
};

const renderHome = (container) => {
  const available = state.vouchers.filter(v => v.status === 'available');
  const active = state.vouchers.filter(v => v.status === 'active');
  const totalSales = state.vouchers.filter(v => v.status !== 'available').reduce((acc, v) => acc + (v.price || 0), 0);

  container.innerHTML = `
    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
        <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Vocha Mpya</p>
        <h3 class="text-3xl font-black">${available.length}</h3>
      </div>
      <div class="bg-[#5d4037] text-white p-6 rounded-2xl shadow-lg">
        <p class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Wateja Active</p>
        <h3 class="text-3xl font-black">${active.length}</h3>
      </div>
      <div class="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
        <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Jumla Mapato (Tzs)</p>
        <h3 class="text-3xl font-black text-emerald-600">${totalSales.toLocaleString()}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- LEFT: Generator Tool -->
      <aside class="lg:col-span-4">
        <div class="bg-white border border-stone-200 rounded-3xl p-8 sticky top-24 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <i data-lucide="zap" class="w-4 h-4 text-[#8d6e63]"></i> Jenereta ya Vocha
          </h2>
          
          <div class="space-y-6">
            <div>
              <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Chagua Kifurushi</label>
              <select id="bundle-select" class="w-full bg-stone-50 border border-stone-200 p-4 rounded-xl text-xs font-black outline-none focus:ring-2 ring-[#8d6e63]/20 appearance-none">
                ${BUNDLES.map(b => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name} - ${b.price} Tzs</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Idadi: <span class="text-[#8d6e63] font-black" id="batch-count-display">${state.batchSize}</span></label>
              <input id="batch-range" type="range" min="1" max="50" value="${state.batchSize}" class="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
              <div class="flex justify-between text-[8px] font-bold text-stone-300 mt-2">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            <button id="btn-create" class="w-full bg-[#8d6e63] hover:bg-[#7a5e54] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Zalisha Vocha
            </button>
          </div>

          <div class="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-3">
             <button onclick="window.print()" class="w-full flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition text-[10px] font-bold uppercase tracking-widest">
                Print Vocha Mpya <i data-lucide="printer" class="w-4 h-4"></i>
             </button>
          </div>
        </div>
      </aside>

      <!-- RIGHT: Management Lists -->
      <section class="lg:col-span-8 space-y-8">
        <!-- Active Vouchers -->
        <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-[#5d4037]">Wateja Waliopo Hewani (${active.length})</h3>
            <i data-lucide="radio" class="w-4 h-4 text-emerald-500 animate-pulse"></i>
          </div>
          <div class="divide-y divide-stone-50">
            ${active.length === 0 ? `
              <div class="p-16 text-center space-y-3">
                <i data-lucide="users" class="w-8 h-8 text-stone-200 mx-auto"></i>
                <p class="text-stone-300 text-[10px] font-bold uppercase tracking-widest">Hakuna mteja active kwa sasa</p>
              </div>
            ` : active.map(v => `
              <div class="p-5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div>
                    <span class="font-mono font-black text-lg tracking-[0.2em] text-stone-800">${v.code}</span>
                    <p class="text-[9px] text-stone-400 font-bold uppercase mt-0.5">${v.bundleName}</p>
                  </div>
                </div>
                <div class="flex items-center gap-6">
                  <div class="text-right">
                    <p class="text-[11px] font-black text-[#8d6e63] countdown-pulse tracking-tight">${getTimeLeft(v.expiresAt)}</p>
                    <p class="text-[8px] text-stone-300 font-bold uppercase">Muda Unaoisha</p>
                  </div>
                  <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-500 transition-all p-2 bg-stone-50 rounded-lg">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Available Vouchers -->
        <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-stone-400">Stock ya Vocha Mpya (${available.length})</h3>
            <span class="text-[8px] font-black text-[#8d6e63] bg-[#8d6e63]/10 px-2 py-1 rounded uppercase tracking-tighter">Bofya kodi kutumia</span>
          </div>
          <div class="max-h-[500px] overflow-y-auto divide-y divide-stone-50">
            ${available.length === 0 ? `
              <div class="p-16 text-center space-y-3">
                <i data-lucide="database" class="w-8 h-8 text-stone-200 mx-auto"></i>
                <p class="text-stone-300 text-[10px] font-bold uppercase tracking-widest">Stock ipo tupu. Zalisha hapo kando.</p>
              </div>
            ` : available.map(v => `
              <div class="p-5 flex items-center justify-between group hover:bg-stone-50 transition-all">
                <button onclick="window.app.copyAndActivate('${v.id}', '${v.code}')" class="flex flex-col items-start">
                  <span class="font-mono font-black text-stone-700 text-lg tracking-[0.2em] group-hover:text-[#8d6e63] transition-colors underline decoration-stone-200 decoration-2 underline-offset-4 group-hover:decoration-[#8d6e63]">
                    ${v.code}
                  </span>
                  <span class="text-[9px] text-stone-400 font-black uppercase mt-1 tracking-tight">${v.bundleName}</span>
                </button>
                <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-500 transition-all p-2 bg-stone-50 rounded-lg opacity-0 group-hover:opacity-100">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;

  // Attach dynamic event listeners after innerHTML update
  // Fixed: Cast e.target to HTMLSelectElement to access 'value' property
  document.getElementById('bundle-select')?.addEventListener('change', (e) => {
    state.selectedBundleId = (e.target as HTMLSelectElement).value;
  });
  
  // Fixed: Cast e.target to HTMLInputElement to access 'value' property
  document.getElementById('batch-range')?.addEventListener('input', (e) => {
    state.batchSize = parseInt((e.target as HTMLInputElement).value);
    const display = document.getElementById('batch-count-display');
    // Fixed: Convert number to string for innerText property assignment
    if (display) display.innerText = state.batchSize.toString();
  });

  document.getElementById('btn-create')?.addEventListener('click', createBatch);
};

const renderExpired = (container) => {
  const expired = state.vouchers.filter(v => v.status === 'expired');
  container.innerHTML = `
    <div class="max-w-2xl mx-auto bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
      <div class="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
        <div>
          <h2 class="text-sm font-black uppercase tracking-widest">Vocha Zilizokwisha</h2>
          <p class="text-[10px] font-bold text-stone-400 uppercase mt-0.5">Kumbukumbu ya mauzo yako</p>
        </div>
        <button onclick="window.app.clearAllExpired()" class="text-red-500 text-[10px] font-black uppercase border border-red-100 px-5 py-2.5 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Safisha Zote
        </button>
      </div>
      <div class="divide-y divide-stone-50 max-h-[600px] overflow-y-auto">
        ${expired.length === 0 ? `
          <div class="p-24 text-center space-y-4">
             <i data-lucide="clock" class="w-12 h-12 text-stone-100 mx-auto"></i>
             <p class="text-stone-300 text-[10px] font-bold uppercase tracking-widest">Hakuna vocha zilizokwisha muda bado</p>
          </div>
        ` : expired.sort((a,b) => b.expiresAt - a.expiresAt).map(v => `
          <div class="px-8 py-5 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                 <i data-lucide="x" class="w-3.5 h-3.5 text-stone-400"></i>
              </div>
              <div>
                <span class="font-mono font-black text-stone-400 line-through tracking-widest text-base">${v.code}</span>
                <p class="text-[9px] text-stone-300 font-bold uppercase">${v.bundleName} • Aliitumia ${new Date(v.activatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[8px] font-black text-stone-400 border border-stone-200 px-3 py-1.5 rounded-full uppercase">Muda umeisha</span>
              <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-400 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

const renderSettings = (container) => {
  container.innerHTML = `
    <div class="max-w-xl mx-auto bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-sm">
      <div class="bg-[#5d4037]/5 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
        <i data-lucide="shield-check" class="w-12 h-12 text-[#5d4037]"></i>
      </div>
      <h2 class="text-2xl font-black uppercase tracking-tight mb-4">Mfumo wa Hotspot Mtaani</h2>
      <p class="text-xs text-stone-400 mb-10 leading-relaxed font-bold uppercase tracking-tight max-w-sm mx-auto">
        Hii ni panel ya usimamizi wa vocha. Kila vocha inayozalishwa hapa inaweza kutumika moja kwa moja kwenye Login Page yako.
      </p>
      
      <div class="space-y-4">
        <div class="bg-stone-50 border border-stone-100 p-6 rounded-2xl text-left">
          <p class="text-[9px] font-black text-stone-400 uppercase mb-2">Prefix ya Vocha</p>
          <p class="font-mono text-lg font-black text-[#8d6e63]">HM-</p>
        </div>
        
        <div class="bg-stone-50 border border-stone-100 p-6 rounded-2xl text-left">
          <p class="text-[9px] font-black text-stone-400 uppercase mb-2">Uhifadhi wa Data</p>
          <p class="text-[11px] font-bold text-stone-800 uppercase">Data zinahifadhiwa kwenye Browser yako (Local Storage). Kufuta 'Cookies' kutafuta vocha zote.</p>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-stone-100">
        <button onclick="if(confirm('HII ITAFUTA DATA ZOTE ZA MAUZO NA VOCHA! Una uhakika?')) { localStorage.clear(); location.reload(); }" 
          class="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-2xl border border-red-50 transition-all active:scale-95">
          Factory Reset (Futa Kila Kitu)
        </button>
      </div>
    </div>
  `;
};

const renderPrintLayout = (container) => {
  const available = state.vouchers.filter(v => v.status === 'available');
  container.innerHTML = `
    <div class="grid grid-cols-4 gap-4">
      ${available.map(v => `
        <div class="voucher-grid-item p-4 border-2 border-black flex flex-col items-center justify-center text-center rounded">
          <h1 class="text-[8px] font-black uppercase tracking-widest border-b border-black w-full pb-1 mb-2">HOTSPOT MTAANI</h1>
          <p class="text-[18px] font-mono font-black tracking-[0.2em] my-2">${v.code}</p>
          <div class="bg-black text-white text-[8px] font-black w-full py-1 mb-1 uppercase">${v.bundleName}</div>
          <p class="text-[6px] font-bold mt-1 uppercase">MTAANI CONNECTIVITY SYSTEM</p>
        </div>
      `).join('')}
    </div>
  `;
};

// --- Initialization & Global Exposure ---

// Fixed: Cast window to any to attach 'app' property to the global scope
(window as any).app = {
  deleteVoucher,
  clearAllExpired: () => {
    if (confirm("Futa kumbukumbu zote za vocha zilizokwisha?")) {
      state.vouchers = state.vouchers.filter(v => v.status !== 'expired');
      saveData();
      render();
    }
  },
  copyAndActivate: (id, code) => {
    navigator.clipboard.writeText(code).then(() => {
      if (confirm(`KODI IMEBAKIWA: ${code}\n\nUnataka kuianzishia muda sasa hivi kwa ajili ya mteja?`)) {
        activateVoucher(id);
      }
    }).catch(err => {
      console.error('Copy failed', err);
      activateVoucher(id);
    });
  }
};

// Start
loadData();
render();

// Timers
setInterval(updateExpiries, 60000); // Check every minute
setInterval(render, 30000); // Refresh UI every 30s to update countdowns

// Global Nav Listeners
document.getElementById('nav-home')?.addEventListener('click', () => { state.activeTab = 'home'; render(); });
document.getElementById('nav-expired')?.addEventListener('click', () => { state.activeTab = 'expired'; render(); });
document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });
