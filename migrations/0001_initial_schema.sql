PRAGMA foreign_keys = ON;

-- Monetary values are stored as integer kuruş amounts. Timestamps are UTC ISO-8601 text.
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  sku TEXT COLLATE NOCASE UNIQUE,
  category TEXT NOT NULL CHECK (length(trim(category)) > 0),
  description TEXT,
  price_in_kurus INTEGER NOT NULL
    CHECK (typeof(price_in_kurus) = 'integer' AND price_in_kurus > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0
    CHECK (typeof(stock_quantity) = 'integer' AND stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 0
    CHECK (typeof(low_stock_threshold) = 'integer' AND low_stock_threshold >= 0),
  image_url TEXT,
  publication_status TEXT NOT NULL DEFAULT 'active'
    CHECK (publication_status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  phone TEXT NOT NULL CHECK (length(trim(phone)) > 0),
  email TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE CHECK (length(trim(order_number)) > 0),
  customer_id INTEGER,
  customer_name_snapshot TEXT NOT NULL CHECK (length(trim(customer_name_snapshot)) > 0),
  customer_phone_snapshot TEXT NOT NULL CHECK (length(trim(customer_phone_snapshot)) > 0),
  customer_email_snapshot TEXT,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
  delivery_address_snapshot TEXT,
  delivery_date TEXT,
  delivery_start_time TEXT,
  delivery_end_time TEXT,
  notes TEXT,
  subtotal_in_kurus INTEGER NOT NULL
    CHECK (typeof(subtotal_in_kurus) = 'integer' AND subtotal_in_kurus >= 0),
  delivery_fee_in_kurus INTEGER NOT NULL DEFAULT 0
    CHECK (typeof(delivery_fee_in_kurus) = 'integer' AND delivery_fee_in_kurus >= 0),
  total_in_kurus INTEGER NOT NULL
    CHECK (
      typeof(total_in_kurus) = 'integer'
      AND total_in_kurus >= 0
      AND total_in_kurus = subtotal_in_kurus + delivery_fee_in_kurus
    ),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'preparing', 'ready_for_delivery', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name_snapshot TEXT NOT NULL CHECK (length(trim(product_name_snapshot)) > 0),
  product_sku_snapshot TEXT,
  product_category_snapshot TEXT NOT NULL CHECK (length(trim(product_category_snapshot)) > 0),
  unit_price_in_kurus INTEGER NOT NULL
    CHECK (typeof(unit_price_in_kurus) = 'integer' AND unit_price_in_kurus >= 0),
  quantity INTEGER NOT NULL
    CHECK (typeof(quantity) = 'integer' AND quantity > 0),
  line_total_in_kurus INTEGER NOT NULL
    CHECK (
      typeof(line_total_in_kurus) = 'integer'
      AND line_total_in_kurus >= 0
      AND line_total_in_kurus = unit_price_in_kurus * quantity
    ),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('new', 'preparing', 'ready_for_delivery', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

-- Keeps the minimal stock history required by the stock screen and order stock rules.
CREATE TABLE inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  order_id INTEGER,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('increase', 'decrease', 'order_created', 'order_cancelled')),
  quantity_delta INTEGER NOT NULL
    CHECK (typeof(quantity_delta) = 'integer' AND quantity_delta <> 0),
  resulting_stock INTEGER NOT NULL
    CHECK (typeof(resulting_stock) = 'integer' AND resulting_stock >= 0),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- V1 has one business, so the only valid settings row has id = 1.
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL CHECK (length(trim(business_name)) > 0),
  email TEXT NOT NULL CHECK (length(trim(email)) > 0),
  phone TEXT,
  address TEXT,
  delivery_fee_in_kurus INTEGER NOT NULL DEFAULT 0
    CHECK (typeof(delivery_fee_in_kurus) = 'integer' AND delivery_fee_in_kurus >= 0),
  minimum_order_amount_in_kurus INTEGER NOT NULL DEFAULT 0
    CHECK (
      typeof(minimum_order_amount_in_kurus) = 'integer'
      AND minimum_order_amount_in_kurus >= 0
    ),
  delivery_enabled INTEGER NOT NULL DEFAULT 1
    CHECK (delivery_enabled IN (0, 1)),
  pickup_enabled INTEGER NOT NULL DEFAULT 1
    CHECK (pickup_enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (delivery_enabled = 1 OR pickup_enabled = 1)
);

CREATE INDEX idx_products_publication_status ON products(publication_status);
CREATE INDEX idx_products_category ON products(category);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_order_status_history_order_id_created_at
  ON order_status_history(order_id, created_at);

CREATE INDEX idx_inventory_movements_product_id_created_at
  ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_inventory_movements_order_id ON inventory_movements(order_id);
