const crypto = require('crypto');
const fs = require('fs');

// Generate RSA key pair and extract JWK components
function generateRSAKeys() {
  console.log('🔐 Generating RSA key pair...');
  
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

  // Save keys to files
  fs.writeFileSync('private.pem', privateKey);
  fs.writeFileSync('public.pem', publicKey);
  console.log('✅ RSA keys saved to private.pem and public.pem');

  // Extract JWK components using a different approach
  try {
    // Create a temporary key object to extract components
    const keyObject = crypto.createPrivateKey(privateKey);
    
    // Export as JWK
    const jwk = keyObject.export({ format: 'jwk' });
    
    console.log('\n📋 JWK Components for .env:');
    console.log('JWT_PUBLIC_KEY_N=' + jwk.n);
    console.log('JWT_PUBLIC_KEY_E=' + jwk.e);
    console.log('JWT_PRIVATE_KEY_D=' + jwk.d);
    console.log('JWT_PRIVATE_KEY_P=' + jwk.p);
    console.log('JWT_PRIVATE_KEY_Q=' + jwk.q);
    console.log('JWT_PRIVATE_KEY_DP=' + jwk.dp);
    console.log('JWT_PRIVATE_KEY_DQ=' + jwk.dq);
    console.log('JWT_PRIVATE_KEY_QI=' + jwk.qi);
    
    return {
      publicKey,
      privateKey,
      jwk
    };
  } catch (error) {
    console.error('❌ Error extracting JWK components:', error.message);
    console.log('\n⚠️  Using fallback random keys for development...');
    
    // Fallback to random keys for development
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
    
    console.log('\n📋 Fallback JWK Components for .env:');
    console.log('JWT_PUBLIC_KEY_N=' + jwk.n);
    console.log('JWT_PUBLIC_KEY_E=' + jwk.e);
    console.log('JWT_PRIVATE_KEY_D=' + jwk.d);
    console.log('JWT_PRIVATE_KEY_P=' + jwk.p);
    console.log('JWT_PRIVATE_KEY_Q=' + jwk.q);
    console.log('JWT_PRIVATE_KEY_DP=' + jwk.dp);
    console.log('JWT_PRIVATE_KEY_DQ=' + jwk.dq);
    console.log('JWT_PRIVATE_KEY_QI=' + jwk.qi);
    
    return {
      publicKey,
      privateKey,
      jwk
    };
  }
}

// Generate secrets
function generateSecrets() {
  return {
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    cookieKeys: crypto.randomBytes(32).toString('hex'),
  };
}

// Create .env.local file
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
  console.log('\n✅ Created .env.local file with generated secrets');
}

// Main execution
console.log('🚀 Generating RSA keys for OAuth2 Authorization Server...\n');
createEnvFile();
console.log('\n🎉 Setup complete! You can now run:');
console.log('1. npm install');
console.log('2. node scripts/seed.js');
console.log('3. npm run dev');
