import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Permission from '@/models/Permission';
import { getSession, hasPermission } from '@/lib/auth';

/**
 * @swagger
 * /api/admin/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve a list of all permissions
 *     tags: [Admin - Permissions]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
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
 *     summary: Create a new permission
 *     description: Create a new permission
 *     tags: [Admin - Permissions]
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
 *               - resource
 *               - action
 *             properties:
 *               name:
 *                 type: string
 *                 description: Permission name
 *                 example: users:create
 *               description:
 *                 type: string
 *                 description: Permission description
 *                 example: Create new users
 *               resource:
 *                 type: string
 *                 description: Resource this permission applies to
 *                 example: users
 *               action:
 *                 type: string
 *                 description: Action this permission allows
 *                 example: create
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Permission'
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'permissions:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id, ...permissionData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }
    
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!hasPermission(session.permissions, 'permissions:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
    }
    
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