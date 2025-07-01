const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'wepapp_control.db');

// Eliminar base de datos existente si existe
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Base de datos existente eliminada');
}

// Crear nueva base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error creando la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Base de datos creada exitosamente');
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Leer y ejecutar el esquema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
  if (err) {
    console.error('Error ejecutando el esquema:', err.message);
    process.exit(1);
  }
  console.log('Esquema de base de datos ejecutado correctamente');
  
  // Leer y ejecutar los datos iniciales
  const seedPath = path.join(__dirname, 'seed.sql');
  const seed = fs.readFileSync(seedPath, 'utf8');
  
  db.exec(seed, (err) => {
    if (err) {
      console.error('Error ejecutando los datos iniciales:', err.message);
      process.exit(1);
    }
    console.log('Datos iniciales cargados correctamente');
    
    // Verificar que todo se creó correctamente
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('Error verificando tablas:', err.message);
      } else {
        console.log('\nTablas creadas:');
        tables.forEach(table => {
          console.log(`- ${table.name}`);
        });
      }
      
      // Contar registros en cada tabla
      const tablesToCheck = ['users', 'products', 'clients', 'accounts', 'payments', 'inventory_movements'];
      
      Promise.all(tablesToCheck.map(table => {
        return new Promise((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, result) => {
            if (err) reject(err);
            else resolve({ table, count: result.count });
          });
        });
      })).then(results => {
        console.log('\nRegistros en cada tabla:');
        results.forEach(({ table, count }) => {
          console.log(`- ${table}: ${count} registros`);
        });
        
        console.log('\n✅ Base de datos configurada exitosamente!');
        console.log('📊 Credenciales de prueba:');
        console.log('   Admin: admin@empresa.com / admin123');
        console.log('   Revendedor: revendedor1@empresa.com / revendedor123');
        
        db.close((err) => {
          if (err) {
            console.error('Error cerrando la base de datos:', err.message);
          } else {
            console.log('Base de datos cerrada correctamente');
          }
        });
      }).catch(err => {
        console.error('Error contando registros:', err.message);
        db.close();
      });
    });
  });
}); 