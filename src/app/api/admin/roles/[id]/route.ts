import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Role from '@/models/Role';
import { getSession, hasPermission } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    
    await connectDB();
    
    // Ensure Permission model is registered before populating
    const PermissionModel = mongoose.models.Permission || (await import('@/models/Permission')).default;
    
    const role = await Role.findById(id).populate('permissions');
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json(role);

  } catch (error) {
    console.error('Role fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const roleData = await request.json();
    
    await connectDB();
    
    // Check if role exists and is not a system role
    const existingRole = await Role.findById(id);
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 400 });
    }

    // Check if name is being changed and if new name already exists
    if (roleData.name && roleData.name !== existingRole.name) {
      const nameExists = await Role.findOne({ name: roleData.name, _id: { $ne: id } });
      if (nameExists) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
      }
    }

    // Ensure Permission model is registered before populating
    const PermissionModel = mongoose.models.Permission || (await import('@/models/Permission')).default;
    
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      roleData,
      { new: true, runValidators: true }
    ).populate('permissions');

    return NextResponse.json({ message: 'Role updated successfully', role: updatedRole });

  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    
    await connectDB();
    
    // Check if role exists and is not a system role
    const existingRole = await Role.findById(id);
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    // Check if role is being used by any users
    const User = (await import('@/models/User')).default;
    const usersWithRole = await User.find({ roles: id });
    if (usersWithRole.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role that is assigned to users',
        usersCount: usersWithRole.length 
      }, { status: 400 });
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Role deleted successfully' });

  } catch (error) {
    console.error('Role deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
