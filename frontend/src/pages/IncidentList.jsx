import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaTrash, FaPlus, FaTimes, FaShieldAlt } from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import TableContainer from "../components/ui/TableContainer";

import incidentService from "../services/incidentService";
import playbookService from "../services/playbookService";
import api from "../services/api";
import { getCurrentRole } from "../services/auth";

const getEditDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const wordsMatchFuzzy = (w1, w2) => {
  if (w1 === w2) return true;
  if (w1.startsWith(w2) || w2.startsWith(w1)) return true;
  const len1 = w1.length;
  const len2 = w2.length;
  const dist = getEditDistance(w1, w2);
  if (len1 >= 7 && len2 >= 7 && dist <= 2) return true;
  if (len1 >= 5 && len2 >= 5 && dist <= 1) return true;
  return false;
};
const getPlaybookRelation = (playbook, incident) => {
  if (!playbook || !incident) return "NONE";

  const pbName = String(playbook.name || "").toLowerCase();

  const stopWords = new Set(["response", "playbook", "mitigation", "containment", "detection", "automation", "remediation", "and", "or", "the", "on", "for", "action", "plan", "incident", "suspect"]);
  const getCleanWords = (text) => {
    return String(text || "")
      .toLowerCase()
      .split(/[\s_\-]+/)
      .map(word => word.replace(/[^a-z0-9]/g, ""))
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  const incWords = getCleanWords(incident.title).concat(getCleanWords(incident.description));

  const isVulnIncident = incWords.some(w => wordsMatchFuzzy("vulnerability", w)) || incWords.some(w => wordsMatchFuzzy("scan", w));
  const isMalwareIncident = incWords.some(w => wordsMatchFuzzy("malware", w));
  const isBruteForceIncident = incWords.some(w => wordsMatchFuzzy("brute", w));
  const isPrivEscIncident = incWords.some(w => wordsMatchFuzzy("privilege", w));

  const isVulnPlaybook = pbName.includes("vulnerability") || pbName.includes("scan");
  const isMalwarePlaybook = pbName.includes("malware");
  const isBruteForcePlaybook = pbName.includes("brute");
  const isPrivEscPlaybook = pbName.includes("privilege");

  // Recommended matching
  if (isMalwareIncident && isMalwarePlaybook) return "RECOMMENDED";
  if (isBruteForceIncident && isBruteForcePlaybook) return "RECOMMENDED";
  if (isPrivEscIncident && isPrivEscPlaybook) return "RECOMMENDED";
  if (isVulnIncident && isVulnPlaybook && !isMalwareIncident && !isBruteForceIncident && !isPrivEscIncident) {
    return "RECOMMENDED";
  }

  // Secondary matching (Vulnerability scan is secondary for Malware, Brute Force, and Privilege Escalation)
  if (isVulnPlaybook && (isMalwareIncident || isBruteForceIncident || isPrivEscIncident)) {
    return "SECONDARY";
  }

  return "NONE";
};

const isPlaybookRelevant = (playbook, incident) => {
  if (!playbook || !incident) return false;
  if (playbook.triggerType === "MANUAL") return true;

  const relation = getPlaybookRelation(playbook, incident);
  if (relation === "RECOMMENDED" || relation === "SECONDARY") {
    return true;
  }

  if (playbook.triggerType === "ALERT_SEVERITY" && 
      playbook.triggerValue && 
      incident.severity?.toLowerCase() === playbook.triggerValue.toLowerCase()) {
    return true;
  }

  if (playbook.triggerValue && (
      incident.title?.toLowerCase().includes(playbook.triggerValue.toLowerCase()) ||
      (incident.description && incident.description.toLowerCase().includes(playbook.triggerValue.toLowerCase()))
  )) {
    return true;
  }

  // Dynamic name keyword match with fuzzy matching
  const stopWords = new Set(["response", "playbook", "mitigation", "containment", "detection", "automation", "remediation", "and", "or", "the", "on", "for", "action", "plan", "incident", "suspect"]);
  
  const getCleanWords = (text) => {
    return String(text || "")
      .toLowerCase()
      .split(/[\s_\-]+/)
      .map(word => word.replace(/[^a-z0-9]/g, ""))
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  const pbKeywords = getCleanWords(playbook.name);
  const incWords = getCleanWords(incident.title).concat(getCleanWords(incident.description));

  for (const w1 of pbKeywords) {
    for (const w2 of incWords) {
      if (wordsMatchFuzzy(w1, w2)) {
        return true;
      }
    }
  }

  return false;
};
function IncidentList() {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const canWrite = ["ADMIN", "ANALYST"].includes(role);
  const isAdmin = role === "ADMIN";

  const [incidents, setIncidents] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [users, setUsers] = useState([]);

  // Search and filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create Incident Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "Medium",
    status: "Open",
    source: "Manual",
    assignedToId: "",
  });

  // Run Playbook Modal State
  const [isPlaybookModalOpen, setIsPlaybookModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState("");
  const [isTriggering, setIsTriggering] = useState(false);

  const currentPlaybook = playbooks.find((p) => String(p.id) === String(selectedPlaybookId));
  const isCurrentPlaybookRelevant = currentPlaybook ? isPlaybookRelevant(currentPlaybook, selectedIncident) : true;

  useEffect(() => {
    fetchIncidents();
    fetchPlaybooks();
    fetchUsers();
  }, []);

  const fetchIncidents = async () => {
    try {
      const data = await incidentService.getIncidents();
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents", error);
    }
  };

  const fetchPlaybooks = async () => {
    try {
      const data = await playbookService.getPlaybooks();
      // Only list active playbooks
      setPlaybooks(data.filter((p) => p.isActive));
    } catch (error) {
      console.error("Failed to load playbooks", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this incident ticket?")) return;
    try {
      await incidentService.deleteIncident(id);
      fetchIncidents();
    } catch (error) {
      console.error("Failed to delete incident", error);
      alert("Error deleting incident ticket.");
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newIncident,
        assignedToId: newIncident.assignedToId ? Number(newIncident.assignedToId) : null,
      };
      await incidentService.createIncident(payload);
      setIsCreateModalOpen(false);
      setNewIncident({
        title: "",
        description: "",
        severity: "Medium",
        status: "Open",
        source: "Manual",
        assignedToId: "",
      });
      fetchIncidents();
    } catch (error) {
      console.error("Failed to create incident", error);
      alert("Error creating incident ticket. Please check fields.");
    }
  };

  const openPlaybookModal = (incident) => {
    setSelectedIncident(incident);
    setIsPlaybookModalOpen(true);
    const relevant = playbooks.filter((p) => isPlaybookRelevant(p, incident));
    const recommended = relevant.filter((p) => getPlaybookRelation(p, incident) === "RECOMMENDED");
    const secondary = relevant.filter((p) => getPlaybookRelation(p, incident) === "SECONDARY");

    if (recommended.length > 0) {
      setSelectedPlaybookId(recommended[0].id);
    } else if (secondary.length > 0) {
      setSelectedPlaybookId(secondary[0].id);
    } else if (relevant.length > 0) {
      setSelectedPlaybookId(relevant[0].id);
    } else {
      setSelectedPlaybookId("");
    }
  };

  const handleTriggerPlaybook = async () => {
    if (!selectedPlaybookId || !selectedIncident) return;
    
    if (currentPlaybook && !isPlaybookRelevant(currentPlaybook, selectedIncident)) {
      alert("Please select the relevant playbook for this incident.");
      return;
    }

    setIsTriggering(true);
    try {
      const execution = await playbookService.triggerPlaybook(
        Number(selectedPlaybookId),
        selectedIncident.id
      );
      setIsPlaybookModalOpen(false);
      // Redirect to execution details terminal view
      navigate(`/playbooks/executions/${execution.id}`);
    } catch (error) {
      console.error("Failed to trigger playbook", error);
      alert("Failed to run playbook: " + (error.response?.data?.message || error.message));
    } finally {
      setIsTriggering(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      (inc.description && inc.description.toLowerCase().includes(search.toLowerCase())) ||
      inc.source.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === "All" || inc.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical": return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "High": return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "Low": return "bg-green-500/20 text-green-400 border border-green-500/30";
      default: return "bg-slate-700 text-white";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open": return "bg-sky-500/20 text-sky-400 border border-sky-500/30";
      case "Investigating": return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
      case "Resolved": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "Closed": return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
      default: return "bg-slate-700 text-white";
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
              title="Incident Management"
              subtitle="Track security alerts, assign task responsibilities, and launch response workflows."
            />
            {canWrite && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-sky-500/25 transition-all duration-300"
              >
                <FaPlus className="text-sm" /> Create Incident
              </motion.button>
            )}
          </div>

          {/* Search & Filters */}
          <GlassCard className="p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="🔍 Search Incident by title, source, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all duration-300"
              />

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-sky-400 outline-none transition-all duration-300"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-sky-400 outline-none transition-all duration-300"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </GlassCard>

          {/* Incidents Table */}
          <TableContainer>
            <table className="w-full">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-sm font-semibold">
                <tr>
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4 text-left">Incident Title</th>
                  <th className="p-4 text-center">Severity</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-left">Source</th>
                  <th className="p-4 text-left">Assignee</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((incident, index) => (
                    <motion.tr
                      key={incident.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="text-slate-300 hover:bg-slate-900/40 transition-all duration-300"
                    >
                      <td className="p-4 text-center text-slate-500 font-mono">#{incident.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{incident.title}</div>
                        <div className="text-slate-500 text-xs mt-0.5 line-clamp-1 max-w-sm">
                          {incident.description || "No description provided."}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{incident.source}</td>
                      <td className="p-4">
                        {incident.assignedToName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold uppercase">
                              {incident.assignedToName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{incident.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {canWrite && (() => {
                            const isClosedOrResolved = incident.status === "Resolved" || incident.status === "Closed";
                            return (
                              <motion.button
                                whileHover={isClosedOrResolved ? {} : { scale: 1.05 }}
                                whileTap={isClosedOrResolved ? {} : { scale: 0.95 }}
                                disabled={isClosedOrResolved}
                                onClick={() => !isClosedOrResolved && openPlaybookModal(incident)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                                  isClosedOrResolved
                                    ? "bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50"
                                    : "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20"
                                }`}
                                title={isClosedOrResolved ? `Cannot run playbook on a ${incident.status.toLowerCase()} incident` : "Run Playbook"}
                              >
                                <FaPlay className="text-[10px]" /> Run Playbook
                              </motion.button>
                            );
                          })()}
                          {isAdmin && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(incident.id)}
                              className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg transition-all duration-300"
                            >
                              <FaTrash className="text-xs" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-500">
                      No security incidents found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableContainer>
        </div>
      </main>

      {/* CREATE INCIDENT TICKET MODAL */}
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
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 text-white"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                  🛡️ Create Security Incident
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Compromised Employee Account login"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Provide details about the security incident..."
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Severity *</label>
                    <select
                      value={newIncident.severity}
                      onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Status *</label>
                    <select
                      value={newIncident.status}
                      onChange={(e) => setNewIncident({ ...newIncident, status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Source *</label>
                    <input
                      type="text"
                      required
                      value={newIncident.source}
                      onChange={(e) => setNewIncident({ ...newIncident, source: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Assign User</label>
                    <select
                      value={newIncident.assignedToId}
                      onChange={(e) => setNewIncident({ ...newIncident, assignedToId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-sky-400 outline-none"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role?.name || "No Role"})
                        </option>
                      ))}
                    </select>
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
                    Create Ticket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHOOSE PLAYBOOK TO RUN MODAL */}
      <AnimatePresence>
        {isPlaybookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlaybookModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 text-white"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <FaShieldAlt className="text-lg animate-pulse" /> Launch Response Playbook
                </h3>
                <button
                  onClick={() => setIsPlaybookModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-400">
                  Select a containment or mitigation playbook to execute for:
                  <strong className="block text-white mt-1 text-base">"{selectedIncident?.title}"</strong>
                </p>

                {(() => {
                  const relevantPlaybooks = playbooks.filter((p) => isPlaybookRelevant(p, selectedIncident));
                  const recommendedPlaybooks = relevantPlaybooks.filter((p) => getPlaybookRelation(p, selectedIncident) === "RECOMMENDED");
                  const secondaryPlaybooks = relevantPlaybooks.filter((p) => getPlaybookRelation(p, selectedIncident) === "SECONDARY");

                  if (relevantPlaybooks.length > 0) {
                    const currentRelation = currentPlaybook ? getPlaybookRelation(currentPlaybook, selectedIncident) : "NONE";
                    return (
                      <div>
                        <label className="block text-sm font-semibold text-slate-400 mb-1.5">Choose Playbook</label>
                        <select
                          value={selectedPlaybookId}
                          onChange={(e) => setSelectedPlaybookId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-400 outline-none"
                        >
                          {recommendedPlaybooks.length > 0 && (
                            <optgroup label="Recommended Suggestions">
                              {recommendedPlaybooks.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {secondaryPlaybooks.length > 0 && (
                            <optgroup label="Secondary Suggestions">
                              {secondaryPlaybooks.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {relevantPlaybooks.filter(p => getPlaybookRelation(p, selectedIncident) === "NONE").map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        {currentRelation === "SECONDARY" && (
                          <div className="mt-2.5 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex items-start gap-1.5 font-medium leading-relaxed">
                            <span>[Warning]</span>
                            <span><strong>Secondary suggestion selected:</strong> Running this playbook will execute assessment/scans and partially resolve the incident to 70% progress.</span>
                          </div>
                        )}

                        <div className="mt-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-500">
                          <strong>Trigger rule:</strong>{" "}
                          {currentPlaybook?.triggerType}{" "}
                          = {currentPlaybook?.triggerValue || "None"}.
                          <p className="mt-1 text-slate-400">
                            {currentPlaybook?.description}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 p-4">
                        No relevant containment playbooks found for this incident's severity or threat type.
                      </div>
                    );
                  }
                })()}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPlaybookModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      isTriggering || 
                      playbooks.length === 0 || 
                      playbooks.filter((p) => isPlaybookRelevant(p, selectedIncident)).length === 0 || 
                      !isCurrentPlaybookRelevant
                    }
                    onClick={handleTriggerPlaybook}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isTriggering ? "Triggering..." : "Execute Playbook"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default IncidentList;
