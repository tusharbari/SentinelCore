import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaLaptop,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaServer,
  FaNetworkWired,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";

import assetService from "../services/assetService";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";

import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import PrimaryButton from "../components/ui/PrimaryButton";

function AssetDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const role = localStorage.getItem("role") || "VIEWER";
  const isWritable = role === "ADMIN" || role === "ANALYST";

  const [asset, setAsset] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssetDetails = async (initial = false) => {
    if (initial) setLoading(true);
    setError("");
    try {
      const data = await assetService.getAssetById(id);
      setAsset(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch asset details.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const alertData = await assetService.getAlertsByAsset(id);
      setAlerts(alertData || []);
    } catch (e) {
      console.error("Failed to fetch asset alerts", e);
    }

    try {
      const incidentData = await assetService.getIncidentsByAsset(id);
      setIncidents(incidentData || []);
    } catch (e) {
      console.error("Failed to fetch asset incidents", e);
    }

    try {
      const auditData = await assetService.getAuditLogsByAsset(id);
      setAuditLogs(auditData || []);
    } catch (e) {
      console.error("Failed to fetch asset audit logs", e);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAssetDetails(true);
      fetchRelatedData();

      const interval = setInterval(() => {
        fetchAssetDetails(false);
        fetchRelatedData();
      }, 30000); // Auto-refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await assetService.deleteAsset(id);
      toast.success("Asset deleted successfully.");
      navigate("/assets");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete asset.");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="ml-64 mt-16 min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold">Loading Asset Registry...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !asset) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="ml-64 mt-16 min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <GlassCard className="p-8 text-center max-w-md">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-slate-400 mb-6">{error || "Asset not found."}</p>
            <PrimaryButton onClick={() => navigate("/assets")} className="bg-cyan-600 hover:bg-cyan-500 text-white w-full">
              Back to Assets
            </PrimaryButton>
          </GlassCard>
        </main>
      </>
    );
  }

  const getRiskColor = (score) => {
    if (!score) return "bg-green-500";
    if (score >= 75) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 25) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskTextColor = (score) => {
    if (!score) return "text-green-400";
    if (score >= 75) return "text-red-400";
    if (score >= 50) return "text-orange-400";
    if (score >= 25) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 p-8">
          <PageHeader title={`Asset / ${asset.hostname}`} subtitle={`Security audit record for device ${asset.assetId}`}>
            <div className="flex gap-3">
              <PrimaryButton onClick={() => navigate("/assets")} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center gap-2">
                <FaArrowLeft /> Back
              </PrimaryButton>

              {isWritable && (
                <PrimaryButton onClick={() => navigate(`/assets/edit/${asset.id}`)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center gap-2">
                  <FaEdit /> Edit Details
                </PrimaryButton>
              )}

              {role === "ADMIN" && (
                <PrimaryButton onClick={handleDelete} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white flex items-center gap-2">
                  <FaTrash /> Delete Asset
                </PrimaryButton>
              )}
            </div>
          </PageHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Title / Identity Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-3">
              <GlassCard className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-cyan-500">
                <div className="flex items-center gap-5">
                  <span className="p-4 bg-cyan-500/10 text-cyan-400 rounded-3xl"><FaLaptop className="text-3xl" /></span>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-3xl font-extrabold text-white">{asset.hostname}</h2>
                      <span className="text-sm font-semibold bg-slate-800 text-cyan-400 px-3 py-1 rounded-xl border border-slate-700">{asset.assetId}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        asset.status === "ONLINE" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        asset.status === "OFFLINE" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>
                        ● {asset.status}
                      </span>
                    </div>
                    <p className="text-slate-400 font-medium text-sm mt-1">{asset.assetName} • {asset.deviceType}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Risk Profile</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black ${getRiskTextColor(asset.riskScore)}`}>
                      {asset.riskScore !== null ? asset.riskScore : "0"}/100
                    </span>
                    <div className="w-24 bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div className={`h-full ${getRiskColor(asset.riskScore)}`} style={{ width: `${asset.riskScore || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Left Column: Live Metrics, Alerts, Incidents, Audits */}
            <div className="lg:col-span-2 space-y-8">
              {/* Live Metrics */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    📊 Live System Metrics
                  </h3>
                  {asset.agentInstalled ? (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-400">CPU Usage</span>
                          <span className="text-white">{asset.cpuUsage !== null && asset.cpuUsage !== undefined ? `${asset.cpuUsage.toFixed(1)}%` : "N/A"}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            asset.cpuUsage >= 90 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                            asset.cpuUsage >= 70 ? "bg-yellow-500" : "bg-green-500"
                          }`} style={{ width: `${asset.cpuUsage || 0}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-400">RAM Usage ({asset.totalRam ? `${asset.totalRam.toFixed(1)} GB Total` : "N/A"})</span>
                          <span className="text-white">{asset.ramUsage !== null && asset.ramUsage !== undefined ? `${asset.ramUsage.toFixed(1)}%` : "N/A"}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            asset.ramUsage >= 95 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                            asset.ramUsage >= 80 ? "bg-yellow-500" : "bg-green-500"
                          }`} style={{ width: `${asset.ramUsage || 0}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-400">Disk Storage ({asset.freeStorage !== null && asset.totalStorage !== null ? `${asset.freeStorage.toFixed(1)} GB free of ${asset.totalStorage.toFixed(1)} GB` : "N/A"})</span>
                          <span className="text-white">{asset.diskUsage !== null && asset.diskUsage !== undefined ? `${asset.diskUsage.toFixed(1)}%` : "N/A"}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            asset.diskUsage >= 90 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                            asset.diskUsage >= 75 ? "bg-yellow-500" : "bg-green-500"
                          }`} style={{ width: `${asset.diskUsage || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic">Monitoring agent is not installed on this asset. Deploy the background agent to start receiving live system telemetry.</p>
                  )}
                </GlassCard>
              </motion.div>

              {/* Alerts */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">🚨 Recent Alerts ({alerts.length})</h3>
                  {alerts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="pb-2">ID</th>
                            <th className="pb-2">Title</th>
                            <th className="pb-2">Severity</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Last Occurred</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {alerts.map((al) => (
                            <tr key={al.id} className="hover:bg-slate-850">
                              <td className="py-2.5 font-mono">{al.id}</td>
                              <td className="py-2.5 font-semibold text-white">{al.title}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  al.severity === "Critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  al.severity === "High" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                  al.severity === "Medium" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                                  "bg-green-500/10 text-green-400 border border-green-500/20"
                                }`}>
                                  {al.severity}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  al.status === "Open" ? "bg-red-500/10 text-red-400" :
                                  al.status === "Acknowledged" ? "bg-yellow-500/10 text-yellow-300" :
                                  "bg-green-500/10 text-green-400"
                                }`}>
                                  {al.status}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-[11px]">
                                {al.lastOccurred ? new Date(al.lastOccurred).toLocaleString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic py-2">No active alerts recorded for this device.</p>
                  )}
                </GlassCard>
              </motion.div>

              {/* Incidents */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">💼 Incident History ({incidents.length})</h3>
                  {incidents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="pb-2">ID</th>
                            <th className="pb-2">Title</th>
                            <th className="pb-2">Severity</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Created At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {incidents.map((inc) => (
                            <tr 
                              key={inc.id} 
                              onClick={() => navigate(`/incidents/${inc.id}`)}
                              className="hover:bg-slate-850 cursor-pointer transition-colors duration-200"
                            >
                              <td className="py-2.5 font-mono text-cyan-400 font-bold">#{inc.id}</td>
                              <td className="py-2.5 font-semibold text-white hover:underline">{inc.title}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  inc.severity === "Critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  inc.severity === "High" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                  inc.severity === "Medium" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                                  "bg-green-500/10 text-green-400 border border-green-500/20"
                                }`}>
                                  {inc.severity}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  inc.status === "Open" ? "bg-red-500/10 text-red-400" :
                                  inc.status === "Investigating" ? "bg-yellow-500/10 text-yellow-300" :
                                  "bg-green-500/10 text-green-400"
                                }`}>
                                  {inc.status}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono text-[11px]">
                                {inc.createdAt ? new Date(inc.createdAt).toLocaleString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic py-2">No security incidents logged for this device.</p>
                  )}
                </GlassCard>
              </motion.div>

              {/* Audit logs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">📋 Audit History ({auditLogs.length})</h3>
                  {auditLogs.length > 0 ? (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="pb-2">Timestamp</th>
                            <th className="pb-2">Action</th>
                            <th className="pb-2">Description</th>
                            <th className="pb-2">Changes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-850">
                              <td className="py-2.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                              </td>
                              <td className="py-2.5 font-bold text-white">{log.action}</td>
                              <td className="py-2.5 max-w-xs truncate" title={log.description}>{log.description}</td>
                              <td className="py-2.5">
                                {log.oldValue && (
                                  <div className="text-[10px] text-red-400 font-mono">
                                    - {log.oldValue}
                                  </div>
                                )}
                                {log.newValue && (
                                  <div className="text-[10px] text-green-400 font-mono">
                                    + {log.newValue}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic py-2">No audit logs available for this asset.</p>
                  )}
                </GlassCard>
              </motion.div>
            </div>

            {/* Right Column: Specs */}
            <div className="space-y-8">
              {/* Technical Specifications */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <GlassCard className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3 mb-4">
                      <span className="text-cyan-400"><FaNetworkWired className="text-lg" /></span>
                      <h3 className="text-lg font-bold text-white">Network & Specs</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">IP Address</span>
                        <p className="text-white font-mono text-sm font-semibold mt-0.5">{asset.ipAddress}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">MAC Address</span>
                        <p className="text-white font-mono text-sm font-semibold mt-0.5">{asset.macAddress}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Operating System</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{asset.operatingSystem}</p>
                      </div>
                      {asset.osVersion && (
                        <div>
                          <span className="text-xs text-slate-500 font-medium uppercase">OS Version</span>
                          <p className="text-white font-semibold text-sm mt-0.5">{asset.osVersion}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Deployment Environment</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{asset.environment}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Physical Location</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{asset.location}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Allocation & Administration */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <GlassCard className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3 mb-4">
                      <span className="text-cyan-400"><FaServer className="text-lg" /></span>
                      <h3 className="text-lg font-bold text-white">Owner & Division</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Assigned Owner</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{asset.owner}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Department / Cost Center</span>
                        <p className="text-white font-semibold text-sm mt-0.5">{asset.department}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Last Activity Scan</span>
                        <p className="text-white font-semibold text-sm mt-0.5">
                          {asset.lastSeen ? new Date(asset.lastSeen).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Security Profile */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <GlassCard className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3 mb-4">
                      <span className="text-cyan-400"><FaShieldAlt className="text-lg" /></span>
                      <h3 className="text-lg font-bold text-white">Security Posture</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Criticality Index</span>
                        <div className="mt-1">
                          <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${
                            asset.criticality === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            asset.criticality === "HIGH" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                            asset.criticality === "MEDIUM" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                            "bg-green-500/10 text-green-400 border border-green-500/20"
                          }`}>
                            {asset.criticality}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Compliance Status</span>
                        <div className="mt-1">
                          <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${
                            asset.patchStatus === "UPDATED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            asset.patchStatus === "OUTDATED" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                            "bg-slate-500/10 text-slate-400 border border-slate-700"
                          }`}>
                            {asset.patchStatus}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase">Last Patch Deployment</span>
                        <p className="text-white font-semibold text-sm mt-0.5">
                          {asset.lastPatchDate ? new Date(asset.lastPatchDate).toLocaleDateString() : "Never Patched / Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Timestamps Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <GlassCard className="p-6 flex flex-col gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-cyan-500" />
                    <span>Created At: <strong>{asset.createdAt ? new Date(asset.createdAt).toLocaleString() : "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-cyan-500" />
                    <span>Last Updated: <strong>{asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : "N/A"}</strong></span>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default AssetDetail;
