const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta a la base de datos
const dbPath = path.join(__dirname, 'wepapp_control.db');

console.log('🧹 Limpiando base de datos...');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath);

// Función para ejecutar queries de forma asíncrona
const runQuery = (query) => {
  return new Promise((resolve, reject) => {
    db.run(query, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

// Función para ejecutar múltiples queries
const runQueries = async (queries) => {
  for (const query of queries) {
    try {
      await runQuery(query);
      console.log(`✅ Ejecutado: ${query.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Error ejecutando: ${query.substring(0, 50)}...`);
      console.error(error.message);
    }
  }
};

// Función principal
const cleanDatabase = async () => {
  try {
    console.log('📋 Eliminando datos existentes...');
    
    // Queries para limpiar la base de datos
    const cleanQueries = [
      'DELETE FROM payments',
      'DELETE FROM accounts', 
      'DELETE FROM inventory_movements',
      'DELETE FROM clients',
      'DELETE FROM products',
      'DELETE FROM users',
      "DELETE FROM sqlite_sequence WHERE name IN ('users', 'products', 'clients', 'accounts', 'payments', 'inventory_movements')"
    ];

    await runQueries(cleanQueries);
    
    console.log('📥 Insertando datos mínimos...');
    
    // Leer y ejecutar el seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedContent = fs.readFileSync(seedPath, 'utf8');
    
    // Dividir el contenido en queries individuales
    const seedQueries = seedContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));
    
    await runQueries(seedQueries);
    
    console.log('✅ Base de datos limpiada y reseteada exitosamente!');
    console.log('');
    console.log('📊 Datos actuales:');
    console.log('   👤 1 Usuario (Administrador)');
    console.log('   📦 1 Producto (iPhone 15 Pro)');
    console.log('   👥 1 Cliente (Cliente Demo)');
    console.log('   📋 1 Movimiento de inventario');
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Email: admin@empresa.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
  } finally {
    db.close();
  }
};

// Ejecutar la limpieza
cleanDatabase(); 