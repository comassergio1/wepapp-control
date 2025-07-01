const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando aplicación...');

// Iniciar el servidor
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
});

server.on('exit', (code) => {
  console.log(`📴 Servidor terminado con código: ${code}`);
});
