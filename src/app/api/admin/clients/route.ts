import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import { getSession, hasPermission } from '@/lib/auth';
import { randomBytes } from 'crypto';

/**
 * @swagger
 * /api/admin/clients:
 *   get:
 *     summary: Get all OAuth2 clients
 *     description: Retrieve a list of all OAuth2 clients
 *     tags: [Admin - Clients]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of clients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new OAuth2 client
 *     description: Create a new OAuth2 client with generated credentials
 *     tags: [Admin - Clients]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - redirectUris
 *               - grantTypes
 *               - scopes
 *             properties:
 *               name:
 *                 type: string
 *                 description: Client application name
 *                 example: My Application
 *               description:
 *                 type: string
 *                 description: Client description
 *                 example: Main application client
 *               redirectUris:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Allowed redirect URIs
 *                 example: [http://localhost:3000/callback, https://myapp.com/callback]
 *               grantTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [authorization_code, client_credentials, refresh_token]
 *                 description: OAuth2 grant types
 *                 example: [authorization_code, refresh_token]
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: OAuth2 scopes
 *                 example: [openid, profile, email, roles, permissions]
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Client'
 *                 - type: object
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                       description: Generated client secret (only shown once)
 *                       example: generated-secret-key-12345
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const clients = await Client.find({});
    
    return NextResponse.json(clients);

  } catch (error) {
    console.error('Clients fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const clientData = await request.json();
    
    await connectDB();
    
    // Generate client ID and secret
    const clientId = randomBytes(16).toString('hex');
    const clientSecret = randomBytes(32).toString('hex');
    
    // Check if client ID already exists
    const existingClient = await Client.findOne({ clientId });

    if (existingClient) {
      return NextResponse.json({ error: 'Client ID already exists' }, { status: 400 });
    }

    const client = new Client({
      ...clientData,
      clientId,
      clientSecret,
    });
    await client.save();

    return NextResponse.json({ 
      message: 'Client created successfully', 
      client: {
        ...client.toObject(),
        clientSecret, // Only return secret on creation
      }
    });

  } catch (error) {
    console.error('Client creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id, ...clientData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    await connectDB();
    
    // Check if client exists
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Don't allow updating clientId or clientSecret through this endpoint
    const { clientId, clientSecret, ...updateData } = clientData;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ message: 'Client updated successfully', client: updatedClient });

  } catch (error) {
    console.error('Client update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }
    
    await connectDB();
    
    // Check if client exists
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await Client.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Client deleted successfully' });

  } catch (error) {
    console.error('Client deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}