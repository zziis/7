(function(){
  const API='https://api.themoviedb.org/3';
  const IMG='https://image.tmdb.org/t/p/';
  class ZilzalTMDB {
    constructor(){
      this.token=localStorage.getItem('zilzal_tmdb_token')||'';
      this.state={movie:{page:1,mode:'trending',query:'',genre:''},tv:{page:1,mode:'trending',query:'',genre:''}};
      this.genres={movie:[],tv:[]};
      this.cache=new Map();
      this.bind();
      this.updateStatus();
      if(this.token) this.bootstrap(); else this.renderFallback();
    }
    bind(){
      const save=document.getElementById('tmdb-save-token');
      const clear=document.getElementById('tmdb-clear-token');
      const input=document.getElementById('tmdb-token-input');
      if(input) input.value=this.token;
      save?.addEventListener('click',async()=>{
        const v=(input?.value||'').trim();
        if(!v) return window.zilzalApp?.showToast('أدخل TMDB Read Access Token أولًا','info');
        this.token=v; localStorage.setItem('zilzal_tmdb_token',v); this.updateStatus('checking');
        try{await this.request('/configuration'); this.updateStatus('live'); window.zilzalApp?.showToast('تم ربط TMDB بنجاح','success'); await this.bootstrap();}
        catch(e){this.updateStatus('error'); window.zilzalApp?.showToast('تعذر التحقق من المفتاح','info');}
      });
      clear?.addEventListener('click',()=>{this.token='';localStorage.removeItem('zilzal_tmdb_token');if(input)input.value='';this.updateStatus();this.renderFallback();});
      this.bindMedia('movie'); this.bindMedia('tv');
    }
    bindMedia(type){
      const p=type==='movie'?'movie':'series';
      const search=document.getElementById(`${p}-search-input`);
      let timer;
      search?.addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>{this.state[type].query=e.target.value.trim();this.state[type].page=1;this.load(type);},450)});
      document.getElementById(`${p}-genre-select`)?.addEventListener('change',e=>{this.state[type].genre=e.target.value;this.state[type].page=1;this.state[type].query='';if(search)search.value='';this.load(type)});
      document.getElementById(`${p}-trending-btn`)?.addEventListener('click',()=>{this.setMode(type,'trending')});
      document.getElementById(`${p}-top-btn`)?.addEventListener('click',()=>{this.setMode(type,'top')});
      document.querySelectorAll(`#${p}-pagination button`).forEach(b=>b.addEventListener('click',()=>{let pg=this.state[type].page+(b.dataset.dir==='next'?1:-1);if(pg<1)return;this.state[type].page=pg;this.load(type);window.scrollTo({top:0,behavior:'smooth'});}));
    }
    setMode(type,mode){
      this.state[type].mode=mode;this.state[type].page=1;this.state[type].query='';
      const p=type==='movie'?'movie':'series'; const input=document.getElementById(`${p}-search-input`); if(input)input.value='';
      document.getElementById(`${p}-trending-btn`)?.classList.toggle('active',mode==='trending');
      document.getElementById(`${p}-top-btn`)?.classList.toggle('active',mode==='top');
      this.load(type);
    }
    updateStatus(state){
      const badge=document.getElementById('tmdb-status-badge');
      if(badge){badge.classList.remove('text-emerald-300','text-rose-300'); if(state==='live'){badge.textContent='متصل بـ TMDB';badge.classList.add('text-emerald-300')} else if(state==='checking'){badge.textContent='جاري التحقق...'} else if(state==='error'){badge.textContent='المفتاح غير صالح';badge.classList.add('text-rose-300')} else badge.textContent='غير مربوط';}
      ['movies-source-label','series-source-label'].forEach(id=>{const e=document.getElementById(id);if(!e)return;e.classList.toggle('live',!!this.token);e.textContent=this.token?'● بيانات TMDB مباشرة':'وضع العرض التجريبي';});
    }
    async request(path,params={}){
      if(!this.token) throw new Error('NO_TOKEN');
      const url=new URL(API+path); Object.entries({...params,language:'ar-IQ'}).forEach(([k,v])=>v!==''&&v!=null&&url.searchParams.set(k,v));
      const r=await fetch(url,{headers:{Authorization:`Bearer ${this.token}`,Accept:'application/json'}}); if(!r.ok) throw new Error(`TMDB ${r.status}`); return r.json();
    }
    async bootstrap(){
      this.updateStatus('live');
      try{
        const [mg,tg]=await Promise.all([this.request('/genre/movie/list'),this.request('/genre/tv/list')]);
        this.genres.movie=mg.genres||[];this.genres.tv=tg.genres||[];this.fillGenres('movie');this.fillGenres('tv');
        await Promise.all([this.load('movie'),this.load('tv')]);
      }catch(e){console.error(e);this.renderError('movie');this.renderError('tv');}
    }
    fillGenres(type){
      const id=type==='movie'?'movie-genre-select':'series-genre-select',sel=document.getElementById(id); if(!sel)return;
      sel.innerHTML='<option value="">كل التصنيفات</option>'+this.genres[type].map(g=>`<option value="${g.id}">${this.escape(g.name)}</option>`).join('');
    }
    async load(type){
      if(!this.token) return this.renderFallback();
      const grid=document.getElementById(type==='movie'?'movies-grid':'series-grid'); if(!grid)return;
      grid.innerHTML='<div class="media-loading"><div><i class="fa-solid fa-circle-notch fa-spin text-2xl text-cyan-400 mb-3"></i><p>جاري جلب المحتوى الحقيقي...</p></div></div>';
      const st=this.state[type]; let path,params={page:st.page};
      if(st.query){path=`/search/${type}`;params.query=st.query;}
      else if(st.genre){path=`/discover/${type}`;params.with_genres=st.genre;params.sort_by=st.mode==='top'?'vote_average.desc':'popularity.desc';if(st.mode==='top')params['vote_count.gte']=300;}
      else if(st.mode==='top'){path=`/${type}/top_rated`;}
      else {path=`/trending/${type}/week`;}
      try{const data=await this.request(path,params);this.renderGrid(type,data.results||[]);this.renderPagination(type,data.page||1,Math.min(data.total_pages||1,500));}
      catch(e){console.error(e);this.renderError(type);}
    }
    renderGrid(type,items){
      const grid=document.getElementById(type==='movie'?'movies-grid':'series-grid');if(!grid)return;
      if(!items.length){grid.innerHTML='<div class="media-empty"><div><i class="fa-regular fa-folder-open text-3xl mb-3"></i><p>لا توجد نتائج.</p></div></div>';return;}
      grid.innerHTML=items.map(x=>{
        const title=type==='movie'?(x.title||x.original_title):(x.name||x.original_name),date=type==='movie'?x.release_date:x.first_air_date,year=(date||'').slice(0,4)||'—';
        const poster=x.poster_path?`${IMG}w500${x.poster_path}`:'assets/images/logo.jpg'; const score=x.vote_average?Number(x.vote_average).toFixed(1):'—';
        return `<article class="cinema-card" data-id="${x.id}" data-type="${type}"><div class="cinema-poster"><img src="${poster}" loading="lazy" alt="${this.escape(title)}"><span class="cinema-score"><i class="fa-solid fa-star"></i> ${score}</span><span class="cinema-type">${type==='movie'?'فيلم':'مسلسل'}</span></div><div class="cinema-info"><div class="cinema-title">${this.escape(title)}</div><div class="cinema-meta"><span>${year}</span><span>${x.original_language?.toUpperCase()||''}</span></div></div></article>`;
      }).join('');
      grid.querySelectorAll('.cinema-card').forEach(c=>c.onclick=()=>this.openDetails(c.dataset.type,Number(c.dataset.id)));
    }
    renderPagination(type,page,total){
      const p=document.getElementById(type==='movie'?'movies-pagination':'series-pagination');if(!p)return;p.classList.remove('hidden');p.querySelector('span').textContent=`${page} / ${total}`;const bs=p.querySelectorAll('button');bs[0].disabled=page<=1;bs[1].disabled=page>=total;
    }
    async openDetails(type,id){
      const modal=document.getElementById('media-modal'),content=document.getElementById('modal-content'); if(!modal||!content)return;
      modal.classList.add('active');content.innerHTML='<div class="media-loading"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-cyan-400"></i></div>';
      try{
        const d=await this.request(`/${type}/${id}`,{append_to_response:'videos,credits'});this.addRecent(type,d);
        const title=type==='movie'?(d.title||d.original_title):(d.name||d.original_name),date=type==='movie'?d.release_date:d.first_air_date,back=d.backdrop_path?`${IMG}w1280${d.backdrop_path}`:(d.poster_path?`${IMG}w780${d.poster_path}`:'assets/images/logo.jpg');
        const trailer=(d.videos?.results||[]).find(v=>v.site==='YouTube'&&(v.type==='Trailer'||v.type==='Teaser'));
        const cast=(d.credits?.cast||[]).slice(0,8);const fav=this.isFavorite(type,id);
        content.innerHTML=`<div class="tmdb-detail-hero"><img src="${back}" alt=""><button onclick="window.zilzalApp.closeModal()" class="absolute z-10 top-4 left-4 w-9 h-9 rounded-full bg-slate-950/80 text-white"><i class="fa-solid fa-xmark"></i></button></div><div class="tmdb-detail-content"><div class="flex flex-wrap gap-2 text-xs mb-2"><span class="cyber-pill">${type==='movie'?'فيلم':'مسلسل'}</span><span class="text-amber-400"><i class="fa-solid fa-star"></i> ${Number(d.vote_average||0).toFixed(1)}</span><span class="text-slate-400">${(date||'').slice(0,4)}</span>${type==='movie'&&d.runtime?`<span class="text-slate-400">${d.runtime} دقيقة</span>`:''}</div><h2 class="text-2xl font-black text-white">${this.escape(title)}</h2><p class="text-sm text-slate-300 leading-7 mt-3">${this.escape(d.overview||'لا يوجد وصف عربي متوفر حاليًا.')}</p><div class="tmdb-actions">${trailer?`<button class="tmdb-action primary" onclick="window.open('https://www.youtube.com/watch?v=${trailer.key}','_blank')"><i class="fa-solid fa-play"></i> مشاهدة التريلر</button>`:''}<button id="tmdb-favorite-btn" class="tmdb-action"><i class="fa-${fav?'solid':'regular'} fa-heart"></i> ${fav?'إزالة من المفضلة':'إضافة للمفضلة'}</button></div><div class="flex flex-wrap gap-2 mb-5">${(d.genres||[]).map(g=>`<span class="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300">${this.escape(g.name)}</span>`).join('')}</div>${cast.length?`<h3 class="text-xs font-bold text-cyan-300 mb-3">أبرز الممثلين</h3><div class="cast-strip">${cast.map(c=>`<div class="cast-chip"><img src="${c.profile_path?IMG+'w185'+c.profile_path:'assets/images/logo.jpg'}"><span>${this.escape(c.name)}</span></div>`).join('')}</div>`:''}<p class="text-[10px] text-slate-600 mt-5">المعلومات والصور مقدمة من TMDB. المنصة تعرض البيانات والتريلرات ولا تستضيف الفيلم أو الحلقة نفسها.</p></div>`;
        document.getElementById('tmdb-favorite-btn')?.addEventListener('click',()=>{this.toggleFavorite(type,d);this.openDetails(type,id)});
      }catch(e){content.innerHTML='<div class="media-empty"><div><p>تعذر تحميل التفاصيل.</p><button onclick="window.zilzalApp.closeModal()" class="mt-4 tmdb-action">إغلاق</button></div></div>';}
    }
    favorites(){try{return JSON.parse(localStorage.getItem('zilzal_media_favs')||'[]')}catch{return[]}}
    isFavorite(type,id){return this.favorites().some(x=>x.type===type&&Number(x.id)===Number(id))}
    toggleFavorite(type,d){let a=this.favorites();const i=a.findIndex(x=>x.type===type&&Number(x.id)===Number(d.id));if(i>=0)a.splice(i,1);else a.unshift({type,id:d.id,title:type==='movie'?(d.title||d.original_title):(d.name||d.original_name),poster_path:d.poster_path});localStorage.setItem('zilzal_media_favs',JSON.stringify(a.slice(0,100)));}
    addRecent(type,d){let a=[];try{a=JSON.parse(localStorage.getItem('zilzal_media_recent')||'[]')}catch{}a=a.filter(x=>!(x.type===type&&Number(x.id)===Number(d.id)));a.unshift({type,id:d.id,title:type==='movie'?(d.title||d.original_title):(d.name||d.original_name),poster_path:d.poster_path,at:Date.now()});localStorage.setItem('zilzal_media_recent',JSON.stringify(a.slice(0,30)));}
    renderFallback(){
      this.updateStatus();
      const mg=document.getElementById('movies-grid'),sg=document.getElementById('series-grid');
      if(mg) mg.innerHTML=(window.ZILZAL_DATA?.movies||[]).map(m=>`<article class="cinema-card"><div class="cinema-poster"><img src="${m.image}"><span class="cinema-score"><i class="fa-solid fa-star"></i> ${m.rating}</span><span class="cinema-type">تجريبي</span></div><div class="cinema-info"><div class="cinema-title">${this.escape(m.arabicTitle)}</div><div class="cinema-meta"><span>${m.year}</span><span>اربط TMDB</span></div></div></article>`).join('')+'<div class="media-empty"><div><i class="fa-solid fa-link text-2xl text-cyan-400 mb-2"></i><p>لإظهار أفلام حقيقية افتح الإعدادات وأدخل TMDB Read Access Token.</p></div></div>';
      if(sg) sg.innerHTML=(window.ZILZAL_DATA?.series||[]).map(s=>`<article class="cinema-card"><div class="cinema-poster"><img src="${s.image}"><span class="cinema-score"><i class="fa-solid fa-star"></i> ${s.rating}</span><span class="cinema-type">تجريبي</span></div><div class="cinema-info"><div class="cinema-title">${this.escape(s.arabicTitle)}</div><div class="cinema-meta"><span>${s.seasons}</span><span>اربط TMDB</span></div></div></article>`).join('')+'<div class="media-empty"><div><i class="fa-solid fa-link text-2xl text-pink-400 mb-2"></i><p>لإظهار مسلسلات حقيقية اربط TMDB من الإعدادات.</p></div></div>';
    }
    renderError(type){const g=document.getElementById(type==='movie'?'movies-grid':'series-grid');if(g)g.innerHTML='<div class="media-empty"><div><i class="fa-solid fa-triangle-exclamation text-2xl text-amber-400 mb-3"></i><p>تعذر جلب البيانات. تحقق من اتصال الإنترنت وTMDB Token.</p></div></div>'}
    escape(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
  }
  document.addEventListener('DOMContentLoaded',()=>{window.zilzalTMDB=new ZilzalTMDB();});
})();
