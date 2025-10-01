# OAuth2/OpenID Connect Authorization Server

A complete OAuth2/OpenID Connect Authorization Server built with Next.js 15, TypeScript, and MongoDB. This server supports Authorization Code Flow with PKCE, Client Credentials Flow, and includes a comprehensive admin dashboard for managing users, roles, permissions, and client applications.

## Features

- **OAuth2/OpenID Connect Flows**: Authorization Code Flow with PKCE, Client Credentials Flow
- **Token Management**: Access tokens, refresh tokens, token introspection, and revocation
- **Custom Claims**: Roles, permissions, and app metadata in JWT tokens
- **Admin Dashboard**: CRUD operations for Users, Roles, Permissions, and Clients
- **Security**: JWT signing with RS256, secure cookies, CSRF protection
- **Database**: MongoDB with Mongoose ODM
- **Deployment Ready**: Configured for Vercel deployment

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: MongoDB with Mongoose
- **OAuth2 Provider**: oidc-provider
- **Authentication**: bcryptjs for password hashing
- **JWT**: jsonwebtoken with RS256 signing

## Quick Start

### 1. Setup

```bash
# Clone the repository
git clone <repository-url>
cd oauth2_application

# Run the setup script
node scripts/setup.js

# Install dependencies
npm install
```

### 2. Database Setup

#### Local MongoDB
```bash
# Start MongoDB locally
mongod

# Seed the database
node scripts/seed.js
```

#### MongoDB Atlas
1. Create a MongoDB Atlas cluster
2. Update `MONGODB_URI` in `.env.local` with your connection string
3. Run the seed script: `node scripts/seed.js`

### 3. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## Default Credentials

After running the seed script, you'll have these default accounts:

- **Admin User**: `admin` / `admin123`
- **Test User**: `testuser` / `admin123`
- **Test Client**: `test-client` / `test-secret`

## API Endpoints

### OIDC Endpoints
- `GET/POST /api/oidc/authorize` - Authorization endpoint
- `POST /api/oidc/token` - Token endpoint
- `GET /api/oidc/userinfo` - UserInfo endpoint
- `POST /api/oidc/introspect` - Token introspection
- `POST /api/oidc/revoke` - Token revocation

### Admin Endpoints
- `GET/POST /api/admin/users` - User management
- `GET/POST /api/admin/roles` - Role management
- `GET/POST /api/admin/permissions` - Permission management
- `GET/POST /api/admin/clients` - Client management

## OAuth2 Flows

### Authorization Code Flow with PKCE

1. **Authorization Request**:
```bash
curl "http://localhost:3000/api/oidc/authorize?response_type=code&client_id=test-client&redirect_uri=http://localhost:3001/callback&scope=openid profile email&state=random-state&code_challenge=code-challenge&code_challenge_method=S256"
```

2. **Token Exchange**:
```bash
curl -X POST "http://localhost:3000/api/oidc/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=test-client&client_secret=test-secret&code=AUTHORIZATION_CODE&redirect_uri=http://localhost:3001/callback&code_verifier=code-verifier"
```

### Client Credentials Flow

```bash
curl -X POST "http://localhost:3000/api/oidc/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=test-client&client_secret=test-secret&scope=openid profile"
```

### Token Introspection

```bash
curl -X POST "http://localhost:3000/api/oidc/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=ACCESS_TOKEN&client_id=test-client&client_secret=test-secret"
```

### Token Revocation

```bash
curl -X POST "http://localhost:3000/api/oidc/revoke" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=ACCESS_TOKEN&client_id=test-client&client_secret=test-secret"
```

## Deployment to Vercel

### 1. Environment Variables

Set these environment variables in your Vercel dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oauth2-server
JWT_SECRET=your-super-secret-jwt-key
JWT_PUBLIC_KEY_N=your-rsa-public-key-n
JWT_PUBLIC_KEY_E=AQAB
JWT_PRIVATE_KEY_D=your-rsa-private-key-d
JWT_PRIVATE_KEY_P=your-rsa-private-key-p
JWT_PRIVATE_KEY_Q=your-rsa-private-key-q
JWT_PRIVATE_KEY_DP=your-rsa-private-key-dp
JWT_PRIVATE_KEY_DQ=your-rsa-private-key-dq
JWT_PRIVATE_KEY_QI=your-rsa-private-key-qi
OIDC_ISSUER=https://your-domain.vercel.app
COOKIE_KEYS=your-cookie-secret-key
```

### 2. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Generate RSA Keys for Production

```bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Extract components for JWT
node -e "
const crypto = require('crypto');
const fs = require('fs');
const privateKey = fs.readFileSync('private.pem', 'utf8');
const key = crypto.createPrivateKey(privateKey);
const jwk = key.asymmetricKeyDetails;
console.log('JWT_PRIVATE_KEY_D=' + jwk.d.toString('base64url'));
console.log('JWT_PRIVATE_KEY_P=' + jwk.p.toString('base64url'));
console.log('JWT_PRIVATE_KEY_Q=' + jwk.q.toString('base64url'));
console.log('JWT_PRIVATE_KEY_DP=' + jwk.dp.toString('base64url'));
console.log('JWT_PRIVATE_KEY_DQ=' + jwk.dq.toString('base64url'));
console.log('JWT_PRIVATE_KEY_QI=' + jwk.qi.toString('base64url'));
"
```

## Security Considerations

### 1. TLS/HTTPS
- Always use HTTPS in production
- Set `NODE_ENV=production` to enable secure cookies

### 2. Secrets Management
- Use strong, unique secrets for JWT and cookies
- Store secrets in environment variables, never in code
- Rotate secrets regularly

### 3. Refresh Token Rotation
- Implement refresh token rotation for enhanced security
- Store refresh tokens securely and validate them properly

### 4. Rate Limiting
- Implement rate limiting on authentication endpoints
- Consider using Redis for distributed rate limiting

### 5. Database Security
- Use MongoDB Atlas with proper network access controls
- Enable MongoDB authentication and authorization
- Use connection string with authentication

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── oidc/[...oidc]/route.ts    # OIDC provider routes
│   │   ├── auth/                      # Authentication routes
│   │   └── admin/                     # Admin API routes
│   ├── login/page.tsx                 # Login page
│   ├── consent/page.tsx               # Consent page
│   └── admin/page.tsx                 # Admin dashboard
├── lib/
│   ├── auth.ts                        # Authentication utilities
│   ├── db.ts                          # Database connection
│   ├── oidc-config.ts                 # OIDC provider configuration
│   └── oidc-provider.ts               # OIDC provider instance
└── models/
    ├── User.ts                        # User model
    ├── Role.ts                        # Role model
    ├── Permission.ts                  # Permission model
    └── Client.ts                      # Client model
```

## Development

### Adding New Scopes

1. Update `scopes` array in `src/lib/oidc-config.ts`
2. Add scope descriptions in `src/app/consent/page.tsx`
3. Update client scopes in the database

### Adding Custom Claims

1. Modify the `claims()` function in `src/lib/oidc-config.ts`
2. Update the JWT payload interface in `src/lib/auth.ts`
3. Ensure claims are included in token generation

### Database Migrations

For production deployments, consider implementing database migrations:

```javascript
// Example migration script
const migration = async () => {
  await connectDB();
  
  // Add new fields, indexes, etc.
  await User.collection.createIndex({ email: 1 }, { unique: true });
  
  console.log('Migration completed');
  process.exit(0);
};
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
2. **JWT Keys**: Verify RSA keys are properly formatted and base64url encoded
3. **CORS Issues**: Check client configuration and allowed origins
4. **Token Validation**: Ensure client secret matches and tokens are not expired

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=oidc-provider:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review OIDC provider documentation

---

**Note**: This is a development-ready OAuth2/OpenID Connect server. For production use, ensure you follow security best practices and conduct thorough security testing.
