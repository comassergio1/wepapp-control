-- Datos iniciales para WepApp Control (Limpio)
-- Solo datos mínimos necesarios

-- Usuario Administrador (password: admin123)
INSERT INTO users (name, email, password_hash, role, is_active, created_at) VALUES
('Administrador', 'admin@empresa.com', '$2b$10$zDtKqr8T3XKOJ/8ZBfdOR.7mNucdByuzB1RN/N40Ub5BF4PPhuiZW', 'admin', TRUE, '2024-01-01 00:00:00');

-- Un producto de ejemplo
INSERT INTO products (name, description, price, stock, category, location, is_active, created_at) VALUES
('iPhone 15 Pro', 'Smartphone Apple iPhone 15 Pro 128GB', 1500000.00, 10, 'Electrónicos', 'Central', TRUE, '2024-01-01 00:00:00');

-- Un cliente de ejemplo
INSERT INTO clients (name, email, phone, address, revendedor_id, is_active, created_at) VALUES
('Cliente Demo', 'cliente@demo.com', '+54 11 1234-5678', 'Av. Demo 123, CABA', 1, TRUE, '2024-01-01 00:00:00');

-- Un movimiento de inventario inicial
INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, user_id, date, notes) VALUES
(1, 'ingreso', 10, 0, 10, 1, '2024-01-01 00:00:00', 'Stock inicial'); 