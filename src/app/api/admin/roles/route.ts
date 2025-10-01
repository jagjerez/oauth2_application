import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import { getSession, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const roles = await Role.find({}).populate('permissions');
    
    return NextResponse.json(roles);

  } catch (error) {
    console.error('Roles fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const roleData = await request.json();
    
    await connectDB();
    
    // Check if role already exists
    const existingRole = await Role.findOne({ name: roleData.name });

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const role = new Role(roleData);
    await role.save();

    return NextResponse.json({ message: 'Role created successfully', role });

  } catch (error) {
    console.error('Role creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
