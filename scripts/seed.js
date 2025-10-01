const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Define schemas directly in the seed script
const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true },
  resource: { type: String, required: true, trim: true },
  action: { type: String, required: true, trim: true },
}, { timestamps: true });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  appMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const ClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true, trim: true },
  clientSecret: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  redirectUris: [{ type: String, required: true }],
  grantTypes: [{ type: String, enum: ['authorization_code', 'client_credentials', 'refresh_token'], required: true }],
  responseTypes: [{ type: String, enum: ['code', 'id_token', 'token'], required: true }],
  scopes: [{ type: String, required: true }],
  isConfidential: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  tokenEndpointAuthMethod: { type: String, enum: ['client_secret_basic', 'client_secret_post', 'none'], default: 'client_secret_basic' },
}, { timestamps: true });

const Permission = mongoose.model('Permission', PermissionSchema);
const Role = mongoose.model('Role', RoleSchema);
const User = mongoose.model('User', UserSchema);
const Client = mongoose.model('Client', ClientSchema);

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
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin / admin123');
    console.log('User: testuser / admin123');
    console.log('\nTest client:');
    console.log('Client ID: test-client');
    console.log('Client Secret: test-secret');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
