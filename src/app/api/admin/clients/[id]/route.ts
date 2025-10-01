import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Client from '@/models/Client';
import { getSession, hasPermission } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    
    await connectDB();
    const client = await Client.findById(id);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json(client);

  } catch (error) {
    console.error('Client fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    const clientData = await request.json();
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'clients:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    
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
