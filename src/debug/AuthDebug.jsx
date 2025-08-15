// src/components/debug/AuthDebug.jsx - TEMPORAL PARA DEBUG
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthDebug = () => {
  const { userInfo, getPrimaryBranch, getUserBranches } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const primaryBranch = getPrimaryBranch();
  const allBranches = getUserBranches();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg max-w-md text-xs overflow-auto max-h-96 z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🐛 AUTH DEBUG (Development Only)</h3>
      
      <div className="space-y-2">
        <div>
          <strong className="text-green-400">User Info:</strong>
          <pre className="text-xs overflow-auto">
            {userInfo ? JSON.stringify({
              id: userInfo.id,
              name: `${userInfo.first_name} ${userInfo.last_name}`,
              email: userInfo.email,
              role: userInfo.role?.name,
              branches_count: userInfo.user_branches?.length || 0
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div>
          <strong className="text-blue-400">Primary Branch:</strong>
          <pre className="text-xs overflow-auto">
            {primaryBranch ? JSON.stringify({
              id: primaryBranch.id,
              name: primaryBranch.name,
              isActive: primaryBranch.is_active,
              isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(primaryBranch.id)
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div>
          <strong className="text-purple-400">All Branches:</strong>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(allBranches?.map(b => ({
              id: b.id,
              name: b.name,
              isActive: b.is_active
            })) || [], null, 2)}
          </pre>
        </div>

        <div>
          <strong className="text-red-400">User Branches Raw:</strong>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(userInfo?.user_branches || [], null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;