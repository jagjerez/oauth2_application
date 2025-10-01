import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Permission from '@/models/Permission';
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

    if (!hasPermission(session.permissions, 'permissions:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    
    await connectDB();
    const permission = await Permission.findById(id);
    
    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }
    
    return NextResponse.json(permission);

  } catch (error) {
    console.error('Permission fetch error:', error);
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

    if (!hasPermission(session.permissions, 'permissions:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    const permissionData = await request.json();
    
    await connectDB();
    
    // Check if permission exists
    const existingPermission = await Permission.findById(id);
    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if name is being changed and if new name already exists
    if (permissionData.name && permissionData.name !== existingPermission.name) {
      const nameExists = await Permission.findOne({ name: permissionData.name, _id: { $ne: id } });
      if (nameExists) {
        return NextResponse.json({ error: 'Permission name already exists' }, { status: 400 });
      }
    }

    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
      permissionData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ message: 'Permission updated successfully', permission: updatedPermission });

  } catch (error) {
    console.error('Permission update error:', error);
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

    if (!hasPermission(session.permissions, 'permissions:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    
    await connectDB();
    
    // Check if permission exists
    const existingPermission = await Permission.findById(id);
    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check if permission is being used by any roles
    const Role = (await import('@/models/Role')).default;
    const rolesWithPermission = await Role.find({ permissions: id });
    if (rolesWithPermission.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete permission that is assigned to roles',
        rolesCount: rolesWithPermission.length 
      }, { status: 400 });
    }

    await Permission.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Permission deleted successfully' });

  } catch (error) {
    console.error('Permission deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
