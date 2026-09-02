import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import crypto from 'node:crypto';
import { pool, ensureSchema } from './db.js';
import { generateShareCode } from './share-code.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

async function getListByCode(code) {
  const { rows } = await pool.query('SELECT * FROM lists WHERE share_code = $1', [code]);
  return rows[0] ?? null;
}

async function getItems(listId) {
  const { rows } = await pool.query(
    'SELECT id, name, quantity, category, checked FROM items WHERE list_id = $1 ORDER BY created_at ASC',
    [listId]
  );
  return rows;
}

async function broadcastItems(code, listId) {
  const items = await getItems(listId);
  io.to(code).emit('items', items);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/lists', async (_req, res) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateShareCode();
    try {
      await pool.query('INSERT INTO lists (share_code) VALUES ($1)', [code]);
      return res.status(201).json({ code });
    } catch (err) {
      if (err.code !== '23505') throw err; // unique_violation, retry with a new code
    }
  }
  res.status(500).json({ error: 'Could not generate a unique share code' });
});

app.get('/api/lists/:code', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });
  const items = await getItems(list.id);
  res.json({ code: list.share_code, items });
});

app.post('/api/lists/:code/items', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  const { name, quantity, category } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const item = {
    id: crypto.randomUUID(),
    name: name.trim(),
    quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
    category: typeof category === 'string' && category ? category : 'Other'
  };

  await pool.query(
    'INSERT INTO items (id, list_id, name, quantity, category) VALUES ($1, $2, $3, $4, $5)',
    [item.id, list.id, item.name, item.quantity, item.category]
  );

  await broadcastItems(list.share_code, list.id);
  res.status(201).json(item);
});

app.patch('/api/lists/:code/items/:itemId', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  const { checked } = req.body;
  if (typeof checked !== 'boolean') {
    return res.status(400).json({ error: 'checked (boolean) is required' });
  }

  const { rowCount } = await pool.query(
    'UPDATE items SET checked = $1 WHERE id = $2 AND list_id = $3',
    [checked, req.params.itemId, list.id]
  );
  if (rowCount === 0) return res.status(404).json({ error: 'Item not found' });

  await broadcastItems(list.share_code, list.id);
  res.status(204).end();
});

app.delete('/api/lists/:code/items/:itemId', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  await pool.query('DELETE FROM items WHERE id = $1 AND list_id = $2', [req.params.itemId, list.id]);
  await broadcastItems(list.share_code, list.id);
  res.status(204).end();
});

app.post('/api/lists/:code/clear-checked', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  await pool.query('DELETE FROM items WHERE list_id = $1 AND checked = true', [list.id]);
  await broadcastItems(list.share_code, list.id);
  res.status(204).end();
});

io.on('connection', (socket) => {
  socket.on('join', async (code) => {
    if (typeof code !== 'string') return;
    const list = await getListByCode(code.toUpperCase());
    if (!list) return;
    socket.join(list.share_code);
    socket.emit('items', await getItems(list.id));
  });
});

const port = process.env.PORT || 3000;

ensureSchema()
  .then(() => {
    httpServer.listen(port, () => console.log(`grocery-agent-server listening on ${port}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database schema', err);
    process.exit(1);
  });
