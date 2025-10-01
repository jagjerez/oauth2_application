import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import { getSession, hasPermission } from '@/lib/auth';
import { randomBytes } from 'crypto';

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
