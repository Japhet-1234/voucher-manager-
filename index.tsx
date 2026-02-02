
// --- Hotspot Mtaani Management Logic (Pure JavaScript) ---

const STORAGE_KEY = 'hotspot_mtaani_data_v4';

// Default Bundles with duration in Minutes
const BUNDLES = [
    { id: 'b1', name: 'Saa 6 Unlimited', price: 500, minutes: 360 },
    { id: 'b2', name: 'Saa 24 Unlimited', price: 1000, minutes: 1440 },
    { id: 'b3', name: 'Siku 3 Unlimited', price: 2000, minutes: 4320 },
    { id: 'b4', name: 'Wiki 1 Unlimited', price: 5000, minutes: 10080 }
];

let state = {
    vouchers: [],
    activeTab: 'home',
    selectedBundleId: 'b1',
    batchSize: 10,
    copiedId: null
};

// --- Initialization ---
const init = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state.vouchers = JSON.parse(saved);
    }
    
    // Check for expired vouchers every 30 seconds
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
    save();
    render();
};

const deleteVoucher = (id) => {
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

const formatTimeLeft = (expiresAt) => {
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
    
    // Update Nav active state visually
    const updateNav = (id, active) => {
        const el = document.getElementById(id);
        if (el) {
            if (active) {
                el.classList.add('text-[#5d4037]', 'border-[#5d4037]');
                el.classList.remove('text-stone-400');
            } else {
                el.classList.remove('text-[#5d4037]', 'border-[#5d4037]');
                el.classList.add('text-stone-400');
            }
        }
    };
    updateNav('nav-home', state.activeTab === 'home');
    updateNav('nav-expired', state.activeTab === 'expired');
    updateNav('nav-settings', state.activeTab === 'settings');

    // Update Icons
    // Fix: Using (window as any) to bypass TypeScript error for lucide which is loaded externally
    if ((window as any).lucide) {
        (window as any).lucide.createIcons();
    }

    // Attach Dynamic Listeners
    attachEventListeners();
};

const renderHome = (container) => {
    const available = state.vouchers.filter(v => v.status === 'available');
    const active = state.vouchers.filter(v => v.status === 'active');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Vocha Mpya</p>
                <h3 class="text-3xl font-black">${available.length}</h3>
            </div>
            <div class="bg-[#5d4037] text-white p-6 rounded-2xl shadow-lg">
                <p class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Wateja Active</p>
                <h3 class="text-3xl font-black">${active.length}</h3>
            </div>
            <div class="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Mapato (Makadirio)</p>
                <h3 class="text-3xl font-black text-green-600">${state.vouchers.filter(v => v.status !== 'available').reduce((acc, v) => acc + (BUNDLES.find(b => b.id === v.bundleId)?.price || 0), 0).toLocaleString()}</h3>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-4">
                <div class="bg-white border border-stone-200 rounded-3xl p-8 sticky top-24 shadow-sm">
                    <h2 class="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                        <i data-lucide="plus-circle" class="w-4 h-4 text-[#8d6e63]"></i> Zalisha Vocha
                    </h2>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Chagua Kifurushi</label>
                            <select id="bundle-select" class="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-[#8d6e63]/20">
                                ${BUNDLES.map(b => `<option value="${b.id}" ${state.selectedBundleId === b.id ? 'selected' : ''}>${b.name} - ${b.price} Tzs</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-stone-400 uppercase mb-2">Idadi ya Kutoa: <span class="text-[#8d6e63] font-black">${state.batchSize}</span></label>
                            <input id="batch-range" type="range" min="1" max="50" value="${state.batchSize}" class="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8d6e63]">
                        </div>
                        <button id="btn-create" class="w-full bg-[#8d6e63] hover:bg-[#7a5e54] text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">
                            Tengeneza Vocha
                        </button>
                    </div>

                    <div class="mt-8 pt-8 border-t border-stone-100">
                        <button onclick="window.print()" class="w-full flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition text-[10px] font-bold uppercase tracking-widest">
                            Print Vocha <i data-lucide="printer" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-8 space-y-6">
                <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div class="px-6 py-4 bg-stone-50 border-b border-stone-100">
                        <h3 class="text-[10px] font-black uppercase tracking-widest">Wateja Waliounganishwa (${active.length})</h3>
                    </div>
                    <div class="divide-y divide-stone-50">
                        ${active.length === 0 ? `<p class="p-12 text-center text-stone-300 text-[10px] font-bold uppercase">Hakuna mteja anayetumia intaneti kwa sasa</p>` : ''}
                        ${active.map(v => `
                            <div class="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono font-black text-sm tracking-widest">${v.code}</span>
                                        <span class="text-[8px] font-black bg-green-500 text-white px-2 py-0.5 rounded uppercase">Active</span>
                                    </div>
                                    <p class="text-[9px] text-stone-400 font-bold mt-1 uppercase">${v.bundleName}</p>
                                </div>
                                <div class="text-right flex items-center gap-4">
                                    <p class="text-[10px] font-black text-[#8d6e63] countdown-pulse">${formatTimeLeft(v.expiresAt)}</p>
                                    <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-300 hover:text-red-500 transition p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div class="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                        <h3 class="text-[10px] font-black uppercase tracking-widest text-stone-400">Vocha Mpya (${available.length})</h3>
                        <span class="text-[8px] font-bold text-stone-300 uppercase">Bofya Nakala Kuanza Muda</span>
                    </div>
                    <div class="max-h-[500px] overflow-y-auto divide-y divide-stone-50">
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

const renderExpired = (container) => {
    const expired = state.vouchers.filter(v => v.status === 'expired');
    container.innerHTML = `
        <div class="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm max-w-2xl mx-auto">
            <div class="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
                <h2 class="text-sm font-black uppercase tracking-widest">Zilizokwisha Muda (${expired.length})</h2>
                <button onclick="window.app.clearExpired()" class="text-red-500 text-[10px] font-black uppercase border border-red-100 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">Safisha Zote</button>
            </div>
            <div class="divide-y divide-stone-50">
                ${expired.length === 0 ? '<p class="p-20 text-center text-stone-300 text-[10px] font-bold uppercase italic">Hakuna kumbukumbu za vocha zilizokwisha</p>' : ''}
                ${expired.map(v => `
                    <div class="px-8 py-4 flex items-center justify-between">
                        <div>
                            <span class="font-mono font-black text-stone-400 line-through tracking-widest">${v.code}</span>
                            <p class="text-[9px] text-stone-300 font-bold uppercase">${v.bundleName}</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-[8px] font-black text-stone-300 border border-stone-100 px-2 py-1 rounded uppercase">EXPIRED</span>
                            <button onclick="window.app.deleteVoucher('${v.id}')" class="text-stone-200 hover:text-red-500 transition"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

const renderSettings = (container) => {
    container.innerHTML = `
        <div class="max-w-xl mx-auto bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
            <div class="bg-stone-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <i data-lucide="shield-check" class="w-10 h-10 text-[#8d6e63]"></i>
            </div>
            <h2 class="text-xl font-black uppercase tracking-widest mb-4">Mfumo wa Hotspot</h2>
            <p class="text-xs text-stone-400 mb-8 leading-relaxed uppercase font-bold tracking-tight">System yako imesanifiwa kutumia prefix "HM-". Ili kuitumia, hakikisha ukurasa wa Login wa Mikrotik unafungua hapa:</p>
            
            <div class="bg-stone-50 border border-stone-100 p-5 rounded-2xl mb-10 font-mono text-[11px] text-[#5d4037] break-all shadow-inner relative group">
                https://japhet-1234.github.io/hotspotmtaani/
                <div class="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            </div>

            <button onclick="if(confirm('Hii itafuta vocha zote! Una uhakika?')) { localStorage.clear(); location.reload(); }" class="text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 w-full py-4 rounded-2xl border border-red-50 transition-all">
                Factory Reset (Futa Data Zote)
            </button>
        </div>
    `;
};

const renderPrint = (container) => {
    const available = state.vouchers.filter(v => v.status === 'available');
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            ${available.map(v => `
                <div class="voucher-grid-item" style="border: 1.5px solid #000; padding: 15px; border-radius: 4px;">
                    <p style="font-size: 9px; font-weight: 900; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 4px; letter-spacing: 1px;">HOTSPOT MTAANI</p>
                    <p style="font-size: 7px; color: #666; font-weight: bold; margin: 0;">Voucher Code:</p>
                    <p style="font-size: 22px; font-family: monospace; font-weight: 900; letter-spacing: 3px; margin: 8px 0; color: #000;">${v.code}</p>
                    <div style="background: #000; color: #fff; font-size: 9px; font-weight: 900; padding: 4px 0; margin-bottom: 6px; text-transform: uppercase;">${v.bundleName}</div>
                    <p style="font-size: 7px; margin-top: 5px; color: #444;">© Hotspot Mtaani System</p>
                </div>
            `).join('')}
        </div>
    `;
};

const attachEventListeners = () => {
    document.getElementById('nav-home')?.addEventListener('click', () => { state.activeTab = 'home'; render(); });
    document.getElementById('nav-expired')?.addEventListener('click', () => { state.activeTab = 'expired'; render(); });
    document.getElementById('nav-settings')?.addEventListener('click', () => { state.activeTab = 'settings'; render(); });

    document.getElementById('bundle-select')?.addEventListener('change', (e) => { 
        // Fix: Casting e.target to HTMLSelectElement to access the 'value' property in TypeScript
        state.selectedBundleId = (e.target as HTMLSelectElement).value; 
    });
    document.getElementById('batch-range')?.addEventListener('input', (e) => { 
        // Fix: Casting e.target to HTMLInputElement to access the 'value' property in TypeScript
        state.batchSize = parseInt((e.target as HTMLInputElement).value); 
        render(); 
    });
    document.getElementById('btn-create')?.addEventListener('click', createVouchers);
};

// --- Exposure for window ---
// Fix: Casting window to any to allow assigning the custom 'app' property in TypeScript environment
(window as any).app = {
    deleteVoucher,
    clearExpired: () => {
        if(confirm("Futa vocha zote zilizokwisha muda?")) {
            state.vouchers = state.vouchers.filter(v => v.status !== 'expired');
            save();
            render();
        }
    },
    copyAndActivate: (id, code) => {
        navigator.clipboard.writeText(code).then(() => {
            if(confirm(`Kodi ${code} imeshanakiliwa!\n\nJe, unataka kuianzishia muda (Activate) sasa hivi kwa ajili ya mteja?`)) {
                activateVoucher(id);
            }
        }).catch(err => {
            console.error('Copy failed', err);
            activateVoucher(id); // Fallback to activate anyway if clipboard fails
        });
    }
};

// Start the engine
init();
