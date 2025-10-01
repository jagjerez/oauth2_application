const { MongoClient } = require('mongodb');

async function setupMongoDB() {
  const client = new MongoClient('mongodb://root:example@localhost:27017/admin');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('oauth2-server');
    
    // Crear usuario para la aplicación
    try {
      await db.command({
        createUser: 'oauth2user',
        pwd: 'password123',
        roles: [
          { role: 'readWrite', db: 'oauth2-server' }
        ]
      });
      console.log('✅ User oauth2user created successfully');
    } catch (error) {
      if (error.code === 51003) {
        console.log('ℹ️  User oauth2user already exists');
      } else {
        console.error('❌ Error creating user:', error.message);
      }
    }
    
    console.log('\n📋 MongoDB setup complete!');
    console.log('Use this connection string in your .env file:');
    console.log('MONGODB_URI=mongodb://oauth2user:password123@localhost:27017/oauth2-server');
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.log('\n💡 Make sure MongoDB is running:');
    console.log('   - Windows: net start MongoDB');
    console.log('   - macOS: brew services start mongodb-community');
    console.log('   - Linux: sudo systemctl start mongod');
  } finally {
    await client.close();
  }
}

setupMongoDB();
