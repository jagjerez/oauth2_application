import { Configuration } from 'oidc-provider';
import connectDB from './db';
import Client from '@/models/Client';
import User from '@/models/User';
import Role from '@/models/Role';
import Permission from '@/models/Permission';

const ISSUER = process.env.OIDC_ISSUER || 'http://localhost:3000';

export const oidcConfig: Configuration = {
  features: {
    devInteractions: { enabled: false },
    introspection: { enabled: true },
    revocation: { enabled: true },
    rpInitiatedLogout: { enabled: true },
  },
  formats: {
    AccessToken: 'jwt',
    ClientCredentials: 'jwt',
  },
  scopes: ['openid', 'profile', 'email', 'roles', 'permissions'],
  claims: {
    openid: ['sub'],
    profile: ['name', 'family_name', 'given_name', 'middle_name', 'nickname', 'preferred_username', 'profile', 'picture', 'website', 'gender', 'birthdate', 'zoneinfo', 'locale', 'updated_at'],
    email: ['email', 'email_verified'],
    roles: ['roles'],
    permissions: ['permissions'],
  },
  interactions: {
    url(ctx, interaction) {
      return `/consent?${ctx.querystring}`;
    },
  },
  cookies: {
    keys: [process.env.COOKIE_KEYS || 'your-cookie-secret-key'],
  },
  jwks: {
    keys: [
      {
        kty: 'RSA',
        kid: 'default',
        use: 'sig',
        alg: 'RS256',
        n: process.env.JWT_PUBLIC_KEY_N || 'your-rsa-public-key-n',
        e: process.env.JWT_PUBLIC_KEY_E || 'AQAB',
        d: process.env.JWT_PRIVATE_KEY_D || 'your-rsa-private-key-d',
        p: process.env.JWT_PRIVATE_KEY_P || 'your-rsa-private-key-p',
        q: process.env.JWT_PRIVATE_KEY_Q || 'your-rsa-private-key-q',
        dp: process.env.JWT_PRIVATE_KEY_DP || 'your-rsa-private-key-dp',
        dq: process.env.JWT_PRIVATE_KEY_DQ || 'your-rsa-private-key-dq',
        qi: process.env.JWT_PRIVATE_KEY_QI || 'your-rsa-private-key-qi',
      },
    ],
  },
  clientBasedCORS(ctx, origin, client) {
    return true;
  },
  async findById(ctx, id) {
    await connectDB();
    const user = await User.findById(id).populate('roles');
    if (!user || !user.isActive) return undefined;

    const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
    const permissions = await Permission.find({ 
      _id: { $in: roles.flatMap(role => role.permissions) } 
    });

    return {
      accountId: user._id.toString(),
      claims() {
        return {
          sub: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          given_name: user.firstName,
          family_name: user.lastName,
          preferred_username: user.username,
          email: user.email,
          email_verified: true,
          roles: roles.map(role => role.name),
          permissions: permissions.map(permission => permission.name),
          ...user.appMetadata,
        };
      },
    };
  },
  async findAccount(ctx, id, token) {
    await connectDB();
    const user = await User.findById(id).populate('roles');
    if (!user || !user.isActive) return undefined;

    const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
    const permissions = await Permission.find({ 
      _id: { $in: roles.flatMap(role => role.permissions) } 
    });

    return {
      accountId: user._id.toString(),
      claims() {
        return {
          sub: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          given_name: user.firstName,
          family_name: user.lastName,
          preferred_username: user.username,
          email: user.email,
          email_verified: true,
          roles: roles.map(role => role.name),
          permissions: permissions.map(permission => permission.name),
          ...user.appMetadata,
        };
      },
    };
  },
  async findClientById(ctx, id) {
    await connectDB();
    const client = await Client.findOne({ clientId: id, isActive: true });
    if (!client) return undefined;

    return {
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      redirectUris: client.redirectUris,
      grantTypes: client.grantTypes,
      responseTypes: client.responseTypes,
      scopes: client.scopes,
      clientAuthMethods: [client.tokenEndpointAuthMethod],
    };
  },
  async saveInteraction(ctx, interaction) {
    // Store interaction in session or database
    return interaction;
  },
  async findInteraction(ctx, jti) {
    // Retrieve interaction from session or database
    return undefined;
  },
  async consumeInteraction(ctx, jti) {
    // Mark interaction as consumed
  },
  async destroyInteraction(ctx, jti) {
    // Remove interaction from storage
  },
};
