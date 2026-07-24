import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaToggleOn, FaToggleOff, FaEye, FaPlus, FaTimes, FaCog, FaHistory, FaCheckCircle, FaExclamationCircle, FaSpinner } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import TableContainer from "../components/ui/TableContainer";

import playbookService from "../services/playbookService";
import { getCurrentRole } from "../services/auth";

function PlaybookList() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const canWrite = ["ADMIN", "ANALYST"].includes(role);

  const [activeTab, setActiveTab] = useState("templates"); // templates | history
  const [playbooks, setPlaybooks] = useState([]);
  const [executions, setExecutions] = useState([]);

  // Create Playbook Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaybook, setNewPlaybook] = useState({
    name: "",
    description: "",
    triggerType: "ALERT_TYPE",
    triggerValue: "",
    conditionsJson: "{}",
    steps: [
      { stepOrder: 1, name: "Collect Logs", actionType: "SEND_NOTIFICATION", parametersJson: "{}" }
    ]
  });

  const [releasedIds, setReleasedIds] = useState(new Set());

  useEffect(() => {
    fetchPlaybooks();
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlaybooks = async () => {
    try {
      const data = await playbookService.getPlaybooks();
      setPlaybooks(data);
    } catch (error) {
      console.error("Failed to load playbooks", error);
    }
  };

  const fetchExecutions = async () => {
    try {
      const data = await playbookService.getExecutionHistory();
      setExecutions(data);
    } catch (error) {
      console.error("Failed to load executions", error);
    }
  };

  const handleToggleStatus = async (id) => {
    if (!canWrite) return;
    try {
      await playbookService.togglePlaybookStatus(id);
      fetchPlaybooks();
    } catch (error) {
      console.error("Failed to toggle playbook status", error);
    }
  };

  const handleAddStep = () => {
    setNewPlaybook({
      ...newPlaybook,
      steps: [
        ...newPlaybook.steps,
        {
          stepOrder: newPlaybook.steps.length + 1,
          name: "",
          actionType: "SEND_NOTIFICATION",
          parametersJson: "{}"
        }
      ]
    });
  };

  const handleRemoveStep = (index) => {
    const updated = newPlaybook.steps.filter((_, idx) => idx !== index).map((step, idx) => ({
      ...step,
      stepOrder: idx + 1
    }));
    setNewPlaybook({
      ...newPlaybook,
      steps: updated
    });
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...newPlaybook.steps];
    updated[index][field] = value;
    setNewPlaybook({
      ...newPlaybook,
      steps: updated
    });
  };

  const handleCreatePlaybook = async (e) => {
    e.preventDefault();
    if (!newPlaybook.name) return;
    try {
      await playbookService.createPlaybook(newPlaybook);
      setIsCreateModalOpen(false);
      setNewPlaybook({
        name: "",
        description: "",
        triggerType: "ALERT_TYPE",
        triggerValue: "",
        conditionsJson: "{}",
        steps: [
          { stepOrder: 1, name: "Collect Logs", actionType: "SEND_NOTIFICATION", parametersJson: "{}" }
        ]
      });
      fetchPlaybooks();
    } catch (error) {
      console.error("Failed to create playbook", error);
      alert("Error creating playbook. Make sure the name is unique.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold"><FaCheckCircle /> Success</span>;
      case "FAILED":
        return <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-bold"><FaExclamationCircle /> Failed</span>;
      case "RUNNING":
        return <span className="flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-xs font-bold"><FaSpinner className="animate-spin" /> Running</span>;
      case "PENDING":
        return <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-white">{status}</span>;
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 p-8">
          <div className="flex justify-between items-center mb-6">
            <PageHeader
              title="Playbook Automation"
              subtitle="Configure response logic templates, view execution progress logs, and toggle rules."
            />
            {activeTab === "templates" && canWrite && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-sky-500/25 transition-all duration-300 text-sm"
              >
                <FaPlus className="text-sm" /> Create Playbook
              </motion.button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 mb-8 gap-4">
            <button
              onClick={() => setActiveTab("templates")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all duration-300 outline-none ${
                activeTab === "templates"
                  ? "border-sky-500 text-sky-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <FaCog /> Playbook Templates
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                fetchExecutions();
              }}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all duration-300 outline-none ${
                activeTab === "history"
                  ? "border-sky-500 text-sky-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <FaHistory /> Execution History
            </button>
          </div>

          {/* TAB 1: PLAYBOOK TEMPLATES */}
          {activeTab === "templates" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {playbooks.map((playbook, idx) => (
                <GlassCard
                  key={playbook.id}
                  className="p-6 border border-slate-800 hover:border-slate-700/60 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{playbook.name}</h4>
                      <p className="text-slate-400 text-xs mt-1 min-h-[32px] line-clamp-2">
                        {playbook.description || "No description provided."}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(playbook.id)}
                      disabled={!canWrite}
                      className={`text-2xl outline-none focus:outline-none transition-colors duration-300 ${
                        playbook.isActive ? "text-sky-400" : "text-slate-600"
                      } ${!canWrite ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {playbook.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-4 text-xs space-y-2">
                    <div>
                      <span className="text-slate-500 font-semibold uppercase">Trigger On:</span>{" "}
                      <span className="text-sky-300 font-mono font-bold bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded ml-1">
                        {playbook.triggerType}
                      </span>
                      {playbook.triggerValue && (
                        <>
                          <span className="text-slate-500 ml-3">Value:</span>{" "}
                          <span className="text-emerald-400 font-bold ml-1">{playbook.triggerValue}</span>
                        </>
                      )}
                    </div>
                    {playbook.conditionsJson && playbook.conditionsJson !== "{}" && (
                      <div className="truncate">
                        <span className="text-slate-500 font-semibold uppercase">Conditions:</span>{" "}
                        <span className="text-slate-400 font-mono ml-1">{playbook.conditionsJson}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Sequential Steps:</div>
                    {playbook.steps && playbook.steps.length > 0 ? (
                      playbook.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between bg-slate-900 border border-slate-800/50 rounded-xl px-4 py-2.5 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-xs font-bold">
                              {step.stepOrder}
                            </span>
                            <span className="text-white font-medium text-xs">{step.name}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                            {step.actionType}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-xs italic">No steps defined for this playbook.</p>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* TAB 2: EXECUTION HISTORY */}
          {activeTab === "history" && (
            <TableContainer>
              <table className="w-full">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-sm font-semibold">
                  <tr>
                    <th className="p-4 text-center">Run ID</th>
                    <th className="p-4 text-left">Playbook</th>
                    <th className="p-4 text-left">Incident Title</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Progress</th>
                    <th className="p-4 text-left">Triggered By</th>
                    <th className="p-4 text-left">Started At</th>
                    <th className="p-4 text-center">Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {executions.length > 0 ? (
                    executions.map((exec, index) => (
                      <motion.tr
                        key={exec.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="text-slate-300 hover:bg-slate-900/40 transition-all duration-300"
                      >
                        <td className="p-4 text-center font-mono text-slate-500">#{exec.id}</td>
                        <td className="p-4 font-semibold text-white">{exec.playbookName}</td>
                        <td className="p-4">
                          {exec.incidentId ? (
                            <div className="text-sm">
                              {exec.incidentTitle || (
                                <span className="text-slate-500 font-mono text-xs">Incident #{exec.incidentId}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Manual Trigger (No Incident)</span>
                          )}
                        </td>
                        <td className="p-4 text-center flex justify-center mt-1">
                          {getStatusBadge(exec.status)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  exec.status === "FAILED" ? "bg-rose-500" : "bg-sky-500"
                                }`}
                                style={{ width: `${exec.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold">{exec.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{exec.triggeredByName || "System (Auto)"}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">
                          {exec.startedAt ? new Date(exec.startedAt).toLocaleString() : "N/A"}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/playbooks/executions/${exec.id}`)}
                              className="bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-300 outline-none"
                              title="View Execution Details & Logs"
                            >
                              <FaEye className="text-xs" /> View Logs
                            </motion.button>
                            <button
                              disabled={releasedIds.has(exec.id)}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await playbookService.resetSimulation();
                                  setReleasedIds(prev => new Set(prev).add(exec.id));
                                } catch (err) {
                                  console.error("Release error", err);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-300 outline-none ${
                                releasedIds.has(exec.id)
                                  ? "bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                                  : "bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20"
                              }`}
                              title={releasedIds.has(exec.id) ? "Block already released" : "Release IP & User Account Block"}
                            >
                              {releasedIds.has(exec.id) ? "Released" : "Release Block"}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-500">
                        No playbooks have been executed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableContainer>
          )}
        </div>
      </main>

      {/* CREATE PLAYBOOK TEMPLATE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 text-white max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                  ⚙️ Create Automation Playbook
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreatePlaybook} className="overflow-y-auto p-6 space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Playbook Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Critical Malware Quarantine"
                    value={newPlaybook.name}
                    onChange={(e) => setNewPlaybook({ ...newPlaybook, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Description</label>
                  <textarea
                    rows="2"
                    placeholder="Explain the containment flow of the playbook..."
                    value={newPlaybook.description}
                    onChange={(e) => setNewPlaybook({ ...newPlaybook, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Trigger Type *</label>
                    <select
                      value={newPlaybook.triggerType}
                      onChange={(e) => setNewPlaybook({ ...newPlaybook, triggerType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                    >
                      <option value="ALERT_SEVERITY">Alert Severity</option>
                      <option value="ALERT_TYPE">Alert Type</option>
                      <option value="THREAT_DETECTED">Threat Detected</option>
                      <option value="MANUAL">Manual Trigger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Trigger Value *</label>
                    <input
                      type="text"
                      placeholder="e.g., Critical, Brute Force"
                      value={newPlaybook.triggerValue}
                      onChange={(e) => setNewPlaybook({ ...newPlaybook, triggerValue: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-slate-400">Sequential Steps ({newPlaybook.steps.length})</label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300"
                    >
                      + Add Step
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newPlaybook.steps.map((step, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row gap-3 relative"
                      >
                        <div className="flex items-center gap-2 md:w-16">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-xs font-bold">
                            {step.stepOrder}
                          </span>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Step Action Name (e.g. Isolate IP)"
                            value={step.name}
                            onChange={(e) => handleStepChange(index, "name", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 outline-none"
                            required
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={step.actionType}
                              onChange={(e) => handleStepChange(index, "actionType", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:border-sky-400 outline-none"
                            >
                              <option value="ISOLATE_HOST">Isolate Host</option>
                              <option value="BLOCK_IP">Block IP</option>
                              <option value="DISABLE_USER">Disable User</option>
                              <option value="SCAN_VULNERABILITY">Scan Vulnerability</option>
                              <option value="SEND_NOTIFICATION">Send Notification</option>
                              <option value="CREATE_INCIDENT">Create Incident</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Params JSON"
                              value={step.parametersJson}
                              onChange={(e) => handleStepChange(index, "parametersJson", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-sky-400 outline-none font-mono"
                            />
                          </div>
                        </div>

                        {newPlaybook.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(index)}
                            className="text-rose-400 hover:text-rose-300 self-center p-2 rounded-lg border border-slate-800"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all duration-300"
                  >
                    Save Playbook
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PlaybookList;
