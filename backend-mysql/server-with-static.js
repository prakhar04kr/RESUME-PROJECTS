import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pino from 'pino';

// NOTE: This file keeps the exact same API + websocket behavior as server.js,
// but also serves the static frontend from ./../frontend at the same port.

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const PORT = Number(process.env.PORT ?? 3000);
if (!PORT || Number.isNaN(PORT) || PORT <= 0) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const MYSQL_URL = process.env.DATABASE_URL;
if (!MYSQL_URL) throw new Error('DATABASE_URL is required (MySQL)');

const JWT_SECRET = process.env.JWT_SECRET ?? 'typeracer-dev-secret-change-in-prod';
const SALT_ROUNDS = 12;

function parseMysqlUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

const mysqlConfig = parseMysqlUrl(MYSQL_URL);
const pool = mysql.createPool({ ...mysqlConfig, connectionLimit: 10 });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..'); // backend-mysql/ -> repo root
const frontendDir = path.resolve(repoRoot, 'frontend');
const frontendAssetsDir = path.join(frontendDir, 'assets');

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: (req.url ?? '').split('?')[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Auth
// --------------------
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authGuard(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !String(header).startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }
  const token = String(header).slice(7);
  try {
    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const validDifficulty = new Set(['easy', 'medium', 'hard']);

function mapGame(r) {
  return {
    id: r.id,
    paragraph: r.paragraph,
    difficulty: r.difficulty,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// NOTE: API responses match server.js behavior/shape
function mapResult(r) {
  return {
    id: r.id,
    userId: r.user_id,
    gameId: r.game_id,
    wpm: r.wpm,
    accuracy: r.accuracy,
    timeTakenMs: r.time_taken_ms,
    createdAt: r.created_at,
  };
}

// --------------------
// API Routes
// --------------------
app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body ?? {};

  if (!email || !username || !password) {
    res.status(400).json({ error: 'email, username, and password are required' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: 'Username must be 3-20 characters' });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (Array.isArray(existing) && existing.length > 0) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
    [email, username, passwordHash, 'user'],
  );

  const userId = result.insertId;
  const [rows] = await pool.query(
    'SELECT id, email, username, role, created_at FROM users WHERE id = ? LIMIT 1',
    [userId],
  );
  const user = rows[0];

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const [users] = await pool.query(
    'SELECT id, email, username, role, password_hash, created_at FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  const user = users[0];
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

app.get('/api/auth/me', authGuard, async (req, res) => {
  const userId = req.user.userId;
  const [rows] = await pool.query(
    'SELECT id, email, username, role, created_at FROM users WHERE id = ? LIMIT 1',
    [userId],
  );
  const user = rows[0];
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
  });
});

app.get('/api/games/random', authGuard, async (req, res) => {
  const difficulty = req.query.difficulty ? String(req.query.difficulty) : undefined;

  if (difficulty && validDifficulty.has(difficulty)) {
    const [rows] = await pool.query(
      'SELECT id, paragraph, difficulty, created_by, created_at, updated_at FROM games WHERE difficulty = ? ORDER BY RAND() LIMIT 1',
      [difficulty],
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'No games found' });
      return;
    }
    res.json(mapGame(rows[0]));
    return;
  }

  const [rows] = await pool.query(
    'SELECT id, paragraph, difficulty, created_by, created_at, updated_at FROM games ORDER BY RAND() LIMIT 1',
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'No games found' });
    return;
  }
  res.json(mapGame(rows[0]));
});

app.get('/api/games', authGuard, adminOnly, async (req, res) => {
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const offset = (page - 1) * limit;

  const [data] = await pool.query(
    'SELECT id, paragraph, difficulty, created_by, created_at, updated_at FROM games ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset],
  );
  const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM games');
  const total = totalRows[0]?.count ?? 0;
  res.json({ data, total, page, limit });
});

app.post('/api/games', authGuard, adminOnly, async (req, res) => {
  const { paragraph, difficulty } = req.body ?? {};
  if (!paragraph || typeof paragraph !== 'string') {
    res.status(400).json({ error: 'paragraph is required' });
    return;
  }
  if (paragraph.length < 80 || paragraph.length > 500) {
    res.status(400).json({ error: 'paragraph must be 80-500 characters' });
    return;
  }
  if (!difficulty || !validDifficulty.has(difficulty)) {
    res.status(400).json({ error: 'difficulty must be easy, medium, or hard' });
    return;
  }

  const [result] = await pool.query(
    'INSERT INTO games (paragraph, difficulty, created_by) VALUES (?, ?, ?)',
    [paragraph, difficulty, req.user.userId],
  );

  const gameId = result.insertId;
  const [rows] = await pool.query(
    'SELECT id, paragraph, difficulty, created_by, created_at, updated_at FROM games WHERE id = ? LIMIT 1',
    [gameId],
  );
  res.status(201).json(mapGame(rows[0]));
});

app.patch('/api/games/:id', authGuard, adminOnly, async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const updates = {};
  const { paragraph, difficulty } = req.body ?? {};

  if (paragraph !== undefined) {
    if (typeof paragraph !== 'string' || paragraph.length < 80 || paragraph.length > 500) {
      res.status(400).json({ error: 'paragraph must be 80-500 characters' });
      return;
    }
    updates.paragraph = paragraph;
  }

  if (difficulty !== undefined) {
    if (!validDifficulty.has(difficulty)) {
      res.status(400).json({ error: 'difficulty must be easy, medium, or hard' });
      return;
    }
    updates.difficulty = difficulty;
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    res.json(null);
    return;
  }

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => updates[k]);
  values.push(id);

  await pool.query(`UPDATE games SET ${setClause} WHERE id = ?`, values);

  const [rows] = await pool.query(
    'SELECT id, paragraph, difficulty, created_by, created_at, updated_at FROM games WHERE id = ? LIMIT 1',
    [id],
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  res.json(mapGame(rows[0]));
});

app.delete('/api/games/:id', authGuard, adminOnly, async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const [result] = await pool.query('DELETE FROM games WHERE id = ? LIMIT 1', [id]);
  if (!result.affectedRows) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.sendStatus(204);
});

app.post('/api/results', authGuard, async (req, res) => {
  const { gameId, wpm, accuracy, timeTakenMs } = req.body ?? {};

  if (!gameId || wpm == null || accuracy == null || timeTakenMs == null) {
    res.status(400).json({ error: 'gameId, wpm, accuracy, and timeTakenMs are required' });
    return;
  }
  if (wpm <= 0) {
    res.status(400).json({ error: 'wpm must be greater than 0' });
    return;
  }
  if (accuracy < 0 || accuracy > 100) {
    res.status(400).json({ error: 'accuracy must be 0-100' });
    return;
  }
  if (timeTakenMs <= 0) {
    res.status(400).json({ error: 'timeTakenMs must be greater than 0' });
    return;
  }

  const [ins] = await pool.query(
    'INSERT INTO results (user_id, game_id, wpm, accuracy, time_taken_ms) VALUES (?, ?, ?, ?, ?)',
    [req.user.userId, gameId, wpm, accuracy, timeTakenMs],
  );

  const resultId = ins.insertId;
  const [rows] = await pool.query(
    'SELECT id, user_id, game_id, wpm, accuracy, time_taken_ms, created_at FROM results WHERE id = ? LIMIT 1',
    [resultId],
  );

  res.status(201).json(mapResult(rows[0]));
});

app.get('/api/results/history', authGuard, async (req, res) => {
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = parseInt(String(req.query.limit ?? '10'), 10);
  const offset = (page - 1) * limit;

  const userId = req.user.userId;

  const [data] = await pool.query(
    `SELECT
      r.id,
      r.user_id AS userId,
      r.game_id AS gameId,
      r.wpm,
      r.accuracy,
      r.time_taken_ms AS timeTakenMs,
      r.created_at AS createdAt,
      g.paragraph,
      g.difficulty,
      u.username,
      NULL AS personalBestWpm
    FROM results r
    INNER JOIN games g ON g.id = r.game_id
    INNER JOIN users u ON u.id = r.user_id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  );

  const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM results WHERE user_id = ?', [userId]);
  const total = totalRows[0]?.count ?? 0;

  res.json({ data, total, page, limit });
});

app.get('/api/results/:id', authGuard, async (req, res) => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.user_id AS userId,
      r.game_id AS gameId,
      r.wpm,
      r.accuracy,
      r.time_taken_ms AS timeTakenMs,
      r.created_at AS createdAt,
      g.paragraph,
      g.difficulty,
      u.username
    FROM results r
    INNER JOIN games g ON g.id = r.game_id
    INNER JOIN users u ON u.id = r.user_id
    WHERE r.id = ?
    LIMIT 1`,
    [id],
  );

  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: 'Result not found' });
    return;
  }
  if (row.userId !== req.user.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const [pbRows] = await pool.query('SELECT MAX(wpm) AS bestWpm FROM results WHERE user_id = ?', [req.user.userId]);
  const personalBestWpm = pbRows[0]?.bestWpm ?? null;

  res.json({ ...row, personalBestWpm });
});

app.get('/api/stats/me', authGuard, async (req, res) => {
  const userId = req.user.userId;

  const [statRows] = await pool.query(
    'SELECT COUNT(*) AS totalRaces, MAX(wpm) AS bestWpm, AVG(wpm) AS avgWpm, AVG(accuracy) AS avgAccuracy FROM results WHERE user_id = ?',
    [userId],
  );
  const stats = statRows[0] ?? {};

  const [recent] = await pool.query(
    'SELECT id, user_id AS userId, game_id AS gameId, wpm, accuracy, time_taken_ms AS timeTakenMs, created_at AS createdAt FROM results WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
    [userId],
  );

  res.json({
    totalRaces: stats.totalRaces ?? 0,
    bestWpm: stats.bestWpm ?? null,
    avgWpm: stats.avgWpm ?? null,
    avgAccuracy: stats.avgAccuracy ?? null,
    recentResults: recent,
  });
});

app.get('/api/leaderboard', async (req, res) => {
  const difficulty = String(req.query.difficulty ?? 'all');
  const limitRaw = parseInt(String(req.query.limit ?? '50'), 10);
  const limit = Math.min(Math.max(limitRaw, 1), 100);

  const validDifficulty = ['all', 'easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'all';

  let query;
  let params;

  if (validDifficulty === 'all') {
    query = `
      SELECT
        u.username,
        r.wpm,
        r.accuracy,
        g.difficulty,
        r.created_at AS raced_at
      FROM results r
      JOIN users u ON u.id = r.user_id
      JOIN games g ON g.id = r.game_id
      ORDER BY r.wpm DESC
      LIMIT ?`;
    params = [limit];
  } else {
    query = `
      SELECT
        u.username,
        r.wpm,
        r.accuracy,
        g.difficulty,
        r.created_at AS raced_at
      FROM results r
      JOIN users u ON u.id = r.user_id
      JOIN games g ON g.id = r.game_id
      WHERE g.difficulty = ?
      ORDER BY r.wpm DESC
      LIMIT ?`;
    params = [validDifficulty, limit];
  }

  const [rows] = await pool.query(query, params);
  const entries = rows.map((row, i) => ({
    rank: i + 1,
    username: row.username,
    wpm: row.wpm,
    accuracy: row.accuracy,
    difficulty: row.difficulty,
    racedAt: row.raced_at,
  }));

  res.json(entries);
});

// --------------------
// Static frontend (same port)
// --------------------
if (fs.existsSync(frontendDir)) {
  app.use('/assets', express.static(frontendAssetsDir, { etag: false }));

  // SPA fallback: anything not /api/* and not /ws should serve index.html
  app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.path === '/ws' || req.path.startsWith('/ws')) return next();

  res.sendFile(path.join(frontendDir, 'index.html'));
});
} else {
  logger.warn({ frontendDir }, 'frontend directory not found; static serving disabled');
}

// --------------------
// WebSocket Server (attach to same http server)
// --------------------
const httpServer = createServer(app);

const rooms = new Map();
function getOrCreateRoom(gameId) {
  if (!rooms.has(gameId)) rooms.set(gameId, { clients: new Map(), interval: null, startTime: null });
  return rooms.get(gameId);
}

function broadcast(room, senderId, msgObj) {
  const data = JSON.stringify(msgObj);
  room.clients.forEach((client, id) => {
    if (id !== senderId && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  let currentGameId = null;
  let clientId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'START' && msg.gameId && msg.userId) {
      currentGameId = String(msg.gameId);
      clientId = String(msg.userId) + '_' + Date.now();
      const room = getOrCreateRoom(currentGameId);
      room.clients.set(clientId, ws);

      if (!room.interval) {
        room.startTime = Date.now();
        room.interval = setInterval(() => {
          const elapsed = Date.now() - (room.startTime ?? Date.now());
          room.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'TICK', elapsed_ms: elapsed }));
            }
          });
        }, 500);
      }
      return;
    }

    if (msg.type === 'WPM_UPDATE' && currentGameId && clientId) {
      const room = rooms.get(currentGameId);
      if (room) {
        broadcast(room, clientId, { type: 'WPM_UPDATE', wpm: msg.wpm, accuracy: msg.accuracy, userId: clientId });
      }
    }
  });

  ws.on('close', () => {
    if (currentGameId && clientId) {
      const room = rooms.get(currentGameId);
      if (room) {
        room.clients.delete(clientId);
        if (room.clients.size === 0) {
          if (room.interval) clearInterval(room.interval);
          rooms.delete(currentGameId);
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server listening (API + WS + Static frontend)');
});

