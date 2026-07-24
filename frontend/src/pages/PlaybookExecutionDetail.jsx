import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaSpinner, FaTerminal, FaClock, FaUser, FaShieldAlt } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";

import playbookService from "../services/playbookService";

function PlaybookExecutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchDetailsAndLogs();

    // Start polling every 2 seconds for live execution updates
    const interval = setInterval(() => {
      fetchDetailsAndLogs(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    // Auto-scroll the terminal to bottom when new logs arrive
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const fetchDetailsAndLogs = async (intervalId = null) => {
    try {
      const details = await playbookService.getExecutionDetails(Number(id));
      const logData = await playbookService.getExecutionLogs(Number(id));

      setExecution(details);
      setLogs(logData);

      // Stop polling when execution reaches final states
      if ((details.status === "SUCCESS" || details.status === "FAILED") && intervalId) {
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error("Failed to fetch execution details/logs", error);
      if (intervalId) clearInterval(intervalId);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS":
        return <FaCheckCircle className="text-emerald-400 text-xl" />;
      case "FAILED":
        return <FaExclamationCircle className="text-rose-400 text-xl" />;
      case "RUNNING":
        return <FaSpinner className="text-sky-400 text-xl animate-spin" />;
      default:
        return <FaClock className="text-slate-500 text-xl" />;
    }
  };

  const getLogColorClass = (level, status) => {
    if (status === "FAILED") return "text-rose-400 font-bold";
    if (status === "SUCCESS") return "text-emerald-400";
    if (level === "WARN") return "text-yellow-400";
    if (level === "ERROR") return "text-rose-500 font-bold";
    return "text-slate-300";
  };

  const [unblocked, setUnblocked] = useState(false);

  const handleReleaseBlock = async () => {
    if (unblocked) return;
    try {
      await playbookService.resetSimulation();
      setUnblocked(true);
    } catch (err) {
      console.error("Failed to release block", err);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 p-8">
          {/* Back Action */}
          <motion.button
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/playbooks")}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-xl transition-all duration-300 outline-none"
          >
            <FaArrowLeft className="text-sky-400" /> Back to Playbooks
          </motion.button>

          {execution && (
            <>
              <div className="flex justify-between items-center mb-6">
                <PageHeader
                  title={`Run #${execution.id}: ${execution.playbookName}`}
                  subtitle={`Triggered on incident ID: #${execution.incidentId || "N/A"}`}
                />
                <div className="flex items-center gap-4">
                  <button
                    disabled={unblocked}
                    onClick={handleReleaseBlock}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all duration-300 ${
                      unblocked 
                        ? "bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed" 
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 cursor-pointer"
                    }`}
                  >
                    {unblocked ? "Released" : "Release Block"}
                  </button>

                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 shadow-lg">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Status</div>
                      <div className="text-sm font-bold text-white tracking-wider">{execution.status}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Progress Summary Card */}
              <GlassCard className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-sky-400">
                      <FaUser />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase">Triggered By</div>
                      <div className="text-white font-bold mt-0.5">{execution.triggeredByName || "System (Automation)"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-sky-400">
                      <FaShieldAlt />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase">Incident Target</div>
                      <div className="text-white font-bold mt-0.5 truncate max-w-[150px]">
                        {execution.incidentTitle || (execution.incidentId ? `Incident #${execution.incidentId}` : "Manual Direct Run")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-sky-400">
                      <FaClock />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-semibold uppercase">Execution Start</div>
                      <div className="text-white font-mono text-xs mt-1">
                        {execution.startedAt ? new Date(execution.startedAt).toLocaleTimeString() : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 font-semibold uppercase mb-2">Overall Completion Progress</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            execution.status === "FAILED" ? "bg-rose-500" : "bg-gradient-to-r from-sky-500 to-emerald-500"
                          }`}
                          style={{ width: `${execution.progress}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white text-sm">{execution.progress}%</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Hacker Terminal Logs and Step Tracking */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Live Console Output Terminal */}
                <div className="xl:col-span-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Console Header */}
                    <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-2 text-sky-400 font-bold">
                        <FaTerminal /> SENTINELCORE RESPONSE AGENT v1.0.0
                      </span>
                      <span>Logs: {logs.length} entries</span>
                    </div>

                    {/* Console Body */}
                    <div className="p-6 h-[400px] overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <div key={log.id} className="flex gap-4 hover:bg-slate-900/30 py-0.5 rounded transition-colors duration-200">
                            <span className="text-slate-600 select-none">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className="text-sky-500 font-semibold min-w-[120px] truncate select-none">
                              [{log.stepName}]
                            </span>
                            <span className={getLogColorClass(log.logLevel, log.status)}>
                              {log.message}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic py-12 text-center">
                          Initializing execution channel, waiting for stdout streaming...
                        </div>
                      )}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>
                </div>

                {/* Current Active Step Checklist */}
                <div>
                  <GlassCard className="p-6 h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Response Action Plan</h4>
                      <div className="space-y-4">
                        <div className="text-xs text-slate-400 mb-2">
                          Executing sequence order steps:
                        </div>
                        
                        {String(execution.playbookName || "").toLowerCase().includes("phishing") ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 1 || execution.status === "SUCCESS" ? "✓" : "1"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 1 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Validate Email format and headers
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 2 || (execution.status === "SUCCESS" && execution.currentStepIndex >= 2) ? "✓" : "2"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 2 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Check Sender Reputation (Blacklists)
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 3 || (execution.status === "SUCCESS" && execution.currentStepIndex >= 3) ? "✓" : "3"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 3 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Scan embedded URLs
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 4 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 4 || (execution.status === "SUCCESS" && execution.currentStepIndex >= 4) ? "✓" : "4"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 4 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Scan attachments (Simulation)
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 5 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 5 || (execution.status === "SUCCESS" && execution.currentStepIndex >= 5) ? "✓" : "5"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 5 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Calculate Risk Score
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 6 || execution.status === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.status === "SUCCESS" ? "✓" : "6"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 6 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Enforce Playbook Decision Rules
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 1 || execution.status === "SUCCESS" ? "✓" : "1"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 1 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Analyze Threat Indicators & Logs
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 2 || (execution.status === "SUCCESS" && execution.currentStepIndex >= 2) ? "✓" : "2"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 2 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Perform Quarantine Isolation Action
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.currentStepIndex > 3 || (execution.status === "SUCCESS" && execution.currentStepIndex >= 3) ? "✓" : "3"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 3 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Notify Administrators / SOC Teams
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                execution.currentStepIndex >= 4 || execution.status === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                              }`}>
                                {execution.status === "SUCCESS" ? "✓" : "4"}
                              </div>
                              <span className={`text-xs ${execution.currentStepIndex === 4 && execution.status === "RUNNING" ? "text-sky-400 font-bold" : "text-slate-300"}`}>
                                Generate Forensic Audit Logs
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-800 text-slate-500 text-[10px]">
                      Halt capability is disabled during automated script containment sequences.
                    </div>
                  </GlassCard>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default PlaybookExecutionDetail;
