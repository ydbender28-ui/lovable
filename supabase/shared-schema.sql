-- SHARED SUPABASE SCHEMA FOR THATCODE
-- Run this ONCE in your shared Supabase project's SQL editor
-- All ThatCode user apps share this database with RLS isolation

-- Enable RLS on all tables
-- Each table has a project_id column that RLS uses to isolate data

-- Generic key-value store (replaces tcSave/tcLoad)
CREATE TABLE IF NOT EXISTS app_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, key)
);
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_data_isolation" ON app_data FOR ALL
  USING (project_id = current_setting('request.jwt.claims', true)::json->>'project_id');
-- Also allow service role full access
CREATE POLICY "app_data_service" ON app_data FOR ALL
  USING (auth.role() = 'service_role');

-- Generic items table (products, menu items, posts, etc.)
CREATE TABLE IF NOT EXISTS items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  type text DEFAULT 'item', -- 'product', 'menu_item', 'post', 'user', etc.
  name text,
  description text,
  price decimal,
  image_url text,
  category text,
  tags text[],
  metadata jsonb DEFAULT '{}',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_read" ON items FOR SELECT USING (true); -- public read
CREATE POLICY "items_write" ON items FOR ALL
  USING (project_id = current_setting('request.jwt.claims', true)::json->>'project_id');
CREATE POLICY "items_service" ON items FOR ALL
  USING (auth.role() = 'service_role');

-- Orders / transactions
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  customer_email text,
  customer_name text,
  items jsonb NOT NULL DEFAULT '[]',
  total decimal,
  status text DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
  stripe_session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_isolation" ON orders FOR ALL
  USING (project_id = current_setting('request.jwt.claims', true)::json->>'project_id');
CREATE POLICY "orders_service" ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- Users / contacts (for apps that need user management)
CREATE TABLE IF NOT EXISTS app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  email text,
  name text,
  role text DEFAULT 'user',
  password_hash text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, email)
);
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_users_isolation" ON app_users FOR ALL
  USING (project_id = current_setting('request.jwt.claims', true)::json->>'project_id');
CREATE POLICY "app_users_service" ON app_users FOR ALL
  USING (auth.role() = 'service_role');

-- Form submissions (contact forms, newsletter signups, etc.)
CREATE TABLE IF NOT EXISTS submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  form_name text DEFAULT 'contact',
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_isolation" ON submissions FOR ALL
  USING (project_id = current_setting('request.jwt.claims', true)::json->>'project_id');
CREATE POLICY "submissions_service" ON submissions FOR ALL
  USING (auth.role() = 'service_role');

-- Setup function called when a project enables database
CREATE OR REPLACE FUNCTION setup_project(p_project_id text)
RETURNS void AS $$
BEGIN
  -- Nothing to do per-project — tables are shared, RLS handles isolation
  -- This function exists so the API can call it without error
  RAISE NOTICE 'Project % database enabled', p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_data_project ON app_data(project_id);
CREATE INDEX IF NOT EXISTS idx_items_project ON items(project_id);
CREATE INDEX IF NOT EXISTS idx_items_project_type ON items(project_id, type);
CREATE INDEX IF NOT EXISTS idx_orders_project ON orders(project_id);
CREATE INDEX IF NOT EXISTS idx_app_users_project ON app_users(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_project ON submissions(project_id);
