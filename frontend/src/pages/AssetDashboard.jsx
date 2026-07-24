import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { FaServer, FaLaptop, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSyncAlt } from "react-icons/fa";

import assetService from "../services/assetService";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";

import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import PrimaryButton from "../components/ui/PrimaryButton";

function AssetDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await assetService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="ml-64 mt-16 min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold">Loading Asset Dashboard...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !stats) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="ml-64 mt-16 min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <GlassCard className="p-8 text-center max-w-md">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-slate-400 mb-6">{error || "Something went wrong."}</p>
            <PrimaryButton onClick={fetchStats} className="bg-cyan-600 hover:bg-cyan-500 text-white w-full">
              Try Again
            </PrimaryButton>
          </GlassCard>
        </main>
      </>
    );
  }

  // Color mappings for criticality
  const CRITICALITY_COLORS = {
    CRITICAL: "#ef4444", // red-500
    HIGH: "#f97316",     // orange-500
    MEDIUM: "#eab308",   // yellow-500
    LOW: "#22c55e",      // green-500
  };

  // Color mappings for patch status
  const PATCH_COLORS = {
    UPDATED: "#22c55e",
    OUTDATED: "#f97316",
    UNKNOWN: "#64748b",
  };

  const criticalityChartData = stats.riskDistribution.map(item => ({
    name: item.name,
    value: item.value,
    color: CRITICALITY_COLORS[item.name] || "#3b82f6",
  })).filter(item => item.value > 0);

  const patchChartData = stats.patchStatusDistribution.map(item => ({
    name: item.name,
    value: item.value,
    color: PATCH_COLORS[item.name] || "#3b82f6",
  })).filter(item => item.value > 0);

  const getRiskColor = (score) => {
    if (!score) return "text-green-400";
    if (score >= 75) return "text-red-400 font-bold";
    if (score >= 50) return "text-orange-400";
    if (score >= 25) return "text-yellow-300";
    return "text-green-400";
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 p-8">
          <PageHeader title="Asset Dashboard" subtitle="Overview of network assets, security compliance, and patch health">
            <div className="flex gap-3">
              <PrimaryButton onClick={fetchStats} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center gap-2">
                <FaSyncAlt /> Refresh
              </PrimaryButton>
              <PrimaryButton onClick={() => navigate("/assets")} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
                View Asset Inventory
              </PrimaryButton>
            </div>
          </PageHeader>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Assets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Total Assets</span>
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><FaLaptop className="text-lg" /></span>
              </div>
              <p className="text-4xl font-extrabold text-white mt-4">{stats.totalAssets}</p>
              <p className="text-xs text-slate-500 mt-2">Inventoried devices</p>
            </motion.div>

            {/* Critical Assets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all duration-300 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Critical Assets</span>
                <span className="p-2 rounded-xl bg-red-500/10 text-red-400"><FaServer className="text-lg" /></span>
              </div>
              <p className="text-4xl font-extrabold text-red-400 mt-4">{stats.criticalAssets}</p>
              <p className="text-xs text-slate-500 mt-2">Requires maximum security</p>
            </motion.div>

            {/* Online Assets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-green-500/40 transition-all duration-300 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full pointer-events-none group-hover:bg-green-500/10 transition-colors"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Online Assets</span>
                <span className="p-2 rounded-xl bg-green-500/10 text-green-400"><FaCheckCircle className="text-lg" /></span>
              </div>
              <p className="text-4xl font-extrabold text-green-400 mt-4">{stats.onlineAssets}</p>
              <p className="text-xs text-slate-500 mt-2">Active on network</p>
            </motion.div>

            {/* Offline Assets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-500/40 transition-all duration-300 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-full pointer-events-none group-hover:bg-slate-500/10 transition-colors"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Offline Assets</span>
                <span className="p-2 rounded-xl bg-slate-500/10 text-slate-400"><FaTimesCircle className="text-lg" /></span>
              </div>
              <p className="text-4xl font-extrabold text-slate-400 mt-4">{stats.offlineAssets}</p>
              <p className="text-xs text-slate-500 mt-2">Inactive or unreachable</p>
            </motion.div>

            {/* Outdated Assets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300 shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none group-hover:bg-orange-500/10 transition-colors"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Outdated Assets</span>
                <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400"><FaExclamationTriangle className="text-lg" /></span>
              </div>
              <p className="text-4xl font-extrabold text-orange-400 mt-4">{stats.outdatedAssets}</p>
              <p className="text-xs text-slate-500 mt-2">Requires patches/updates</p>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Criticality Pie Chart */}
            <GlassCard className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Asset Criticality</h3>
                <p className="text-xs text-slate-400 mb-4">Distribution by business priority level</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                {criticalityChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={criticalityChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                        {criticalityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#fff" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm">No criticality data available</p>
                )}
              </div>
            </GlassCard>

            {/* Device Type Bar Chart */}
            <GlassCard className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Device Types</h3>
                <p className="text-xs text-slate-400 mb-4">Counts of network host categories</p>
              </div>
              <div className="h-64">
                {stats.deviceTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.deviceTypeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "11px" }} />
                      <YAxis stroke="#64748b" style={{ fontSize: "11px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#fff" }} />
                      <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500 text-sm">No device category data available</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Patch Status Chart */}
            <GlassCard className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Patch Compliance</h3>
                <p className="text-xs text-slate-400 mb-4">Distribution of device update status</p>
              </div>
              <div className="h-64 flex items-center justify-center">
                {patchChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={patchChartData} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="value">
                        {patchChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#fff" }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm">No patch compliance data available</p>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Lists Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Recently Added Assets */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">🆕 Recently Added Assets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">Asset ID</th>
                      <th className="pb-3">Hostname</th>
                      <th className="pb-3">IP Address</th>
                      <th className="pb-3">Criticality</th>
                      <th className="pb-3 text-right">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                    {stats.latestAssets.length > 0 ? (
                      stats.latestAssets.map((asset) => (
                        <tr key={asset.id} onClick={() => navigate(`/assets/detail/${asset.id}`)} className="hover:bg-slate-800/30 cursor-pointer transition-colors duration-200">
                          <td className="py-3 text-cyan-400 font-semibold">{asset.assetId}</td>
                          <td className="py-3 font-semibold text-white">{asset.hostname}</td>
                          <td className="py-3">{asset.ipAddress}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              asset.criticality === "CRITICAL" ? "bg-red-500/10 text-red-400" :
                              asset.criticality === "HIGH" ? "bg-orange-500/10 text-orange-400" :
                              asset.criticality === "MEDIUM" ? "bg-yellow-500/10 text-yellow-300" :
                              "bg-green-500/10 text-green-400"
                            }`}>
                              {asset.criticality}
                            </span>
                          </td>
                          <td className={`py-3 text-right ${getRiskColor(asset.riskScore)}`}>
                            {asset.riskScore !== null ? asset.riskScore : "0"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No assets recorded yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Recently Updated Assets */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">🔄 Recently Updated Assets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">Asset ID</th>
                      <th className="pb-3">Hostname</th>
                      <th className="pb-3">Owner</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                    {stats.recentlyUpdatedAssets.length > 0 ? (
                      stats.recentlyUpdatedAssets.map((asset) => (
                        <tr key={asset.id} onClick={() => navigate(`/assets/detail/${asset.id}`)} className="hover:bg-slate-800/30 cursor-pointer transition-colors duration-200">
                          <td className="py-3 text-cyan-400 font-semibold">{asset.assetId}</td>
                          <td className="py-3 font-semibold text-white">{asset.hostname}</td>
                          <td className="py-3">{asset.owner}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              asset.status === "ONLINE" ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"
                            }`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="py-3 text-right text-xs text-slate-400">
                            {asset.lastSeen ? new Date(asset.lastSeen).toLocaleString() : "Never"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">No assets recorded yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </>
  );
}

export default AssetDashboard;
