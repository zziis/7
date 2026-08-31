/**
 * ZILZAL PLATFORM - MAIN APPLICATION CONTROLLER
 */

class ZilzalPlatformApp {
  constructor() {
    this.currentTab = 'home';
    this.audioEnabled = localStorage.getItem('zilzal_audio') !== 'false';
    this.currentTheme = localStorage.getItem('zilzal_theme') || 'cyan';
    this.tickerSpeed = parseInt(localStorage.getItem('zilzal_ticker_speed') || '25');
    this.audioCtx = null;
    
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupAudio();
    this.setupParticles();
    this.renderTicker();
    this.renderSocials();
    this.renderMovies();
    this.renderSeries();
    this.renderAPKStore();
    this.setupNavigation();
    this.setupEventListeners();
    this.setupSettings();
    this.setupSearch();
    this.setupAPKDeveloper();
    this.setupAPKAdminAuth();
    this.initAPKStoreRealtime();

    // Initialize sub-engines
    if (window.zilzalRooms) window.zilzalRooms.renderCurrentRoom();
    if (window.zilzalGames) window.zilzalGames.init();

    // Check URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && ['settings', 'rooms', 'games', 'series', 'movies', 'ai', 'apk', 'home'].includes(hash)) {
      this.switchTab(hash);
    }
  }

  // ==========================================
  // WEB AUDIO SYNTHESIZER (No external audio needed)
  // ==========================================
  setupAudio() {
    const initAudioContext = () => {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
    };
    window.addEventListener('click', initAudioContext, { once: true });
    window.addEventListener('keydown', initAudioContext, { once: true });
  }

  playSound(type) {
    if (!this.audioEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'victory') {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
          const subOsc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subOsc.connect(subGain);
          subGain.connect(ctx.destination);
          subOsc.frequency.value = freq;
          subGain.gain.setValueAtTime(0.1, now + i * 0.09);
          subGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.2);
          subOsc.start(now + i * 0.09);
          subOsc.stop(now + i * 0.09 + 0.2);
        });
      } else if (type === 'notification' || type === 'message') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio fallback
    }
  }

  // ==========================================
  // BACKGROUND PARTICLES CANVAS
  // ==========================================
  setupParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const count = 45;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.5
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f0ff';

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.strokeStyle = '#00f0ff';
            ctx.globalAlpha = (1 - dist / 100) * 0.15;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(render);
    };
    render();
  }

  // ==========================================
  // TICKER ADS (Moving Left to Right)
  // ==========================================
  renderTicker() {
    const tickerContainer = document.getElementById('ticker-move-box');
    if (!tickerContainer) return;

    // Double list for seamless marquee loop
    const itemsHtml = [...ZILZAL_DATA.tickerAds, ...ZILZAL_DATA.tickerAds].map(ad => `
      <div class="ticker-item">
        <span class="tag">${ad.tag}</span>
        <span>${ad.text}</span>
        <i class="fa-solid fa-bolt-lightning text-xs ml-2 text-cyan-400"></i>
      </div>
    `).join('');

    tickerContainer.innerHTML = itemsHtml;
    document.documentElement.style.setProperty('--ticker-speed', `${this.tickerSpeed}s`);
  }

  // ==========================================
  // SOCIAL ACCOUNTS BAR
  // ==========================================
  renderSocials() {
    const container = document.getElementById('socials-container');
    if (!container) return;

    container.innerHTML = ZILZAL_DATA.socials.map(s => `
      <div class="social-card ${s.id}" onclick="window.zilzalApp.handleSocialClick('${s.id}', '${s.url}', '${s.handle}')">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-900/80 shadow-inner flex-shrink-0">
          <i class="${s.icon}"></i>
        </div>
        <div class="flex-1 min-w-0 text-right">
          <div class="text-xs font-bold text-white flex items-center gap-1.5">
            <span>${s.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800/90 text-cyan-300 font-mono">${s.followers}</span>
          </div>
          <div class="text-xs text-slate-400 font-mono truncate">${s.handle}</div>
        </div>
        <button title="نسخ الرابط" onclick="event.stopPropagation(); window.zilzalApp.copyToClipboard('${s.handle}', '${s.name}')" 
          class="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition">
          <i class="fa-regular fa-copy text-xs"></i>
        </button>
      </div>
    `).join('');
  }

  handleSocialClick(id, url, handle) {
    this.playSound('click');
    this.showToast(`جاري فتح ${handle}...`, 'info');
    window.open(url, '_blank');
  }

  copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      this.playSound('notification');
      this.showToast(`تم نسخ ${label} (${text}) بنجاح! 📋`, 'success');
    }).catch(() => {
      this.showToast(`المعرف: ${text}`, 'info');
    });
  }

  // ==========================================
  // MOVIES SECTION
  // ==========================================
  renderMovies(filter = 'all') {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    let items = ZILZAL_DATA.movies;
    if (filter !== 'all') {
      items = items.filter(m => m.category.toLowerCase().includes(filter.toLowerCase()));
    }

    container.innerHTML = items.map(m => `
      <div class="media-card group cursor-pointer" onclick="window.zilzalApp.openMovieModal('${m.id}')">
        <div class="relative overflow-hidden">
          <img src="${m.image}" alt="${m.title}" loading="lazy" />
          <span class="media-card-badge text-cyan-300 border-cyan-500/40">
            <i class="fa-solid fa-star text-amber-400 ml-1"></i> ${m.rating}
          </span>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-95 transition"></div>
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
            <span class="w-14 h-14 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center text-xl shadow-[0_0_20px_#00f0ff]">
              <i class="fa-solid fa-play mr-[-3px]"></i>
            </span>
          </div>
        </div>
        <div class="p-4 relative">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span class="font-mono">${m.year}</span>
            <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold text-[11px]">${m.quality}</span>
            <span><i class="fa-regular fa-clock ml-1"></i>${m.duration}</span>
          </div>
          <h3 class="font-bold text-base text-white group-hover:text-cyan-300 transition truncate">${m.arabicTitle}</h3>
          <p class="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">${m.description}</p>
        </div>
      </div>
    `).join('');
  }

  openMovieModal(id) {
    const movie = ZILZAL_DATA.movies.find(m => m.id === id);
    if (!movie) return;

    this.playSound('click');
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
      <div class="relative h-64 overflow-hidden rounded-t-2xl">
        <img src="${movie.image}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/50 to-transparent"></div>
        <button onclick="window.zilzalApp.closeModal()" class="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-900/80 text-slate-300 hover:text-white flex items-center justify-center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-2">
          <span class="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-bold">${movie.quality}</span>
          <span class="text-amber-400 text-xs font-bold"><i class="fa-solid fa-star"></i> ${movie.rating}/10</span>
          <span class="text-slate-400 text-xs">${movie.year} • ${movie.duration}</span>
        </div>
        <h2 class="text-2xl font-black text-white mb-2">${movie.arabicTitle} (${movie.title})</h2>
        <p class="text-sm text-slate-300 leading-relaxed mb-6">${movie.description}</p>
        
        <div class="flex items-center gap-4">
          <button onclick="window.zilzalApp.showToast('جاري تشغيل المشغل السينمائي بدقة 4K...', 'success')" class="cyber-button flex-1 py-3 text-sm">
            <i class="fa-solid fa-play"></i> مشاهدة الفيلم الآن
          </button>
          <button onclick="window.zilzalApp.showToast('تمت إضافة الفيلم إلى قائمتك المفضلة ⭐', 'info')" class="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-300 flex items-center justify-center border border-slate-700">
            <i class="fa-regular fa-bookmark"></i>
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // ==========================================
  // SERIES SECTION
  // ==========================================
  renderSeries() {
    const container = document.getElementById('series-grid');
    if (!container) return;

    container.innerHTML = ZILZAL_DATA.series.map(s => `
      <div class="media-card group cursor-pointer" onclick="window.zilzalApp.openSeriesModal('${s.id}')">
        <div class="relative overflow-hidden">
          <img src="${s.image}" alt="${s.title}" loading="lazy" />
          <span class="media-card-badge text-purple-300 border-purple-500/40">
            <i class="fa-solid fa-fire text-pink-500 ml-1"></i> ${s.rating}
          </span>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-95 transition"></div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span class="text-cyan-400 font-bold">${s.seasons}</span>
            <span>${s.episodes}</span>
          </div>
          <h3 class="font-bold text-base text-white group-hover:text-purple-300 transition truncate">${s.arabicTitle}</h3>
          <p class="text-xs text-slate-400 line-clamp-2 mt-1.5">${s.description}</p>
        </div>
      </div>
    `).join('');
  }

  openSeriesModal(id) {
    const item = ZILZAL_DATA.series.find(s => s.id === id);
    if (!item) return;

    this.playSound('click');
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
      <div class="relative h-60 overflow-hidden rounded-t-2xl">
        <img src="${item.image}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/50 to-transparent"></div>
        <button onclick="window.zilzalApp.closeModal()" class="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-900/80 text-slate-300 hover:text-white flex items-center justify-center">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-2">
          <span class="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 text-xs font-bold">${item.seasons}</span>
          <span class="text-slate-400 text-xs">${item.episodes}</span>
          <span class="text-emerald-400 text-xs font-bold">${item.status}</span>
        </div>
        <h2 class="text-2xl font-black text-white mb-2">${item.arabicTitle}</h2>
        <p class="text-sm text-slate-300 leading-relaxed mb-4">${item.description}</p>
        
        <h4 class="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">قائمة الحلقات السريعة:</h4>
        <div class="space-y-2 mb-6 max-h-40 overflow-y-auto pr-1">
          ${[1, 2, 3, 4].map(ep => `
            <div onclick="window.zilzalApp.showToast('جاري تشغيل الحلقة ${ep} بجودة فائقة...', 'success')" class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 cursor-pointer border border-slate-800 transition">
              <span class="text-xs font-bold text-slate-200">الحلقة ${ep}: البداية الرقمية</span>
              <span class="text-cyan-400 text-xs"><i class="fa-solid fa-circle-play ml-1"></i> تشغيل</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // ==========================================
  // APK ADMIN AUTH
  async getAdminSession() {
    const sb=this.getSupabase();
    if(!sb)return {user:null,isAdmin:false};
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return {user:null,isAdmin:false};
    const {data,error}=await sb.rpc('is_apk_admin');
    return {user,isAdmin:!error && data===true};
  }

  async refreshAdminUI() {
    const {user,isAdmin}=await this.getAdminSession();
    this._apkAdminUser=user;
    this._apkIsAdmin=isAdmin;
    const btnText=document.getElementById('apk-developer-btn-text');
    const userStatus=document.getElementById('apk-admin-user-status');
    if(btnText)btnText.textContent=isAdmin?'إدارة المطور':'دخول المدير';
    if(userStatus)userStatus.textContent=isAdmin?`مسجل كمدير: ${user.email}`:'';
    if(!isAdmin)document.getElementById('apk-developer-panel')?.classList.add('hidden');
    return {user,isAdmin};
  }

  setupAPKAdminAuth() {
    const form=document.getElementById('apk-admin-login-form');
    if(form){
      form.addEventListener('submit',async e=>{
        e.preventDefault();
        const sb=this.getSupabase();
        const msg=document.getElementById('apk-admin-login-msg');
        if(!sb){msg.textContent='اربط Supabase أولًا.';return;}
        msg.textContent='جاري تسجيل الدخول...';
        const email=document.getElementById('apk-admin-email').value.trim();
        const password=document.getElementById('apk-admin-password').value;
        const {error}=await sb.auth.signInWithPassword({email,password});
        if(error){msg.textContent='فشل تسجيل الدخول: '+error.message;return;}
        const state=await this.refreshAdminUI();
        if(!state.isAdmin){
          await sb.auth.signOut();
          msg.textContent='هذا الحساب ليس ضمن مديري متجر APK.';
          await this.refreshAdminUI();
          return;
        }
        msg.textContent='تم تسجيل الدخول بنجاح ✅';
        document.getElementById('apk-admin-auth-modal')?.classList.add('hidden');
        document.getElementById('apk-developer-panel')?.classList.remove('hidden');
        await this.renderAPKAdminList();
      });
    }
    const sb=this.getSupabase();
    if(sb){
      sb.auth.onAuthStateChange(async()=>{await this.refreshAdminUI();});
      this.refreshAdminUI();
    }
  }

  closeAdminLogin(){document.getElementById('apk-admin-auth-modal')?.classList.add('hidden');}

  async adminLogout(){
    const sb=this.getSupabase();if(!sb)return;
    await sb.auth.signOut();
    document.getElementById('apk-developer-panel')?.classList.add('hidden');
    await this.refreshAdminUI();
    this.showToast('تم تسجيل خروج المدير','success');
  }

  // APK APPLICATIONS STORE — Supabase
  getSupabase() {
    if (this._supabaseClient) return this._supabaseClient;
    if (!window.supabase || !window.ZILZAL_SUPABASE_URL || !window.ZILZAL_SUPABASE_ANON_KEY) return null;
    if (window.ZILZAL_SUPABASE_URL.includes('ضع_') || window.ZILZAL_SUPABASE_ANON_KEY.includes('ضع_')) return null;
    this._supabaseClient = window.supabase.createClient(window.ZILZAL_SUPABASE_URL, window.ZILZAL_SUPABASE_ANON_KEY);
    return this._supabaseClient;
  }

  async fetchAPKApps(admin=false) {
    const sb=this.getSupabase(); if(!sb) return [];
    if(admin){
      const state=await this.getAdminSession();
      if(!state.isAdmin)return [];
    }
    let q=sb.from('apk_apps').select('*').order('created_at',{ascending:false});
    if(!admin) q=q.eq('visible',true);
    const {data,error}=await q;
    if(error){ console.error(error); return []; }
    return data||[];
  }

  async initAPKStoreRealtime() {
    const sb=this.getSupabase();
    const status=document.getElementById('apk-supabase-status');
    if(!sb){
      if(status){status.textContent='⚠️ ضع بيانات Supabase في supabase-config.js';status.className='mt-2 text-[11px] text-amber-300';}
      await this.renderAPKStore();
      return;
    }
    if(status){status.textContent='● متصل بقاعدة البيانات';status.className='mt-2 text-[11px] text-emerald-400';}
    await this.renderAPKStore();
    this._apkChannel=sb.channel('apk-apps-store')
      .on('postgres_changes',{event:'*',schema:'public',table:'apk_apps'},async()=>{
        await this.renderAPKStore();
        if(!document.getElementById('apk-developer-panel')?.classList.contains('hidden')) await this.renderAPKAdminList();
      }).subscribe();
  }

  async renderAPKStore(filter='all') {
    const container=document.getElementById('apk-grid'); if(!container)return;
    let items=await this.fetchAPKApps(false);
    if(filter!=='all') items=items.filter(a=>(a.category||'').includes(filter));
    if(!items.length){
      container.innerHTML=`<div class="glass-panel p-8 sm:col-span-2 lg:col-span-3 text-center">
      <i class="fa-brands fa-android text-5xl text-cyan-400 mb-4"></i>
      <h3 class="font-bold text-white mb-2">لا توجد تطبيقات منشورة حاليًا</h3>
      <p class="text-xs text-slate-400">أضف تطبيقًا من لوحة المطور ليظهر هنا لكل الزوار.</p></div>`;
      return;
    }
    container.innerHTML=items.map(a=>`<div class="glass-panel p-5 relative overflow-hidden flex flex-col justify-between hover:border-cyan-400 transition group">
      <div><div class="flex items-start justify-between mb-4">
      ${a.icon_url?`<img src="${this.escapeAttr(a.icon_url)}" class="w-14 h-14 rounded-2xl object-cover border border-cyan-500/30">`:`<div class="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-2xl text-cyan-400"><i class="fa-brands fa-android"></i></div>`}
      <span class="cyber-pill text-[11px]">${this.escapeHTML(a.category||'تطبيق')}</span></div>
      <h3 class="font-bold text-base text-white group-hover:text-cyan-300 transition">${this.escapeHTML(a.name)}</h3>
      <div class="text-xs text-slate-400 mb-2 font-mono">${this.escapeHTML(a.version||'')}${a.size_text?' • '+this.escapeHTML(a.size_text):''}</div>
      <p class="text-xs text-slate-300 leading-relaxed mb-4">${this.escapeHTML(a.description||'')}</p></div>
      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
      <span class="text-[11px] text-emerald-400"><i class="fa-solid fa-link ml-1"></i> رابط مباشر</span>
      <button onclick="window.zilzalApp.downloadAPKById('${a.id}')" class="cyber-button py-2 px-3.5 text-xs"><i class="fa-solid fa-arrow-down"></i> تنزيل APK</button>
      </div></div>`).join('');
  }

  async downloadAPKById(id) {
    const sb=this.getSupabase(); if(!sb)return this.showToast('Supabase غير مربوط','error');
    const {data:a,error}=await sb.from('apk_apps').select('*').eq('id',id).eq('visible',true).maybeSingle();
    if(error||!a?.download_url)return this.showToast('رابط التنزيل غير موجود','error');
    if(!/^https:\/\//i.test(a.download_url))return this.showToast('رابط APK غير صالح','error');
    window.open(a.download_url,'_blank','noopener');
  }

  async openDeveloperAPK() {
    const sb=this.getSupabase();
    if(!sb)return this.showToast('اربط Supabase أولًا','error');
    const {isAdmin}=await this.refreshAdminUI();
    if(!isAdmin){
      document.getElementById('apk-admin-auth-modal')?.classList.remove('hidden');
      document.getElementById('apk-admin-login-msg').textContent='';
      document.getElementById('apk-admin-email')?.focus();
      return;
    }
    document.getElementById('apk-developer-panel')?.classList.remove('hidden');
    await this.renderAPKAdminList();
    document.getElementById('apk-developer-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  closeDeveloperAPK(){document.getElementById('apk-developer-panel')?.classList.add('hidden');}
  resetAPKForm(){const f=document.getElementById('apk-admin-form');if(f)f.reset();document.getElementById('apk-edit-id').value='';document.getElementById('apk-visible').checked=true;}

  async renderAPKAdminList() {
    const el=document.getElementById('apk-admin-list'); if(!el)return;
    const items=await this.fetchAPKApps(true);
    el.innerHTML=items.length?items.map(a=>`<div class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
      ${a.icon_url?`<img src="${this.escapeAttr(a.icon_url)}" class="w-10 h-10 rounded-xl object-cover">`:'<div class="w-10 h-10 rounded-xl bg-slate-800 grid place-items-center">📦</div>'}
      <div class="min-w-0 flex-1"><strong class="text-sm text-white block truncate">${this.escapeHTML(a.name)}</strong><small class="text-slate-500">${this.escapeHTML(a.version||'')} • ${a.visible===false?'مخفي':'ظاهر'}</small></div>
      <button onclick="window.zilzalApp.editAPK('${a.id}')" class="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs">تعديل</button>
      <button onclick="window.zilzalApp.toggleAPK('${a.id}',${a.visible!==false})" class="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-300 text-xs">${a.visible===false?'إظهار':'إخفاء'}</button>
      <button onclick="window.zilzalApp.deleteAPK('${a.id}')" class="px-3 py-2 rounded-lg bg-rose-500/10 text-rose-300 text-xs">حذف</button>
      </div>`).join(''):'<p class="text-xs text-slate-500">لم تضف أي تطبيق بعد.</p>';
  }

  async editAPK(id){
    const sb=this.getSupabase();if(!sb)return;
    const state=await this.getAdminSession();if(!state.isAdmin)return this.showToast('صلاحية مدير مطلوبة','error');
    const {data:a}=await sb.from('apk_apps').select('*').eq('id',id).maybeSingle();if(!a)return;
    document.getElementById('apk-edit-id').value=a.id;
    document.getElementById('apk-name').value=a.name||'';
    document.getElementById('apk-version').value=a.version||'';
    document.getElementById('apk-size').value=a.size_text||'';
    document.getElementById('apk-category').value=a.category||'أخرى';
    document.getElementById('apk-icon-url').value=a.icon_url||'';
    document.getElementById('apk-download-url').value=a.download_url||'';
    document.getElementById('apk-description').value=a.description||'';
    document.getElementById('apk-visible').checked=a.visible!==false;
  }

  async toggleAPK(id,currentVisible){
    const sb=this.getSupabase();if(!sb)return;
    const state=await this.getAdminSession();if(!state.isAdmin)return this.showToast('صلاحية مدير مطلوبة','error');
    const {error}=await sb.from('apk_apps').update({visible:!currentVisible,updated_at:new Date().toISOString()}).eq('id',id);
    if(error)return this.showToast(error.message,'error');
    await this.renderAPKAdminList();await this.renderAPKStore();
  }

  async deleteAPK(id){
    const sb=this.getSupabase();if(!sb)return;
    const state=await this.getAdminSession();if(!state.isAdmin)return this.showToast('صلاحية مدير مطلوبة','error');
    const {data:a}=await sb.from('apk_apps').select('name').eq('id',id).maybeSingle();
    if(!confirm(`حذف ${a?.name||'التطبيق'} من المتجر؟`))return;
    const {error}=await sb.from('apk_apps').delete().eq('id',id);
    if(error)return this.showToast(error.message,'error');
    await this.renderAPKAdminList();await this.renderAPKStore();
  }

  setupAPKDeveloper(){
    const form=document.getElementById('apk-admin-form'); if(!form)return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const sb=this.getSupabase();if(!sb)return this.showToast('اربط Supabase أولًا','error');
      const state=await this.getAdminSession();if(!state.isAdmin)return this.showToast('صلاحية مدير مطلوبة','error');
      const id=document.getElementById('apk-edit-id').value||crypto.randomUUID();
      const download_url=document.getElementById('apk-download-url').value.trim();
      const icon_url=document.getElementById('apk-icon-url').value.trim();
      if(!/^https:\/\//i.test(download_url))return this.showToast('ضع رابط تنزيل HTTPS صحيح','error');
      if(icon_url&&!/^https:\/\//i.test(icon_url))return this.showToast('رابط الصورة يجب أن يبدأ بـ HTTPS','error');
      const row={id,name:document.getElementById('apk-name').value.trim(),version:document.getElementById('apk-version').value.trim(),
        size_text:document.getElementById('apk-size').value.trim(),category:document.getElementById('apk-category').value,
        icon_url,download_url,description:document.getElementById('apk-description').value.trim(),
        visible:document.getElementById('apk-visible').checked,updated_at:new Date().toISOString()};
      const {error}=await sb.from('apk_apps').upsert(row,{onConflict:'id'});
      if(error)return this.showToast(error.message,'error');
      this.resetAPKForm();await this.renderAPKAdminList();await this.renderAPKStore();
      this.showToast('تم حفظ التطبيق في Supabase ✅','success');
    });
  }

  escapeHTML(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  escapeAttr(v=''){return this.escapeHTML(v);}

  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!toggleBtn || !sidebar || !overlay) return;

    const openDrawer = () => {
      sidebar.classList.add('drawer-open');
      overlay.classList.add('overlay-open');
      document.body.classList.add('drawer-lock');
      toggleBtn.setAttribute('aria-expanded','true');
      overlay.setAttribute('aria-hidden','false');
    };

    const closeDrawer = () => {
      sidebar.classList.remove('drawer-open');
      overlay.classList.remove('overlay-open');
      document.body.classList.remove('drawer-lock');
      toggleBtn.setAttribute('aria-expanded','false');
      overlay.setAttribute('aria-hidden','true');
    };

    toggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      sidebar.classList.contains('drawer-open') ? closeDrawer() : openDrawer();
    });

    overlay.addEventListener('click', closeDrawer);
    document.getElementById('sidebar-close-btn')?.addEventListener('click', closeDrawer);

    sidebar.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.innerWidth < 1024) closeDrawer();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) closeDrawer();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });

    this.closeMobileDrawer = closeDrawer;
  }

  // ==========================================
  // NAVIGATION & TAB SWITCHING
  // ==========================================
  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
          this.playSound('click');
        }
      });
    });

  }

  switchTab(tabId) {
    this.currentTab = tabId;
    window.location.hash = tabId;

    // Update active buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const activeEl = document.getElementById(`tab-${tabId}`);
    if (activeEl) {
      activeEl.classList.add('active');
    }

    // Close mobile drawer on item click
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && window.innerWidth < 1024) {
      sidebar.classList.remove('drawer-open');
      
      if (overlay) overlay.classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // SETTINGS & THEMES
  // ==========================================
  setupSettings() {
    const audioToggle = document.getElementById('toggle-audio');
    const themeSelect = document.getElementById('theme-select');
    const speedRange = document.getElementById('ticker-speed-input');
    const speedDisplay = document.getElementById('ticker-speed-val');
    const nickInput = document.getElementById('setting-nickname');
    const avatarInput = document.getElementById('setting-avatar');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    if (audioToggle) {
      audioToggle.checked = this.audioEnabled;
      audioToggle.onchange = (e) => {
        this.audioEnabled = e.target.checked;
        localStorage.setItem('zilzal_audio', this.audioEnabled);
        this.showToast(this.audioEnabled ? 'تم تفعيل المؤثرات الصوتية 🔊' : 'تم كتم الصوت 🔇', 'info');
      };
    }

    if (themeSelect) {
      themeSelect.value = this.currentTheme;
      themeSelect.onchange = (e) => {
        this.applyTheme(e.target.value);
      };
    }

    if (speedRange && speedDisplay) {
      speedRange.value = this.tickerSpeed;
      speedDisplay.textContent = `${this.tickerSpeed} ثانية`;
      speedRange.oninput = (e) => {
        this.tickerSpeed = parseInt(e.target.value);
        speedDisplay.textContent = `${this.tickerSpeed} ثانية`;
        localStorage.setItem('zilzal_ticker_speed', this.tickerSpeed);
        document.documentElement.style.setProperty('--ticker-speed', `${this.tickerSpeed}s`);
      };
    }

    if (nickInput) nickInput.value = localStorage.getItem('zilzal_nickname') || 'زائر زلزال';
    if (avatarInput) avatarInput.value = localStorage.getItem('zilzal_avatar') || '⚡';

    if (btnSaveProfile) {
      btnSaveProfile.onclick = () => {
        const nick = nickInput.value.trim() || 'زائر زلزال';
        const av = avatarInput.value.trim() || '⚡';
        localStorage.setItem('zilzal_nickname', nick);
        localStorage.setItem('zilzal_avatar', av);
        if (window.zilzalRooms) {
          window.zilzalRooms.nickname = nick;
          window.zilzalRooms.avatar = av;
        }
        this.playSound('notification');
        this.showToast('تم حفظ الملف الشخصي وتحديث الرومات بنجاح! ✅', 'success');
      };
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('zilzal_theme', theme);
    document.body.className = '';
    if (theme === 'purple') document.body.classList.add('theme-purple');
    if (theme === 'gold') document.body.classList.add('theme-gold');
  }

  // ==========================================
  // EVENT LISTENERS & SEARCH
  // ==========================================
  setupEventListeners() {
    // AI Chat submission
    const aiInput = document.getElementById('ai-chat-input');
    const aiBtn = document.getElementById('ai-chat-send');
    const aiPrompts = document.querySelectorAll('.ai-prompt-chip');

    const handleAISend = () => {
      if (!aiInput) return;
      const text = aiInput.value.trim();
      if (!text) return;

      this.sendAIMessage(text);
      aiInput.value = '';
    };

    if (aiBtn) aiBtn.onclick = handleAISend;
    if (aiInput) {
      aiInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleAISend();
      };
    }

    aiPrompts.forEach(chip => {
      chip.onclick = () => {
        const query = chip.getAttribute('data-prompt');
        if (query) this.sendAIMessage(query);
      };
    });

    // Rooms chat submission
    const roomInput = document.getElementById('room-chat-input');
    const roomBtn = document.getElementById('room-chat-send');

    const handleRoomSend = () => {
      if (!roomInput) return;
      const text = roomInput.value.trim();
      if (!text) return;

      if (window.zilzalRooms) window.zilzalRooms.sendMessage(text);
      roomInput.value = '';
    };

    if (roomBtn) roomBtn.onclick = handleRoomSend;
    if (roomInput) {
      roomInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleRoomSend();
      };
    }
  }

  async sendAIMessage(text) {
    const container=document.getElementById('ai-chat-messages');if(!container)return;
    this.playSound('click');
    const safe=String(text).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    container.insertAdjacentHTML('beforeend',`<div class="flex items-start gap-3 flex-row-reverse"><div class="w-10 h-10 rounded-xl bg-cyan-500/20 grid place-items-center">👤</div><div class="max-w-[80%] p-3.5 rounded-2xl chat-bubble-me">${safe}</div></div>`);
    const typingId='typing-'+Date.now();container.insertAdjacentHTML('beforeend',`<div id="${typingId}" class="text-cyan-400 text-xs p-3">🤖 يكتب...</div>`);container.scrollTop=container.scrollHeight;
    let responseText=window.zilzalAI?.findStoredResponse?.(text)||null, remaining=null;
    if(!responseText){
      if(!window.zilzalAccounts?.profile){responseText='سجّل الدخول لاستخدام الأسئلة الذكية الجديدة. يمكنك الاستمرار باستخدام الردود المحفوظة.';}
      else try{const {data:{session}}=await window.zilzalAccounts.sb.auth.getSession();const r=await fetch(`${window.ZILZAL_SUPABASE_URL}/functions/v1/zilzal-bot`,{method:'POST',headers:{'Content-Type':'application/json','apikey':window.ZILZAL_SUPABASE_ANON_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({message:text})});const j=await r.json();responseText=j.reply||j.error;remaining=j.remaining;}catch(e){responseText='تعذر الاتصال بالذكاء الآن. الردود المحفوظة ما زالت متاحة.';}
    }
    document.getElementById(typingId)?.remove();const formatted=String(responseText).replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');container.insertAdjacentHTML('beforeend',`<div class="flex items-start gap-3"><div class="w-10 h-10 rounded-xl bg-slate-800 grid place-items-center">🤖</div><div class="max-w-[85%]"><div class="p-4 rounded-2xl chat-bubble-bot">${formatted}</div>${remaining!==null?`<small class="text-emerald-400">الأسئلة الذكية المتبقية اليوم: ${remaining}/10</small>`:''}</div></div>`);container.scrollTop=container.scrollHeight;this.playSound('notification');
  }

  setupSearch() {
    const movieSearch = document.getElementById('movie-search-input');
    if (movieSearch) {
      movieSearch.oninput = (e) => {
        const query = e.target.value.toLowerCase();
        const container = document.getElementById('movies-grid');
        if (!container) return;

        const filtered = ZILZAL_DATA.movies.filter(m => 
          m.arabicTitle.toLowerCase().includes(query) || 
          m.title.toLowerCase().includes(query) || 
          m.category.toLowerCase().includes(query)
        );

        container.innerHTML = filtered.map(m => `
          <div class="media-card group cursor-pointer" onclick="window.zilzalApp.openMovieModal('${m.id}')">
            <img src="${m.image}" alt="${m.title}" />
            <div class="p-4">
              <h3 class="font-bold text-base text-white group-hover:text-cyan-300 transition truncate">${m.arabicTitle}</h3>
              <p class="text-xs text-slate-400 line-clamp-2 mt-1">${m.description}</p>
            </div>
          </div>
        `).join('');
      };
    }
  }

  closeModal() {
    const modal = document.getElementById('media-modal');
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'border-emerald-400 text-emerald-300' : 'border-cyan-400 text-cyan-200'}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-cyan-400'}"></i>
      <span class="text-xs font-semibold">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Instantiate on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.zilzalApp = new ZilzalPlatformApp();
});
