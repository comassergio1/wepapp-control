-- Agregar campo location a la tabla products
ALTER TABLE products ADD COLUMN location VARCHAR(100) DEFAULT 'Central';

-- Actualizar productos existentes con ubicación por defecto
UPDATE products SET location = 'Central' WHERE location IS NULL; 