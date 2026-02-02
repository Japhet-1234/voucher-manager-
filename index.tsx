// Fix: Declare lucide as a global constant to resolve "Cannot find name 'lucide'"
declare const lucide: any;

// --- State Management ---
const STORAGE_KEY_VOUCHERS = 'hotspot_mtaani_vouchers_v3';
const STORAGE_KEY_BUNDLES = 'hotspot_mtaani_bundles_v3';

const DEFAULT_BUNDLES = [
  { id: '1', name: '6 HOURS UNLIMITED', duration: 360, price: 500 },
  { id: '2', name: '24 HOURS UNLIMITED', duration: 1440, price: 1000 },
  { id: '3', name: '3 DAYS UNLIMITED', duration: 4320, price: 2000 },
  { id: '4', name: '7 DAYS UNLIMITED', duration: 10080, price: 5000 },
];

let state = {
  vouchers: JSON.parse(localStorage.getItem(STORAGE_KEY_VOUCHERS) || '[]'),
  bundles: JSON.parse(localStorage.getItem(STORAGE_KEY_BUNDLES) || JSON.stringify(DEFAULT_BUNDLES)),
  activeTab: 'main',
  batchCount: 10,
  selectedBundleId: '1',
  copiedId: null as string | null
};

// --- Helpers ---
const saveState = () => {
  localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(state.vouchers));
  localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(state.bundles));
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateVoucherCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HM-${randomPart}`;
};

// --- Actions ---
const createBatch = () => {
  const bundle = state.bundles.find((b: any) => b.id === state.selectedBundleId);
  if (!bundle) return;
  
  const news = Array.from({ length: state.batchCount }, () => ({
    id: generateId(),
    code: generateVoucherCode(),
    bundleId: bundle.id,
    bundleName: bundle.name,
    createdAt: Date.now(),
    status: 'Available'
  }));

  state.vouchers = [...state.vouchers, ...news];
  saveState();
  render();
};

const deleteVoucher = (id: string) => {
  state.vouchers = state.vouchers.filter((v: any) => v.id !== id);
  saveState();
  render();
};

const clearUsed = () => {
  if (confirm("Je, una uhakika wa kufuta vocha zilizotumika?")) {
    state.vouchers = state.vouchers.filter((v: any) => v.status === 'Available' || v.status === 'Active');
    saveState();
    render();
  }
};

const handleVoucherClick = async (id: string, code: string, currentStatus: string) => {
  try {
    await navigator.clipboard.writeText(code);
    state.copiedId = id;
    
    if (currentStatus === 'Available') {
      state.vouchers = state.vouchers.map((v: any) => 
        v.id === id ? { ...v, status: 'Used' } : v
      );
    }
    
    saveState();
    render();
    setTimeout(() => {
      state.copiedId = null;
      render();
    }, 1500);
  } catch (err) {
    console.error('Copy failed', err);
  }
};

// --- Render Engine ---
const render = () => {
  const root = document.getElementById('content-root');
  const printRoot = document.getElementById('print-root');
  if (!root || !printRoot) return;

  // Calculate Stats
  const available = state.vouchers.filter((v: any) => v.status === 'Available').length;
  const active = state.vouchers.filter((v: any) => v.status === 'Active').length;
  const revenue = state.vouchers.reduce((acc: number, v: any) => {
    const b = state.bundles.find((bn: any) => bn.id === v.bundleId);
    return v.status !== 'Available' ? acc + (b?.price || 0) : acc;
  }, 0);

  // Update Nav Styling
  const navDashboard = document.getElementById('nav-dashboard');
  if (navDashboard) navDashboard.className = `text-[10px] font-black uppercase tracking-widest ${state.activeTab === 'main' ? 'text-[#5d4037]' : 'text-stone-400 hover:text-stone-600'}`;
  
  const navSettings = document.getElementById('nav-settings');
  if (navSettings) navSettings.className = `text-[10px] font-black uppercase tracking-widest ${state.activeTab === 'settings' ? 'text-[#5d4037]' : 'text-stone-400 hover:text-stone-600'}`;

  if (state.activeTab === 'main') {
    root.innerHTML = `
      <!-- 1. Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border border-stone-200 p-4 rounded-lg shadow-sm">
          <p class="text-[9px] font-black text-stone-400 uppercase">Zilizopo</p>
          <p class="text-2xl font-black text-stone-800">${available}</p>
        </div>
        <div class="bg-white border border-stone-200 p-4 rounded-lg shadow-sm">
          <p class="text-[9px] font-black text-stone-400 uppercase">Inatumika</p>
          <p class="text-2xl font-black text-[#8d6e63]">${active}</p>
        </div>
        <div class="bg-white border border-stone-200 p-4 rounded-lg shadow-sm">
          <p class="text-[9px] font-black text-stone-400 uppercase">Mapato (Tzs)</p>
          <p class="text-2xl font-black text-stone-800">${revenue.toLocaleString()}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- 2. Engine -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-[#3d2b1f] text-white p-6 rounded-xl shadow-lg border border-[#2d1f16]">
            <h3 class="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <i data-lucide="zap" class="w-3 h-3 text-[#8d6e63]"></i> Voucher Engine
            </h3>
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-stone-400 uppercase">Kifurushi</label>
                <select id="bundle-select" class="w-full bg-[#2d1f16] border border-stone-800 p-2.5 text-xs rounded font-bold outline-none focus:border-[#8d6e63] transition-colors">
                  ${state.bundles.map((b: any) => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[9px] font-bold text-stone-400 uppercase">Idadi: <span id="batch-count-display">${state.batchCount}</span></label>
                <input id="batch-slider" type="range" min="1" max="50" value="${state.batchCount}" class="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
              </div>
              <button id="btn-generate" class="w-full bg-[#8d6e63] hover:bg-[#a18276] text-white font-black py-4 rounded text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98]">
                Zalisha Sasa
              </button>
            </div>
          </div>

          <div class="bg-white border border-stone-200 p-4 rounded-xl space-y-2 shadow-sm">
            <h3 class="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Shughuli Haraka</h3>
            <button onclick="window.print()" class="w-full text-left p-3 text-xs font-bold border border-stone-50 rounded hover:bg-stone-50 transition flex items-center justify-between">
              <span>Print Vocha</span>
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            </button>
            <button id="btn-clear" class="w-full text-left p-3 text-xs font-bold border border-stone-50 rounded hover:bg-red-50 transition flex items-center justify-between text-red-500">
              <span>Futa Zilizotumika</span>
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- 3. Logs -->
        <div class="lg:col-span-8 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
            <h3 class="text-[10px] font-black uppercase tracking-widest">Kumbukumbu (Logs)</h3>
            <span class="text-[9px] font-bold text-stone-400">${state.vouchers.length} Jumla</span>
          </div>
          <div class="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table class="w-full text-[11px] text-left">
              <thead class="bg-white sticky top-0 border-b border-stone-100 z-10">
                <tr>
                  <th class="px-4 py-3 font-black uppercase tracking-tighter text-stone-400">Kodi (Bofya kunakili)</th>
                  <th class="px-4 py-3 font-black uppercase tracking-tighter text-stone-400">Hali</th>
                  <th class="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-50">
                ${[...state.vouchers].reverse().map((v: any) => `
                  <tr class="hover:bg-stone-50/50 group transition-colors">
                    <td 
                      onclick="window.app.handleVoucherClick('${v.id}', '${v.code}', '${v.status}')"
                      class="px-4 py-3 font-mono font-black text-stone-800 tracking-widest cursor-pointer relative"
                    >
                      <span class="group-hover:text-[#8d6e63] underline decoration-stone-200 group-hover:decoration-[#8d6e63]">${v.code}</span>
                      ${state.copiedId === v.id ? `<span class="absolute left-4 -top-1 bg-stone-900 text-white text-[7px] px-1 rounded shadow-lg copied-badge z-20">COPIED!</span>` : ''}
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                        v.status === 'Available' ? 'bg-stone-100 text-stone-600' :
                        v.status === 'Active' ? 'bg-[#5d4037] text-white' : 
                        v.status === 'Used' ? 'bg-stone-200 text-stone-400 line-through' :
                        'text-stone-300'
                      }">
                        ${v.status === 'Available' ? 'Ipo' : v.status === 'Used' ? 'Tayari' : v.status}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-300 hover:text-red-500 transition-colors p-1">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
                ${state.vouchers.length === 0 ? '<tr><td colspan="3" class="p-10 text-center text-stone-300 font-bold italic uppercase text-[9px]">Hakuna kumbukumbu</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else {
    root.innerHTML = `
      <div class="bg-white border border-stone-200 p-10 rounded-xl max-w-lg mx-auto shadow-sm">
        <h2 class="text-sm font-black uppercase tracking-widest mb-8 border-b border-stone-100 pb-2">Seva ya Mikrotik</h2>
        <div class="space-y-6">
          <div>
            <p class="text-[9px] font-black text-stone-400 uppercase mb-3">Login URL</p>
            <div class="p-4 bg-stone-50 border border-stone-100 rounded text-[10px] font-mono text-stone-600 break-all leading-relaxed">
              https://japhet-1234.github.io/hotspotmtaani/
            </div>
          </div>
          <div class="pt-8 border-t border-stone-100">
            <button id="btn-reset" class="w-full text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-100 py-3 rounded hover:bg-red-50 transition">
              Factory Reset
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Update Print View
  printRoot.innerHTML = `
    <div class="grid grid-cols-4 gap-2">
      ${state.vouchers.filter((v: any) => v.status === 'Available').map((v: any) => `
        <div class="border border-stone-900 p-4 text-center rounded flex flex-col items-center">
          <p class="text-[8px] font-black border-b border-stone-900 w-full mb-3 pb-1 uppercase">HM Identity</p>
          <h4 class="text-xl font-mono font-black tracking-widest">${v.code}</h4>
          <p class="text-[7px] text-stone-600 mt-2 font-bold uppercase">${v.bundleName}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Re-attach listeners and process icons
  attachListeners();
  // Fix: Line 256: lucide.createIcons(); - lucide is now declared
  lucide.createIcons();
};

const attachListeners = () => {
  // Navigation
  document.getElementById('nav-dashboard')?.addEventListener('click', () => { state.activeTab = 'main'; render(); });
  document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });

  // Main Controls
  const bundleSelect = document.getElementById('bundle-select');
  if (bundleSelect) {
    // Fix: Line 267: Cast EventTarget to HTMLSelectElement to access .value
    bundleSelect.addEventListener('change', (e) => { 
      state.selectedBundleId = (e.target as HTMLSelectElement).value; 
    });
  }

  const batchSlider = document.getElementById('batch-slider');
  if (batchSlider) {
    batchSlider.addEventListener('input', (e) => {
      // Fix: Line 273: Cast EventTarget to HTMLInputElement to access .value
      state.batchCount = parseInt((e.target as HTMLInputElement).value);
      // Fix: Line 274: Convert number to string for innerText
      const display = document.getElementById('batch-count-display');
      if (display) display.innerText = state.batchCount.toString();
    });
  }

  document.getElementById('btn-generate')?.addEventListener('click', createBatch);
  document.getElementById('btn-clear')?.addEventListener('click', clearUsed);
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm("FUTA DATA ZOTE? Kitendo hiki hakiwezi kurejeshwa.")) {
      localStorage.clear();
      window.location.reload();
    }
  });
};

// --- Exposure for onclick handlers ---
// Fix: Line 289: Use any cast for window to allow 'app' property
(window as any).app = {
  deleteVoucher,
  handleVoucherClick
};

// Initial Render
render();