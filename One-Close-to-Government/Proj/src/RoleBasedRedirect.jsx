import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RoleSelection from "./RoleSelection";

const RoleBasedRedirect = () => {
  const { user, isLoaded } = useUser();
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    if (isLoaded && user) {
      const userRole = user.publicMetadata?.role;
      
      if (!userRole) {
        // User doesn't have a role set, show role selection
        setRedirectPath('/role-selection');
      } else {
        // User has a role, redirect to appropriate dashboard
        const path = userRole === 'government' ? '/admin-dashboard' : '/user-dashboard';
        setRedirectPath(path);
      }
    }
  }, [user, isLoaded]);

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

  // If user doesn't have a role, show role selection
  if (!user.publicMetadata?.role) {
    return <RoleSelection />;
  }

  return <Navigate to={redirectPath} replace />;
};

export default RoleBasedRedirect;
