const fs = require('fs');
const path = require('path');

// Leer el archivo .env actual
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('No .env file found, creating new one...');
}

// Reemplazar la línea MONGODB_URI
const lines = envContent.split('\n');
const updatedLines = lines.map(line => {
  if (line.startsWith('MONGODB_URI=')) {
    return 'MONGODB_URI=mongodb://oauth2user:password123@localhost:27017/oauth2-server';
  }
  return line;
});

// Si no existe la línea MONGODB_URI, agregarla
if (!lines.some(line => line.startsWith('MONGODB_URI='))) {
  updatedLines.unshift('MONGODB_URI=mongodb://oauth2user:password123@localhost:27017/oauth2-server');
}

const updatedContent = updatedLines.join('\n');

// Escribir el archivo actualizado
fs.writeFileSync(envPath, updatedContent);

console.log('✅ Updated .env file with correct MongoDB URI');
console.log('MONGODB_URI=mongodb://oauth2user:password123@localhost:27017/oauth2-server');
