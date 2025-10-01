import { NextRequest, NextResponse } from 'next/server';
import { createOIDCProvider } from '@/lib/oidc-provider';

const provider = createOIDCProvider();

/**
 * @swagger
 * /api/oidc/{oidc}:
 *   get:
 *     summary: OIDC Provider Endpoint
 *     description: OpenID Connect provider endpoint for authorization, token, userinfo, etc.
 *     tags: [OIDC]
 *     parameters:
 *       - in: path
 *         name: oidc
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC path (e.g., authorization, token, userinfo, jwks)
 *         example: authorization
 *     responses:
 *       200:
 *         description: OIDC response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Response varies by OIDC endpoint
 *       302:
 *         description: Redirect response (for authorization flow)
 *       400:
 *         description: Bad request
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
 *     summary: OIDC Provider Endpoint (POST)
 *     description: OpenID Connect provider endpoint for token exchange, etc.
 *     tags: [OIDC]
 *     parameters:
 *       - in: path
 *         name: oidc
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC path (e.g., token, introspection, revocation)
 *         example: token
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               grant_type:
 *                 type: string
 *                 example: authorization_code
 *               code:
 *                 type: string
 *                 example: authorization-code-123
 *               redirect_uri:
 *                 type: string
 *                 example: http://localhost:3000/callback
 *               client_id:
 *                 type: string
 *                 example: my-app-client
 *               client_secret:
 *                 type: string
 *                 example: client-secret-123
 *     responses:
 *       200:
 *         description: OIDC response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 token_type:
 *                   type: string
 *                   example: Bearer
 *                 expires_in:
 *                   type: number
 *                   example: 3600
 *                 refresh_token:
 *                   type: string
 *                   example: refresh-token-123
 *                 id_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Bad request
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
 *   put:
 *     summary: OIDC Provider Endpoint (PUT)
 *     description: OpenID Connect provider endpoint for updates
 *     tags: [OIDC]
 *     parameters:
 *       - in: path
 *         name: oidc
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC path
 *     responses:
 *       200:
 *         description: OIDC response
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: OIDC Provider Endpoint (DELETE)
 *     description: OpenID Connect provider endpoint for deletions
 *     tags: [OIDC]
 *     parameters:
 *       - in: path
 *         name: oidc
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC path
 *     responses:
 *       200:
 *         description: OIDC response
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ oidc: string[] }> }) {
  const url = new URL(request.url);
  const { oidc } = await params;
  const path = oidc.join('/');
  
  try {
    const response = await provider.callback()(request as unknown);
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('OIDC DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
