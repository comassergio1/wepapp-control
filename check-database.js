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

// Función para verificar tablas
function checkTables() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name;
    `;
    
    db.all(query, [], (err, tables) => {
      if (err) {
        console.error('❌ Error verificando tablas:', err.message);
        reject(err);
      } else {
        console.log('\n📋 Tablas encontradas:');
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
        resolve(tables);
      }
    });
  });
}

// Función para verificar datos en tablas
function checkTableData() {
  return new Promise((resolve, reject) => {
    const tables = ['users', 'products', 'clients', 'accounts', 'payments', 'inventory_movements'];
    let completed = 0;
    
    tables.forEach(tableName => {
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, result) => {
        if (err) {
          console.log(`  ❌ ${tableName}: Error - ${err.message}`);
        } else {
          console.log(`  ✅ ${tableName}: ${result.count} registros`);
        }
        completed++;
        if (completed === tables.length) {
          resolve();
        }
      });
    });
  });
}

// Función para verificar estructura de tabla accounts
function checkAccountsStructure() {
  return new Promise((resolve, reject) => {
    const query = `PRAGMA table_info(accounts);`;
    
    db.all(query, [], (err, columns) => {
      if (err) {
        console.error('❌ Error verificando estructura de accounts:', err.message);
        reject(err);
      } else {
        console.log('\n🔍 Estructura de tabla accounts:');
        columns.forEach(col => {
          console.log(`  - ${col.name} (${col.type})`);
        });
        resolve(columns);
      }
    });
  });
}

// Función para verificar JOIN de accounts
function testAccountsJoin() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT a.*, c.name as client_name, p.name as product_name, u.name as revendedor_name
      FROM accounts a
      JOIN clients c ON a.client_id = c.id
      JOIN products p ON a.product_id = p.id
      JOIN users u ON a.revendedor_id = u.id
      LIMIT 1
    `;
    
    db.get(query, [], (err, result) => {
      if (err) {
        console.error('❌ Error en JOIN de accounts:', err.message);
        reject(err);
      } else {
        if (result) {
          console.log('✅ JOIN de accounts funciona correctamente');
        } else {
          console.log('ℹ️  No hay datos en accounts para probar JOIN');
        }
        resolve(result);
      }
    });
  });
}

// Función principal
async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');
    
    await checkTables();
    await checkTableData();
    await checkAccountsStructure();
    await testAccountsJoin();
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error.message);
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
  checkDatabase();
}

module.exports = { checkDatabase }; 