const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database/wepapp_control.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Función para crear el esquema de la base de datos
function createSchema() {
  return new Promise((resolve, reject) => {
    const schema = `
      -- Tabla de usuarios
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de productos
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        category TEXT,
        location TEXT DEFAULT 'Central',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de clientes
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        revendedor_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (revendedor_id) REFERENCES users (id)
      );

      -- Tabla de cuentas
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        revendedor_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        remaining_amount REAL DEFAULT 0,
        delivery_amount REAL DEFAULT 0,
        installment_amount REAL DEFAULT 0,
        total_installments INTEGER DEFAULT 1,
        paid_installments INTEGER DEFAULT 0,
        start_date DATE DEFAULT CURRENT_DATE,
        due_date DATE DEFAULT (CURRENT_DATE + 365),
        status TEXT DEFAULT 'active',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (revendedor_id) REFERENCES users (id)
      );

      -- Tabla de pagos
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATE NOT NULL,
        payment_method TEXT,
        receipt_path TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
      );

      -- Tabla de movimientos de inventario
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        notes TEXT,
        from_location TEXT,
        to_location TEXT,
        date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Error creando esquema:', err.message);
        reject(err);
      } else {
        console.log('✅ Esquema de base de datos creado');
        resolve();
      }
    });
  });
}

// Función para crear usuario administrador
function createAdminUser() {
  return new Promise((resolve, reject) => {
    const adminEmail = 'admin@phoenixconsultora.com';
    const adminPassword = 'admin123';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    // Verificar si el usuario ya existe
    db.get('SELECT id FROM users WHERE email = ?', [adminEmail], (err, user) => {
      if (err) {
        console.error('❌ Error verificando usuario:', err.message);
        reject(err);
        return;
      }

      if (user) {
        console.log('ℹ️  Usuario administrador ya existe');
        resolve();
        return;
      }

      // Crear usuario administrador
      const query = 'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)';
      db.run(query, ['Administrador', adminEmail, passwordHash, 'admin', 1], function(err) {
        if (err) {
          console.error('❌ Error creando usuario administrador:', err.message);
          reject(err);
        } else {
          console.log('✅ Usuario administrador creado');
          console.log('📧 Email: admin@phoenixconsultora.com');
          console.log('🔑 Contraseña: admin123');
          resolve();
        }
      });
    });
  });
}

// Función para crear algunos datos de ejemplo
function createSampleData() {
  return new Promise((resolve, reject) => {
    // Crear algunos productos de ejemplo
    const products = [
      ['Producto 1', 'Descripción del producto 1', 100.00, 50, 'Categoría A', 'Central'],
      ['Producto 2', 'Descripción del producto 2', 200.00, 30, 'Categoría B', 'Central'],
      ['Producto 3', 'Descripción del producto 3', 150.00, 25, 'Categoría A', 'Central']
    ];

    const insertProduct = 'INSERT INTO products (name, description, price, stock, category, location) VALUES (?, ?, ?, ?, ?, ?)';
    
    let completed = 0;
    products.forEach((product, index) => {
      db.run(insertProduct, product, function(err) {
        if (err) {
          console.error(`❌ Error creando producto ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Producto ${index + 1} creado`);
        }
        completed++;
        if (completed === products.length) {
          console.log('✅ Datos de ejemplo creados');
          resolve();
        }
      });
    });
  });
}

// Función principal
async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuración de base de datos...');
    
    await createSchema();
    await createAdminUser();
    await createSampleData();
    
    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('📧 Email: admin@phoenixconsultora.com');
    console.log('🔑 Contraseña: admin123');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error cerrando base de datos:', err.message);
      } else {
        console.log('✅ Base de datos cerrada');
      }
    });
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 