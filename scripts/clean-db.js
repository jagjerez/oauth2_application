const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oauth2-server');
    console.log('✅ Connected to MongoDB');

    // Limpiar todas las colecciones
    const collections = ['users', 'roles', 'permissions', 'clients'];
    
    for (const collection of collections) {
      await mongoose.connection.db.collection(collection).deleteMany({});
      console.log(`✅ Cleaned collection: ${collection}`);
    }

    console.log('\n🎉 Database cleaned successfully!');
    console.log('You can now run: node scripts/seed.js');

  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanDatabase();
