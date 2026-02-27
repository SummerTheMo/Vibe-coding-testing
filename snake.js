(() => {
  const CELL = 20;          // px per grid cell
  const COLS = 20;          // grid columns  (400 / 20)
  const ROWS = 20;          // grid rows     (400 / 20)
  const BASE_INTERVAL = 150; // ms between ticks at start
  const MIN_INTERVAL = 60;   // fastest speed

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-message');
  const startBtn = document.getElementById('start-btn');

  // ── State ────────────────────────────────────────────────────────────
  let snake, direction, nextDirection, food, score, highScore, loopId, paused;

  highScore = 0;

  // ── Helpers ──────────────────────────────────────────────────────────
  function rand(max) {
    return Math.floor(Math.random() * max);
  }

  function spawnFood() {
    let pos;
    do {
      pos = { x: rand(COLS), y: rand(ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function currentInterval() {
    // Speed increases as score grows, capped at MIN_INTERVAL
    return Math.max(MIN_INTERVAL, BASE_INTERVAL - score * 2);
  }

  // ── Init / Reset ─────────────────────────────────────────────────────
  function initGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9,  y: 10 },
      { x: 8,  y: 10 },
    ];
    direction     = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score         = 0;
    paused        = false;
    scoreEl.textContent = 0;
    food = spawnFood();
  }

  // ── Game Loop ─────────────────────────────────────────────────────────
  function tick() {
    if (paused) return schedule();

    direction = nextDirection;

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }

    // Self collision (skip tail tip because it will move away)
    if (snake.slice(0, -1).some(s => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
      }
      food = spawnFood();
    } else {
      snake.pop();
    }

    draw();
    schedule();
  }

  function schedule() {
    loopId = setTimeout(tick, currentInterval());
  }

  // ── Drawing ───────────────────────────────────────────────────────────
  function draw() {
    // Background
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(canvas.width, r * CELL);
      ctx.stroke();
    }

    // Snake
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.fillStyle = isHead ? '#22c55e' : '#4ade80';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur  = isHead ? 10 : 4;
      const padding = isHead ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL + padding,
        seg.y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
        isHead ? 4 : 3
      );
      ctx.fill();
    });

    ctx.shadowBlur = 0;

    // Food
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    ctx.fillStyle = '#f87171';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Paused indicator
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }
  }

  // ── Game Over ─────────────────────────────────────────────────────────
  function gameOver() {
    clearTimeout(loopId);
    overlayTitle.textContent = 'Game Over';
    overlayMsg.textContent   = `Your score: ${score}`;
    startBtn.textContent     = 'Play Again';
    overlay.classList.remove('hidden');
  }

  // ── Start ─────────────────────────────────────────────────────────────
  function startGame() {
    clearTimeout(loopId);
    initGame();
    draw();
    overlay.classList.add('hidden');
    schedule();
  }

  // ── Input ─────────────────────────────────────────────────────────────
  const KEY_MAP = {
    ArrowUp:    { x:  0, y: -1 },
    ArrowDown:  { x:  0, y:  1 },
    ArrowLeft:  { x: -1, y:  0 },
    ArrowRight: { x:  1, y:  0 },
    w: { x:  0, y: -1 },
    s: { x:  0, y:  1 },
    a: { x: -1, y:  0 },
    d: { x:  1, y:  0 },
    W: { x:  0, y: -1 },
    S: { x:  0, y:  1 },
    A: { x: -1, y:  0 },
    D: { x:  1, y:  0 },
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P') {
      if (!overlay.classList.contains('hidden')) return;
      paused = !paused;
      if (!paused) {
        draw();
        schedule();
      } else {
        clearTimeout(loopId);
        draw();
      }
      return;
    }

    const dir = KEY_MAP[e.key];
    if (!dir) return;

    // Prevent reversing directly
    if (dir.x !== 0 && dir.x === -direction.x) return;
    if (dir.y !== 0 && dir.y === -direction.y) return;

    nextDirection = dir;
    e.preventDefault();
  });

  startBtn.addEventListener('click', startGame);

  // ── Initial draw ──────────────────────────────────────────────────────
  // Draw empty board behind the overlay
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
})();
