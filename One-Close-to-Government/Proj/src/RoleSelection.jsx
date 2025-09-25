import { useState } from "react";
import { useUser } from "@clerk/clerk-react";

const RoleSelection = () => {
  const { user } = useUser();
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleUpdate = async () => {
    if (!selectedRole || !user) return;
    
    setIsUpdating(true);
    try {
      await user.update({
        publicMetadata: {
          role: selectedRole
        }
      });
      
      // Redirect based on role
      const redirectPath = selectedRole === 'government' ? '/admin-dashboard' : '/user-dashboard';
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your role to continue to your dashboard
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="space-y-3">
            <label className={`flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedRole === 'citizen' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="role"
                value="citizen"
                checked={selectedRole === 'citizen'}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mr-4 h-5 w-5 text-green-600"
              />
              <div>
                <div className="font-semibold text-lg text-gray-900">Citizen</div>
                <div className="text-sm text-gray-600 mt-1">Report civic issues, track progress, and engage with your community</div>
              </div>
            </label>
            
            <label className={`flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedRole === 'government' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}>
              <input
                type="radio"
                name="role"
                value="government"
                checked={selectedRole === 'government'}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mr-4 h-5 w-5 text-blue-600"
              />
              <div>
                <div className="font-semibold text-lg text-gray-900">Government Official</div>
                <div className="text-sm text-gray-600 mt-1">Manage civic issues, respond to reports, and oversee community engagement</div>
              </div>
            </label>
          </div>
          
          <button
            onClick={handleRoleUpdate}
            disabled={!selectedRole || isUpdating}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedRole === 'government'
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isUpdating ? 'Setting up your dashboard...' : `Continue to ${selectedRole === 'government' ? 'Admin' : 'User'} Dashboard`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
