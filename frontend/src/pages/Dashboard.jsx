
import AIChatWidget from "../components/AIChatWidget";
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
          <div>
            <div className="flex justify-between items-center">

              <div>

                <h1 className="text-5xl font-extrabold text-white">
                  Security Dashboard
                </h1>

                <p className="mt-3 text-lg text-slate-400">
                  Real-time Cyber Threat Intelligence Platform
                </p>

              </div>

              <div
                className="px-6 py-3 rounded-full
                           bg-emerald-500/20
                           border border-emerald-400/30
                           backdrop-blur-xl
                           text-emerald-300
                           font-semibold"
              >
                🟢 Live Monitoring
              </div>

            </div>
          </div>

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
      <AIChatWidget />
      </main>
    </>
  );
}

export default Dashboard;