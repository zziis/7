class ZilzalAccountSystem {
  constructor(){this.profile=null;this.guest=false;this.timer=null;this.sb=null;}
  init(){
    this.sb=(window.zilzalApp?.getSupabase?.() || (window.supabase&&window.ZILZAL_SUPABASE_URL&&!window.ZILZAL_SUPABASE_URL.includes('ضع_')?window.supabase.createClient(window.ZILZAL_SUPABASE_URL,window.ZILZAL_SUPABASE_ANON_KEY):null));
    this.bindUI(); this.setupPasswordRecovery(); this.restore();
  }
  bindUI(){
    const toggle=document.getElementById('official-accounts-toggle'), panel=document.getElementById('official-accounts-panel');
    toggle?.addEventListener('click',()=>{const open=panel.classList.toggle('hidden')===false;toggle.setAttribute('aria-expanded',String(open));});
    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('z-login-form').classList.toggle('hidden',b.dataset.authTab!=='login');document.getElementById('z-signup-form').classList.toggle('hidden',b.dataset.authTab!=='signup');});
    document.getElementById('z-guest-btn')?.addEventListener('click',()=>this.enterGuest());
    document.getElementById('z-login-form')?.addEventListener('submit',e=>{e.preventDefault();this.login();});
    document.getElementById('z-signup-form')?.addEventListener('submit',e=>{e.preventDefault();this.signup();});
    document.getElementById('z-forgot-password')?.addEventListener('click',()=>this.requestPasswordReset());
    document.getElementById('z-reset-password-form')?.addEventListener('submit',e=>{e.preventDefault();this.finishPasswordReset();});
    document.getElementById('z-reset-close')?.addEventListener('click',()=>this.hideResetModal());
    document.getElementById('feature-close')?.addEventListener('click',()=>this.closeModal());
    document.querySelectorAll('[data-z-action]').forEach(b=>b.addEventListener('click',()=>this.action(b.dataset.zAction)));
    document.addEventListener('click',e=>{const room=e.target.closest('[data-tab="rooms"]');if(room&&!this.profile){e.preventDefault();e.stopImmediatePropagation();this.needAccount('دخول الرومات متاح للحسابات المسجلة فقط.');}},true);
  }
  async setupPasswordRecovery(){
    if(!this.sb)return;

    // Supabase may return recovery either as ?code=... (PKCE)
    // or as tokens/type=recovery in the URL hash.
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/,''));
    const type = url.searchParams.get('type') || hash.get('type');
    const code = url.searchParams.get('code');

    this.sb.auth.onAuthStateChange((event)=>{
      if(event === 'PASSWORD_RECOVERY'){
        this.showResetModal();
      }
    });

    try{
      if(code){
        const {error}=await this.sb.auth.exchangeCodeForSession(code);
        if(error) throw error;
        this.showResetModal();
        return;
      }

      if(type === 'recovery'){
        const access_token = hash.get('access_token');
        const refresh_token = hash.get('refresh_token');

        if(access_token && refresh_token){
          const {error}=await this.sb.auth.setSession({
            access_token,
            refresh_token
          });
          if(error) throw error;
        }
        this.showResetModal();
      }
    }catch(e){
      console.error('Password recovery error:',e);
      const msg=document.getElementById('z-reset-msg');
      this.showResetModal();
      if(msg){
        msg.textContent='رابط الاستعادة غير صالح أو منتهي. اطلب رابطًا جديدًا.';
        msg.style.color='#fb7185';
      }
    }
  }
  showResetModal(){
    const m=document.getElementById('z-reset-password-modal');
    if(m){m.classList.remove('hidden');m.classList.add('flex');}
    const gate=document.getElementById('zilzal-auth-gate');
    gate?.classList.add('hidden');
    setTimeout(()=>document.getElementById('z-reset-password-1')?.focus(),100);
  }
  hideResetModal(){
    const m=document.getElementById('z-reset-password-modal');
    if(m){m.classList.add('hidden');m.classList.remove('flex');}
  }
  async requestPasswordReset(){
    if(!this.sb)return this.msg('اربط Supabase أولاً',true);
    const email=prompt('اكتب البريد الإلكتروني المرتبط بحسابك:');
    if(!email)return;
    try{
      this.msg('جاري إرسال رابط الاستعادة...');
      const redirectTo=location.origin+location.pathname;
      const {error}=await this.sb.auth.resetPasswordForEmail(email.trim(),{redirectTo});
      if(error)throw error;
      this.msg('تم إرسال رابط تغيير كلمة المرور إلى بريدك.');
    }catch(e){this.msg(e.message||'تعذر إرسال رابط الاستعادة',true);}
  }
  async finishPasswordReset(){
    if(!this.sb)return;
    const p1=document.getElementById('z-reset-password-1').value;
    const p2=document.getElementById('z-reset-password-2').value;
    const msg=document.getElementById('z-reset-msg');
    if(p1.length<6){msg.textContent='كلمة المرور يجب أن تكون 6 أحرف على الأقل.';msg.style.color='#fb7185';return;}
    if(p1!==p2){msg.textContent='كلمتا المرور غير متطابقتين.';msg.style.color='#fb7185';return;}
    msg.textContent='جاري تحديث كلمة المرور...';msg.style.color='#67e8f9';
    const {error}=await this.sb.auth.updateUser({password:p1});
    if(error){msg.textContent=error.message;msg.style.color='#fb7185';return;}
    msg.textContent='تم تغيير كلمة المرور بنجاح ✅';msg.style.color='#86efac';
    history.replaceState({},document.title,location.pathname);
    setTimeout(async()=>{
      this.hideResetModal();
      await this.sb.auth.signOut();
      this.profile=null;this.guest=false;this.paint();this.showGate();
      this.msg('تم تغيير كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.');
    },1200);
  }
  async restore(){
    if(!this.sb){
      if(localStorage.getItem('zilzal_guest')==='1') return this.enterGuest(false);
      return this.showGate();
    }

    const {data:{session},error}=await this.sb.auth.getSession();
    if(error){
      console.error('getSession error:',error);
      return this.showGate();
    }

    if(session){
      localStorage.removeItem('zilzal_guest');
      const ok=await this.loadProfile();
      if(ok) return this.hideGate();
    }

    if(localStorage.getItem('zilzal_guest')==='1') return this.enterGuest(false);
    this.showGate();
  }
  showGate(){document.getElementById('zilzal-auth-gate')?.classList.remove('hidden');}
  hideGate(){document.getElementById('zilzal-auth-gate')?.classList.add('hidden');}
  enterGuest(save=true){this.guest=true;this.profile=null;if(save)localStorage.setItem('zilzal_guest','1');this.hideGate();this.paint();}
  async api(path,body){
    const url=window.ZILZAL_SUPABASE_URL;
    const key=window.ZILZAL_SUPABASE_ANON_KEY;
    if(!url||url.includes('ضع_')||!key||key.includes('ضع_'))throw new Error('اربط Supabase أولاً');
    const r=await fetch(`${url}/functions/v1/${path}`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'apikey':key
      },
      body:JSON.stringify(body)
    });
    let j={};
    try{j=await r.json();}catch{}
    if(!r.ok)throw new Error(j.error||j.message||`فشل الاتصال (${r.status})`);
    return j;
  }
  async login(){
    try{
      this.msg('جاري الدخول...');
      const id=document.getElementById('z-login-id').value.trim();
      const password=document.getElementById('z-login-password').value;

      const x=await this.api('auth-login',{id,password});
      const access_token=x.access_token||x.session?.access_token;
      const refresh_token=x.refresh_token||x.session?.refresh_token;

      if(!access_token||!refresh_token)
        throw new Error('تم التحقق من الحساب لكن لم تصل جلسة الدخول');

      const {data:sessionData,error:sessionError}=await this.sb.auth.setSession({
        access_token,
        refresh_token
      });
      if(sessionError) throw sessionError;
      if(!sessionData?.session?.user) throw new Error('تعذر تثبيت جلسة الدخول');

      localStorage.removeItem('zilzal_guest');

      const loaded=await this.loadProfile();
      if(!loaded) throw new Error('تم الدخول لكن تعذر تحميل بيانات الحساب');

      this.hideGate();
      this.msg('');
    }catch(e){
      console.error('login error:',e);
      this.msg(e.message||'تعذر تسجيل الدخول',true);
    }
  }
  async signup(){try{this.msg('جاري إنشاء الحساب...');const x=await this.api('auth-register',{name:document.getElementById('z-signup-name').value.trim(),email:document.getElementById('z-signup-email').value.trim(),password:document.getElementById('z-signup-password').value,inviter_id:document.getElementById('z-inviter-id').value.trim()||null});document.getElementById('z-login-id').value=x.id;document.querySelector('[data-auth-tab="login"]').click();this.msg(`تم إنشاء الحساب. ID الخاص بك: ${x.id}`);}catch(e){this.msg(e.message,true)}}
  msg(t,err=false){const el=document.getElementById('z-auth-msg');if(el){el.textContent=t;el.style.color=err?'#fb7185':'#67e8f9';}}
  async loadProfile(){
    try{
      const {data:{user},error:userError}=await this.sb.auth.getUser();
      if(userError||!user){
        console.error('getUser error:',userError);
        this.profile=null;
        this.showGate();
        return false;
      }

      const {data,error}=await this.sb
        .from('profiles')
        .select('*')
        .eq('id',user.id)
        .maybeSingle();

      if(error){
        console.error('profile load error:',error);
        this.profile=null;
        this.showGate();
        return false;
      }

      if(!data){
        console.error('profile missing for auth user:',user.id);
        this.profile=null;
        this.showGate();
        return false;
      }

      this.profile=data;
      this.guest=false;
      this.paint();
      this.startTimer();
      return true;
    }catch(e){
      console.error('loadProfile fatal:',e);
      this.profile=null;
      this.showGate();
      return false;
    }
  }
  paint(){
    const nameEl=document.getElementById('side-user-name');
    const idEl=document.getElementById('side-user-id');
    const pointsEl=document.getElementById('side-points');
    if(nameEl) nameEl.textContent=this.profile?.name||this.profile?.display_name||'زائر';
    if(idEl) idEl.textContent=this.profile?.public_id||'—';
    if(pointsEl) pointsEl.textContent=`${this.profile?.points||0} 🪙`;
  }
  needAccount(text='هذه الميزة للحسابات المسجلة فقط.'){this.openModal(`<div class="text-center"><div class="text-5xl mb-3">🔐</div><h3 class="font-bold text-xl">سجّل حسابك أولاً</h3><p class="text-slate-400 mt-2">${text}</p><button onclick="zilzalAccounts.closeModal();zilzalAccounts.showGate()" class="cyber-button mt-5">تسجيل / إنشاء حساب</button></div>`)}
  action(x){if(x==='butterfly')return this.openButterfly();if(!this.profile)return this.needAccount();if(x==='account')return this.openAccount();if(x==='invite')return this.openInvite();if(x==='support')return this.openModal('<h3 class="text-xl font-bold mb-3">الدعم والمساعدة</h3><p class="text-slate-300">تواصل مع إدارة ZILZAL من الحسابات الرسمية أو أرسل طلب دعم من المنصة.</p>');if(x==='saved')return this.openModal('<h3 class="text-xl font-bold">المحفوظات</h3><p class="text-slate-400 mt-3">ستظهر هنا العناصر التي تحفظها.</p>');if(x==='notifications')return this.openModal('<h3 class="text-xl font-bold">إشعاراتي</h3><p class="text-slate-400 mt-3">لا توجد إشعارات جديدة.</p>');}
  openAccount(){this.openModal(`<h3 class="text-xl font-bold mb-4">حسابي</h3><div class="space-y-3"><div class="glass-panel p-3">الاسم: <b>${this.profile.name}</b></div><div class="glass-panel p-3">ID: <b>${this.profile.public_id}</b></div><div class="glass-panel p-3">النقاط: <b>${this.profile.points} 🪙</b></div>${this.profile.role==='developer'?'<div class="text-amber-300">⭐ حساب المطور — ID 1</div>':''}<button onclick="zilzalAccounts.logout()" class="w-full mt-4 py-3 rounded-xl bg-rose-500/15 text-rose-300">تسجيل الخروج</button></div>`)}
  openInvite(){this.openModal(`<h3 class="text-xl font-bold">دعوة صديق</h3><p class="text-slate-300 mt-3">أرسل ID الخاص بك لصديقك:</p><div class="reward-timer mt-4">${this.profile.public_id}</div><p class="text-sm text-emerald-300 mt-4">+10 نقاط عند تسجيل حساب جديد بدعوتك<br>+2 نقطة لك كل يوم عندما يستلم المدعو مكافأة الفراشة.</p>`)}
  async openButterfly(){if(!this.profile)return this.needAccount('الفراشة اليومية متاحة للمستخدمين المسجلين فقط.');const remain=this.remaining();this.openModal(`<div class="text-center"><h3 class="text-xl font-black">🦋 الفراشة اليومية</h3><div class="reward-orb"><span class="butterfly-big">🦋</span></div><div id="reward-modal-timer" class="reward-timer">${remain?this.fmt(remain):'جاهزة'}</div><p class="text-slate-400 text-sm mt-2">المكافأة: 50 نقطة كل 24 ساعة</p><button id="claim-butterfly" class="cyber-button mt-5" ${remain?'disabled':''}>${remain?'انتظر انتهاء العداد':'استلام 50 نقطة'}</button></div>`);document.getElementById('claim-butterfly')?.addEventListener('click',()=>this.claimButterfly());}
  remaining(){if(!this.profile?.reward_ready_at)return 0;return Math.max(0,new Date(this.profile.reward_ready_at).getTime()-Date.now());}
  fmt(ms){const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return [h,m,ss].map(v=>String(v).padStart(2,'0')).join(':');}
  startTimer(){clearInterval(this.timer);this.timer=setInterval(()=>{const r=this.remaining(),el=document.getElementById('butterfly-menu-status');if(el)el.textContent=r?this.fmt(r):'50 نقطة جاهزة';const m=document.getElementById('reward-modal-timer');if(m)m.textContent=r?this.fmt(r):'جاهزة';},1000)}
  async claimButterfly(){const {data,error}=await this.sb.rpc('claim_butterfly_reward');if(error)return alert(error.message);await this.loadProfile();this.closeModal();this.openButterfly();}
  async logout(){if(this.sb)await this.sb.auth.signOut();localStorage.removeItem('zilzal_guest');this.profile=null;this.guest=false;clearInterval(this.timer);this.paint();this.closeModal();this.showGate();}
  openModal(html){document.getElementById('feature-content').innerHTML=html;document.getElementById('zilzal-feature-modal').classList.remove('hidden');}
  closeModal(){document.getElementById('zilzal-feature-modal').classList.add('hidden');}
}
window.addEventListener('load',()=>{window.zilzalAccounts=new ZilzalAccountSystem();zilzalAccounts.init();});
