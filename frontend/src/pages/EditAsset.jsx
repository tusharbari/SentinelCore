import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaLaptop, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";

import assetService from "../services/assetService";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";

import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import PrimaryButton from "../components/ui/PrimaryButton";
import ModernInput from "../components/ui/ModernInput";
import ModernSelect from "../components/ui/ModernSelect";
import FormSection from "../components/ui/FormSection";

function EditAsset() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [asset, setAsset] = useState({
    hostname: "",
    assetName: "",
    ipAddress: "",
    macAddress: "",
    deviceType: "Server",
    operatingSystem: "",
    osVersion: "",
    owner: "",
    department: "",
    location: "",
    environment: "Production",
    criticality: "MEDIUM",
    patchStatus: "UNKNOWN",
    lastPatchDate: "",
    status: "ONLINE",
    riskScore: 0,
  });

  // Client Validation State
  const [errors, setErrors] = useState({});

  const fetchAssetDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await assetService.getAssetById(id);
      setAsset({
        hostname: data.hostname || "",
        assetName: data.assetName || "",
        ipAddress: data.ipAddress || "",
        macAddress: data.macAddress || "",
        deviceType: data.deviceType || "Server",
        operatingSystem: data.operatingSystem || "",
        osVersion: data.osVersion || "",
        owner: data.owner || "",
        department: data.department || "",
        location: data.location || "",
        environment: data.environment || "Production",
        criticality: data.criticality || "MEDIUM",
        patchStatus: data.patchStatus || "UNKNOWN",
        lastPatchDate: data.lastPatchDate || "",
        status: data.status || "ONLINE",
        riskScore: data.riskScore || 0,
      });
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

  const validateForm = () => {
    const tempErrors = {};
    if (!asset.hostname.trim()) tempErrors.hostname = "Hostname is required";
    if (!asset.assetName.trim()) tempErrors.assetName = "Asset Name is required";
    
    // IP Validation
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!asset.ipAddress.trim()) {
      tempErrors.ipAddress = "IP Address is required";
    } else if (!ipPattern.test(asset.ipAddress.trim())) {
      tempErrors.ipAddress = "Invalid IPv4 format";
    }

    // MAC Validation
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!asset.macAddress.trim()) {
      tempErrors.macAddress = "MAC Address is required";
    } else if (!macPattern.test(asset.macAddress.trim())) {
      tempErrors.macAddress = "Invalid MAC Address format (e.g. 00:50:56:AB:CD:12)";
    }

    if (!asset.operatingSystem.trim()) tempErrors.operatingSystem = "Operating System is required";
    if (!asset.owner.trim()) tempErrors.owner = "Owner is required";
    if (!asset.department.trim()) tempErrors.department = "Department is required";
    if (!asset.location.trim()) tempErrors.location = "Location is required";

    if (asset.riskScore < 0 || asset.riskScore > 100) {
      tempErrors.riskScore = "Risk score must be between 0 and 100";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please resolve the validation errors first.");
      return;
    }

    const updateToastId = toast.loading("Updating asset details...");
    try {
      const payload = {
        ...asset,
        lastPatchDate: asset.lastPatchDate ? asset.lastPatchDate : null,
      };
      await assetService.updateAsset(id, payload);
      toast.update(updateToastId, {
        render: "Asset details updated successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      navigate("/assets");
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Failed to update asset. Hostname/IP might be duplicate.";
      const subErrors = error.response?.data?.errors;
      if (subErrors) {
        setErrors(subErrors);
      }
      toast.update(updateToastId, {
        render: errMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
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
            <p className="text-slate-400 font-semibold">Loading Asset Details...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="ml-64 mt-16 min-h-screen bg-slate-950 flex items-center justify-center p-8">
          <GlassCard className="p-8 text-center max-w-md">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <PrimaryButton onClick={() => navigate("/assets")} className="bg-cyan-600 hover:bg-cyan-500 text-white w-full">
              Back to Assets
            </PrimaryButton>
          </GlassCard>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 p-8">
          <PageHeader title="Edit Asset" subtitle="Update identity, allocation, and status variables for this device">
            <PrimaryButton onClick={() => navigate("/assets")} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 flex items-center gap-2">
              <FaArrowLeft /> Back to List
            </PrimaryButton>
          </PageHeader>

          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <GlassCard className="max-w-5xl mx-auto p-8 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                <span className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl"><FaLaptop className="text-xl" /></span>
                <div>
                  <h2 className="text-xl font-bold text-white">Modify Host Information</h2>
                  <p className="text-xs text-slate-400">Edit fields and click save to commit changes to the registry</p>
                </div>
              </div>

              <FormSection>
                {/* Hostname */}
                <div>
                  <ModernInput label="Hostname *" value={asset.hostname} onChange={(e) => setAsset({ ...asset, hostname: e.target.value })} />
                  {errors.hostname && <p className="text-red-400 text-xs mt-1 pl-1">{errors.hostname}</p>}
                </div>

                {/* Asset Name */}
                <div>
                  <ModernInput label="Asset Name *" value={asset.assetName} onChange={(e) => setAsset({ ...asset, assetName: e.target.value })} />
                  {errors.assetName && <p className="text-red-400 text-xs mt-1 pl-1">{errors.assetName}</p>}
                </div>

                {/* IP Address */}
                <div>
                  <ModernInput label="IP Address *" value={asset.ipAddress} onChange={(e) => setAsset({ ...asset, ipAddress: e.target.value })} />
                  {errors.ipAddress && <p className="text-red-400 text-xs mt-1 pl-1">{errors.ipAddress}</p>}
                </div>

                {/* MAC Address */}
                <div>
                  <ModernInput label="MAC Address * (e.g. 00:50:56:AB:CD:12)" value={asset.macAddress} onChange={(e) => setAsset({ ...asset, macAddress: e.target.value })} />
                  {errors.macAddress && <p className="text-red-400 text-xs mt-1 pl-1">{errors.macAddress}</p>}
                </div>

                {/* Device Type */}
                <ModernSelect label="Device Type *" value={asset.deviceType} onChange={(e) => setAsset({ ...asset, deviceType: e.target.value })} options={["Server", "Workstation", "Router", "Switch", "Firewall", "IoT", "Mobile", "Other"]} />

                {/* Operating System */}
                <div>
                  <ModernInput label="Operating System *" value={asset.operatingSystem} onChange={(e) => setAsset({ ...asset, operatingSystem: e.target.value })} />
                  {errors.operatingSystem && <p className="text-red-400 text-xs mt-1 pl-1">{errors.operatingSystem}</p>}
                </div>

                {/* OS Version */}
                <ModernInput label="OS Version" value={asset.osVersion} onChange={(e) => setAsset({ ...asset, osVersion: e.target.value })} />

                {/* Owner */}
                <div>
                  <ModernInput label="Owner *" value={asset.owner} onChange={(e) => setAsset({ ...asset, owner: e.target.value })} />
                  {errors.owner && <p className="text-red-400 text-xs mt-1 pl-1">{errors.owner}</p>}
                </div>

                {/* Department */}
                <div>
                  <ModernInput label="Department *" value={asset.department} onChange={(e) => setAsset({ ...asset, department: e.target.value })} />
                  {errors.department && <p className="text-red-400 text-xs mt-1 pl-1">{errors.department}</p>}
                </div>

                {/* Location */}
                <div>
                  <ModernInput label="Location (Room/DC) *" value={asset.location} onChange={(e) => setAsset({ ...asset, location: e.target.value })} />
                  {errors.location && <p className="text-red-400 text-xs mt-1 pl-1">{errors.location}</p>}
                </div>

                {/* Environment */}
                <ModernSelect label="Environment *" value={asset.environment} onChange={(e) => setAsset({ ...asset, environment: e.target.value })} options={["Production", "Test", "Development"]} />

                {/* Criticality */}
                <ModernSelect label="Criticality *" value={asset.criticality} onChange={(e) => setAsset({ ...asset, criticality: e.target.value })} options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} />

                {/* Patch Status */}
                <ModernSelect label="Patch Status *" value={asset.patchStatus} onChange={(e) => setAsset({ ...asset, patchStatus: e.target.value })} options={["UNKNOWN", "UPDATED", "OUTDATED"]} />

                {/* Status */}
                <ModernSelect label="Status *" value={asset.status} onChange={(e) => setAsset({ ...asset, status: e.target.value })} options={["ONLINE", "OFFLINE"]} />

                {/* Risk Score */}
                <div>
                  <div className="relative">
                    <input type="number" min="0" max="100" value={asset.riskScore} onChange={(e) => setAsset({ ...asset, riskScore: parseInt(e.target.value) || 0 })} className="peer w-full rounded-xl bg-slate-800 border border-slate-700 px-5 pt-7 pb-3 text-white placeholder-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none transition" />
                    <label className="absolute left-5 top-2 text-xs font-medium text-cyan-400">Risk Score (0 - 100)</label>
                  </div>
                  {errors.riskScore && <p className="text-red-400 text-xs mt-1 pl-1">{errors.riskScore}</p>}
                </div>

                {/* Last Patch Date */}
                <div className="relative">
                  <input type="date" value={asset.lastPatchDate} onChange={(e) => setAsset({ ...asset, lastPatchDate: e.target.value })} className="peer w-full rounded-xl bg-slate-800 border border-slate-700 px-5 pt-7 pb-3 text-white placeholder-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none transition" />
                  <label className="absolute left-5 top-2 text-xs font-medium text-cyan-400">Last Patch Date</label>
                </div>
              </FormSection>

              <div className="flex justify-end gap-4 mt-8 border-t border-slate-800 pt-6">
                <button type="button" onClick={() => navigate("/assets")} className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition">
                  Cancel
                </button>
                <PrimaryButton onClick={handleUpdate} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-600/20">
                  💾 Update Details
                </PrimaryButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </main>
    </>
  );
}

export default EditAsset;
