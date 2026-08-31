class ZilzalAccountSystem {
  constructor(){this.profile=null;this.guest=false;this.timer=null;this.sb=null;}

  init(){
    this.ensureSupabase();
    this.bindUI();

    // v8.3: every fresh page visit starts from the chooser.
    // We intentionally do not auto-restore a previous session here.
    this.profile=null;
    this.guest=false;
    this.paint();
    this.showGate('login');
  }

  ensureSupabase(){
    if(this.sb) return this.sb;
    this.sb=window.zilzalApp?.getSupabase?.() || null;
    if(!this.sb && window.supabase && window.ZILZAL_SUPABASE_URL && window.ZILZAL_SUPABASE_ANON_KEY && !String(window.ZILZAL_SUPABASE_URL).includes('ضع_')){
      this.sb=window.supabase.createClient(window.ZILZAL_SUPABASE_URL,window.ZILZAL_SUPABASE_ANON_KEY);
    }
    return this.sb;
  }

  bindUI(){
    const toggle=document.getElementById('official-accounts-toggle'), panel=document.getElementById('official-accounts-panel');
    toggle?.addEventListener('click',()=>{const open=panel.classList.toggle('hidden')===false;toggle.setAttribute('aria-expanded',String(open));});

    document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>{
      document.querySelectorAll('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));
      document.getElementById('z-login-form')?.classList.toggle('hidden',b.dataset.authTab!=='login');
      document.getElementById('z-signup-form')?.classList.toggle('hidden',b.dataset.authTab!=='signup');
    });

    document.getElementById('z-guest-btn')?.addEventListener('click',()=>this.enterGuest());
    document.getElementById('z-login-form')?.addEventListener('submit',e=>{e.preventDefault();this.login();});
    document.getElementById('z-signup-form')?.addEventListener('submit',e=>{e.preventDefault();this.signup();});
    document.getElementById('feature-close')?.addEventListener('click',()=>this.closeModal());

    document.querySelectorAll('[data-z-action]').forEach(b=>b.addEventListener('click',()=>{
      this.closeDrawer();
      this.action(b.dataset.zAction);
    }));

    document.addEventListener('click',e=>{
      const room=e.target.closest('[data-tab="rooms"]');
      if(room&&!this.profile){
        e.preventDefault();
        e.stopImmediatePropagation();
        this.closeDrawer();
        this.needAccount('دخول الرومات متاح للحسابات المسجلة فقط.');
      }
    },true);
  }

  closeDrawer(){
    if(typeof window.zilzalApp?.closeMobileDrawer==='function') return window.zilzalApp.closeMobileDrawer();
    const sidebar=document.getElementById('sidebar'), overlay=document.getElementById('sidebar-overlay'), toggle=document.getElementById('mobile-menu-btn');
    sidebar?.classList.remove('drawer-open');
    overlay?.classList.remove('overlay-open');
    document.body.classList.remove('drawer-lock');
    toggle?.setAttribute('aria-expanded','false');
    overlay?.setAttribute('aria-hidden','true');
  }

  async restore(){
    // الزائر لا يُحفظ بعد تحديث الصفحة: في كل زيارة بدون جلسة مسجلة تظهر شاشة الدخول أولاً.
    localStorage.removeItem('zilzal_guest');
    if(!this.sb) return this.showGate();
    try{
      const {data:{session}}=await this.sb.auth.getSession();
      if(!session) return this.showGate();
      await this.loadProfile();
    }catch(_){
      this.showGate();
    }
  }

  showGate(tab='login'){
    this.closeDrawer();
    const gate=document.getElementById('zilzal-auth-gate');
    if(!gate) return;
    gate.classList.remove('hidden');
    gate.style.display='grid';
    gate.setAttribute('aria-hidden','false');
    const btn=document.querySelector(`[data-auth-tab="${tab}"]`);
    if(btn) btn.click();
  }
  hideGate(){
    const gate=document.getElementById('zilzal-auth-gate');
    if(!gate) return;
    gate.classList.add('hidden');
    gate.style.display='none';
    gate.setAttribute('aria-hidden','true');
  }

  async enterGuest(){
    this.profile=null;
    this.guest=true;
    try{
      const sb=this.ensureSupabase();
      if(sb) await sb.auth.signOut({scope:'local'});
    }catch(_){}
    this.paint();
    this.hideGate();
  }

  async api(path,body){
    const url=window.ZILZAL_SUPABASE_URL;
    if(!url||url.includes('ضع_')) throw new Error('اربط Supabase أولاً');
    const r=await fetch(`${url}/functions/v1/${path}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':window.ZILZAL_SUPABASE_ANON_KEY},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||'تعذر إكمال العملية');
    return j;
  }

  async login(){
    try{
      this.msg('جاري الدخول...');
      const sb=this.ensureSupabase();
      if(!sb) throw new Error('Supabase غير مربوط في supabase-config.js');
      const id=document.getElementById('z-login-id').value.trim();
      const password=document.getElementById('z-login-password').value;
      if(!/^\d+$/.test(id)) throw new Error('أدخل ID صحيح');
      if(!password) throw new Error('أدخل كلمة المرور');

      // Accounts in ZILZAL Auth use this internal email pattern.
      // Logging in directly avoids the old auth-login Edge Function/schema mismatch.
      const email=`u${Number(id)}@auth.zilzal.local`;
      const {data,error}=await sb.auth.signInWithPassword({email,password});
      if(error || !data?.user) throw new Error('ID أو كلمة المرور غير صحيحة');

      await this.loadProfile(data.user.id);
      this.guest=false;
      this.hideGate();
      this.msg('');
    }catch(e){
      this.showGate('login');
      this.msg(e?.message||'تعذر تسجيل الدخول',true);
    }
  }

  async signup(){
    try{
      this.msg('جاري إنشاء الحساب...');
      const x=await this.api('auth-register',{
        name:document.getElementById('z-signup-name').value.trim(),
        email:document.getElementById('z-signup-email').value.trim(),
        password:document.getElementById('z-signup-password').value,
        inviter_id:document.getElementById('z-inviter-id').value.trim()||null
      });
      document.getElementById('z-login-id').value=x.id;
      this.showGate('login');
      this.msg(`تم إنشاء الحساب. ID الخاص بك: ${x.id}`);
    }catch(e){this.msg(e.message,true)}
  }

  msg(t,err=false){
    const el=document.getElementById('z-auth-msg');
    if(el){el.textContent=t;el.style.color=err?'#fb7185':'#67e8f9';}
  }

  async loadProfile(userId=null){
    const sb=this.ensureSupabase();
    if(!sb) throw new Error('Supabase غير مربوط');
    let uid=userId;
    if(!uid){
      const {data:{user},error:ue}=await sb.auth.getUser();
      if(ue||!user) throw new Error('تعذر قراءة جلسة الحساب');
      uid=user.id;
    }
    const {data,error}=await sb.from('profiles').select('*').eq('id',uid).maybeSingle();
    if(error) throw new Error(error.message||'تعذر قراءة بيانات الحساب');
    if(!data) throw new Error('لم يتم العثور على ملف الحساب');
    this.profile=data;
    this.guest=false;
    this.paint();
    this.startTimer();
    this.syncRoomIdentity();
    return data;
  }

  profileName(){
    return this.profile?.name || this.profile?.display_name || this.profile?.username || 'مستخدم';
  }

  profileAvatar(){
    return this.profile?.avatar_url || 'assets/images/logo.jpg';
  }

  syncRoomIdentity(){
    if(!this.profile) return;
    const name=this.profileName(), avatar=this.profileAvatar();
    localStorage.setItem('zilzal_nickname',name);
    localStorage.setItem('zilzal_avatar',avatar);
    if(window.zilzalRooms){
      window.zilzalRooms.nickname=name;
      window.zilzalRooms.avatar=avatar;
    }
  }

  paint(){
    const name=this.profile?this.profileName():'زائر';
    const id=this.profile?.public_id ?? '—';
    const points=Number(this.profile?.points||0).toLocaleString('en-US');
    const nameEl=document.getElementById('side-user-name'), idEl=document.getElementById('side-user-id'), pointsEl=document.getElementById('side-points'), avatarEl=document.getElementById('side-user-avatar');
    if(nameEl) nameEl.textContent=name;
    if(idEl) idEl.textContent=id;
    if(pointsEl) pointsEl.textContent=`${points} 🪙`;
    if(avatarEl){avatarEl.src=this.profile?this.profileAvatar():'assets/images/logo.jpg';avatarEl.alt=name;}
  }

  needAccount(text='هذه الميزة للحسابات المسجلة فقط.'){
    this.closeDrawer();
    this.openModal(`<div class="text-center auth-required-box"><div class="text-5xl mb-3">🔐</div><h3 class="font-bold text-xl">سجّل حسابك أولاً</h3><p class="text-slate-400 mt-2">${this.esc(text)}</p><button id="go-auth-from-modal" class="cyber-button mt-5">تسجيل / إنشاء حساب</button></div>`);
    document.getElementById('go-auth-from-modal')?.addEventListener('click',()=>{this.closeModal();requestAnimationFrame(()=>this.showGate('login'));});
  }

  action(x){
    if(x==='butterfly') return this.openButterfly();
    if(!this.profile) return this.needAccount();
    if(x==='account') return this.openAccount();
    if(x==='invite') return this.openInvite();
    if(x==='support') return this.openModal('<h3 class="text-xl font-bold mb-3">الدعم والمساعدة</h3><p class="text-slate-300">تواصل مع إدارة ZILZAL من الحسابات الرسمية أو أرسل طلب دعم من المنصة.</p>');
    if(x==='saved') return this.openModal('<h3 class="text-xl font-bold">المحفوظات</h3><p class="text-slate-400 mt-3">ستظهر هنا العناصر التي تحفظها.</p>');
    if(x==='notifications') return this.openModal('<h3 class="text-xl font-bold">إشعاراتي</h3><p class="text-slate-400 mt-3">لا توجد إشعارات جديدة.</p>');
  }

  memberSince(){
    if(!this.profile?.created_at) return '—';
    try{return new Intl.DateTimeFormat('ar-IQ',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(this.profile.created_at));}catch(_){return new Date(this.profile.created_at).toLocaleDateString();}
  }

  openAccount(){
    if(!this.profile) return this.needAccount();
    const name=this.esc(this.profileName());
    const email=this.esc(this.profile.contact_email||'');
    const avatar=this.escAttr(this.profileAvatar());
    const points=Number(this.profile.points||0).toLocaleString('en-US');
    const developer=this.profile.role==='developer'?'<span class="account-role">⭐ حساب المطور</span>':'';

    this.openModal(`
      <div class="account-page" dir="rtl">
        <div class="account-head">
          <div class="account-avatar-wrap">
            <img id="account-avatar-preview" class="account-avatar" src="${avatar}" alt="صورة الحساب">
            <button id="account-avatar-btn" class="avatar-edit-btn" title="تعديل الصورة"><i class="fa-solid fa-camera"></i></button>
            <input id="account-avatar-input" type="file" accept="image/*" hidden>
          </div>
          <div class="account-head-info">
            <div class="account-name-line"><h3>${name}</h3>${developer}</div>
            <div class="account-meta">ID: <b>${this.profile.public_id}</b> <span class="fixed-badge">ثابت</span></div>
            <div class="account-meta">عضو منذ <b>${this.memberSince()}</b></div>
          </div>
          <div class="account-points"><span>النقاط الحالية</span><b>🪙 ${points}</b><small>تزيد تلقائياً عند استلام المكافآت</small></div>
        </div>

        <div class="account-fixed-id">
          <span class="id-icon">ID</span>
          <div><b>معرّف الحساب (ID)</b><small>هذا المعرّف ثابت ولا يمكن تغييره</small></div>
          <strong>${this.profile.public_id}</strong>
        </div>

        <div class="account-setting-card">
          <div class="account-setting-title"><i class="fa-solid fa-user"></i><b>تعديل اسم الحساب</b></div>
          <div class="account-field-row"><input id="account-name" value="${name}" maxlength="40"><button id="save-account-name">حفظ</button></div>
        </div>

        <div class="account-setting-card">
          <div class="account-setting-title"><i class="fa-solid fa-envelope"></i><b>تعديل البريد الإلكتروني</b></div>
          <div class="account-field-row"><input id="account-email" type="email" value="${email}" placeholder="example@gmail.com"><button id="save-account-email">حفظ</button></div>
          <small class="account-help">البريد مخصص للتواصل واسترداد الحساب مستقبلاً، ولا يغيّر الـ ID.</small>
        </div>

        <div class="account-setting-card">
          <div class="account-setting-title"><i class="fa-solid fa-lock"></i><b>تغيير كلمة المرور</b></div>
          <div class="account-field-row password-row"><div class="password-wrap"><input id="account-password" type="password" minlength="6" placeholder="اكتب كلمة مرور جديدة"><button id="toggle-account-password" type="button" aria-label="إظهار كلمة المرور"><i class="fa-solid fa-eye"></i></button></div><button id="save-account-password">تغيير</button></div>
          <small class="account-help">لأمان حسابك لا يتم عرض كلمة المرور الحالية؛ زر العين يعرض فقط الكلمة الجديدة التي تكتبها.</small>
        </div>

        <div class="account-setting-card account-coming-soon">
          <div class="account-setting-title"><i class="fa-solid fa-phone"></i><b>رقم الهاتف (اختياري)</b></div>
          <span class="soon-badge">قريباً</span>
          <small class="account-help">سيتم إضافة التسجيل أو التفعيل برقم الهاتف في تحديث لاحق.</small>
        </div>

        <div id="account-status" class="account-status" aria-live="polite"></div>

        <button id="account-logout" class="account-logout"><i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج</button>
      </div>`,'account-feature-card');

    document.getElementById('account-avatar-btn')?.addEventListener('click',()=>document.getElementById('account-avatar-input')?.click());
    document.getElementById('account-avatar-input')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(file)this.uploadAvatar(file);});
    document.getElementById('save-account-name')?.addEventListener('click',()=>this.updateName());
    document.getElementById('save-account-email')?.addEventListener('click',()=>this.updateEmail());
    document.getElementById('save-account-password')?.addEventListener('click',()=>this.updatePassword());
    document.getElementById('toggle-account-password')?.addEventListener('click',()=>this.togglePassword());
    document.getElementById('account-logout')?.addEventListener('click',()=>this.logout());
  }

  accountStatus(text,error=false){
    const el=document.getElementById('account-status');
    if(el){el.textContent=text;el.classList.toggle('error',error);el.classList.toggle('success',!error&&!!text);}
  }

  async updateProfileFields(next={}){
    const name=(next.name??this.profileName()).trim();
    const contact_email=(next.contact_email??this.profile?.contact_email??'').trim()||null;
    const avatar_url=(next.avatar_url??this.profile?.avatar_url??null)||null;
    const {error}=await this.sb.rpc('update_my_profile',{p_name:name,p_contact_email:contact_email,p_avatar_url:avatar_url});
    if(error) throw new Error(this.friendlyDbError(error));
    await this.loadProfile();
  }

  async updateName(){
    const name=document.getElementById('account-name')?.value.trim();
    if(!name) return this.accountStatus('اكتب اسم الحساب أولاً.',true);
    try{this.accountStatus('جاري حفظ الاسم...');await this.updateProfileFields({name});this.accountStatus('تم تحديث اسم الحساب بنجاح ✅');this.paint();}catch(e){this.accountStatus(e.message,true);}
  }

  async updateEmail(){
    const email=document.getElementById('account-email')?.value.trim();
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.accountStatus('اكتب بريداً إلكترونياً صحيحاً.',true);
    try{this.accountStatus('جاري حفظ البريد...');await this.updateProfileFields({contact_email:email});this.accountStatus('تم تحديث البريد الإلكتروني بنجاح ✅');}catch(e){this.accountStatus(e.message,true);}
  }

  togglePassword(){
    const input=document.getElementById('account-password'), icon=document.querySelector('#toggle-account-password i');
    if(!input) return;
    const show=input.type==='password';
    input.type=show?'text':'password';
    icon?.classList.toggle('fa-eye',!show);
    icon?.classList.toggle('fa-eye-slash',show);
  }

  async updatePassword(){
    const password=document.getElementById('account-password')?.value||'';
    if(password.length<6) return this.accountStatus('كلمة المرور يجب أن تكون 6 أحرف على الأقل.',true);
    try{
      this.accountStatus('جاري تغيير كلمة المرور...');
      const {error}=await this.sb.auth.updateUser({password});
      if(error) throw error;
      document.getElementById('account-password').value='';
      this.accountStatus('تم تغيير كلمة المرور بنجاح ✅');
    }catch(e){this.accountStatus(e.message||'تعذر تغيير كلمة المرور.',true);}
  }

  async uploadAvatar(file){
    if(!file.type?.startsWith('image/')) return this.accountStatus('اختر ملف صورة فقط.',true);
    if(file.size>5*1024*1024) return this.accountStatus('حجم الصورة يجب ألا يتجاوز 5MB.',true);
    try{
      this.accountStatus('جاري رفع الصورة...');
      const {data:{user}}=await this.sb.auth.getUser();
      if(!user) throw new Error('انتهت جلسة الدخول، سجّل الدخول من جديد.');
      const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-zA-Z0-9]/g,'').toLowerCase()||'jpg';
      const path=`${user.id}/profile.${ext}`;
      const {error:upError}=await this.sb.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});
      if(upError) throw new Error(this.friendlyDbError(upError));
      const {data:pub}=this.sb.storage.from('avatars').getPublicUrl(path);
      const url=`${pub.publicUrl}?v=${Date.now()}`;
      await this.updateProfileFields({avatar_url:url});
      const img=document.getElementById('account-avatar-preview');if(img)img.src=url;
      this.accountStatus('تم تحديث صورة الحساب ✅');
    }catch(e){this.accountStatus(e.message||'تعذر رفع الصورة.',true);}
  }

  openInvite(){
    this.openModal(`<h3 class="text-xl font-bold">دعوة صديق</h3><p class="text-slate-300 mt-3">أرسل ID الخاص بك لصديقك:</p><div class="reward-timer mt-4">${this.profile.public_id}</div><p class="text-sm text-emerald-300 mt-4">+10 نقاط عند تسجيل حساب جديد بدعوتك<br>+2 نقطة لك كل يوم عندما يستلم المدعو مكافأة الفراشة.</p>`);
  }

  async openButterfly(successText=''){
    if(!this.profile) return this.needAccount('الفراشة اليومية متاحة للمستخدمين المسجلين فقط.');
    const remain=this.remaining();
    this.openModal(`<div class="text-center butterfly-modal"><h3 class="text-xl font-black">🦋 الفراشة اليومية</h3><div class="reward-orb"><span class="butterfly-big">🦋</span></div><div id="reward-modal-timer" class="reward-timer">${remain?this.fmt(remain):'جاهزة'}</div><p class="text-slate-400 text-sm mt-2">المكافأة: 50 نقطة كل 24 ساعة</p>${successText?`<div class="reward-success">${this.esc(successText)}</div>`:''}<button id="claim-butterfly" class="cyber-button mt-5" ${remain?'disabled':''}>${remain?'انتظر انتهاء العداد':'استلام 50 نقطة'}</button></div>`);
    document.getElementById('claim-butterfly')?.addEventListener('click',()=>this.claimButterfly());
  }

  remaining(){
    if(!this.profile?.reward_ready_at) return 0;
    return Math.max(0,new Date(this.profile.reward_ready_at).getTime()-Date.now());
  }
  fmt(ms){const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return [h,m,ss].map(v=>String(v).padStart(2,'0')).join(':');}

  startTimer(){
    clearInterval(this.timer);
    const tick=()=>{
      const r=this.remaining(),el=document.getElementById('butterfly-menu-status');
      if(el)el.textContent=r?this.fmt(r):'50 نقطة جاهزة';
      const m=document.getElementById('reward-modal-timer');if(m)m.textContent=r?this.fmt(r):'جاهزة';
      const btn=document.getElementById('claim-butterfly');
      if(btn&&r<=0){btn.disabled=false;btn.textContent='استلام 50 نقطة';}
    };
    tick();
    this.timer=setInterval(tick,1000);
  }

  async claimButterfly(){
    const btn=document.getElementById('claim-butterfly');
    if(btn){btn.disabled=true;btn.textContent='جاري الاستلام...';}
    try{
      const {error}=await this.sb.rpc('claim_butterfly_reward');
      if(error) throw new Error(this.friendlyDbError(error));
      await this.loadProfile();
      this.openButterfly('تم استلام 50 نقطة وبدأ عداد 24 ساعة من جديد ✅');
    }catch(e){
      alert(e.message);
      if(btn){btn.disabled=false;btn.textContent='استلام 50 نقطة';}
    }
  }

  friendlyDbError(error){
    const msg=String(error?.message||error||'حدث خطأ غير معروف');
    if(/claim_butterfly_reward|update_my_profile|schema cache|PGRST202/i.test(msg)) return 'قاعدة بيانات Supabase تحتاج تحديث v8. شغّل ملف supabase-fix-v8.sql مرة واحدة من SQL Editor.';
    if(/avatars|bucket/i.test(msg)) return 'مخزن صور الحساب غير مفعّل. شغّل ملف supabase-fix-v8.sql في Supabase.';
    return msg;
  }

  async logout(){
    if(this.sb) await this.sb.auth.signOut();
    localStorage.removeItem('zilzal_guest');
    this.profile=null;this.guest=false;clearInterval(this.timer);this.paint();this.closeModal();this.showGate();
  }

  openModal(html,extraClass=''){
    this.closeDrawer();
    const modal=document.getElementById('zilzal-feature-modal'), card=modal?.querySelector('.feature-card'), content=document.getElementById('feature-content');
    if(!modal||!content) return;
    content.innerHTML=html;
    card?.classList.toggle('account-feature-card',extraClass==='account-feature-card');
    modal.classList.remove('hidden');
  }

  closeModal(){
    const modal=document.getElementById('zilzal-feature-modal'), card=modal?.querySelector('.feature-card');
    modal?.classList.add('hidden');
    card?.classList.remove('account-feature-card');
  }

  esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  escAttr(v=''){return this.esc(v);}
}

function bootZilzalAccounts(){
  if(window.zilzalAccounts) return;
  window.zilzalAccounts=new ZilzalAccountSystem();
  window.zilzalAccounts.init();
}

// Do not depend only on window.load; cached/CDN resources can make timing inconsistent on mobile.
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootZilzalAccounts, {once:true});
} else {
  bootZilzalAccounts();
}
