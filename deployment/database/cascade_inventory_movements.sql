-- 1. Renombrar la tabla actual
ALTER TABLE inventory_movements RENAME TO inventory_movements_old;

-- 2. Crear la nueva tabla con ON DELETE CASCADE
CREATE TABLE inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ingreso', 'egreso', 'traslado', 'desvio')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. Copiar los datos existentes
INSERT INTO inventory_movements (id, product_id, type, quantity, previous_stock, new_stock, user_id, date, notes, from_location, to_location)
SELECT id, product_id, type, quantity, previous_stock, new_stock, user_id, date, notes, from_location, to_location FROM inventory_movements_old;

-- 4. Eliminar la tabla antigua
DROP TABLE inventory_movements_old;

-- 5. Recrear índices
CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_date ON inventory_movements(date); 