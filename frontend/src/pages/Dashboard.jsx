import AISecurityScore from "../components/AISecurityScore";
import SystemHealth from "../components/SystemHealth";
import LiveActivity from "../components/LiveActivity";
import AnimatedBackground from "../components/AnimatedBackground";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DashboardCards from "../components/DashboardCards";
import ThreatChart from "../components/ThreatChart";
import RecentAlerts from "../components/RecentAlerts";
import RecentThreats from "../components/RecentThreats";
import SeverityChart from "../components/SeverityChart";
import { motion } from "framer-motion";

function Dashboard() {
  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">

        {/* Animated Background */}
        <AnimatedBackground />

        {/* Dashboard Content */}
        <div className="relative z-10 p-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-between items-center">

              <div>

                <h1 className="text-5xl font-extrabold text-white">
                  Security Dashboard
                </h1>

                <p className="mt-3 text-lg text-slate-400">
                  Real-time Cyber Threat Intelligence Platform
                </p>

              </div>

              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 10px rgba(34,197,94,0.3)",
                    "0 0 30px rgba(34,197,94,0.7)",
                    "0 0 10px rgba(34,197,94,0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="px-6 py-3 rounded-full
                           bg-emerald-500/20
                           border border-emerald-400/30
                           backdrop-blur-xl
                           text-emerald-300
                           font-semibold"
              >
                🟢 Live Monitoring
              </motion.div>

            </div>
          </motion.div>

          {/* KPI Cards */}

          <div className="mt-10">
            <DashboardCards />
          </div>

          {/* Charts */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-10">

        <div className="xl:col-span-2 h-[420px]">
                <ThreatChart />
            </div>

            <div className="h-[420px]">
                <SeverityChart />
            </div>

        </div>

          {/* AI Widgets */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">

            <AISecurityScore />

            <SystemHealth />

          </div>

          {/* Recent Threats + Live Activity */}

         

          {/* Recent Alerts */}

          <div className="mt-10">

            <RecentAlerts />

          </div>

        </div>

      </main>
    </>
  );
}

export default Dashboard;