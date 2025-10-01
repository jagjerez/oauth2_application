import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve a list of all roles with their permissions
 *     tags: [Admin - Roles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
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
 *     summary: Create a new role
 *     description: Create a new role with specified permissions
 *     tags: [Admin - Roles]
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
 *               - description
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *                 example: content_manager
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: Manages content and media
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission IDs
 *                 example: [507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012]
 *               clientId:
 *                 type: string
 *                 description: Associated client ID (optional)
 *                 example: my-app-client
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
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

    if (!hasPermission(session.permissions, 'roles:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    
    // Ensure Permission model is registered before populating
    const PermissionModel = mongoose.models.Permission || (await import('@/models/Permission')).default;
    
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
    
    // Check if role already exists for the same client
    const existingRole = await Role.findOne({ 
      name: roleData.name, 
      clientId: roleData.clientId || null 
    });

    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists for this client' }, { status: 400 });
    }

    const role = new Role(roleData);
    await role.save();

    return NextResponse.json({ message: 'Role created successfully', role });

  } catch (error) {
    console.error('Role creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id, ...roleData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }
    
    await connectDB();
    
    // Check if role exists and is not a system role
    const existingRole = await Role.findById(id);
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 400 });
    }

    // Check if name is being changed and if new name already exists for the same client
    if (roleData.name && roleData.name !== existingRole.name) {
      const nameExists = await Role.findOne({ 
        name: roleData.name, 
        clientId: roleData.clientId || null,
        _id: { $ne: id } 
      });
      if (nameExists) {
        return NextResponse.json({ error: 'Role name already exists for this client' }, { status: 400 });
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'roles:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }
    
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