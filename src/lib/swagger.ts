import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OAuth2 Application API',
      version: '1.0.0',
      description: 'API documentation for OAuth2 Application with user management, roles, permissions, and OIDC support',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe',
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
              example: true,
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'User roles',
              example: ['user', 'admin'],
            },
            appMetadata: {
              type: 'object',
              description: 'Custom user metadata that will be included in JWT tokens',
              additionalProperties: true,
              example: {
                department: 'Engineering',
                level: 'Senior',
                location: 'Remote',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Role unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Role name',
              example: 'administrator',
            },
            description: {
              type: 'string',
              description: 'Role description',
              example: 'Full system administrator with all permissions',
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Role permissions',
              example: ['users:read', 'users:create', 'users:update', 'users:delete'],
            },
            isSystem: {
              type: 'boolean',
              description: 'Whether this is a system role',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Role creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Role last update timestamp',
            },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Permission unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Permission name',
              example: 'users:read',
            },
            description: {
              type: 'string',
              description: 'Permission description',
              example: 'Read user information',
            },
            resource: {
              type: 'string',
              description: 'Resource this permission applies to',
              example: 'users',
            },
            action: {
              type: 'string',
              description: 'Action this permission allows',
              example: 'read',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Permission creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Permission last update timestamp',
            },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Client unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            clientId: {
              type: 'string',
              description: 'OAuth2 client identifier',
              example: 'my-app-client',
            },
            name: {
              type: 'string',
              description: 'Client application name',
              example: 'My Application',
            },
            description: {
              type: 'string',
              description: 'Client description',
              example: 'Main application client',
            },
            redirectUris: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Allowed redirect URIs',
              example: ['http://localhost:3000/callback', 'https://myapp.com/callback'],
            },
            grantTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['authorization_code', 'client_credentials', 'refresh_token'],
              },
              description: 'OAuth2 grant types',
              example: ['authorization_code', 'refresh_token'],
            },
            scopes: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'OAuth2 scopes',
              example: ['openid', 'profile', 'email', 'roles', 'permissions'],
            },
            isActive: {
              type: 'boolean',
              description: 'Client active status',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Client creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Client last update timestamp',
            },
          },
        },
        SessionData: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              description: 'User email',
              example: 'john.doe@example.com',
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'User roles',
              example: ['user', 'admin'],
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'User permissions',
              example: ['users:read', 'users:create'],
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Not authenticated',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/*.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
