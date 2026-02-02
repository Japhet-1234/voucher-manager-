
// Add global declaration for lucide icons
declare const lucide: any;

// --- Configuration & State ---
const STORAGE_KEY_VOUCHERS = 'hotspot_mtaani_vouchers_v3';
const STORAGE_KEY_BUNDLES = 'hotspot_mtaani_bundles_v3';

const DEFAULT_BUNDLES = [
  { id: '1', name: '6 HOURS UNLIMITED', price: 500 },
  { id: '2', name: '24 HOURS UNLIMITED', price: 1000 },
  { id: '3', name: '3 DAYS UNLIMITED', price: 2000 },
  { id: '4', name: '7 DAYS UNLIMITED', price: 5000 },
];

let state = {
  vouchers: JSON.parse(localStorage.getItem(STORAGE_KEY_VOUCHERS) || '[]'),
  bundles: JSON.parse(localStorage.getItem(STORAGE_KEY_BUNDLES) || JSON.stringify(DEFAULT_BUNDLES)),
  activeTab: 'main',
  batchCount: 10,
  selectedBundleId: '1',
  copiedId: null
};

// --- Core Logic ---

const saveState = () => {
  localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(state.vouchers));
  localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(state.bundles));
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

const generateVoucherCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HM-${randomPart}`; // Identity Prefix
};

const createBatch = () => {
  const bundle = state.bundles.find(b => b.id === state.selectedBundleId);
  if (!bundle) return;
  
  const newVouchers = Array.from({ length: state.batchCount }, () => ({
    id: generateId(),
    code: generateVoucherCode(),
    bundleId: bundle.id,
    bundleName: bundle.name,
    createdAt: Date.now(),
    status: 'Available'
  }));

  state.vouchers = [...state.vouchers, ...newVouchers];
  saveState();
  render();
};

const deleteVoucher = (id) => {
  state.vouchers = state.vouchers.filter(v => v.id !== id);
  saveState();
  render();
};

const clearUsed = () => {
  if (confirm("Je, unataka kufuta vocha zote zilizotumika?")) {
    state.vouchers = state.vouchers.filter(v => v.status === 'Available');
    saveState();
    render();
  }
};

const handleVoucherClick = async (id, code, currentStatus) => {
  try {
    await navigator.clipboard.writeText(code);
    state.copiedId = id;
    
    // Auto-mark as used to track distribution
    if (currentStatus === 'Available') {
      state.vouchers = state.vouchers.map(v => 
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

// --- Rendering Engine ---

const render = () => {
  const root = document.getElementById('content-root');
  const printRoot = document.getElementById('print-root');
  if (!root || !printRoot) return;

  // Calculate Stats
  const available = state.vouchers.filter(v => v.status === 'Available').length;
  const used = state.vouchers.filter(v => v.status === 'Used').length;
  const revenue = state.vouchers.reduce((acc, v) => {
    const b = state.bundles.find(bn => bn.id === v.bundleId);
    return v.status === 'Used' ? acc + (b?.price || 0) : acc;
  }, 0);

  // Nav UI
  const navDashboard = document.getElementById('nav-dashboard');
  if (navDashboard) navDashboard.className = `text-[10px] font-black uppercase tracking-widest ${state.activeTab === 'main' ? 'text-[#5d4037]' : 'text-stone-400 hover:text-stone-600'}`;
  
  const navSettings = document.getElementById('nav-settings');
  if (navSettings) navSettings.className = `text-[10px] font-black uppercase tracking-widest ${state.activeTab === 'settings' ? 'text-[#5d4037]' : 'text-stone-400 hover:text-stone-600'}`;

  if (state.activeTab === 'main') {
    root.innerHTML = `
      <!-- Stats Row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
          <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Vocha Zilizopo</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-stone-800">${available}</p>
            <i data-lucide="ticket" class="w-5 h-5 text-stone-200"></i>
          </div>
        </div>
        <div class="bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
          <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Zilizotumika</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-[#8d6e63]">${used}</p>
            <i data-lucide="check-circle" class="w-5 h-5 text-[#8d6e63]/20"></i>
          </div>
        </div>
        <div class="bg-white border border-stone-200 p-5 rounded-xl shadow-sm">
          <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Mapato (Tzs)</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-stone-800">${revenue.toLocaleString()}</p>
            <i data-lucide="banknote" class="w-5 h-5 text-stone-200"></i>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Control Panel -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-[#3d2b1f] text-white p-6 rounded-2xl shadow-xl border border-[#2d1f16]">
            <h3 class="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <i data-lucide="zap" class="w-4 h-4 text-[#8d6e63]"></i> Jenereta ya Vocha
            </h3>
            <div class="space-y-5">
              <div class="space-y-1.5">
                <label class="text-[9px] font-bold text-stone-400 uppercase">Aina ya Kifurushi</label>
                <select id="bundle-select" class="w-full bg-[#2d1f16] border border-stone-800 p-3 text-xs rounded-lg font-bold outline-none focus:border-[#8d6e63] transition-colors">
                  ${state.bundles.map(b => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name} - ${b.price} Tzs</option>`).join('')}
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[9px] font-bold text-stone-400 uppercase">Idadi: <span id="batch-count-display">${state.batchCount}</span></label>
                <input id="batch-slider" type="range" min="1" max="50" value="${state.batchCount}" class="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
              </div>
              <button id="btn-generate" class="w-full bg-[#8d6e63] hover:bg-[#a18276] text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-[0.97]">
                Tengeneza Vocha
              </button>
            </div>
          </div>

          <div class="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-sm">
            <h3 class="text-[9px] font-black uppercase tracking-widest text-stone-400">Quick Actions</h3>
            <button onclick="window.print()" class="w-full text-left p-4 text-xs font-bold border border-stone-50 rounded-xl hover:bg-stone-50 transition flex items-center justify-between">
              <span>Print Vocha Zilizopo</span>
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button id="btn-clear" class="w-full text-left p-4 text-xs font-bold border border-stone-50 rounded-xl hover:bg-red-50 transition flex items-center justify-between text-red-500">
              <span>Safisha Kumbukumbu</span>
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Data Logs -->
        <div class="lg:col-span-8 bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
            <h3 class="text-[10px] font-black uppercase tracking-widest">Kumbukumbu (Logs)</h3>
            <div class="flex items-center gap-2">
               <span class="text-[9px] font-bold text-stone-400 bg-white border border-stone-200 px-2 py-1 rounded-full">${state.vouchers.length} Jumla</span>
            </div>
          </div>
          <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table class="w-full text-[11px] text-left border-collapse">
              <thead class="bg-white sticky top-0 border-b border-stone-100 z-10 shadow-sm">
                <tr>
                  <th class="px-6 py-4 font-black uppercase tracking-tighter text-stone-400">Kodi (Bofya Nakili)</th>
                  <th class="px-6 py-4 font-black uppercase tracking-tighter text-stone-400">Kifurushi</th>
                  <th class="px-6 py-4 font-black uppercase tracking-tighter text-stone-400">Hali</th>
                  <th class="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-50">
                ${[...state.vouchers].reverse().map(v => `
                  <tr class="hover:bg-stone-50/30 group transition-colors">
                    <td 
                      onclick="window.app.handleVoucherClick('${v.id}', '${v.code}', '${v.status}')"
                      class="px-6 py-4 font-mono font-black text-stone-800 tracking-widest cursor-pointer relative"
                    >
                      <span class="group-hover:text-[#8d6e63] underline decoration-stone-200 group-hover:decoration-[#8d6e63] transition-all">${v.code}</span>
                      ${state.copiedId === v.id ? `<span class="absolute left-6 -top-1 bg-stone-900 text-white text-[7px] px-1.5 py-0.5 rounded shadow-xl copied-badge z-20">COPIED!</span>` : ''}
                    </td>
                    <td class="px-6 py-4 text-stone-500 font-bold uppercase text-[9px]">${v.bundleName}</td>
                    <td class="px-6 py-4">
                      <span class="text-[8px] font-black px-2.5 py-1 rounded-full uppercase ${
                        v.status === 'Available' ? 'bg-green-50 text-green-600 border border-green-100' :
                        'bg-stone-100 text-stone-400 line-through'
                      }">
                        ${v.status === 'Available' ? 'Ipo' : 'Tayari'}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
                ${state.vouchers.length === 0 ? '<tr><td colspan="4" class="p-20 text-center text-stone-300 font-bold italic uppercase text-[10px] tracking-widest">Hakuna data kwa sasa</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer class="text-center pt-10 no-print">
        <p class="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">Mali ya Hotspot Mtaani System</p>
        <p class="text-[7px] text-stone-300 font-mono mt-1">Version 3.0.1 Stable</p>
      </footer>
    `;
  } else {
    root.innerHTML = `
      <div class="bg-white border border-stone-200 p-12 rounded-3xl max-w-xl mx-auto shadow-sm text-center">
        <div class="bg-stone-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i data-lucide="settings" class="w-8 h-8 text-stone-400"></i>
        </div>
        <h2 class="text-lg font-black uppercase tracking-widest mb-2">Mpangilio wa Mfumo</h2>
        <p class="text-xs text-stone-400 mb-10">Unganisha mfumo huu na Seva yako ya Mikrotik</p>
        
        <div class="space-y-8 text-left">
          <div class="space-y-3">
            <label class="text-[9px] font-black text-stone-400 uppercase tracking-widest">Mikrotik Landing Identity</label>
            <div class="p-4 bg-stone-50 border border-stone-100 rounded-xl text-[11px] font-mono text-stone-600 break-all leading-relaxed shadow-inner">
              https://japhet-1234.github.io/hotspotmtaani/
            </div>
            <p class="text-[8px] text-stone-400 italic">Tumia link hii kwenye mfumo wa Login kuitambua Identity ya Vocha.</p>
          </div>

          <div class="pt-8 border-t border-stone-100">
            <button id="btn-reset" class="w-full text-red-500 font-black text-[10px] uppercase tracking-widest border-2 border-red-50 py-4 rounded-xl hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-2">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i> Futa Data Zote (Reset)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Generate Print Layout
  printRoot.innerHTML = `
    <div class="grid grid-cols-3 gap-4">
      ${state.vouchers.filter(v => v.status === 'Available').map(v => `
        <div class="voucher-card p-4 text-center rounded-none flex flex-col items-center">
          <p class="text-[9px] font-black border-b-2 border-black w-full mb-3 pb-1 uppercase tracking-tighter">HOTSPOT MTAANI</p>
          <p class="text-[7px] font-bold text-stone-600 mb-1 uppercase">CODE:</p>
          <h4 class="text-2xl font-mono font-black tracking-[0.2em] mb-2">${v.code}</h4>
          <div class="w-full bg-black text-white py-1 px-2 text-[8px] font-black uppercase tracking-widest mb-1">
            ${v.bundleName}
          </div>
          <p class="text-[6px] text-stone-400 mt-1 italic">Ingiza kodi hii kwenye login page ya mtaani.</p>
        </div>
      `).join('')}
    </div>
  `;

  attachListeners();
  // Fix for Error: Cannot find name 'lucide'.
  lucide.createIcons();
};

const attachListeners = () => {
  document.getElementById('nav-dashboard')?.addEventListener('click', () => { state.activeTab = 'main'; render(); });
  document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });

  const bundleSelect = document.getElementById('bundle-select');
  if (bundleSelect) {
    bundleSelect.addEventListener('change', (e) => { 
      // Fix for Error: Property 'value' does not exist on type 'EventTarget'.
      state.selectedBundleId = (e.target as HTMLSelectElement).value; 
    });
  }

  const batchSlider = document.getElementById('batch-slider');
  if (batchSlider) {
    batchSlider.addEventListener('input', (e) => {
      // Fix for Error: Property 'value' does not exist on type 'EventTarget'.
      state.batchCount = parseInt((e.target as HTMLInputElement).value);
      const display = document.getElementById('batch-count-display');
      // Fix for Error: Type 'number' is not assignable to type 'string'.
      if (display) display.innerText = state.batchCount.toString();
    });
  }

  document.getElementById('btn-generate')?.addEventListener('click', createBatch);
  document.getElementById('btn-clear')?.addEventListener('click', clearUsed);
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm("ONYO: Kitendo hiki kitafuta vocha zote! Una uhakika?")) {
      localStorage.clear();
      window.location.reload();
    }
  });
};

// Expose globally for HTML onclick
// Fix for Error: Property 'app' does not exist on type 'Window'.
(window as any).app = {
  deleteVoucher,
  handleVoucherClick
};

// Start
render();
