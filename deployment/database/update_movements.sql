-- Actualizar la tabla inventory_movements para incluir nuevos tipos y campos
-- Primero agregar las nuevas columnas
ALTER TABLE inventory_movements ADD COLUMN from_location VARCHAR(100);
ALTER TABLE inventory_movements ADD COLUMN to_location VARCHAR(100);

-- Actualizar la constraint para incluir los nuevos tipos
-- SQLite no permite modificar constraints directamente, así que recreamos la tabla
CREATE TABLE inventory_movements_new (
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
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Copiar datos existentes
INSERT INTO inventory_movements_new 
SELECT id, product_id, type, quantity, previous_stock, new_stock, user_id, date, notes, NULL, NULL 
FROM inventory_movements;

-- Eliminar tabla antigua y renombrar la nueva
DROP TABLE inventory_movements;
ALTER TABLE inventory_movements_new RENAME TO inventory_movements;

-- Recrear índices
CREATE INDEX idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_date ON inventory_movements(date); 