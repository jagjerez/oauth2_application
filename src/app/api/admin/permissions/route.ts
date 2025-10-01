import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Permission from '@/models/Permission';
import { getSession, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'permissions:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const permissions = await Permission.find({});
    
    return NextResponse.json(permissions);

  } catch (error) {
    console.error('Permissions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'permissions:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const permissionData = await request.json();
    
    await connectDB();
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name: permissionData.name });

    if (existingPermission) {
      return NextResponse.json({ error: 'Permission already exists' }, { status: 400 });
    }

    const permission = new Permission(permissionData);
    await permission.save();

    return NextResponse.json({ message: 'Permission created successfully', permission });

  } catch (error) {
    console.error('Permission creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
