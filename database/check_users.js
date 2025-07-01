const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'wepapp_control.db');
const db = new sqlite3.Database(dbPath);

console.log('Verificando usuarios en la base de datos...\n');

db.all('SELECT id, name, email, role, is_active, password_hash FROM users', [], (err, users) => {
  if (err) {
    console.error('Error obteniendo usuarios:', err);
    return;
  }
  
  users.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`Nombre: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Rol: ${user.role}`);
    console.log(`Activo: ${user.is_active}`);
    console.log(`Hash de contraseña: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
    console.log('---');
  });
  
  db.close((err) => {
    if (err) {
      console.error('Error cerrando la base de datos:', err);
    } else {
      console.log('Base de datos cerrada.');
    }
  });
}); 