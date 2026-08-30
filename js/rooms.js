/**
 * ZILZAL PLATFORM - PRIVATE CHAT ROOMS ENGINE
 */

class ZilzalRoomsEngine {
  constructor() {
    this.currentRoomId = "general";
    this.nickname = localStorage.getItem("zilzal_nickname") || "زائر زلزال";
    this.avatar = localStorage.getItem("zilzal_avatar") || "⚡";
    this.roomMessages = {};
    this.initRooms();
  }

  initRooms() {
    // Clone initial messages from data
    ZILZAL_DATA.rooms.forEach(room => {
      this.roomMessages[room.id] = [...room.initialMessages];
    });
  }

  getCurrentRoom() {
    return ZILZAL_DATA.rooms.find(r => r.id === this.currentRoomId) || ZILZAL_DATA.rooms[0];
  }

  switchRoom(roomId) {
    if (this.roomMessages[roomId]) {
      this.currentRoomId = roomId;
      this.renderCurrentRoom();
      if (window.zilzalApp) {
        window.zilzalApp.playSound('click');
        window.zilzalApp.showToast(`تم الانتقال إلى ${this.getCurrentRoom().name}`, 'info');
      }
    }
  }

  sendMessage(text) {
    if (!text || text.trim() === '') return;

    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      user: this.nickname,
      avatar: this.avatar,
      time: time,
      text: text.trim(),
      isMe: true
    };

    this.roomMessages[this.currentRoomId].push(newMsg);
    this.renderMessages();
    if (window.zilzalApp) {
      window.zilzalApp.playSound('message');
    }

    // Trigger realistic community bot reply after short delay
    setTimeout(() => {
      this.simulateCommunityResponse(text);
    }, 1500 + Math.random() * 1500);
  }

  simulateCommunityResponse(userText) {
    const responses = [
      { user: "فهد العتيبي", avatar: "🔥", text: "كلامك في الصميم، منصة زلزال رقم 1 فعلاً!" },
      { user: "Cyber_Girl", avatar: "🌸", text: "منور الروم يا غالي، أهلاً بك!" },
      { user: "المطور علي", avatar: "💻", text: "شغالين على ميزات وتحديثات جديدة قريباً جداً 🚀" },
      { user: "جيمر محترف", avatar: "🎮", text: "حد يتحدى في لعبة الفضاء الآن؟" }
    ];

    const randomResp = responses[Math.floor(Math.random() * responses.length)];
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    this.roomMessages[this.currentRoomId].push({
      user: randomResp.user,
      avatar: randomResp.avatar,
      time: time,
      text: randomResp.text,
      isMe: false
    });

    this.renderMessages();
    if (window.zilzalApp) {
      window.zilzalApp.playSound('notification');
    }
  }

  renderCurrentRoom() {
    const room = this.getCurrentRoom();
    const titleEl = document.getElementById('active-room-name');
    const descEl = document.getElementById('active-room-desc');
    const countEl = document.getElementById('active-room-count');
    const tabsContainer = document.getElementById('rooms-tab-list');

    if (titleEl) titleEl.innerHTML = `<i class="${room.icon} text-cyan-400 ml-2"></i> ${room.name}`;
    if (descEl) descEl.textContent = room.desc;
    if (countEl) countEl.textContent = `${room.activeUsers} متصل الآن`;

    if (tabsContainer) {
      tabsContainer.innerHTML = ZILZAL_DATA.rooms.map(r => `
        <button onclick="window.zilzalRooms.switchRoom('${r.id}')" 
          class="flex items-center gap-3 w-full p-3 rounded-xl transition text-right ${r.id === this.currentRoomId ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300' : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'}">
          <span class="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800 text-cyan-400">
            <i class="${r.icon}"></i>
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate">${r.name}</div>
            <div class="text-xs text-slate-400 truncate">${r.activeUsers} عضو نشط</div>
          </div>
          ${r.id === this.currentRoomId ? '<span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]"></span>' : ''}
        </button>
      `).join('');
    }

    this.renderMessages();
  }

  renderMessages() {
    const container = document.getElementById('room-messages-container');
    if (!container) return;

    const msgs = this.roomMessages[this.currentRoomId] || [];
    container.innerHTML = msgs.map(m => `
      <div class="flex items-start gap-3 ${m.isMe ? 'flex-row-reverse' : ''} animate-fadeIn">
        <div class="w-10 h-10 rounded-xl bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
          ${m.avatar}
        </div>
        <div class="max-w-[75%]">
          <div class="flex items-center gap-2 mb-1 ${m.isMe ? 'justify-end' : ''}">
            <span class="text-xs font-bold ${m.isMod ? 'text-amber-400 flex items-center gap-1' : (m.isMe ? 'text-cyan-400' : 'text-slate-300')}">
              ${m.isMod ? '<i class="fa-solid fa-crown text-xs text-amber-400"></i>' : ''}
              ${m.user}
            </span>
            <span class="text-[10px] text-slate-500">${m.time}</span>
          </div>
          <div class="p-3 rounded-2xl text-sm leading-relaxed ${m.isMe ? 'chat-bubble-me' : 'chat-bubble-bot'}">
            ${m.text}
          </div>
        </div>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }
}

window.zilzalRooms = new ZilzalRoomsEngine();
