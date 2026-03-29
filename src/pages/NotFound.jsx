import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const SURFACE = '#F8F9FB';
const BORDER = '#E5E7EB';

const GAME_W = 400;
const GAME_H = 500;
const PADDLE_W = 70;
const PADDLE_H = 14;
const KEY_SIZE = 28;
const SPAWN_INTERVAL = 900;
const FALL_SPEED = 2.5;

const EMOJIS = ['🔑', '🏠', '🛋️', '🏡'];
const BOMB_EMOJI = '💣';

export default function NotFound() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const gameRef = useRef({
    paddleX: GAME_W / 2 - PADDLE_W / 2,
    items: [],
    score: 0,
    lives: 3,
    frame: 0,
    running: false,
    highScore: parseInt(localStorage.getItem('fm_404_high') || '0'),
    gameOver: false,
  });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(gameRef.current.highScore);
  const [started, setStarted] = useState(false);
  const animRef = useRef(null);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.paddleX = GAME_W / 2 - PADDLE_W / 2;
    g.items = [];
    g.score = 0;
    g.lives = 3;
    g.frame = 0;
    g.running = true;
    g.gameOver = false;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.paddleX = Math.max(0, Math.min(GAME_W - PADDLE_W, clientX - rect.left - PADDLE_W / 2));
    };
    const onMouse = (e) => handleMove(e.clientX);
    const onTouch = (e) => { e.preventDefault(); handleMove(e.touches[0].clientX); };
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', onTouch, { passive: false });
    return () => { canvas.removeEventListener('mousemove', onMouse); canvas.removeEventListener('touchmove', onTouch); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const g = gameRef.current;
      if (!g.running) { animRef.current = requestAnimationFrame(loop); return; }
      g.frame++;

      if (g.frame % Math.max(20, Math.round(SPAWN_INTERVAL / (16 + g.score * 0.3))) === 0) {
        const isBomb = Math.random() < 0.25;
        g.items.push({
          x: Math.random() * (GAME_W - KEY_SIZE), y: -KEY_SIZE,
          type: isBomb ? 'bomb' : 'key',
          emoji: isBomb ? BOMB_EMOJI : EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          speed: FALL_SPEED + Math.random() * 1.2 + g.score * 0.02,
        });
      }

      for (let i = g.items.length - 1; i >= 0; i--) {
        const item = g.items[i];
        item.y += item.speed;
        const catching = item.y + KEY_SIZE >= GAME_H - PADDLE_H - 10 && item.y + KEY_SIZE <= GAME_H && item.x + KEY_SIZE > g.paddleX && item.x < g.paddleX + PADDLE_W;
        if (catching) {
          if (item.type === 'bomb') {
            g.lives--; setLives(g.lives);
            if (g.lives <= 0) { g.running = false; g.gameOver = true; if (g.score > g.highScore) { g.highScore = g.score; localStorage.setItem('fm_404_high', String(g.score)); setHighScore(g.score); } setGameOver(true); }
          } else { g.score++; setScore(g.score); }
          g.items.splice(i, 1); continue;
        }
        if (item.y > GAME_H + 10) {
          if (item.type === 'key') {
            g.lives--; setLives(g.lives);
            if (g.lives <= 0) { g.running = false; g.gameOver = true; if (g.score > g.highScore) { g.highScore = g.score; localStorage.setItem('fm_404_high', String(g.score)); setHighScore(g.score); } setGameOver(true); }
          }
          g.items.splice(i, 1);
        }
      }

      // Light mode canvas
      ctx.clearRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = SURFACE;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Subtle dots pattern
      ctx.fillStyle = '#e5e7eb';
      for (let x = 20; x < GAME_W; x += 30) {
        for (let y = 20; y < GAME_H; y += 30) {
          ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Items with shadow
      ctx.font = `${KEY_SIZE}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      g.items.forEach(item => {
        ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
        ctx.fillText(item.emoji, item.x + KEY_SIZE / 2, item.y + KEY_SIZE / 2);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      });

      // Paddle
      ctx.fillStyle = PRIMARY;
      ctx.shadowColor = PRIMARY; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(g.paddleX, GAME_H - PADDLE_H - 10, PADDLE_W, PADDLE_H, 7); ctx.fill();
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = DARK;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.fillText(`Score: ${g.score}`, 12, 24);
      ctx.textAlign = 'right'; ctx.fillText('❤️'.repeat(Math.max(0, g.lives)), GAME_W - 12, 24);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: SURFACE, padding: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: PRIMARY, letterSpacing: -2, lineHeight: 1 }}>404</div>
        <p style={{ fontSize: 18, color: MUTED, marginTop: 8, fontWeight: 500 }}>
          This page moved out. Help find the keys!
        </p>
      </div>

      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}` }}>
        <canvas ref={canvasRef} width={GAME_W} height={GAME_H} style={{ display: 'block', cursor: 'none' }} />

        {!started && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 6 }}>Key Catcher</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 24, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
              Catch falling keys 🔑 and houses 🏠 to score.<br />
              Dodge the bombs 💣! Miss a key = lose a life.
            </div>
            {highScore > 0 && (
              <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 16, fontWeight: 600 }}>
                High Score: {highScore}
              </div>
            )}
            <button
              onClick={startGame}
              style={{
                padding: '12px 36px', borderRadius: 10, border: 'none',
                background: PRIMARY, color: WHITE, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', boxShadow: `0 4px 20px ${PRIMARY}40`,
              }}
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>😵</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: DARK, marginBottom: 4 }}>Game Over!</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: PRIMARY, marginBottom: 4 }}>{score}</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>keys collected</div>
            {score >= highScore && score > 0 && (
              <div style={{ fontSize: 14, color: '#f59e0b', fontWeight: 700, marginBottom: 16 }}>
                New High Score!
              </div>
            )}
            {score < highScore && (
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
                Best: {highScore}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={startGame}
                style={{
                  padding: '10px 28px', borderRadius: 10, border: 'none',
                  background: PRIMARY, color: WHITE, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', boxShadow: `0 4px 20px ${PRIMARY}40`,
                }}
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 28px', borderRadius: 10, border: `1px solid ${BORDER}`,
                  background: WHITE, color: DARK, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Home size={14} /> Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 24, padding: '10px 24px', borderRadius: 8, border: `1px solid ${BORDER}`,
          background: WHITE, color: MUTED, fontSize: 13, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <Home size={14} /> Back to Dashboard
      </button>
    </div>
  );
}
