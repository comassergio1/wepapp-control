const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Configuración
const dbPath = path.join(__dirname, 'database', 'wepapp_control.db');
const importDir = path.join(__dirname, 'import-excel');

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath);

console.log('🚀 Iniciando importación masiva de datos...\n');

// Función para leer archivo Excel
function readExcelFile(filename) {
  const filepath = path.join(importDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`❌ Archivo no encontrado: ${filename}`);
    return null;
  }
  
  const workbook = XLSX.readFile(filepath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length < 2) {
    console.log(`❌ Archivo vacío o sin datos: ${filename}`);
    return null;
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return { headers, rows };
}

// Función para importar usuarios
async function importUsers() {
  console.log('👥 Importando usuarios...');
  const data = readExcelFile('usuarios.xlsx');
  if (!data) return;
  
  const { headers, rows } = data;
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row.length < 4) continue;
    
    try {
      const [name, email, password, role, is_active] = row;
      
      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);
      
      const sql = `
        INSERT INTO users (name, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      await new Promise((resolve, reject) => {
        db.run(sql, [name, email, passwordHash, role, is_active === 'TRUE' ? 1 : 0], function(err) {
          if (err) {
            console.log(`❌ Error importando usuario ${email}: ${err.message}`);
            errors++;
            reject(err);
          } else {
            imported++;
            resolve();
          }
        });
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Usuarios importados: ${imported}, Errores: ${errors}\n`);
}

// Función para importar productos
function importProducts() {
  console.log('📦 Importando productos...');
  const data = readExcelFile('productos.xlsx');
  if (!data) return;
  
  const { headers, rows } = data;
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row.length < 6) continue;
    
    try {
      const [name, description, price, stock, category, location, is_active] = row;
      
      const sql = `
        INSERT INTO products (name, description, price, stock, category, location, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(sql, [name, description, parseFloat(price), parseInt(stock), category, location, is_active === 'TRUE' ? 1 : 0], function(err) {
        if (err) {
          console.log(`❌ Error importando producto ${name}: ${err.message}`);
          errors++;
        } else {
          imported++;
        }
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Productos importados: ${imported}, Errores: ${errors}\n`);
}

// Función para importar clientes
function importClients() {
  console.log('👤 Importando clientes...');
  const data = readExcelFile('clientes.xlsx');
  if (!data) return;
  
  const { headers, rows } = data;
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row.length < 5) continue;
    
    try {
      const [name, email, phone, address, revendedor_id, is_active] = row;
      
      const sql = `
        INSERT INTO clients (name, email, phone, address, revendedor_id, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(sql, [name, email, phone, address, parseInt(revendedor_id), is_active === 'TRUE' ? 1 : 0], function(err) {
        if (err) {
          console.log(`❌ Error importando cliente ${name}: ${err.message}`);
          errors++;
        } else {
          imported++;
        }
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Clientes importados: ${imported}, Errores: ${errors}\n`);
}

// Función para importar cuentas
function importAccounts() {
  console.log('💳 Importando cuentas...');
  const data = readExcelFile('cuentas.xlsx');
  if (!data) return;
  
  const { headers, rows } = data;
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row.length < 10) continue;
    
    try {
      const [client_id, product_id, total_amount, delivery_amount, installment_amount, 
            total_installments, start_date, due_date, status, revendedor_id, is_active] = row;
      
      const remaining_amount = parseFloat(total_amount) - parseFloat(delivery_amount);
      
      const sql = `
        INSERT INTO accounts (client_id, product_id, total_amount, paid_amount, remaining_amount, 
                             delivery_amount, installment_amount, total_installments, paid_installments,
                             start_date, due_date, status, revendedor_id, is_active, created_at)
        VALUES (?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(sql, [
        parseInt(client_id), parseInt(product_id), parseFloat(total_amount), remaining_amount,
        parseFloat(delivery_amount), parseFloat(installment_amount), parseInt(total_installments),
        start_date, due_date, status, parseInt(revendedor_id), is_active === 'TRUE' ? 1 : 0
      ], function(err) {
        if (err) {
          console.log(`❌ Error importando cuenta ${client_id}: ${err.message}`);
          errors++;
        } else {
          imported++;
        }
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Cuentas importadas: ${imported}, Errores: ${errors}\n`);
}

// Función para importar pagos
function importPayments() {
  console.log('💰 Importando pagos...');
  const data = readExcelFile('pagos.xlsx');
  if (!data) return;
  
  const { headers, rows } = data;
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row.length < 6) continue;
    
    try {
      const [account_id, amount, installment_number, payment_date, payment_method, notes, user_id] = row;
      
      const sql = `
        INSERT INTO payments (account_id, amount, installment_number, payment_date, payment_method, notes, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(sql, [
        parseInt(account_id), parseFloat(amount), parseInt(installment_number),
        payment_date, payment_method, notes, parseInt(user_id)
      ], function(err) {
        if (err) {
          console.log(`❌ Error importando pago ${account_id}: ${err.message}`);
          errors++;
        } else {
          imported++;
        }
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Pagos importados: ${imported}, Errores: ${errors}\n`);
}

// Función para importar movimientos de inventario
function importInventoryMovements() {
  console.log('📊 Importando movimientos de inventario...');
  const data = readExcelFile('movimientos_inventario.xlsx');
  if (!data) return;
  
  const { headers, rows } = data;
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    if (row.length < 4) continue;
    
    try {
      const [product_id, type, quantity, notes, user_id] = row;
      
      // Obtener stock actual del producto
      db.get('SELECT stock FROM products WHERE id = ?', [parseInt(product_id)], (err, product) => {
        if (err) {
          console.log(`❌ Error obteniendo stock del producto ${product_id}: ${err.message}`);
          errors++;
          return;
        }
        
        const previousStock = product ? product.stock : 0;
        const newStock = type === 'ingreso' ? previousStock + parseInt(quantity) : previousStock - parseInt(quantity);
        
        const sql = `
          INSERT INTO inventory_movements (product_id, type, quantity, previous_stock, new_stock, user_id, date, notes)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `;
        
        db.run(sql, [
          parseInt(product_id), type, parseInt(quantity), previousStock, newStock, parseInt(user_id), notes
        ], function(err) {
          if (err) {
            console.log(`❌ Error importando movimiento ${product_id}: ${err.message}`);
            errors++;
          } else {
            // Actualizar stock del producto
            db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, parseInt(product_id)]);
            imported++;
          }
        });
      });
      
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`✅ Movimientos importados: ${imported}, Errores: ${errors}\n`);
}

// Función principal
async function importAllData() {
  try {
    // Importar en orden de dependencias
    await importUsers();
    importProducts();
    importClients();
    importAccounts();
    importPayments();
    importInventoryMovements();
    
    console.log('🎉 ¡Importación completada!');
    console.log('📊 Verifica los resultados en la aplicación.');
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
  } finally {
    db.close();
  }
}

// Ejecutar importación
importAllData(); 