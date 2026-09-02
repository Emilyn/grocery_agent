CREATE TABLE IF NOT EXISTS lists (
  id SERIAL PRIMARY KEY,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS items_list_id_idx ON items (list_id);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_value DOUBLE PRECISION,
  weight_unit TEXT,
  expiry_date DATE NOT NULL,
  purchase_date DATE,
  price DOUBLE PRECISION,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added after the initial release; keeps existing databases in sync since
-- CREATE TABLE IF NOT EXISTS above is a no-op once the table already exists.
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS inventory_items_list_id_idx ON inventory_items (list_id);
