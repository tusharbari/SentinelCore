import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaExclamationTriangle, FaCheckCircle, FaSpinner, FaEye, FaPlusCircle, FaEnvelope, FaShieldAlt } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import TableContainer from "../components/ui/TableContainer";

import api from "../services/api";
import playbookService from "../services/playbookService";

function PhishingAlertList() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("All");

  // Create Mock Phishing Alert Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [mockAlert, setMockAlert] = useState({
    emailSender: "attacker@secure-login.net",
    emailRecipient: "billing@acme.com",
    emailSubject: "ACTION REQUIRED: Update Payment Details Immediately",
    emailBody: "Dear Customer, your corporate bank account has been suspended. Please click here to login: http://secure-login.net/banking and update your details to restore access.",
    emailUrls: "http://secure-login.net/banking",
    emailAttachments: "statement_pdf.zip, update.exe",
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const alertResponse = await api.get("/alerts");
      // Filter only phishing alerts
      const phishAlerts = alertResponse.data.filter(
        (a) =>
          a.source === "Phishing Simulator" ||
          a.source === "Email Gateway" ||
          a.title.toLowerCase().includes("phishing")
      );
      setAlerts(phishAlerts);

      const execResponse = await playbookService.getExecutionHistory();
      setExecutions(execResponse);
    } catch (error) {
      console.error("Failed to fetch phishing alerts/executions", error);
    }
  };

  const handleCreateMockAlert = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: "Suspicious Phishing Email: " + mockAlert.emailSubject,
        severity: "Critical",
        source: "Email Gateway",
        description: "Phishing alert triggered automatically for investigation. Sender: " + mockAlert.emailSender,
        emailSender: mockAlert.emailSender,
        emailRecipient: mockAlert.emailRecipient,
        emailSubject: mockAlert.emailSubject,
        emailBody: mockAlert.emailBody,
        emailUrls: mockAlert.emailUrls,
        emailAttachments: mockAlert.emailAttachments,
        status: "Open",
      };

      await api.post("/alerts", payload);
      setIsOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create mock phishing alert", err);
    }
  };

  const getPlaybookStatus = (alertId) => {
    const run = executions.find((e) => e.alertId === alertId);
    if (!run) return { status: "NOT TRIGGERED", progress: 0, id: null };
    return { status: run.status, progress: run.progress, id: run.id };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
        return <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">✓ Success</span>;
      case "FAILED":
        return <span className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">✗ Failed</span>;
      case "RUNNING":
        return <span className="flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse"><FaSpinner className="animate-spin" /> Running</span>;
      case "PENDING":
        return <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">Pending</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700/80 px-2.5 py-1 rounded-full text-[10px] font-bold">Not Run</span>;
    }
  };

  const filtered = alerts.filter((a) => {
    const matchesSearch =
      a.emailSender?.toLowerCase().includes(search.toLowerCase()) ||
      a.emailSubject?.toLowerCase().includes(search.toLowerCase()) ||
      a.title?.toLowerCase().includes(search.toLowerCase());

    const matchesVerdict =
      verdictFilter === "All" ||
      (verdictFilter === "Malicious" && a.verdict === "MALICIOUS") ||
      (verdictFilter === "Safe" && a.verdict === "SAFE") ||
      (verdictFilter === "Scanning" && !a.verdict);

    return matchesSearch && matchesVerdict;
  });

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden flex flex-col">
        <AnimatedBackground />

        <div className="relative z-10 p-8 flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <PageHeader
              title="Phishing Email Alerts"
              subtitle="Monitor incoming mail gateways, check forensics risk logs, and watch automation contain threats."
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-rose-500/20 transition cursor-pointer text-xs"
            >
              <FaPlusCircle /> Simulate Phishing Inbound
            </motion.button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search sender, subject, alert..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-sky-500 transition-all outline-none"
            />
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-sky-500 outline-none min-w-[150px]"
            >
              <option value="All">All Verdicts</option>
              <option value="Malicious">Malicious</option>
              <option value="Safe">Safe</option>
              <option value="Scanning">In Analysis</option>
            </select>
          </div>

          {/* Table */}
          <TableContainer>
            <table className="w-full">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-xs font-bold">
                <tr>
                  <th className="p-4 text-left">Sender / Recipient</th>
                  <th className="p-4 text-left">Email Subject</th>
                  <th className="p-4 text-center">Verdict</th>
                  <th className="p-4 text-center">Risk Score</th>
                  <th className="p-4 text-center">Auto-Playbook Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs">
                {filtered.length > 0 ? (
                  filtered.map((alert, idx) => {
                    const playStatus = getPlaybookStatus(alert.id);
                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="text-slate-300 hover:bg-slate-900/40 transition duration-300"
                      >
                        <td className="p-4">
                          <div className="font-bold text-white max-w-[200px] truncate">{alert.emailSender}</div>
                          <div className="text-[10px] text-slate-500 max-w-[200px] truncate">To: {alert.emailRecipient}</div>
                        </td>
                        <td className="p-4 font-semibold text-white max-w-[250px] truncate">
                          {alert.emailSubject || "No subject provided"}
                        </td>
                        <td className="p-4 text-center">
                          {alert.verdict === "MALICIOUS" ? (
                            <span className="inline-flex items-center gap-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Malicious
                            </span>
                          ) : alert.verdict === "SAFE" ? (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Safe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                              Scanning
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-sm">
                          {alert.riskScore !== null ? (
                            <span className={alert.riskScore >= 50 ? "text-rose-400" : "text-emerald-400"}>
                              {alert.riskScore}/100
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            {getStatusBadge(playStatus.status)}
                            {playStatus.id && (
                              <div className="w-16 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-900">
                                <div className="bg-sky-500 h-full" style={{ width: `${playStatus.progress}%` }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {playStatus.id ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/playbooks/executions/${playStatus.id}`)}
                              className="bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                            >
                              <FaEye /> View Steps
                            </motion.button>
                          ) : (
                            <span className="text-slate-600 italic">No execution</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-500 italic">
                      No phishing alerts found in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>
        </div>
      </main>

      {/* Mock Inbound Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 text-white max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
                  <FaEnvelope className="text-rose-500" /> Simulate Gateway Phishing Inbound
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateMockAlert} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sender *</label>
                  <input
                    type="text"
                    required
                    value={mockAlert.emailSender}
                    onChange={(e) => setMockAlert({ ...mockAlert, emailSender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Recipient *</label>
                  <input
                    type="text"
                    required
                    value={mockAlert.emailRecipient}
                    onChange={(e) => setMockAlert({ ...mockAlert, emailRecipient: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={mockAlert.emailSubject}
                    onChange={(e) => setMockAlert({ ...mockAlert, emailSubject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Body *</label>
                  <textarea
                    rows="3"
                    required
                    value={mockAlert.emailBody}
                    onChange={(e) => setMockAlert({ ...mockAlert, emailBody: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-sky-500 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">URLs</label>
                  <input
                    type="text"
                    value={mockAlert.emailUrls}
                    onChange={(e) => setMockAlert({ ...mockAlert, emailUrls: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-sky-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Attachments</label>
                  <input
                    type="text"
                    value={mockAlert.emailAttachments}
                    onChange={(e) => setMockAlert({ ...mockAlert, emailAttachments: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-sky-500 outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Inject Inbound Alert
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

export default PhishingAlertList;
