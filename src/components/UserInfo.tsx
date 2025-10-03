import { getServerSession } from '@/lib/session';

export default async function UserInfo() {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.user) {
    return (
      <div className="text-sm text-gray-500">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-500">
      <div>Welcome, {session.user.firstName} {session.user.lastName}</div>
      <div>Username: {session.user.username}</div>
      <div>Email: {session.user.email}</div>
      <div>Roles: {session.user.roles.join(', ')}</div>
    </div>
  );
}
