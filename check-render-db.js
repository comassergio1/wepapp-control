const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, './database/wepapp_control.db');

console.log('🔍 Verificando base de datos en Render...');
console.log('📁 Ruta de BD:', dbPath);

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Conectado a la base de datos SQLite');
  
  // Verificar si las tablas existen
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('❌ Error obteniendo tablas:', err.message);
      return;
    }
    
    console.log('📋 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    // Verificar productos
    db.get('SELECT COUNT(*) as count FROM products', [], (err, result) => {
      if (err) {
        console.error('❌ Error contando productos:', err.message);
      } else {
        console.log(`📦 Productos en inventario: ${result.count}`);
      }
      
      // Verificar usuarios
      db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
        if (err) {
          console.error('❌ Error contando usuarios:', err.message);
        } else {
          console.log(`👥 Usuarios en el sistema: ${result.count}`);
        }
        
        // Cerrar conexión
        db.close((err) => {
          if (err) {
            console.error('❌ Error cerrando BD:', err.message);
          } else {
            console.log('✅ Base de datos cerrada');
          }
        });
      });
    });
  });
});
