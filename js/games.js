/**
 * ZILZAL PLATFORM - MINI-GAMES SUITE
 * 1. Zilzal Space Defender (Canvas 2D Shooter)
 * 2. Zilzal 2048 Neon
 * 3. Neon Tic-Tac-Toe vs AI
 */

class ZilzalGamesEngine {
  constructor() {
    this.activeGame = "space";
    this.spaceGame = null;
    this.game2048 = null;
    this.tttGame = null;
  }

  init() {
    this.initSpaceGame();
    this.init2048();
    this.initTicTacToe();
  }

  // ==========================================
  // GAME 1: ZILZAL SPACE DEFENDER
  // ==========================================
  initSpaceGame() {
    const canvas = document.getElementById('space-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stage = document.getElementById('space-stage');

    const state = {
      running: false,
      score: 0,
      highScore: parseInt(localStorage.getItem('zilzal_space_highscore') || '0'),
      player: { x: 200, y: 340, w: 32, h: 32, speed: 6 },
      lasers: [],
      asteroids: [],
      particles: [],
      keys: {},
      lastSpawn: 0
    };

    const reset = () => {
      state.score = 0;
      state.player.x = canvas.width / 2 - 16;
      state.player.y = canvas.height - 50;
      state.lasers = [];
      state.asteroids = [];
      state.particles = [];
      state.running = true;
      document.getElementById('space-score').textContent = '0';
      document.getElementById('space-gameover').classList.add('hidden');
    };

    const spawnAsteroid = () => {
      const size = 20 + Math.random() * 25;
      state.asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        size: size,
        speed: 1.5 + Math.random() * 3,
        rot: 0,
        vRot: (Math.random() - 0.5) * 0.08
      });
    };

    const shoot = () => {
      if (!state.running) return;
      state.lasers.push({
        x: state.player.x + state.player.w / 2 - 2,
        y: state.player.y,
        w: 4,
        h: 14,
        speed: 9
      });
      if (window.zilzalApp) window.zilzalApp.playSound('laser');
    };

    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
      state.keys[e.code] = true;
      if (e.code === 'Space' && state.running) {
        e.preventDefault();
        shoot();
      }
    });

    window.addEventListener('keyup', (e) => {
      state.keys[e.code] = false;
    });

    // Touch / Button controls
    const btnLeft = document.getElementById('btn-space-left');
    const btnRight = document.getElementById('btn-space-right');
    const btnFire = document.getElementById('btn-space-fire');

    if (btnLeft) {
      btnLeft.onmousedown = () => state.keys['ArrowLeft'] = true;
      btnLeft.onmouseup = () => state.keys['ArrowLeft'] = false;
      btnLeft.ontouchstart = () => state.keys['ArrowLeft'] = true;
      btnLeft.ontouchend = () => state.keys['ArrowLeft'] = false;
    }
    if (btnRight) {
      btnRight.onmousedown = () => state.keys['ArrowRight'] = true;
      btnRight.onmouseup = () => state.keys['ArrowRight'] = false;
      btnRight.ontouchstart = () => state.keys['ArrowRight'] = true;
      btnRight.ontouchend = () => state.keys['ArrowRight'] = false;
    }
    if (btnFire) {
      btnFire.onclick = () => shoot();
    }

    // Modern direct-touch movement: drag ship anywhere horizontally; multi-touch fire stays available.
    let dragPointer = null;
    const moveFromClientX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      state.player.x = Math.max(0, Math.min(canvas.width-state.player.w, (clientX-rect.left)*scaleX-state.player.w/2));
    };
    canvas.addEventListener('pointerdown', e => { dragPointer=e.pointerId; canvas.setPointerCapture?.(e.pointerId); moveFromClientX(e.clientX); e.preventDefault(); });
    canvas.addEventListener('pointermove', e => { if(e.pointerId===dragPointer){moveFromClientX(e.clientX);e.preventDefault();} });
    canvas.addEventListener('pointerup', e => { if(e.pointerId===dragPointer) dragPointer=null; });
    canvas.addEventListener('touchmove', e => e.preventDefault(), {passive:false});

    const enterFull = () => { stage?.classList.add('space-fullscreen'); document.body.classList.add('game-lock'); document.getElementById('space-exit-x')?.classList.remove('hidden'); reset(); };
    const exitFull = () => { stage?.classList.remove('space-fullscreen'); document.body.classList.remove('game-lock'); document.getElementById('space-exit-x')?.classList.add('hidden'); };
    document.getElementById('space-fullscreen-open')?.addEventListener('click', enterFull);
    document.getElementById('space-exit-x')?.addEventListener('click', exitFull);

    const update = () => {
      if (!state.running) return;

      // Player Movement
      if (state.keys['ArrowLeft'] || state.keys['KeyA']) {
        state.player.x = Math.max(10, state.player.x - state.player.speed);
      }
      if (state.keys['ArrowRight'] || state.keys['KeyD']) {
        state.player.x = Math.min(canvas.width - state.player.w - 10, state.player.x + state.player.speed);
      }

      // Update Lasers
      for (let i = state.lasers.length - 1; i >= 0; i--) {
        const l = state.lasers[i];
        l.y -= l.speed;
        if (l.y < -20) state.lasers.splice(i, 1);
      }

      // Spawn Asteroids
      if (Date.now() - state.lastSpawn > 900) {
        spawnAsteroid();
        state.lastSpawn = Date.now();
      }

      // Update Asteroids & Collisions
      for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const a = state.asteroids[i];
        a.y += a.speed;
        a.rot += a.vRot;

        // Collision with lasers
        for (let j = state.lasers.length - 1; j >= 0; j--) {
          const l = state.lasers[j];
          if (l.x < a.x + a.size && l.x + l.w > a.x && l.y < a.y + a.size && l.y + l.h > a.y) {
            // Destroyed!
            state.score += 50;
            document.getElementById('space-score').textContent = state.score;
            if (state.score > state.highScore) {
              state.highScore = state.score;
              localStorage.setItem('zilzal_space_highscore', state.highScore);
              document.getElementById('space-highscore').textContent = state.highScore;
            }

            // Particles
            for (let p = 0; p < 8; p++) {
              state.particles.push({
                x: a.x + a.size / 2,
                y: a.y + a.size / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                color: '#00f0ff'
              });
            }

            state.asteroids.splice(i, 1);
            state.lasers.splice(j, 1);
            if (window.zilzalApp) window.zilzalApp.playSound('hit');
            break;
          }
        }

        // Collision with Player
        if (a.y + a.size > state.player.y && a.x < state.player.x + state.player.w && a.x + a.size > state.player.x) {
          state.running = false;
          document.getElementById('space-final-score').textContent = state.score;
          document.getElementById('space-gameover').classList.remove('hidden');
          if (window.zilzalApp) window.zilzalApp.playSound('gameover');
          return;
        }

        if (a.y > canvas.height + 30) state.asteroids.splice(i, 1);
      }

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
    };

    const draw = () => {
      ctx.fillStyle = '#050813';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background stars
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 25; s++) {
        const sx = (s * 37 + Date.now() * 0.05) % canvas.width;
        const sy = (s * 43) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Lasers
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      state.lasers.forEach(l => {
        ctx.fillRect(l.x, l.y, l.w, l.h);
      });

      // Draw Particles
      state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      });

      // Draw Asteroids
      state.asteroids.forEach(a => {
        ctx.save();
        ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
        ctx.rotate(a.rot);
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.rect(-a.size / 2, -a.size / 2, a.size, a.size);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Draw Player Ship
      ctx.save();
      ctx.translate(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2);
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 14);
      ctx.lineTo(0, 8);
      ctx.lineTo(-16, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Thruster Flame
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.moveTo(-6, 9);
      ctx.lineTo(0, 18 + Math.random() * 6);
      ctx.lineTo(6, 9);
      ctx.fill();
      ctx.restore();

      ctx.shadowBlur = 0;
    };

    const loop = () => {
      update();
      draw();
      requestAnimationFrame(loop);
    };

    document.getElementById('btn-space-start').onclick = reset;
    document.getElementById('btn-space-restart').onclick = reset;
    document.getElementById('space-highscore').textContent = state.highScore;

    reset();
    loop();
  }

  // ==========================================
  // GAME 2: ZILZAL 2048 NEON
  // ==========================================
  init2048() {
    const gridEl = document.getElementById('grid-2048');
    if (!gridEl) return;

    let board = Array(16).fill(0);
    let score = 0;
    let best = parseInt(localStorage.getItem('zilzal_2048_best') || '0');

    const spawn = () => {
      const empty = [];
      board.forEach((val, i) => { if (val === 0) empty.push(i); });
      if (empty.length > 0) {
        const randomIdx = empty[Math.floor(Math.random() * empty.length)];
        board[randomIdx] = Math.random() > 0.1 ? 2 : 4;
      }
    };

    const render = () => {
      gridEl.innerHTML = '';
      const colors = {
        0: 'bg-slate-800/50 text-transparent',
        2: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]',
        4: 'bg-blue-950/80 text-blue-300 border border-blue-500/40',
        8: 'bg-purple-950/80 text-purple-300 border border-purple-500/40',
        16: 'bg-pink-950/80 text-pink-300 border border-pink-500/40',
        32: 'bg-rose-950/80 text-rose-300 border border-rose-500/40',
        64: 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
        128: 'bg-yellow-950/90 text-yellow-300 border border-yellow-400 shadow-[0_0_15px_#f59e0b]',
        256: 'bg-emerald-950/90 text-emerald-300 border border-emerald-400',
        512: 'bg-cyan-900 text-cyan-200 border border-cyan-300',
        1024: 'bg-purple-900 text-purple-200 border border-purple-300',
        2048: 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-extrabold shadow-[0_0_25px_#00f0ff]'
      };

      board.forEach(val => {
        const cell = document.createElement('div');
        cell.className = `cell-2048 ${colors[val] || 'bg-cyan-500 text-white'}`;
        cell.textContent = val > 0 ? val : '';
        gridEl.appendChild(cell);
      });

      document.getElementById('score-2048').textContent = score;
      document.getElementById('best-2048').textContent = best;
    };

    const slide = (row) => {
      let arr = row.filter(v => v !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          score += arr[i];
          arr.splice(i + 1, 1);
        }
      }
      while (arr.length < 4) arr.push(0);
      return arr;
    };

    const move = (direction) => {
      let changed = false;
      let newBoard = [...board];

      if (direction === 'LEFT' || direction === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
          let row = [board[r * 4], board[r * 4 + 1], board[r * 4 + 2], board[r * 4 + 3]];
          if (direction === 'RIGHT') row.reverse();
          let newRow = slide(row);
          if (direction === 'RIGHT') newRow.reverse();
          for (let c = 0; c < 4; c++) newBoard[r * 4 + c] = newRow[c];
        }
      } else if (direction === 'UP' || direction === 'DOWN') {
        for (let c = 0; c < 4; c++) {
          let col = [board[c], board[c + 4], board[c + 8], board[c + 12]];
          if (direction === 'DOWN') col.reverse();
          let newCol = slide(col);
          if (direction === 'DOWN') newCol.reverse();
          for (let r = 0; r < 4; r++) newBoard[r * 4 + c] = newCol[r];
        }
      }

      if (JSON.stringify(board) !== JSON.stringify(newBoard)) {
        board = newBoard;
        spawn();
        if (score > best) {
          best = score;
          localStorage.setItem('zilzal_2048_best', best);
        }
        render();
        if (window.zilzalApp) window.zilzalApp.playSound('click');
      }
    };

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) move('UP');
      if (['ArrowDown', 'KeyS'].includes(e.code)) move('DOWN');
      if (['ArrowLeft', 'KeyA'].includes(e.code)) move('LEFT');
      if (['ArrowRight', 'KeyD'].includes(e.code)) move('RIGHT');
    });

    document.getElementById('btn-2048-reset').onclick = () => {
      board = Array(16).fill(0);
      score = 0;
      spawn();
      spawn();
      render();
    };

    spawn();
    spawn();
    render();
  }

  // ==========================================
  // GAME 3: TIC-TAC-TOE VS SMART AI
  // ==========================================
  initTicTacToe() {
    const cells = document.querySelectorAll('.ttt-cell');
    let board = Array(9).fill(null);
    let player = 'X';
    let isGameOver = false;
    let scores = { player: 0, ai: 0, ties: 0 };

    const winCombos = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    const checkWin = (b, p) => {
      return winCombos.some(combo => combo.every(idx => b[idx] === p));
    };

    const renderBoard = () => {
      cells.forEach((cell, idx) => {
        cell.textContent = board[idx] || '';
        cell.className = 'ttt-cell aspect-square rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-center text-4xl font-extrabold cursor-pointer transition hover:border-cyan-400';
        if (board[idx] === 'X') {
          cell.classList.add('text-cyan-400', 'shadow-[0_0_15px_rgba(0,240,255,0.3)]');
        } else if (board[idx] === 'O') {
          cell.classList.add('text-pink-500', 'shadow-[0_0_15px_rgba(255,0,127,0.3)]');
        }
      });
    };

    const aiMove = () => {
      if (isGameOver) return;
      const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
      if (emptyIndices.length === 0) return;

      // Smart decision: Win or Block
      let chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      for (const idx of emptyIndices) {
        const copy = [...board];
        copy[idx] = 'O';
        if (checkWin(copy, 'O')) { chosen = idx; break; }
      }
      for (const idx of emptyIndices) {
        const copy = [...board];
        copy[idx] = 'X';
        if (checkWin(copy, 'X')) { chosen = idx; break; }
      }

      board[chosen] = 'O';
      if (checkWin(board, 'O')) {
        isGameOver = true;
        scores.ai++;
        document.getElementById('ttt-ai-score').textContent = scores.ai;
        document.getElementById('ttt-status').textContent = '🤖 فاز الذكاء الاصطناعي!';
      } else if (board.every(v => v !== null)) {
        isGameOver = true;
        scores.ties++;
        document.getElementById('ttt-ties-score').textContent = scores.ties;
        document.getElementById('ttt-status').textContent = '🤝 تعادل!';
      }
      renderBoard();
    };

    cells.forEach((cell, idx) => {
      cell.onclick = () => {
        if (board[idx] || isGameOver) return;
        board[idx] = 'X';
        if (checkWin(board, 'X')) {
          isGameOver = true;
          scores.player++;
          document.getElementById('ttt-player-score').textContent = scores.player;
          document.getElementById('ttt-status').textContent = '🎉 مبروك! لقد فزت!';
          if (window.zilzalApp) window.zilzalApp.playSound('victory');
        } else if (board.every(v => v !== null)) {
          isGameOver = true;
          scores.ties++;
          document.getElementById('ttt-ties-score').textContent = scores.ties;
          document.getElementById('ttt-status').textContent = '🤝 تعادل!';
        } else {
          setTimeout(aiMove, 300);
        }
        renderBoard();
      };
    });

    document.getElementById('btn-ttt-reset').onclick = () => {
      board = Array(9).fill(null);
      isGameOver = false;
      document.getElementById('ttt-status').textContent = 'دورك (X) - اضغط على أي خانة';
      renderBoard();
    };
  }
}

window.zilzalGames = new ZilzalGamesEngine();
