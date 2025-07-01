-- Script para limpiar y resetear la base de datos
-- Ejecutar este script para limpiar todos los datos y dejar solo lo mínimo

-- Eliminar todos los datos existentes (en orden correcto por foreign keys)
DELETE FROM payments;
DELETE FROM accounts;
DELETE FROM inventory_movements;
DELETE FROM clients;
DELETE FROM products;
DELETE FROM users;

-- Resetear los contadores de auto-increment
DELETE FROM sqlite_sequence WHERE name IN ('users', 'products', 'clients', 'accounts', 'payments', 'inventory_movements');

-- Ahora ejecutar el seed.sql para insertar datos mínimos
-- Los datos se insertarán con IDs 1, 2, 3, etc. 