const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'wepapp_control.db');
const db = new sqlite3.Database(dbPath);

console.log('Actualizando contraseñas por defecto...');

// Actualizar contraseña del administrador
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
db.run('UPDATE users SET password_hash = ? WHERE email = ?', [adminPasswordHash, 'admin@empresa.com'], function(err) {
  if (err) {
    console.error('Error actualizando contraseña del administrador:', err);
  } else {
    console.log('Contraseña del administrador actualizada');
  }
});

// Actualizar contraseñas de revendedores
const revendedorPasswordHash = bcrypt.hashSync('revendedor123', 10);
db.run('UPDATE users SET password_hash = ? WHERE email LIKE ?', [revendedorPasswordHash, 'revendedor%@empresa.com'], function(err) {
  if (err) {
    console.error('Error actualizando contraseñas de revendedores:', err);
  } else {
    console.log('Contraseñas de revendedores actualizadas');
  }
  
  // Cerrar la base de datos
  db.close((err) => {
    if (err) {
      console.error('Error cerrando la base de datos:', err);
    } else {
      console.log('Base de datos cerrada. Contraseñas actualizadas correctamente.');
    }
  });
}); 