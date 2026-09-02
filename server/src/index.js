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

const INVENTORY_STATUSES = ['unused', 'opened', 'used'];

function toInventoryDto(row) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    weightValue: row.weight_value,
    weightUnit: row.weight_unit,
    expiryDate: row.expiry_date,
    purchaseDate: row.purchase_date,
    price: row.price,
    status: row.status
  };
}

async function getInventoryItems(listId) {
  const { rows } = await pool.query(
    `SELECT id, name, quantity, weight_value, weight_unit, expiry_date, purchase_date, price, status
     FROM inventory_items WHERE list_id = $1
     ORDER BY
       CASE status WHEN 'unused' THEN 0 WHEN 'opened' THEN 1 ELSE 2 END,
       expiry_date ASC,
       created_at ASC`,
    [listId]
  );
  return rows.map(toInventoryDto);
}

async function broadcastInventory(code, listId) {
  const items = await getInventoryItems(listId);
  io.to(code).emit('inventory', items);
}

function isValidDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

const ITEM_FIELD_COLUMNS = {
  name: 'name',
  quantity: 'quantity',
  category: 'category',
  checked: 'checked'
};

app.patch('/api/lists/:code/items/:itemId', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, column] of Object.entries(ITEM_FIELD_COLUMNS)) {
    if (!(key in req.body)) continue;
    let value = req.body[key];

    if (key === 'name') {
      if (typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({ error: 'name must be a non-empty string' });
      }
      value = value.trim();
    }
    if (key === 'quantity') {
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ error: 'quantity must be a positive number' });
      }
      value = Math.floor(value);
    }
    if (key === 'category' && (typeof value !== 'string' || !value.trim())) {
      return res.status(400).json({ error: 'category must be a non-empty string' });
    }
    if (key === 'checked' && typeof value !== 'boolean') {
      return res.status(400).json({ error: 'checked must be a boolean' });
    }

    sets.push(`${column} = $${i}`);
    values.push(value);
    i++;
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  values.push(req.params.itemId, list.id);
  const { rowCount } = await pool.query(
    `UPDATE items SET ${sets.join(', ')} WHERE id = $${i} AND list_id = $${i + 1}`,
    values
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

app.post('/api/lists/:code/inventory', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  const { name, quantity, weightValue, weightUnit, expiryDate, purchaseDate, price } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!isValidDate(expiryDate)) {
    return res.status(400).json({ error: 'expiryDate is required and must be YYYY-MM-DD' });
  }
  if (purchaseDate != null && !isValidDate(purchaseDate)) {
    return res.status(400).json({ error: 'purchaseDate must be YYYY-MM-DD' });
  }

  const item = {
    id: crypto.randomUUID(),
    name: name.trim(),
    quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
    weightValue: Number.isFinite(weightValue) ? weightValue : null,
    weightUnit: typeof weightUnit === 'string' && weightUnit ? weightUnit : null,
    expiryDate,
    purchaseDate: purchaseDate ?? null,
    price: Number.isFinite(price) ? price : null,
    status: 'unused'
  };

  await pool.query(
    `INSERT INTO inventory_items (id, list_id, name, quantity, weight_value, weight_unit, expiry_date, purchase_date, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      item.id,
      list.id,
      item.name,
      item.quantity,
      item.weightValue,
      item.weightUnit,
      item.expiryDate,
      item.purchaseDate,
      item.price
    ]
  );

  await broadcastInventory(list.share_code, list.id);
  res.status(201).json(item);
});

const INVENTORY_FIELD_COLUMNS = {
  name: 'name',
  quantity: 'quantity',
  weightValue: 'weight_value',
  weightUnit: 'weight_unit',
  expiryDate: 'expiry_date',
  purchaseDate: 'purchase_date',
  price: 'price',
  status: 'status'
};

app.patch('/api/lists/:code/inventory/:itemId', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, column] of Object.entries(INVENTORY_FIELD_COLUMNS)) {
    if (!(key in req.body)) continue;
    let value = req.body[key];

    if (key === 'name') {
      if (typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({ error: 'name must be a non-empty string' });
      }
      value = value.trim();
    }
    if (key === 'quantity') {
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ error: 'quantity must be a positive number' });
      }
      value = Math.floor(value);
    }
    if (key === 'expiryDate' && !isValidDate(value)) {
      return res.status(400).json({ error: 'expiryDate must be YYYY-MM-DD' });
    }
    if (key === 'purchaseDate' && value != null && !isValidDate(value)) {
      return res.status(400).json({ error: 'purchaseDate must be YYYY-MM-DD' });
    }
    if (key === 'status' && !INVENTORY_STATUSES.includes(value)) {
      return res.status(400).json({ error: `status must be one of ${INVENTORY_STATUSES.join(', ')}` });
    }

    sets.push(`${column} = $${i}`);
    values.push(value);
    i++;
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  values.push(req.params.itemId, list.id);
  const { rowCount } = await pool.query(
    `UPDATE inventory_items SET ${sets.join(', ')} WHERE id = $${i} AND list_id = $${i + 1}`,
    values
  );
  if (rowCount === 0) return res.status(404).json({ error: 'Item not found' });

  await broadcastInventory(list.share_code, list.id);
  res.status(204).end();
});

app.post('/api/lists/:code/inventory/:itemId/finish', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'DELETE FROM inventory_items WHERE id = $1 AND list_id = $2 RETURNING name, quantity',
      [req.params.itemId, list.id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }
    const { name, quantity } = rows[0];
    await client.query(
      'INSERT INTO items (id, list_id, name, quantity, category) VALUES ($1, $2, $3, $4, $5)',
      [crypto.randomUUID(), list.id, name, quantity, 'Other']
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await broadcastInventory(list.share_code, list.id);
  await broadcastItems(list.share_code, list.id);
  res.status(204).end();
});

app.post('/api/lists/:code/inventory/clear-used', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  await pool.query("DELETE FROM inventory_items WHERE list_id = $1 AND status = 'used'", [list.id]);
  await broadcastInventory(list.share_code, list.id);
  res.status(204).end();
});

app.delete('/api/lists/:code/inventory/:itemId', async (req, res) => {
  const list = await getListByCode(req.params.code.toUpperCase());
  if (!list) return res.status(404).json({ error: 'List not found' });

  await pool.query('DELETE FROM inventory_items WHERE id = $1 AND list_id = $2', [
    req.params.itemId,
    list.id
  ]);
  await broadcastInventory(list.share_code, list.id);
  res.status(204).end();
});

io.on('connection', (socket) => {
  socket.on('join', async (code) => {
    if (typeof code !== 'string') return;
    const list = await getListByCode(code.toUpperCase());
    if (!list) return;
    socket.join(list.share_code);
    socket.emit('items', await getItems(list.id));
    socket.emit('inventory', await getInventoryItems(list.id));
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
