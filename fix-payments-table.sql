-- Script para corregir la tabla payments
-- Agregar columnas faltantes y corregir nombres

-- Agregar columna user_id si no existe
ALTER TABLE payments ADD COLUMN user_id INTEGER;

-- Agregar columna created_at si no existe
ALTER TABLE payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Renombrar receipt_path a receipt_image si es necesario
-- (SQLite no soporta RENAME COLUMN directamente, así que creamos una nueva tabla)

-- Crear nueva tabla con estructura correcta
CREATE TABLE payments_new (
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

-- Copiar datos existentes (si los hay)
INSERT INTO payments_new (id, account_id, amount, installment_number, payment_date, payment_method, notes, user_id, created_at)
SELECT id, account_id, amount, installment_number, payment_date, payment_method, notes, COALESCE(user_id, 1), COALESCE(created_at, CURRENT_TIMESTAMP)
FROM payments;

-- Eliminar tabla antigua
DROP TABLE payments;

-- Renombrar nueva tabla
ALTER TABLE payments_new RENAME TO payments;

-- Recrear índices
CREATE INDEX idx_payments_account ON payments(account_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Verificar estructura final
PRAGMA table_info(payments);
