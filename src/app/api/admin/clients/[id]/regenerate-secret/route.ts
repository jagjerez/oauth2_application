import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import { getSession, hasPermission } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    
    await connectDB();
    
    // Check if client exists
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate new client secret
    const newClientSecret = randomBytes(32).toString('hex');

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { clientSecret: newClientSecret },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      message: 'Client secret regenerated successfully', 
      client: {
        ...updatedClient?.toObject(),
        clientSecret: newClientSecret, // Only return secret on regeneration
      }
    });

  } catch (error) {
    console.error('Client secret regeneration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
