import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function CivicConnect() {
  const navigate = useNavigate();


  return (
    <section
      id="civic-connect"
      className="px-6 py-12 max-w-5xl mx-auto text-center"
    >
      {/* Section Heading */}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
        How CivicConnect Works
      </h2>
      <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
        Submit issues like potholes, broken streetlights, or garbage collection
        problems. We make it easy for municipalities to track, manage, and resolve
        your concerns quickly.
      </p>


      {/* Cards Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Issue */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-blue-600">Report Issue</h3>
          <p className="text-gray-600 mt-2">
            Easily submit civic issues via our platform.
          </p>
        </div>


        {/* Track Progress */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-blue-600">Track Progress</h3>
          <p className="text-gray-600 mt-2">
            Follow the status of your submissions in real-time.
          </p>
        </div>


        {/* Share Feedback */}
        <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-blue-600">Share Feedback</h3>
          <p className="text-gray-600 mt-2">
            Authorities act faster based on better reporting data.
          </p>
        </div>
      </div>


      {/* Login Buttons Section */}
      <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Admin Login Button */}
        <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
        <button
          onClick={() => navigate("/admin-login")}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition"
        >
          Admin Login
        </button>
        </motion.div>

        {/* User Login Button */}

        <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
        <button
          onClick={() => navigate("/user-login")}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:bg-green-700 transition"
        >
          User Login
        </button>
        </motion.div>
      </div>
    </section>
  );
}


export default CivicConnect;