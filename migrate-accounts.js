const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'database/wepapp_control.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Función para verificar si una columna existe
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    const query = `PRAGMA table_info(${tableName});`;
    db.all(query, [], (err, columns) => {
      if (err) {
        reject(err);
      } else {
        const exists = columns.some(col => col.name === columnName);
        resolve(exists);
      }
    });
  });
}

// Función para agregar columna si no existe
function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await columnExists(tableName, columnName);
      if (!exists) {
        const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`;
        db.run(query, [], function(err) {
          if (err) {
            console.error(`❌ Error agregando columna ${columnName}:`, err.message);
            reject(err);
          } else {
            console.log(`✅ Columna ${columnName} agregada a ${tableName}`);
            resolve();
          }
        });
      } else {
        console.log(`ℹ️  Columna ${columnName} ya existe en ${tableName}`);
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Función para migrar la tabla accounts
async function migrateAccountsTable() {
  try {
    console.log('🔄 Migrando tabla accounts...\n');
    
    // Agregar columnas faltantes
    await addColumnIfNotExists('accounts', 'product_id', 'INTEGER DEFAULT 1');
    await addColumnIfNotExists('accounts', 'delivery_amount', 'REAL DEFAULT 0');
    await addColumnIfNotExists('accounts', 'installment_amount', 'REAL DEFAULT 0');
    await addColumnIfNotExists('accounts', 'start_date', 'DATE DEFAULT CURRENT_DATE');
    await addColumnIfNotExists('accounts', 'due_date', 'DATE DEFAULT (CURRENT_DATE + 365)');
    await addColumnIfNotExists('accounts', 'is_active', 'INTEGER DEFAULT 1');
    
    console.log('\n✅ Migración de tabla accounts completada');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    throw error;
  }
}

// Función para crear algunos datos de ejemplo
function createSampleData() {
  return new Promise((resolve, reject) => {
    console.log('\n📝 Creando datos de ejemplo...');
    
    // Crear algunos clientes de ejemplo
    const clients = [
      ['Cliente 1', 'cliente1@email.com', '123456789', 'Dirección 1', 1],
      ['Cliente 2', 'cliente2@email.com', '987654321', 'Dirección 2', 1],
      ['Cliente 3', 'cliente3@email.com', '555666777', 'Dirección 3', 1]
    ];

    const insertClient = 'INSERT INTO clients (name, email, phone, address, revendedor_id) VALUES (?, ?, ?, ?, ?)';
    
    let completed = 0;
    clients.forEach((client, index) => {
      db.run(insertClient, client, function(err) {
        if (err) {
          console.error(`❌ Error creando cliente ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Cliente ${index + 1} creado`);
        }
        completed++;
        if (completed === clients.length) {
          console.log('✅ Datos de ejemplo creados');
          resolve();
        }
      });
    });
  });
}

// Función principal
async function migrateDatabase() {
  try {
    console.log('🚀 Iniciando migración de base de datos...\n');
    
    await migrateAccountsTable();
    await createSampleData();
    
    console.log('\n🎉 ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
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
  migrateDatabase();
}

module.exports = { migrateDatabase }; 