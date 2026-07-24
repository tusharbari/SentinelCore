import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaCheckCircle,
  FaArrowUp,
} from "react-icons/fa";

function AISecurityScore() {

  const score = 92;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl"
    >

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold text-white">
            AI Security Score
          </h2>

          <p className="text-slate-400 mt-2">
            Overall security posture
          </p>

        </div>

        <FaShieldAlt className="text-4xl text-cyan-400" />

      </div>

      <div className="mt-8 flex justify-center">

        <div
          className="w-44 h-44 rounded-full
                     border-[12px]
                     border-cyan-400
                     flex flex-col
                     items-center
                     justify-center"
        >

          <h1 className="text-5xl font-bold text-white">
            {score}
          </h1>

          <span className="text-cyan-400">
            /100
          </span>

        </div>

      </div>

      <div className="mt-8 space-y-3">

        <div className="flex items-center gap-3 text-green-400">
          <FaCheckCircle />
          Firewall Healthy
        </div>

        <div className="flex items-center gap-3 text-green-400">
          <FaCheckCircle />
          IOC Detection Active
        </div>

        <div className="flex items-center gap-3 text-yellow-400">
          <FaArrowUp />
          Patch Windows Server
        </div>

      </div>

    </div>
  );
}

export default AISecurityScore;