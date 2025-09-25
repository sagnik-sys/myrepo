import { motion } from "framer-motion";


function Hero() {
  const handleScroll = () => {
    const section = document.getElementById("civic-connect");
    if(section){
      section.scrollIntoView({ behavior : "smooth" });
    }
  };
  return (
    <section 
    id ="hero"
    className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20">
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold text-gray-900 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Welcome to <span className="text-blue-600">CivicConnect</span>
      </motion.h1>


      <motion.p
        className="mt-4 text-lg md:text-xl text-gray-600 text-center max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        A powerful platform to report, track, and resolve civic issues in your
        community. Let's make cities smarter and safer together.
      </motion.p>


      <motion.button
        onClick={handleScroll}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        Get Started
      </motion.button>
    </section>
  );
}
export default Hero;