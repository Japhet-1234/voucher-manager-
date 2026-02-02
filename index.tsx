
// --- Hotspot Mtaani Management Logic ---

const STORAGE_KEY = 'hotspot_mtaani_data_v4';

// Default Bundles with duration in Minutes
const BUNDLES = [
    { id: 'b1', name: 'Saa 6 Unlimited', price: 500, minutes: 360 },
    { id: 'b2', name: 'Saa 24 Unlimited', price: 1000, minutes: 1440 },
    { id: 'b3', name: 'Siku 3 Unlimited', price: 2000, minutes: 4320 },
    { id: 'b4', name: 'Wiki 1 Unlimited', price: 5000, minutes: 10080 }
];

let state = {
    vouchers: [] as any[],
    activeTab: 'home',
    selectedBundleId: 'b1',
    batchSize: 10,
    copiedId: null as string | null
};

// --- Initialization ---
const init = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state.vouchers = JSON.parse(saved);
    }
    
    // Start the timer to update UI for active vouchers every minute
    setInterval(updateExpiries, 30000); 
    render();
};

const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vouchers));
};

// --- Core Actions ---

const generateVoucherCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HM-${code}`;
};

const createVouchers = () => {
    const bundle = BUNDLES.find(b => b.id === state.selectedBundleId);
    if (!bundle) return;
    const newItems = [];
    
    for (let i = 0; i < state.batchSize; i++) {
        newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            code: generateVoucherCode(),
            bundleId: bundle.id,
            bundleName: bundle.name,
            duration: bundle.minutes,
            status: 'available', // available, active, expired
            createdAt: Date.now(),
            activatedAt: null,
            expiresAt: null
        });
    }
    
    state.vouchers = [...state.vouchers, ...newItems];
    save();
    render();
};

const activateVoucher = (id: string) => {
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
    save();
    render();
};

const deleteVoucher = (id: string) => {
    if (confirm("Futa hii vocha?")) {
        state.vouchers = state.vouchers.filter(v => v.id !== id);
        save();
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
        save();
        render();
    }
};

// --- UI Helpers ---

const formatTimeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${mins}m remaining`;
};

// --- Rendering ---

const render = () => {
    const container = document.getElementById('main-content');
    const printContainer = document.getElementById('print-layout');
    
    if (!container || !printContainer) return;

    if (state.activeTab === 'home') {
        renderHome(container);
    } else if (state.activeTab === 'expired') {
        renderExpired(container);
    } else {
        renderSettings(container);
    }
    
    renderPrint(printContainer);
    
    // Fix: Access lucide through window casting to avoid "Cannot find name 'lucide'" error
    // Update Icons
    if (typeof (window as any).lucide !== 'undefined') {
        (window as any).lucide.createIcons();
    }

    // Attach Dynamic Listeners
    attachEventListeners();
};

const renderHome = (container: HTMLElement) => {
    const available = state.vouchers.filter(v => v.status === 'available');
    const active = state.vouchers.filter(v => v.status === 'active');
    
    container.innerHTML = `
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Vocha Zilizopo</p>
                <h3 class="text-3xl font-black">${available.length}</h3>
            </div>
            <div class="bg-[#5d4037] text-white p-6 rounded-2xl shadow-lg">
                <p class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Wateja Hewani</p>
                <h3 class="text-3xl font-black">${active.length}</h3>
            </div>
            <div class="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Mapato Leo (Tzs)</p>
                <h3 class="text-3xl font-black">Coming Soon</h3>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Engine -->
            <div class="lg:col-span-4">
                <div class="bg-white border border-stone-200 rounded-3xl p-8 sticky top-24 shadow-sm">
                    <h2 class="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                        <i data-lucide="zap" class="w-4 h-4 text-[#8d6e63]"></i> Jenereta
                    </h2>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Kifurushi</label>
                            <select id="bundle-select" class="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-[#8d6e63]/20">
                                ${BUNDLES.map(b => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name} - ${b.price} Tzs</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Idadi: ${state.batchSize}</label>
                            <input id="batch-range" type="range" min="1" max="50" value="${state.batchSize}" class="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
                        </div>
                        <button id="btn-create" class="w-full bg-[#8d6e63] hover:bg-[#7a5e54] text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">
                            Tengeneza Vocha
                        </button>
                    </div>

                    <div class="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-2">
                        <button onclick="window.print()" class="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition text-[10px] font-bold uppercase tracking-widest">
                            Print Zilizopo <i data-lucide="printer" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Management Table -->
            <div class="lg:col-span-8 space-y-6">
                <!-- Active Vouchers -->
                <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div class="px-6 py-4 bg-stone-50 border-b border-stone-100">
                        <h3 class="text-[10px] font-black uppercase tracking-widest">Wateja Waliopo Hewani (${active.length})</h3>
                    </div>
                    <div class="divide-y divide-stone-50">
                        ${active.length === 0 ? `<p class="p-12 text-center text-stone-300 text-[10px] font-bold uppercase">Hakuna mteja anayetumia intaneti kwa sasa</p>` : ''}
                        ${active.map(v => `
                            <div class="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono font-black text-sm tracking-widest">${v.code}</span>
                                        <span class="text-[8px] font-black bg-[#5d4037] text-white px-2 py-0.5 rounded uppercase">Active</span>
                                    </div>
                                    <p class="text-[9px] text-stone-400 font-bold mt-1 uppercase">${v.bundleName}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] font-black text-[#8d6e63] countdown-pulse">${formatTimeLeft(v.expiresAt)}</p>
                                    <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-300 hover:text-red-500 transition p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Available Vouchers -->
                <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div class="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-stone-400">Vocha Mpya Zilizopo (${available.length})</h3>
                        <span class="text-[8px] font-bold text-stone-300">BOFYA NAKALA ILI KUANZA MUDA</span>
                    </div>
                    <div class="max-h-[400px] overflow-y-auto divide-y divide-stone-50">
                        ${available.length === 0 ? `<p class="p-12 text-center text-stone-300 text-[10px] font-bold uppercase">Hakuna vocha mpya. Tengeneza hapo kando.</p>` : ''}
                        ${available.map(v => `
                            <div class="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                <button onclick="window.app.copyAndActivate('${v.id}', '${v.code}')" class="flex flex-col items-start group">
                                    <span class="font-mono font-black text-stone-700 tracking-widest group-hover:text-[#8d6e63] transition-colors underline decoration-stone-200 group-hover:decoration-[#8d6e63]">${v.code}</span>
                                    <span class="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">${v.bundleName}</span>
                                </button>
                                <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-500 transition p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderExpired = (container: HTMLElement) => {
    const expired = state.vouchers.filter(v => v.status === 'expired');
    container.innerHTML = `
        <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm max-w-2xl mx-auto">
            <div class="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
                <h2 class="text-sm font-black uppercase tracking-widest">Vocha Zilizokwisha Muda (${expired.length})</h2>
                <button onclick="window.app.clearExpired()" class="text-red-500 text-[10px] font-black uppercase border border-red-100 px-4 py-2 rounded-xl hover:bg-red-50">Futa Zote</button>
            </div>
            <div class="divide-y divide-stone-50">
                ${expired.length === 0 ? '<p class="p-20 text-center text-stone-300 text-[10px] font-bold uppercase">Hakuna vocha zilizokwisha bado</p>' : ''}
                ${expired.map(v => `
                    <div class="px-8 py-4 flex items-center justify-between">
                        <div>
                            <span class="font-mono font-black text-stone-400 line-through tracking-widest">${v.code}</span>
                            <p class="text-[9px] text-stone-300 font-bold uppercase">${v.bundleName}</p>
                        </div>
                        <span class="text-[8px] font-black text-stone-300 border border-stone-100 px-2 py-1 rounded uppercase">EXPIRED</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

const renderSettings = (container: HTMLElement) => {
    container.innerHTML = `
        <div class="max-w-xl mx-auto bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
            <div class="bg-stone-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i data-lucide="server" class="w-10 h-10 text-stone-300"></i>
            </div>
            <h2 class="text-xl font-black uppercase tracking-widest mb-4">Identity ya Mfumo</h2>
            <p class="text-xs text-stone-400 mb-10 leading-relaxed uppercase font-bold tracking-tight">System yako inatambua vocha kupitia prefix "HM-". Ili kuitumia, hakikisha page yako ya login imeelekezwa hapa:</p>
            
            <div class="bg-stone-50 border border-stone-100 p-5 rounded-2xl mb-10 font-mono text-[11px] text-[#5d4037] break-all shadow-inner">
                https://japhet-1234.github.io/hotspotmtaani/
            </div>

            <button onclick="localStorage.clear(); location.reload();" class="text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 w-full py-4 rounded-2xl border border-red-50 transition-all">
                Factory Reset All Data
            </button>
        </div>
    `;
};

const renderPrint = (container: HTMLElement) => {
    const available = state.vouchers.filter(v => v.status === 'available');
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            ${available.map(v => `
                <div class="voucher-grid-item">
                    <p style="font-size: 8px; font-weight: 900; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 2px;">HOTSPOT MTAANI</p>
                    <p style="font-size: 18px; font-family: monospace; font-weight: 900; letter-spacing: 2px; margin: 10px 0;">${v.code}</p>
                    <div style="background: #000; color: #fff; font-size: 8px; font-weight: 900; padding: 2px 0;">${v.bundleName}</div>
                    <p style="font-size: 6px; margin-top: 5px;">MTAANI CONNECTIVITY</p>
                </div>
            `).join('')}
        </div>
    `;
};

const attachEventListeners = () => {
    // Nav
    document.getElementById('nav-home')?.addEventListener('click', () => { state.activeTab = 'home'; render(); });
    document.getElementById('nav-expired')?.addEventListener('click', () => { state.activeTab = 'expired'; render(); });
    document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });

    // Fix: Cast e.target to appropriate HTML element to access 'value' property
    // Controls
    document.getElementById('bundle-select')?.addEventListener('change', (e) => { 
        state.selectedBundleId = (e.target as HTMLSelectElement).value; 
    });
    document.getElementById('batch-range')?.addEventListener('input', (e) => { 
        state.batchSize = parseInt((e.target as HTMLInputElement).value); 
        render(); 
    });
    document.getElementById('btn-create')?.addEventListener('click', createVouchers);
};

// Fix: Cast window to any to avoid "Property 'app' does not exist on type 'Window'" error
// --- Exposure ---
(window as any).app = {
    deleteVoucher: deleteVoucher,
    clearExpired: () => {
        if(confirm("Futa vocha zote zilizokwisha?")) {
            state.vouchers = state.vouchers.filter(v => v.status !== 'expired');
            save();
            render();
        }
    },
    copyAndActivate: (id: string, code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            if(confirm(`Kodi ${code} imeshanakiliwa! Unataka kuianzishia muda (Activate) sasa hivi?`)) {
                activateVoucher(id);
            }
        });
    }
};

// Start the engine
init();
