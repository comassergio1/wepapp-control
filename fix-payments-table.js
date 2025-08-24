const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta de la base de datos
const dbPath = path.join(__dirname, './database/wepapp_control.db');

console.log('🔧 Corrigiendo tabla payments...');
console.log('📁 Ruta de BD:', dbPath);

// Leer el script SQL
const sqlScript = fs.readFileSync('./fix-payments-table.sql', 'utf8');

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Conectado a la base de datos SQLite');
  
  // Habilitar foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Ejecutar el script de corrección
  console.log('🚀 Aplicando correcciones...');
  
  // Dividir el script en comandos individuales
  const commands = sqlScript.split(';').filter(cmd => cmd.trim());
  
  let completedCommands = 0;
  
  commands.forEach((command, index) => {
    if (command.trim()) {
      console.log(`📝 Ejecutando comando ${index + 1}/${commands.length}...`);
      
      db.run(command, (err) => {
        if (err) {
          console.error(`❌ Error en comando ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Comando ${index + 1} ejecutado`);
        }
        
        completedCommands++;
        
        if (completedCommands === commands.length) {
          // Verificar estructura final
          console.log('\n🔍 Verificando estructura final...');
          db.all("PRAGMA table_info(payments)", [], (err, columns) => {
            if (err) {
              console.error('❌ Error verificando estructura:', err.message);
            } else {
              console.log('📋 Estructura final de la tabla payments:');
              columns.forEach(col => {
                console.log(`  - ${col.name} (${col.type})`);
              });
            }
            
            // Probar la query que fallaba
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
              } else {
                console.log(`✅ Query de prueba exitosa: ${payments.length} pagos`);
              }
              
              // Cerrar conexión
              db.close((err) => {
                if (err) {
                  console.error('❌ Error cerrando BD:', err.message);
                } else {
                  console.log('✅ Base de datos cerrada');
                  console.log('\n🎉 ¡Corrección completada!');
                }
              });
            });
          });
        }
      });
    }
  });
});
