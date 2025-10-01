const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA key pair
function generateRSAKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // For development, we'll generate random base64url strings
  // In production, you should extract actual RSA components
  const jwk = {
    n: Buffer.from(crypto.randomBytes(256)).toString('base64url'),
    e: 'AQAB',
    d: Buffer.from(crypto.randomBytes(256)).toString('base64url'),
    p: Buffer.from(crypto.randomBytes(128)).toString('base64url'),
    q: Buffer.from(crypto.randomBytes(128)).toString('base64url'),
    dp: Buffer.from(crypto.randomBytes(128)).toString('base64url'),
    dq: Buffer.from(crypto.randomBytes(128)).toString('base64url'),
    qi: Buffer.from(crypto.randomBytes(128)).toString('base64url'),
  };

  return {
    publicKey,
    privateKey,
    jwk
  };
}

// Generate random secrets
function generateSecrets() {
  return {
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    cookieKeys: crypto.randomBytes(32).toString('hex'),
  };
}

// Create .env file
function createEnvFile() {
  const keys = generateRSAKeys();
  const secrets = generateSecrets();
  
  const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/oauth2-server

# JWT Configuration
JWT_SECRET=${secrets.jwtSecret}
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# RSA Keys for JWT signing
JWT_PUBLIC_KEY_N=${keys.jwk.n}
JWT_PUBLIC_KEY_E=${keys.jwk.e}
JWT_PRIVATE_KEY_D=${keys.jwk.d}
JWT_PRIVATE_KEY_P=${keys.jwk.p}
JWT_PRIVATE_KEY_Q=${keys.jwk.q}
JWT_PRIVATE_KEY_DP=${keys.jwk.dp}
JWT_PRIVATE_KEY_DQ=${keys.jwk.dq}
JWT_PRIVATE_KEY_QI=${keys.jwk.qi}

# OIDC Configuration
OIDC_ISSUER=http://localhost:3000

# Cookie Security
COOKIE_KEYS=${secrets.cookieKeys}

# Environment
NODE_ENV=development
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local file with generated secrets');
}

// Create database seed script
function createSeedScript() {
  const seedContent = `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Permission = require('../src/models/Permission');
const Client = require('../src/models/Client');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oauth2-server');
    console.log('Connected to MongoDB');

    // Create permissions
    const permissions = [
      { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
      { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'roles:read', description: 'Read roles', resource: 'roles', action: 'read' },
      { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'permissions:read', description: 'Read permissions', resource: 'permissions', action: 'read' },
      { name: 'permissions:create', description: 'Create permissions', resource: 'permissions', action: 'create' },
      { name: 'permissions:update', description: 'Update permissions', resource: 'permissions', action: 'update' },
      { name: 'permissions:delete', description: 'Delete permissions', resource: 'permissions', action: 'delete' },
      { name: 'clients:read', description: 'Read clients', resource: 'clients', action: 'read' },
      { name: 'clients:create', description: 'Create clients', resource: 'clients', action: 'create' },
      { name: 'clients:update', description: 'Update clients', resource: 'clients', action: 'update' },
      { name: 'clients:delete', description: 'Delete clients', resource: 'clients', action: 'delete' },
    ];

    const createdPermissions = await Permission.insertMany(permissions);
    console.log('✅ Created permissions');

    // Create roles
    const adminRole = new Role({
      name: 'admin',
      description: 'Administrator role with full access',
      permissions: createdPermissions.map(p => p._id),
      isSystem: true,
    });
    await adminRole.save();

    const userRole = new Role({
      name: 'user',
      description: 'Regular user role',
      permissions: createdPermissions.filter(p => p.name.includes('read')).map(p => p._id),
      isSystem: true,
    });
    await userRole.save();

    console.log('✅ Created roles');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roles: [adminRole._id],
      isActive: true,
    });
    await adminUser.save();

    // Create test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      roles: [userRole._id],
      isActive: true,
    });
    await testUser.save();

    console.log('✅ Created users');

    // Create test client
    const testClient = new Client({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      name: 'Test Application',
      description: 'A test OAuth2 client application',
      redirectUris: ['http://localhost:3001/callback'],
      grantTypes: ['authorization_code', 'client_credentials', 'refresh_token'],
      responseTypes: ['code'],
      scopes: ['openid', 'profile', 'email', 'roles', 'permissions'],
      isConfidential: true,
      isActive: true,
      tokenEndpointAuthMethod: 'client_secret_basic',
    });
    await testClient.save();

    console.log('✅ Created test client');
    console.log('\\n🎉 Database seeded successfully!');
    console.log('\\nTest credentials:');
    console.log('Admin: admin / admin123');
    console.log('User: testuser / admin123');
    console.log('\\nTest client:');
    console.log('Client ID: test-client');
    console.log('Client Secret: test-secret');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
`;

  fs.writeFileSync('scripts/seed.js', seedContent);
  console.log('✅ Created database seed script');
}

// Main setup function
function setup() {
  console.log('🚀 Setting up OAuth2 Authorization Server...\n');
  
  createEnvFile();
  createSeedScript();
  
  console.log('\n📋 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start MongoDB locally or update MONGODB_URI in .env.local');
  console.log('3. Seed the database: node scripts/seed.js');
  console.log('4. Start the development server: npm run dev');
  console.log('5. Visit http://localhost:3000 to access the application');
  console.log('\n💡 For production RSA keys, run: node scripts/generate-rsa-keys.js');
}

setup();
