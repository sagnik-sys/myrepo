import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";

const RoleBasedDashboardLink = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'citizen';
  
  const dashboardPath = userRole === 'government' ? '/admin-dashboard' : '/user-dashboard';
  const dashboardLabel = userRole === 'government' ? 'Admin Dashboard' : 'User Dashboard';
  
  return (
    <Link
      to={dashboardPath}
      className="bg-blue-500 hover:bg-blue-700 text-gray-200 px-4 py-2 rounded-lg transition duration-300"
    >
      {dashboardLabel}
    </Link>
  );
};

export default function Navbar() {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
    setTimeout(() => {
      const hero = document.getElementById("hero");
      if(hero){
        hero.scrollIntoView({ behavior: "smooth"});
      }
    }, 100);
  };
  const [isOpen, setIsOpen] = useState(false);


  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false); // Close mobile menu
    }
  };


  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md fixed top-0 left-0 w-full z-30">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          CivicConnect
        </Link>

        {/* Route-based navigation */}
        <div className="hidden md:flex items-center space-x-6">

          {/* In-page smooth scroll links */}
          <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
          <button onClick={handleHomeClick} className="bg-blue-500 hover:bg-blue-700 text-gray-200 px-4 py-2 rounded-lg transition duration-300">
            Home
          </button>
          </motion.div>
           <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
          <button onClick={() => scrollToSection("services")} className="bg-blue-500 hover:bg-blue-700 text-gray-200 px-4 py-2 rounded-lg transition duration-300">
            About Us
          </button>
          </motion.div>
           <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
          <button onClick={() => scrollToSection("connect")} className="bg-blue-500 hover:bg-blue-700 text-gray-200 px-4 py-2 rounded-lg transition duration-300">
            Connect
          </button>
          </motion.div>

         {/* Desktop Menu - Authentication */}
         <SignedOut>
           <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
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
              <button className="bg-blue-500 hover:bg-blue-700 text-gray-200 px-4 py-2 rounded-lg transition duration-300">
                Sign In
              </button>
            </SignInButton>
          </motion.div>
         </SignedOut>

         <SignedIn>
           <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
            <RoleBasedDashboardLink />
          </motion.div>
          <UserButton afterSignOutUrl="/" />
         </SignedIn>

        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden focus:outline-none"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>


      {/* Mobile Dropdown Menu */}
      {isOpen && (
      
        <div className="md:hidden bg-blue-700 p-4 flex flex-col space-y-3">
          <button
            onClick={handleHomeClick}
            className="text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("services")}
            className="text-white py-2 rounded-lg hover:bg-blue-600"
          >
           About
          </button>
          <button
            onClick={() => scrollToSection("connect")}
            className="text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Connect Us
          </button>

          
          <SignedOut>
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
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-blue-500 hover:bg-blue-700 text-gray-200 px-4 py-2 rounded-lg transition duration-300 w-full"
              >
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div onClick={() => setIsOpen(false)}>
              <RoleBasedDashboardLink />
            </div>
            <div className="flex justify-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      )}
    </nav>
  );
}