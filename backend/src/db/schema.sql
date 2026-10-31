-- ==============================================================================
-- BRIGHTLOOP PRODUCTION POSTGRESQL SCHEMA
-- Subscription Management & Recurring Billing Platform
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('SOFTWARE', 'ADDON', 'SERVICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_cadence AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('FIXED', 'PERCENTAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_scope AS ENUM ('SUBSCRIPTION', 'PRODUCT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER', 'CARD', 'UPI', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCTS & VARIANTS
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    type product_type NOT NULL DEFAULT 'SOFTWARE',
    sales_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    price_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PLANS
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    billing_cadence billing_cadence NOT NULL DEFAULT 'MONTHLY',
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_close_on_expiry BOOLEAN NOT NULL DEFAULT TRUE,
    allow_early_close BOOLEAN NOT NULL DEFAULT TRUE,
    allow_pause BOOLEAN NOT NULL DEFAULT TRUE,
    allow_renewal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. QUOTATION TEMPLATES
CREATE TABLE IF NOT EXISTS quotation_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    default_plan_id VARCHAR(36) REFERENCES plans(id) ON DELETE SET NULL,
    validity_days INTEGER NOT NULL DEFAULT 30,
    template_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TAXES & DISCOUNTS
CREATE TABLE IF NOT EXISTS tax_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(100) NOT NULL,
    rate_percentage NUMERIC(5, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discount_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    code VARCHAR(100) NOT NULL UNIQUE,
    type discount_type NOT NULL,
    value NUMERIC(12, 2) NOT NULL,
    target_scope discount_scope NOT NULL DEFAULT 'SUBSCRIPTION',
    target_product_id VARCHAR(36) REFERENCES products(id) ON DELETE SET NULL,
    min_spend NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    max_redemptions INTEGER,
    times_redeemed INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SUBSCRIPTIONS & LINES
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    subscription_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    plan_id VARCHAR(36) NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    discount_rule_id VARCHAR(36) REFERENCES discount_rules(id) ON DELETE SET NULL,
    status subscription_status NOT NULL DEFAULT 'DRAFT',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    payment_terms_days INTEGER NOT NULL DEFAULT 15,
    valid_until TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_lines (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    subscription_id VARCHAR(36) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id VARCHAR(36) REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    tax_rule_id VARCHAR(36) REFERENCES tax_rules(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. INVOICES & LINES
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subscription_id VARCHAR(36) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    customer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_subscription_period_start UNIQUE (subscription_id, period_start)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL DEFAULT 'MANUAL',
    amount NUMERIC(12, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- B-TREE PERFORMANCE INDEXES
-- Optimized for Sub-2s KPI Aggregations and High-Throughput Billing Runs
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions USING btree (next_billing_date);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices USING btree (status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices USING btree (subscription_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments USING btree (invoice_id);
