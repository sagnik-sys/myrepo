import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  const handleLogin = (e) => {
    e.preventDefault();


    if (!email.includes("@")) {
      setError("⚠ Please enter a valid email address.");
      return;
    }


    if (password.length < 6) {
      setError("⚠ Password must be at least 6 characters.");
      return;
    }


    setError("");
    navigate("/user-dashboard");
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-4xl text-blue-600 font-bold text-center mb-6">User Login</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded"
          />

          <motion.div
            whileHover={{scale: 1.05}}
            whileTap={{scale: 0.95}}
            >
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition"
          >
            Login
          </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}