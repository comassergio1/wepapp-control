const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, './database/wepapp_control.db');

console.log('🔍 Verificando tabla payments...');
console.log('📁 Ruta de BD:', dbPath);

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Conectado a la base de datos SQLite');
  
  // Verificar estructura de la tabla payments
  db.all("PRAGMA table_info(payments)", [], (err, columns) => {
    if (err) {
      console.error('❌ Error obteniendo estructura de payments:', err.message);
      return;
    }
    
    console.log('📋 Estructura de la tabla payments:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Verificar si hay datos
    db.get('SELECT COUNT(*) as count FROM payments', [], (err, result) => {
      if (err) {
        console.error('❌ Error contando pagos:', err.message);
      } else {
        console.log(`💰 Pagos en la tabla: ${result.count}`);
      }
      
      // Verificar si hay cuentas
      db.get('SELECT COUNT(*) as count FROM accounts', [], (err, result) => {
        if (err) {
          console.error('❌ Error contando cuentas:', err.message);
        } else {
          console.log(`📊 Cuentas en la tabla: ${result.count}`);
        }
        
        // Verificar si hay clientes
        db.get('SELECT COUNT(*) as count FROM clients', [], (err, result) => {
          if (err) {
            console.error('❌ Error contando clientes:', err.message);
          } else {
            console.log(`👥 Clientes en la tabla: ${result.count}`);
          }
          
          // Verificar si hay usuarios
          db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
            if (err) {
              console.error('❌ Error contando usuarios:', err.message);
            } else {
              console.log(`👤 Usuarios en la tabla: ${result.count}`);
            }
            
            // Probar la query que falla
            console.log('\n🧪 Probando query de payments...');
            const testQuery = `
              SELECT p.*, a.client_id, c.name as client_name, u.name as user_name
              FROM payments p
              JOIN accounts a ON p.account_id = a.id
              JOIN clients c ON a.client_id = c.id
              JOIN users u ON p.user_id = u.id
            `;
            
            db.all(testQuery, [], (err, payments) => {
              if (err) {
                console.error('❌ Error en query de prueba:', err.message);
                console.error('🔍 Error completo:', err);
              } else {
                console.log(`✅ Query de prueba exitosa: ${payments.length} pagos`);
                if (payments.length > 0) {
                  console.log('📝 Primer pago:', payments[0]);
                }
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
    });
  });
});
