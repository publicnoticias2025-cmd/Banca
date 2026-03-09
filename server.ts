import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const PORT = 3000;

console.log('--- SERVER STARTING ---');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

let db;
try {
  db = new Database(path.join(__dirname, 'database.sqlite'));
  console.log('Database connected');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      date TEXT,
      event TEXT,
      market TEXT,
      stake REAL,
      odds REAL,
      status TEXT,
      profit REAL,
      minute INTEGER DEFAULT 0,
      probability REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bank_config (
      user_id TEXT PRIMARY KEY,
      initial_bank REAL,
      current_bank REAL,
      daily_interest REAL DEFAULT 2,
      period_days INTEGER DEFAULT 30,
      currency TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stake_config (
      user_id TEXT PRIMARY KEY,
      mode TEXT DEFAULT 'percent',
      percent REAL DEFAULT 2,
      kelly_fraction REAL DEFAULT 0.25,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Migrations
  try { db.prepare('ALTER TABLE bank_config ADD COLUMN daily_interest REAL DEFAULT 2').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE bank_config ADD COLUMN period_days INTEGER DEFAULT 30').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE bets ADD COLUMN minute INTEGER DEFAULT 0').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE bets ADD COLUMN probability REAL DEFAULT 0').run(); } catch(e) {}
  try { db.prepare('ALTER TABLE bets ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP').run(); } catch(e) {}
} catch (err) {
  console.error('Database error:', err);
}

const seedAdmin = async () => {
  if (!db) return;
  const adminEmail = 'INACIOPUBLIC';
  const adminPassword = '123Mudar';
  
  const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const id = 'admin-user-id';
    
    db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)').run(id, adminEmail, hashedPassword, 'admin');
    db.prepare('INSERT INTO bank_config (user_id, initial_bank, current_bank, daily_interest, period_days, currency) VALUES (?, ?, ?, ?, ?, ?)').run(id, 10000, 10000, 2, 30, 'BRL');
    db.prepare('INSERT INTO stake_config (user_id, mode, percent, kelly_fraction) VALUES (?, ?, ?, ?)').run(id, 'percent', 2, 0.25);
    
    console.log('Admin user created successfully');
  } else if (existingAdmin.role !== 'admin') {
    db.prepare('UPDATE users SET role = "admin" WHERE email = ?').run(adminEmail);
  }
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)').run(id, email, hashedPassword, 'user');
    db.prepare('INSERT INTO bank_config (user_id, initial_bank, current_bank, daily_interest, period_days, currency) VALUES (?, ?, ?, ?, ?, ?)').run(id, 1000, 1000, 2, 30, 'BRL');
    db.prepare('INSERT INTO stake_config (user_id, mode, percent, kelly_fraction) VALUES (?, ?, ?, ?)').run(id, 'percent', 2, 0.25);
    const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, role: 'user' } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => res.json({ user: req.user }));

app.get('/api/bets', authenticateToken, (req: any, res) => {
  const bets = db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY date DESC, created_at DESC').all(req.user.id);
  res.json(bets);
});

app.post('/api/bets', authenticateToken, (req: any, res) => {
  const { event, market, stake, odds, status, profit, date, minute, probability } = req.body;
  const id = Math.random().toString(36).substring(2, 15);
  try {
    db.prepare('INSERT INTO bets (id, user_id, date, event, market, stake, odds, status, profit, minute, probability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.user.id, date || new Date().toISOString(), event, market, stake, odds, status, profit, minute || 0, probability || 0);
    res.json({ id, event, market, stake, odds, status, profit, minute, probability });
  } catch (error) {
    console.error('Error adding bet:', error);
    res.status(500).json({ error: 'Failed to add bet' });
  }
});

app.put('/api/bets/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { event, market, stake, odds, status, profit, date, minute, probability } = req.body;
  try {
    db.prepare('UPDATE bets SET event = ?, market = ?, stake = ?, odds = ?, status = ?, profit = ?, date = ?, minute = ?, probability = ? WHERE id = ? AND user_id = ?')
      .run(event, market, stake, odds, status, profit, date, minute, probability, id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating bet:', error);
    res.status(500).json({ error: 'Failed to update bet' });
  }
});

app.patch('/api/bets/:id/status', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { status, profit } = req.body;
  try {
    db.prepare('UPDATE bets SET status = ?, profit = ? WHERE id = ? AND user_id = ?')
      .run(status, profit, id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating bet status:', error);
    res.status(500).json({ error: 'Failed to update bet status' });
  }
});

app.delete('/api/bets/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM bets WHERE id = ? AND user_id = ?').run(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bet:', error);
    res.status(500).json({ error: 'Failed to delete bet' });
  }
});

app.get('/api/bankroll', authenticateToken, (req: any, res) => {
  const config = db.prepare('SELECT * FROM bank_config WHERE user_id = ?').get(req.user.id);
  res.json(config);
});

app.put('/api/bankroll', authenticateToken, (req: any, res) => {
  const { initial_bank, current_bank, daily_interest, period_days, currency } = req.body;
  db.prepare('UPDATE bank_config SET initial_bank = ?, current_bank = ?, daily_interest = ?, period_days = ?, currency = ? WHERE user_id = ?')
    .run(initial_bank, current_bank, daily_interest, period_days, currency, req.user.id);
  res.json({ initial_bank, current_bank, daily_interest, period_days, currency });
});

app.get('/api/stake-config', authenticateToken, (req: any, res) => {
  let config = db.prepare('SELECT * FROM stake_config WHERE user_id = ?').get(req.user.id);
  if (!config) {
    db.prepare('INSERT INTO stake_config (user_id, mode, percent, kelly_fraction) VALUES (?, ?, ?, ?)').run(req.user.id, 'percent', 2, 0.25);
    config = db.prepare('SELECT * FROM stake_config WHERE user_id = ?').get(req.user.id);
  }
  res.json(config);
});

app.put('/api/stake-config', authenticateToken, (req: any, res) => {
  const { mode, percent, kelly_fraction } = req.body;
  db.prepare('UPDATE stake_config SET mode = ?, percent = ?, kelly_fraction = ? WHERE user_id = ?')
    .run(mode, percent, kelly_fraction, req.user.id);
  res.json({ mode, percent, kelly_fraction });
});

app.get('/api/admin/users', authenticateToken, isAdmin, (req: any, res) => {
  const users = db.prepare('SELECT id, email, role, created_at FROM users').all();
  res.json(users);
});

app.post('/api/admin/users', authenticateToken, isAdmin, async (req: any, res) => {
  const { email, password, role = 'user' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)').run(id, email, hashedPassword, role);
    db.prepare('INSERT INTO bank_config (user_id, initial_bank, current_bank, daily_interest, period_days, currency) VALUES (?, ?, ?, ?, ?, ?)').run(id, 1000, 1000, 2, 30, 'BRL');
    db.prepare('INSERT INTO stake_config (user_id, mode, percent, kelly_fraction) VALUES (?, ?, ?, ?)').run(id, 'percent', 2, 0.25);
    res.json({ id, email, role });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req: any, res) => {
  const { id } = req.params;
  if (id === 'admin-user-id') return res.status(400).json({ error: 'Cannot delete master admin' });
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  db.prepare('DELETE FROM bets WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM bank_config WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM stake_config WHERE user_id = ?').run(id);
  res.json({ success: true });
});

app.post('/api/user/reset-data', authenticateToken, async (req: any, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Senha incorreta' });

    // Delete all bets for this user
    db.prepare('DELETE FROM bets WHERE user_id = ?').run(userId);
    
    // Reset bankroll to initial state
    const bankConfig = db.prepare('SELECT initial_bank FROM bank_config WHERE user_id = ?').get(userId);
    if (bankConfig) {
      db.prepare('UPDATE bank_config SET current_bank = ? WHERE user_id = ?').run(bankConfig.initial_bank, userId);
    }

    res.json({ success: true, message: 'Dados resetados com sucesso' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Falha ao resetar dados' });
  }
});

async function startServer() {
  await seedAdmin();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
