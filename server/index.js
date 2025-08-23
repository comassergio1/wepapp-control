const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Importar setup de base de datos
const { setupDatabase } = require('../setup-database');
const { checkDatabase } = require('../check-database');
const { migrateDatabase } = require('../migrate-accounts');

// Conectar a la base de datos
const dbPath = path.join(__dirname, '../database/wepapp_control.db');
const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
    
    // Ejecutar setup de base de datos si es necesario
    try {
      await setupDatabase();
      // Ejecutar migración si es necesario
      await migrateDatabase();
      // Verificar estado de la base de datos
      await checkDatabase();
      console.log('✅ Configuración de base de datos completada');
    } catch (setupError) {
      console.error('❌ Error en setup de base de datos:', setupError.message);
      // No cerrar el servidor por errores de setup
      console.log('⚠️  Continuando con el servidor...');
    }
  }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/comprobantes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Rutas de autenticación
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
  db.get(query, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña usando bcrypt
    try {
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      // No enviar la contraseña en la respuesta
      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (bcryptError) {
      console.error('Error verificando contraseña:', bcryptError);
      return res.status(500).json({ error: 'Error verificando credenciales' });
    }
  });
});

// Rutas de usuarios
app.get('/api/users', (req, res) => {
  const query = 'SELECT id, name, email, role, is_active, created_at, updated_at FROM users';
  db.all(query, [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
    res.json(users);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, password, role, isActive } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);
  const is_active = typeof isActive === 'boolean' ? (isActive ? 1 : 0) : 1;
  
  const query = 'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)';
  db.run(query, [name, email, passwordHash, role, is_active], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error creando usuario' });
    }
    res.json({ id: this.lastID, name, email, role, is_active });
  });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, isActive } = req.body;
  
  let query, params;
  
  if (password) {
    // Si se proporciona una nueva contraseña, actualizarla también
    const passwordHash = bcrypt.hashSync(password, 10);
    query = 'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params = [name, email, passwordHash, role, isActive, id];
  } else {
    // Si no se proporciona contraseña, mantener la existente
    query = 'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    params = [name, email, role, isActive, id];
  }
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error actualizando usuario' });
    }
    
    // Obtener el usuario actualizado
    const getUserQuery = 'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?';
    db.get(getUserQuery, [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo usuario actualizado' });
      }
      res.json(user);
    });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar si el usuario tiene clientes asociados
  db.get('SELECT COUNT(*) as count FROM clients WHERE revendedor_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error verificando clientes del usuario' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene clientes asociados' });
    }
    
    // Verificar si el usuario tiene cuentas asociadas
    db.get('SELECT COUNT(*) as count FROM accounts WHERE revendedor_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error verificando cuentas del usuario' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene cuentas asociadas' });
      }
      
      // Eliminar usuario
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error eliminando usuario' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
      });
    });
  });
});

// Rutas de productos
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products WHERE is_active = 1';
  db.all(query, [], (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo productos' });
    }
    res.json(products);
  });
});

app.post('/api/products', (req, res) => {
  const { name, description, price, stock, category, location } = req.body;
  
  const query = 'INSERT INTO products (name, description, price, stock, category, location) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(query, [name, description, price, stock, category, location || 'Central'], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error creando producto' });
    }
    
    // Registrar movimiento de ingreso
    const movementQuery = 'INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, user_id, notes, from_location, to_location, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)';
    db.run(movementQuery, [this.lastID, 'ingreso', stock, 0, stock, 1, 'Creación de producto', null, location || 'Central'], (err) => {
      if (err) {
        console.error('Error registrando movimiento:', err);
      }
    });
    
    res.json({ id: this.lastID, name, description, price, stock, category, location: location || 'Central' });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, location } = req.body;
  
  const query = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(query, [name, description, price, stock, category, location, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error actualizando producto' });
    }
    res.json({ id, name, description, price, stock, category, location });
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar si el producto tiene cuentas asociadas
  db.get('SELECT COUNT(*) as count FROM accounts WHERE product_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error verificando cuentas del producto' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el producto porque tiene cuentas asociadas' });
    }
    
    // Primero eliminar los movimientos de inventario asociados al producto
    db.run('DELETE FROM inventory_movements WHERE product_id = ?', [id], function(err) {
      if (err) {
        console.error('Error eliminando movimientos del producto:', err);
      }
      
      // Luego eliminar el producto
      db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error eliminando producto' });
        }
        res.json({ message: 'Producto eliminado correctamente' });
      });
    });
  });
});

// Rutas de clientes
app.get('/api/clients', (req, res) => {
  const { revendedorId } = req.query;
  let query = `
    SELECT c.*, u.name as revendedor_name 
    FROM clients c 
    JOIN users u ON c.revendedor_id = u.id
  `;
  let params = [];
  
  if (revendedorId) {
    query += ' WHERE c.revendedor_id = ?';
    params.push(revendedorId);
  }
  
  db.all(query, params, (err, clients) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo clientes' });
    }
    res.json(clients);
  });
});

app.post('/api/clients', (req, res) => {
  const { name, email, phone, address, revendedorId } = req.body;

  // Verificar si ya existe un cliente con ese email
  db.get('SELECT * FROM clients WHERE email = ?', [email], (err, existingClient) => {
    if (err) {
      return res.status(500).json({ error: 'Error verificando email de cliente' });
    }
    if (existingClient) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese email', name: existingClient.name });
    }

    const query = 'INSERT INTO clients (name, email, phone, address, revendedor_id) VALUES (?, ?, ?, ?, ?)';
    db.run(query, [name, email, phone, address, revendedorId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creando cliente' });
      }
      res.json({ id: this.lastID, name, email, phone, address, revendedorId });
    });
  });
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, isActive } = req.body;
  
  const query = 'UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(query, [name, email, phone, address, isActive, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error actualizando cliente' });
    }
    
    // Si se cambió el estado del cliente, actualizar todas sus cuentas
    if (isActive !== undefined) {
      db.run('UPDATE accounts SET is_active = ? WHERE client_id = ?', [isActive, id]);
    }
    
    res.json({ id, name, email, phone, address, isActive });
  });
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar si el cliente tiene cuentas activas
  db.get('SELECT COUNT(*) as count FROM accounts WHERE client_id = ? AND is_active = 1', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error verificando cuentas del cliente' });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene cuentas activas' });
    }
    
    // Eliminar cliente
    db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error eliminando cliente' });
      }
      res.json({ message: 'Cliente eliminado correctamente' });
    });
  });
});

// Rutas de cuentas
app.get('/api/accounts', (req, res) => {
  const { revendedorId } = req.query;
  let query = `
    SELECT a.*, c.name as client_name, p.name as product_name, u.name as revendedor_name
    FROM accounts a
    JOIN clients c ON a.client_id = c.id
    JOIN products p ON a.product_id = p.id
    JOIN users u ON a.revendedor_id = u.id
    WHERE c.is_active = 1
  `;
  let params = [];
  
  if (revendedorId) {
    query += ' AND a.revendedor_id = ?';
    params.push(revendedorId);
  }
  
  db.all(query, params, (err, accounts) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo cuentas' });
    }
    res.json(accounts);
  });
});

app.post('/api/accounts', (req, res) => {
  const { clientId, productId, totalAmount, deliveryAmount, installmentAmount, totalInstallments, revendedorId } = req.body;
  
  const paidAmount = deliveryAmount || 0;
  const remainingAmount = totalAmount - paidAmount;
  
  // Primero obtener el stock actual del producto
  db.get('SELECT stock, name, location FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo información del producto' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    if (product.stock <= 0) {
      return res.status(400).json({ error: 'No hay stock disponible para este producto' });
    }
    
    const previousStock = product.stock;
    const newStock = previousStock - 1;
    
    const query = `
      INSERT INTO accounts (client_id, product_id, total_amount, paid_amount, remaining_amount, delivery_amount, installment_amount, total_installments, start_date, due_date, revendedor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, DATE('now', '+1 year'), ?)
    `;
    
    db.run(query, [clientId, productId, totalAmount, paidAmount, remainingAmount, deliveryAmount, installmentAmount, totalInstallments, revendedorId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creando cuenta' });
      }
      
      const accountId = this.lastID;
      
      // Descontar stock del producto
      db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId], function(err) {
        if (err) {
          console.error('Error actualizando stock:', err);
        }
      });
      
      // Registrar movimiento de egreso
      const movementQuery = 'INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, user_id, notes, from_location, to_location, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)';
      db.run(movementQuery, [productId, 'egreso', 1, previousStock, newStock, revendedorId, `Venta - Cuenta ${accountId}`, product.location, null], function(err) {
        if (err) {
          console.error('Error registrando movimiento:', err);
        }
      });
      
      // Obtener la cuenta completa con nombres de cliente y producto
      const getAccountQuery = `
        SELECT a.*, c.name as client_name, p.name as product_name, u.name as revendedor_name
        FROM accounts a
        JOIN clients c ON a.client_id = c.id
        JOIN products p ON a.product_id = p.id
        JOIN users u ON a.revendedor_id = u.id
        WHERE a.id = ?
      `;
      
      db.get(getAccountQuery, [accountId], (err, account) => {
        if (err) {
          return res.status(500).json({ error: 'Error obteniendo cuenta creada' });
        }
        res.json(account);
      });
    });
  });
});

app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const { clientId, productId, totalAmount, paidAmount, remainingAmount, deliveryAmount, installmentAmount, totalInstallments, paidInstallments, status, isActive } = req.body;
  
  const query = `
    UPDATE accounts 
    SET client_id = ?, product_id = ?, total_amount = ?, paid_amount = ?, remaining_amount = ?, 
        delivery_amount = ?, installment_amount = ?, total_installments = ?, paid_installments = ?, 
        status = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [clientId, productId, totalAmount, paidAmount, remainingAmount, deliveryAmount, installmentAmount, totalInstallments, paidInstallments, status, isActive, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error actualizando cuenta' });
    }
    
    // Obtener la cuenta actualizada
    const getAccountQuery = `
      SELECT a.*, c.name as client_name, p.name as product_name, u.name as revendedor_name
      FROM accounts a
      JOIN clients c ON a.client_id = c.id
      JOIN products p ON a.product_id = p.id
      JOIN users u ON a.revendedor_id = u.id
      WHERE a.id = ?
    `;
    
    db.get(getAccountQuery, [id], (err, account) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo cuenta actualizada' });
      }
      res.json(account);
    });
  });
});

app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  
  // Primero obtener información de la cuenta antes de eliminarla
  db.get('SELECT product_id, client_id FROM accounts WHERE id = ?', [id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo información de la cuenta' });
    }
    
    if (!account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    
    const productId = account.product_id;
    const clientId = account.client_id;
    
    // Obtener información del producto para restablecer el stock
    db.get('SELECT stock, name, location FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo información del producto' });
      }
      
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const previousStock = product.stock;
      const newStock = previousStock + 1; // Restablecer una unidad
      
      // Eliminar la cuenta
      db.run('DELETE FROM accounts WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error eliminando cuenta' });
        }
        
        // Restablecer stock del producto
        db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId], function(err) {
          if (err) {
            console.error('Error actualizando stock:', err);
          }
        });
        
        // Registrar movimiento de ingreso (restablecimiento)
        const movementQuery = 'INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, user_id, notes, from_location, to_location, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)';
        db.run(movementQuery, [productId, 'ingreso', 1, previousStock, newStock, 1, `Restablecimiento - Cuenta ${id} eliminada`, null, product.location], function(err) {
          if (err) {
            console.error('Error registrando movimiento:', err);
          }
        });
        
        res.json({ message: 'Cuenta eliminada correctamente' });
      });
    });
  });
});

// Obtener una cuenta por ID
app.get('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT a.*, c.name as client_name, p.name as product_name, u.name as revendedor_name
    FROM accounts a
    JOIN clients c ON a.client_id = c.id
    JOIN products p ON a.product_id = p.id
    JOIN users u ON a.revendedor_id = u.id
    WHERE a.id = ?
  `;
  db.get(query, [id], (err, account) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo cuenta' });
    }
    if (!account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(account);
  });
});

// Rutas de pagos
app.get('/api/payments', (req, res) => {
  const { accountId } = req.query;
  let query = `
    SELECT p.*, a.client_id, c.name as client_name, u.name as user_name
    FROM payments p
    JOIN accounts a ON p.account_id = a.id
    JOIN clients c ON a.client_id = c.id
    JOIN users u ON p.user_id = u.id
  `;
  let params = [];
  
  if (accountId) {
    query += ' WHERE p.account_id = ?';
    params.push(accountId);
  }
  
  db.all(query, params, (err, payments) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo pagos' });
    }
    res.json(payments);
  });
});

app.post('/api/payments', upload.single('receipt'), (req, res) => {
  const { accountId, amount, installmentNumber, paymentMethod, notes, userId } = req.body;
  let receiptImage = '';
  if (req.file) {
    receiptImage = '/uploads/comprobantes/' + req.file.filename;
  }
  const query = 'INSERT INTO payments (account_id, amount, installment_number, payment_date, payment_method, notes, user_id, receipt_image) VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?, ?)';
  db.run(query, [accountId, amount, installmentNumber, paymentMethod, notes, userId, receiptImage], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error registrando pago' });
    }
    const paymentId = this.lastID;
    // ... resto de la lógica de actualización de cuenta ...
    // (puedes dejar igual el resto del endpoint)
    res.json({ id: paymentId, accountId, amount, installmentNumber, receiptImage });
  });
});

app.put('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  const { accountId, amount, installmentNumber, paymentMethod, notes, userId } = req.body;
  
  // Primero obtener el pago actual para calcular la diferencia
  db.get('SELECT account_id, amount FROM payments WHERE id = ?', [id], (err, oldPayment) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo pago anterior' });
    }
    
    if (!oldPayment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    const oldAmount = oldPayment.amount;
    const oldAccountId = oldPayment.account_id;
    const amountDifference = amount - oldAmount;
    
    // Actualizar el pago
    const query = `
      UPDATE payments 
      SET account_id = ?, amount = ?, installment_number = ?, payment_method = ?, notes = ?, user_id = ?
      WHERE id = ?
    `;
    
    db.run(query, [accountId, amount, installmentNumber, paymentMethod, notes, userId, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error actualizando pago' });
      }
      
      // Si cambió la cuenta, actualizar ambas cuentas
      if (oldAccountId !== accountId) {
        // Restar del monto de la cuenta anterior
        db.run('UPDATE accounts SET paid_amount = paid_amount - ? WHERE id = ?', [oldAmount, oldAccountId]);
        // Sumar al monto de la nueva cuenta
        db.run('UPDATE accounts SET paid_amount = paid_amount + ? WHERE id = ?', [amount, accountId]);
        
        // Actualizar ambas cuentas
        updateAccountTotals(oldAccountId, () => {
          updateAccountTotals(accountId, () => {
            // Obtener el pago actualizado
            const getPaymentQuery = `
              SELECT p.*, a.client_id, c.name as client_name, u.name as user_name
              FROM payments p
              JOIN accounts a ON p.account_id = a.id
              JOIN clients c ON a.client_id = c.id
              JOIN users u ON p.user_id = u.id
              WHERE p.id = ?
            `;
            
            db.get(getPaymentQuery, [id], (err, payment) => {
              if (err) {
                return res.status(500).json({ error: 'Error obteniendo pago actualizado' });
              }
              res.json(payment);
            });
          });
        });
      } else {
        // Solo actualizar la cuenta actual
        db.run('UPDATE accounts SET paid_amount = paid_amount + ? WHERE id = ?', [amountDifference, accountId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error actualizando cuenta' });
          }
          
          updateAccountTotals(accountId, () => {
            // Obtener el pago actualizado
            const getPaymentQuery = `
              SELECT p.*, a.client_id, c.name as client_name, u.name as user_name
              FROM payments p
              JOIN accounts a ON p.account_id = a.id
              JOIN clients c ON a.client_id = c.id
              JOIN users u ON p.user_id = u.id
              WHERE p.id = ?
            `;
            
            db.get(getPaymentQuery, [id], (err, payment) => {
              if (err) {
                return res.status(500).json({ error: 'Error obteniendo pago actualizado' });
              }
              res.json(payment);
            });
          });
        });
      }
    });
  });
});

app.delete('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  
  // Primero obtener el pago para saber qué cuenta actualizar
  db.get('SELECT account_id, amount FROM payments WHERE id = ?', [id], (err, payment) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo pago' });
    }
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    const accountId = payment.account_id;
    const amount = payment.amount;
    
    // Eliminar el pago
    db.run('DELETE FROM payments WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error eliminando pago' });
      }
      
      // Actualizar la cuenta restando el monto del pago eliminado
      db.run('UPDATE accounts SET paid_amount = paid_amount - ? WHERE id = ?', [amount, accountId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error actualizando cuenta' });
        }
        
        updateAccountTotals(accountId, () => {
          res.json({ message: 'Pago eliminado correctamente' });
        });
      });
    });
  });
});

// Función auxiliar para actualizar totales de cuenta
function updateAccountTotals(accountId, callback) {
  db.get('SELECT total_amount, paid_amount, total_installments FROM accounts WHERE id = ?', [accountId], (err, account) => {
    if (err) {
      return callback(err);
    }
    
    const remainingAmount = account.total_amount - account.paid_amount;
    const paidInstallments = Math.ceil(account.paid_amount / (account.total_amount / account.total_installments));
    const status = remainingAmount <= 0 ? 'completed' : 'active';
    
    db.run('UPDATE accounts SET remaining_amount = ?, paid_installments = ?, status = ? WHERE id = ?', 
      [remainingAmount, paidInstallments, status, accountId], function(err) {
      if (err) {
        return callback(err);
      }
      callback();
    });
  });
}

// Rutas de movimientos de inventario
app.get('/api/inventory-movements', (req, res) => {
  const query = `
    SELECT im.*, p.name as product_name, u.name as user_name
    FROM inventory_movements im
    JOIN products p ON im.product_id = p.id
    JOIN users u ON im.user_id = u.id
    ORDER BY im.date DESC
  `;
  
  db.all(query, [], (err, movements) => {
    if (err) {
      return res.status(500).json({ error: 'Error obteniendo movimientos' });
    }
    res.json(movements);
  });
});

app.post('/api/inventory-movements', (req, res) => {
  const { productId, type, quantity, previousStock, newStock, userId, notes, fromLocation, toLocation } = req.body;
  
  const query = `
    INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, user_id, notes, from_location, to_location, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
  `;
  
  db.run(query, [productId, type, quantity, previousStock, newStock, userId, notes, fromLocation, toLocation], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error creando movimiento' });
    }
    
    // Solo actualizar el stock si NO es un traslado
    if (type !== 'traslado') {
      db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId], function(err) {
        if (err) {
          console.error('Error actualizando stock:', err);
        }
      });
    } else {
      // Para traslados, solo actualizar la ubicación del producto
      db.run('UPDATE products SET location = ? WHERE id = ?', [toLocation, productId], function(err) {
        if (err) {
          console.error('Error actualizando ubicación:', err);
        }
      });
    }
    
    // Obtener el movimiento completo con nombres de producto y usuario
    const getMovementQuery = `
      SELECT im.*, p.name as product_name, u.name as user_name
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      JOIN users u ON im.user_id = u.id
      WHERE im.id = ?
    `;
    
    db.get(getMovementQuery, [this.lastID], (err, movement) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo movimiento creado' });
      }
      res.json(movement);
    });
  });
});

app.put('/api/inventory-movements/:id', (req, res) => {
  const { id } = req.params;
  const { productId, type, quantity, previousStock, newStock, userId, notes, fromLocation, toLocation } = req.body;
  
  const query = `
    UPDATE inventory_movements 
    SET product_id = ?, type = ?, quantity = ?, previous_stock = ?, new_stock = ?, user_id = ?, notes = ?, from_location = ?, to_location = ?
    WHERE id = ?
  `;
  
  db.run(query, [productId, type, quantity, previousStock, newStock, userId, notes, fromLocation, toLocation, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error actualizando movimiento' });
    }
    
    // Solo actualizar el stock si NO es un traslado
    if (type !== 'traslado') {
      db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId], function(err) {
        if (err) {
          console.error('Error actualizando stock:', err);
        }
      });
    } else {
      // Para traslados, solo actualizar la ubicación del producto
      db.run('UPDATE products SET location = ? WHERE id = ?', [toLocation, productId], function(err) {
        if (err) {
          console.error('Error actualizando ubicación:', err);
        }
      });
    }
    
    // Obtener el movimiento actualizado
    const getMovementQuery = `
      SELECT im.*, p.name as product_name, u.name as user_name
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      JOIN users u ON im.user_id = u.id
      WHERE im.id = ?
    `;
    
    db.get(getMovementQuery, [id], (err, movement) => {
      if (err) {
        return res.status(500).json({ error: 'Error obteniendo movimiento actualizado' });
      }
      res.json(movement);
    });
  });
});

app.delete('/api/inventory-movements/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM inventory_movements WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error eliminando movimiento' });
    }
    res.json({ message: 'Movimiento eliminado correctamente' });
  });
});

// Servir archivos de comprobantes de forma pública
app.use('/uploads/comprobantes', express.static(path.join(__dirname, '../uploads/comprobantes')));

// Servir archivos estáticos de React (build)
app.use(express.static(path.join(__dirname, '../build')));

// Ruta para obtener el valor del dólar blue
app.get('/api/dolar-blue', async (req, res) => {
  try {
    const response = await axios.get('https://dolarhoy.com/');
    const html = response.data;
    const $ = cheerio.load(html);
    // Usar el XPath proporcionado para encontrar el valor
    // XPath: //*[@id="home_0"]/div[2]/section/div/div/div[2]/div[1]/div/div[2]/div[1]/div[2]/div[3]/div[1]/div[2]
    // En cheerio, buscar el selector equivalente:
    // Inspeccionando la web, el valor de venta del dólar blue suele estar en:
    // div[data-market="Dolar Blue"] .value
    let valor = null;
    valor = $("div[data-market='Dolar Blue'] .value").first().text().replace(/[^\d,\.]/g, '').replace(',', '.');
    if (!valor) {
      // Fallback: buscar por estructura del XPath
      valor = $("#home_0 > div:nth-child(2) section > div > div > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(2)").text().replace(/[^\d,\.]/g, '').replace(',', '.');
    }
    if (!valor) {
      return res.status(500).json({ error: 'No se pudo obtener el valor del dólar blue', valor: 1200 });
    }
    res.json({ valor: parseFloat(valor) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el valor del dólar blue', valor: 1200 });
  }
});

// Ruta catch-all para React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Servidor listo para recibir conexiones`);
});

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('❌ Error en el servidor:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error('⚠️  El puerto ya está en uso');
  }
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('🔄 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});