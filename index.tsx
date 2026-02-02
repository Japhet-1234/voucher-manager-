
/**
 * HOTSPOT MTAANI VOUCHER MANAGER - PRO EDITION
 * A complete system for managing WiFi vouchers, sales, and expirations.
 */

const STORAGE_KEY = 'hotspot_mtaani_v5_final';

interface Voucher {
  id: string;
  code: string;
  bundleName: string;
  duration: number; // in minutes
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
  activeTab: 'home', // home, expired, settings
  selectedBundleId: 'b1',
  batchSize: 10
};

// --- Logic ---

const loadData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      state.vouchers = JSON.parse(data);
    } catch (e) {
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

const deleteVoucher = (id: string) => {
  if (confirm("Je, una uhakika unataka kufuta kabisa?")) {
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
      return { ...v, status: 'expired' as const };
    }
    return v;
  });
  if (changed) {
    saveData();
    render();
  }
};

const getTimeLeft = (expiresAt: number | null) => {
  if (!expiresAt) return "";
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "IMEKWISHA";
  
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
};

// --- UI Rendering ---

const render = () => {
  const root = document.getElementById('main-content');
  if (!root) return;

  // Header Nav active states
  const navIds = ['nav-home', 'nav-expired', 'nav-settings'];
  navIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const isActive = id.includes(state.activeTab);
      el.className = `text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${
        isActive ? 'text-[#5d4037] border-b-2 border-[#5d4037]' : 'text-stone-400 hover:text-stone-600'
      }`;
    }
  });

  if (state.activeTab === 'home') renderHome(root);
  else if (state.activeTab === 'expired') renderExpired(root);
  else renderSettings(root);

  // Sync Print Layout
  const printRoot = document.getElementById('print-layout');
  if (printRoot) {
    const available = state.vouchers.filter(v => v.status === 'available');
    printRoot.innerHTML = `
      <div class="grid grid-cols-4 gap-4 p-4">
        ${available.map(v => `
          <div class="border-2 border-black p-4 text-center rounded flex flex-col items-center justify-center">
            <h1 class="text-[8px] font-black uppercase tracking-widest border-b border-black w-full pb-1 mb-2">HOTSPOT MTAANI</h1>
            <p class="text-xl font-mono font-black tracking-widest my-2">${v.code}</p>
            <div class="bg-black text-white text-[8px] font-black w-full py-1 mb-1 uppercase">${v.bundleName}</div>
            <p class="text-[6px] font-bold mt-1 uppercase tracking-tighter">MTAANI CONNECTIVITY SYSTEM</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  if ((window as any).lucide) (window as any).lucide.createIcons();
};

const renderHome = (container: HTMLElement) => {
  const available = state.vouchers.filter(v => v.status === 'available');
  const active = state.vouchers.filter(v => v.status === 'active');
  const totalSales = state.vouchers.filter(v => v.status !== 'available').reduce((sum, v) => sum + v.price, 0);

  container.innerHTML = `
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm">
        <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Vocha Mpya (Stock)</p>
        <h3 class="text-3xl font-black">${available.length}</h3>
      </div>
      <div class="bg-[#5d4037] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div class="relative z-10">
          <p class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Wateja Waliopo Hewani</p>
          <h3 class="text-3xl font-black">${active.length}</h3>
        </div>
        <i data-lucide="radio" class="absolute -right-4 -bottom-4 w-24 h-24 opacity-10"></i>
      </div>
      <div class="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm">
        <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Jumla Mapato (Tzs)</p>
        <h3 class="text-3xl font-black text-emerald-600">${totalSales.toLocaleString()}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- SIDEBAR: Generator -->
      <aside class="lg:col-span-4">
        <div class="bg-white border border-stone-200 rounded-3xl p-8 sticky top-24 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <i data-lucide="zap" class="w-4 h-4 text-[#8d6e63]"></i> Generator ya Vocha
          </h2>
          
          <div class="space-y-6">
            <div>
              <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Chagua Kifurushi</label>
              <select id="bundle-select" class="w-full bg-stone-50 border border-stone-200 p-4 rounded-xl text-xs font-black outline-none appearance-none">
                ${BUNDLES.map(b => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name} - ${b.price} Tzs</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Idadi ya Vocha: <span class="text-[#8d6e63] font-black" id="batch-val">${state.batchSize}</span></label>
              <input id="batch-range" type="range" min="1" max="50" value="${state.batchSize}" class="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
            </div>

            <button id="btn-create" class="w-full bg-[#8d6e63] hover:bg-[#5d4037] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
              <i data-lucide="plus" class="w-4 h-4"></i> Zalisha Vocha
            </button>
            
            <button onclick="window.print()" class="w-full border border-stone-200 text-stone-500 hover:bg-stone-50 font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              <i data-lucide="printer" class="w-4 h-4"></i> Print Vocha Zote Mpya
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN: Lists -->
      <section class="lg:col-span-8 space-y-8">
        <!-- Active Customers -->
        <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-emerald-50/50 border-b border-stone-100 flex justify-between items-center">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-emerald-800">Wateja Active Hewani (${active.length})</h3>
            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
          <div class="divide-y divide-stone-50">
            ${active.length === 0 ? `
              <div class="p-16 text-center text-stone-300 text-[10px] font-black uppercase tracking-widest">
                Hakuna mteja hewani kwa sasa
              </div>
            ` : active.map(v => `
              <div class="p-5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <i data-lucide="user" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <span class="font-mono font-black text-lg tracking-widest text-stone-800">${v.code}</span>
                    <p class="text-[9px] text-stone-400 font-bold uppercase">${v.bundleName}</p>
                  </div>
                </div>
                <div class="text-right flex items-center gap-6">
                  <div>
                    <p class="text-xs font-black text-[#8d6e63]">${getTimeLeft(v.expiresAt)}</p>
                    <p class="text-[8px] text-stone-300 font-bold uppercase">Inakatika</p>
                  </div>
                  <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-500 p-2">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Available Stock -->
        <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <div class="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-stone-500">Stock ya Vocha Mpya (${available.length})</h3>
            <p class="text-[8px] font-bold text-stone-400 uppercase">Gusa kodi ku-activate</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-stone-50">
            ${available.length === 0 ? `
              <div class="col-span-2 p-16 text-center text-stone-300 text-[10px] font-black uppercase tracking-widest">
                Stock haina kitu. Zalisha kodi mpya.
              </div>
            ` : available.map(v => `
              <div class="p-5 flex items-center justify-between group hover:bg-stone-50">
                <button onclick="window.app.useVoucher('${v.id}', '${v.code}')" class="flex flex-col items-start">
                  <span class="font-mono font-black text-stone-700 text-lg tracking-widest group-hover:text-[#8d6e63] underline decoration-stone-200 decoration-2 underline-offset-4">
                    ${v.code}
                  </span>
                  <span class="text-[9px] text-stone-400 font-black uppercase mt-1">${v.bundleName}</span>
                </button>
                <button onclick="window.app.deleteVoucher('${v.id}')" class="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;

  // Listeners
  document.getElementById('bundle-select')?.addEventListener('change', (e) => {
    state.selectedBundleId = (e.target as HTMLSelectElement).value;
  });
  document.getElementById('batch-range')?.addEventListener('input', (e) => {
    state.batchSize = parseInt((e.target as HTMLInputElement).value);
    const display = document.getElementById('batch-val');
    if (display) display.innerText = state.batchSize.toString();
  });
  document.getElementById('btn-create')?.addEventListener('click', createBatch);
};

const renderExpired = (container: HTMLElement) => {
  const expired = state.vouchers.filter(v => v.status === 'expired');
  container.innerHTML = `
    <div class="max-w-2xl mx-auto bg-white border border-stone-200 rounded-3xl overflow-hidden">
      <div class="px-8 py-6 bg-stone-50 border-b flex justify-between items-center">
        <div>
          <h2 class="text-xs font-black uppercase tracking-widest">Vocha Zilizokwisha Muda</h2>
          <p class="text-[9px] font-bold text-stone-400 uppercase">Ripoti ya matumizi ya wateja</p>
        </div>
        <button onclick="window.app.clearExpired()" class="text-red-500 text-[10px] font-black uppercase flex items-center gap-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Safisha Zote
        </button>
      </div>
      <div class="divide-y divide-stone-50 max-h-[600px] overflow-y-auto">
        ${expired.length === 0 ? `
          <div class="p-20 text-center text-stone-300 text-[10px] font-black uppercase">Hakuna kumbukumbu</div>
        ` : expired.sort((a,b) => (b.expiresAt || 0) - (a.expiresAt || 0)).map(v => `
          <div class="p-5 flex items-center justify-between opacity-60">
            <div>
              <span class="font-mono font-black text-stone-400 line-through tracking-widest">${v.code}</span>
              <p class="text-[8px] font-bold uppercase text-stone-300">${v.bundleName} • Iliisha ${new Date(v.expiresAt!).toLocaleTimeString()}</p>
            </div>
            <span class="text-[8px] font-black text-red-300 border border-red-50 px-2 py-1 rounded-full uppercase">Exp</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

const renderSettings = (container: HTMLElement) => {
  container.innerHTML = `
    <div class="max-w-xl mx-auto bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
      <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <i data-lucide="shield-check" class="w-10 h-10 text-[#5d4037]"></i>
      </div>
      <h2 class="text-xl font-black uppercase tracking-tight mb-2">Mtaani Hotspot v5.0</h2>
      <p class="text-[10px] text-stone-400 uppercase font-black tracking-widest mb-8">System Admin Panel</p>
      
      <div class="space-y-4 text-left">
        <div class="bg-stone-50 p-5 rounded-2xl border border-stone-100">
          <p class="text-[9px] font-black text-stone-400 uppercase mb-1">Hali ya Data</p>
          <p class="text-xs font-bold text-stone-700">Data zinahifadhiwa kwenye Browser yako pekee. Usifute cache/cookies kama unataka kutunza vocha hizi.</p>
        </div>
        <button onclick="if(confirm('Data zote zitafutika. Je una uhakika?')) { localStorage.clear(); location.reload(); }" class="w-full py-4 text-red-500 font-black text-[10px] uppercase border border-red-100 rounded-2xl hover:bg-red-50 transition-all">
          Reset System (Futa Data Zote)
        </button>
      </div>
    </div>
  `;
};

// --- Global App Interface ---

(window as any).app = {
  deleteVoucher,
  useVoucher: (id: string, code: string) => {
    if (confirm(`Unataka kuanzisha muda wa vocha hii (${code}) sasa hivi?`)) {
      navigator.clipboard.writeText(code);
      activateVoucher(id);
    }
  },
  clearExpired: () => {
    state.vouchers = state.vouchers.filter(v => v.status !== 'expired');
    saveData();
    render();
  }
};

// Start
loadData();
render();

// Timers
setInterval(updateExpiries, 5000); // Check expiry every 5 seconds
setInterval(render, 1000); // UI updates every second for live countdowns

// Nav Listeners
document.getElementById('nav-home')?.addEventListener('click', () => { state.activeTab = 'home'; render(); });
document.getElementById('nav-expired')?.addEventListener('click', () => { state.activeTab = 'expired'; render(); });
document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });
