import { Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./NotificationContext";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import CivicConnect from "./CivicConnect";
import AdminLogin from "./AdminLogin";
import UserLogin from "./UserLogin";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import Working from "./Working";
import { ReportsProvider } from "./ReportsContext";
import RoleBasedRoute from "./RoleBasedRoute";
import RoleBasedRedirect from "./RoleBasedRedirect";
import RoleSelection from "./RoleSelection";
import About from "./About";

export default function App() {
  return (
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          <Routes>
            {/* Home Page */}
            <Route
              path="/"
              element={
                <>
                  <Hero />
                  <About />
                  <CivicConnect />
                </>
              }
            />

            {/* Sign In Page */}
            <Route 
              path="/sign-in" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="max-w-md w-full space-y-8">
                    <div>
                      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                      </h2>
                      <p className="mt-2 text-center text-sm text-gray-600">
                        Choose your role to continue
                      </p>
                    </div>
                    <div className="mt-8 space-y-4">
                      {/* Government Sign In */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900 text-center">Government Official</h3>
                        <SignInButton 
                          mode="modal" 
                          redirectUrl="/role-redirect"
                          appearance={{
                            elements: {
                              organizationSwitcher: {
                                display: "none"
                              }
                            }
                          }}
                        >
                          <button className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Sign In as Government Official
                          </button>
                        </SignInButton>
                        <SignUpButton 
                          mode="modal" 
                          redirectUrl="/role-redirect"
                          appearance={{
                            elements: {
                              organizationSwitcher: {
                                display: "none"
                              }
                            }
                          }}
                        >
                          <button className="group relative w-full flex justify-center py-2 px-4 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Sign Up as Government Official
                          </button>
                        </SignUpButton>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-gray-50 text-gray-500">or</span>
                        </div>
                      </div>

                      {/* Citizen Sign In */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900 text-center">Citizen</h3>
                        <SignInButton 
                          mode="modal" 
                          redirectUrl="/role-redirect"
                          appearance={{
                            elements: {
                              organizationSwitcher: {
                                display: "none"
                              }
                            }
                          }}
                        >
                          <button className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Sign In as Citizen
                          </button>
                        </SignInButton>
                        <SignUpButton 
                          mode="modal" 
                          redirectUrl="/role-redirect"
                          appearance={{
                            elements: {
                              organizationSwitcher: {
                                display: "none"
                              }
                            }
                          }}
                        >
                          <button className="group relative w-full flex justify-center py-2 px-4 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Sign Up as Citizen
                          </button>
                        </SignUpButton>
                      </div>
                    </div>
                  </div>
                </div>
              } 
            />

            {/* Role-based redirect after login */}
            <Route path="/role-redirect" element={<RoleBasedRedirect />} />
            
            {/* Role selection for new users */}
            <Route path="/role-selection" element={<RoleSelection />} />

            {/* Role-based Protected Routes */}
            <Route 
              path="/user-dashboard" 
              element={
                <RoleBasedRoute requiredRole="citizen" fallbackPath="/admin-dashboard">
                  <UserDashboard />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <RoleBasedRoute requiredRole="government" fallbackPath="/user-dashboard">
                  <AdminDashboard />
                </RoleBasedRoute>
              } 
            />

            {/* Legacy routes for backward compatibility */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/user-login" element={<UserLogin />} />
             <Route path="/working-w" element={<Working />} />

          </Routes>
        </div>
      </NotificationProvider>
  );
}