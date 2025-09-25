import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const RoleBasedRoute = ({ children, requiredRole, fallbackPath }) => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Check if user has the required role
  const userRole = user.publicMetadata?.role || 'citizen';
  
  if (userRole !== requiredRole) {
    // Redirect based on user's actual role
    const redirectPath = userRole === 'government' ? '/admin-dashboard' : '/user-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleBasedRoute;
