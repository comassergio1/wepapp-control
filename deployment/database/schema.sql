-- Esquema de Base de Datos para WepApp Control
-- Sistema de gestión de ventas con autofinanciamiento y red de revendedores

-- Tabla de Usuarios
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'revendedor')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Clientes
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    revendedor_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (revendedor_id) REFERENCES users(id)
);

-- Tabla de Cuentas
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL,
    delivery_amount DECIMAL(10,2) DEFAULT 0,
    installment_amount DECIMAL(10,2) NOT NULL,
    total_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue')),
    is_active BOOLEAN DEFAULT TRUE,
    revendedor_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (revendedor_id) REFERENCES users(id)
);

-- Tabla de Pagos
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    installment_number INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    receipt_image VARCHAR(500),
    notes TEXT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de Movimientos de Inventario
CREATE TABLE inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ingreso', 'egreso')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_clients_revendedor ON clients(revendedor_id);
CREATE INDEX idx_clients_active ON clients(is_active);
CREATE INDEX idx_accounts_client ON accounts(client_id);
CREATE INDEX idx_accounts_revendedor ON accounts(revendedor_id);
CREATE INDEX idx_accounts_active ON accounts(is_active);
CREATE INDEX idx_payments_account ON payments(account_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_date ON inventory_movements(date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_products_updated_at 
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_clients_updated_at 
    AFTER UPDATE ON clients
    FOR EACH ROW
    BEGIN
        UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_accounts_updated_at 
    AFTER UPDATE ON accounts
    FOR EACH ROW
    BEGIN
        UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger para actualizar remaining_amount automáticamente
CREATE TRIGGER update_account_remaining_amount 
    AFTER UPDATE OF paid_amount ON accounts
    FOR EACH ROW
    BEGIN
        UPDATE accounts SET remaining_amount = NEW.total_amount - NEW.paid_amount WHERE id = NEW.id;
    END;

-- Trigger para actualizar paid_installments automáticamente
CREATE TRIGGER update_paid_installments 
    AFTER INSERT ON payments
    FOR EACH ROW
    BEGIN
        UPDATE accounts 
        SET paid_installments = (
            SELECT COUNT(*) FROM payments WHERE account_id = NEW.account_id
        )
        WHERE id = NEW.account_id;
    END; 