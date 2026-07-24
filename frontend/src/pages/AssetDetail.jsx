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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssetDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await assetService.getAssetById(id);
      setAsset(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch asset details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAssetDetails();
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
                        asset.status === "ONLINE" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-700"
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

            {/* Technical Specifications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard className="p-6 h-full flex flex-col justify-between">
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
              <GlassCard className="p-6 h-full flex flex-col justify-between">
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
              <GlassCard className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3 mb-4">
                    <span className="text-cyan-400"><FaShieldAlt className="text-lg" /></span>
                    <h3 className="text-lg font-bold text-white">Security posture</h3>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-3">
              <GlassCard className="p-6 flex items-center justify-between gap-6 border-t border-slate-800 text-xs text-slate-400">
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
      </main>
    </>
  );
}

export default AssetDetail;
