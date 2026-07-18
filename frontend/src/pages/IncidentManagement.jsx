import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaExclamationTriangle,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaUserShield,
  FaListAlt,
  FaSearch,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaCheck,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/ui/GlassCard";
import api from "../services/api";

const workflow = [
  "Triage incoming alerts and assign owners",
  "Contain the threat and isolate impacted assets",
  "Document evidence and confirm recovery",
];

function SlaTimer({ deadline, status }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft("No SLA");
      return;
    }

    if (status === "RESOLVED" || status === "CLOSED") {
      setTimeLeft("Stopped");
      return;
    }

    const calculateTime = () => {
      const now = new Date();
      const target = new Date(deadline);
      const diff = target - now;

      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft("SLA BREACHED");
        return;
      }

      setIsBreached(false);
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (num) => String(num).padStart(2, "0");
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [deadline, status]);

  if (!deadline) {
    return <span className="text-slate-500">—</span>;
  }

  if (status === "RESOLVED" || status === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
        <FaClock className="text-emerald-500" /> SLA Met
      </span>
    );
  }

  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/20 animate-pulse">
        <FaClock className="text-rose-400" /> BREACHED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400">
      <FaClock className="text-cyan-500 shrink-0" /> {timeLeft}
    </span>
  );
}

function IncidentManagement() {
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
  title: "",
  description: "",
  severity: "High",
  priority: "P3",
  status: "OPEN",
  assignedTo: "",
});
  const [editingId, setEditingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const filteredIncidents = incidents.filter((incident) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      (incident.title || "").toLowerCase().includes(query) ||
      (incident.description || "").toLowerCase().includes(query) ||
      String(incident.id).includes(query) ||
      (incident.severity || "").toLowerCase().includes(query) ||
      (incident.status || "").toLowerCase().includes(query) ||
      (incident.assignedTo?.name || "").toLowerCase().includes(query) ||
      (incident.assignedTo?.username || "").toLowerCase().includes(query)
    );
  });

  const fetchIncidents = async () => {
  try {
    const response = await api.get("/incidents");

    console.log("Incidents:", response.data);   // <-- Add this

    setIncidents(response.data || []);
  } catch (err) {
    console.error("Failed to fetch incidents", err);
    setError("Unable to load incidents from the backend right now.");
  } finally {
    setLoading(false);
  }
};

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get("/audit");
      setAuditLogs(response.data || []);
    } catch (err) {
      console.error("Failed to sync audit timeline context", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data || []);
    } catch (err) {
      console.error("Failed to load users context", err);
    }
  };

  // Safe Isolated Mount: Runs exactly once when the component builds
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchIncidents();
      fetchAuditLogs();
      fetchUsers();
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionMessage("");

    try {
      const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    severity: form.severity,
    priority: form.priority,
    status: form.status,
    assignedTo: form.assignedTo
        ? Number(form.assignedTo)
        : null,
};

      if (!payload.title || !payload.description) {
        setActionMessage("Please provide both a title and description.");
        return;
      }

      if (editingId) {
        await api.put(`/incidents/${editingId}`, payload);
        setActionMessage("Incident updated successfully.");
      } else {
        await api.post("/incidents", payload);
        setActionMessage("Incident created successfully.");
      }

      setForm({
    title:"",
    description:"",
    severity:"High",
    priority:"P3",
    status:"OPEN",
    assignedTo:""
});
      setEditingId(null);
      
      // Concurrently update grids without cascading side-effects
      fetchIncidents();
      fetchAuditLogs();
    } catch (err) {
      console.error("Incident action failed", err);
      setActionMessage("The incident action could not be completed.");
    }
  };

  const handleEdit = (incident) => {
    setEditingId(incident.id);
    setForm({
    title: incident.title || "",
    description: incident.description || "",
    severity: incident.severity || "High",
    priority: incident.priority || "P3",
    status: incident.status || "OPEN",
    assignedTo: incident.assignedTo?.id
        ? String(incident.assignedTo.id)
        : "",
});
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token"); 

      await api.delete(`/incidents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setActionMessage("Incident deleted successfully.");
      
      fetchIncidents();
      fetchAuditLogs();
    } catch (err) {
      console.error("Incident delete failed", err);
      const message = err?.response?.data?.message || err?.message || "The incident could not be deleted.";
      setActionMessage(`Delete failed: ${message}`);
    }
  };

  const handleEscalate = async (id) => {
  try {
    await api.put(`/incidents/${id}/escalate`);
    setActionMessage("Incident escalated successfully.");
    fetchIncidents();
    fetchAuditLogs();
  } catch (err) {
    console.error(err);
    setActionMessage("Failed to escalate incident.");
  }
};
const handleResolve = async(id)=>{

    await api.put(`/incidents/${id}/resolve`);

    fetchIncidents();

    fetchAuditLogs();

}

  const handleStatusTransition = async (incident, newStatus) => {
    try {
      setActionMessage("");
      const payload = {
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        priority: incident.priority,
        status: newStatus,
        assignedTo: incident.assignedTo?.id || null,
      };
      await api.put(`/incidents/${incident.id}`, payload);
      setActionMessage(`Incident #${incident.id} status updated to ${newStatus}.`);
      fetchIncidents();
      fetchAuditLogs();
    } catch (err) {
      console.error("Failed to transition status", err);
      setActionMessage(err.response?.data?.message || "Failed to update status.");
    }
  };

  // Safe Inline Filtering Calculations
  const openIncidents = incidents.filter((incident) => {
    const status = (incident.status || "").toUpperCase();
    return ["OPEN", "IN_PROGRESS", "INVESTIGATING", "PENDING"].includes(status);
  }).length;

  const containedIncidents = incidents.filter((incident) => {
    const status = (incident.status || "").toUpperCase();
    return ["RESOLVED", "CLOSED", "CONTAINED"].includes(status);
  }).length;

  const activeAnalysts = incidents.filter((incident) => incident.assignedTo?.username || incident.assignedTo?.name).length;
  const criticalIncidents = incidents.filter((incident) => (incident.priority || "").toUpperCase() === "P1").length;

  const metrics = [
    {
      title: "Open Incidents",
      value: openIncidents,
      change: "Currently active",
      icon: <FaExclamationTriangle className="text-red-400" />,
      accent: "border-red-500/20 text-red-300",
    },
    {
      title: "Contained",
      value: containedIncidents,
      change: "Resolved or closed",
      icon: <FaShieldAlt className="text-emerald-400" />,
      accent: "border-emerald-500/20 text-emerald-300",
    },
    {
      title: "Synced Records",
      value: incidents.length,
      change: "Live from backend",
      icon: <FaClock className="text-cyan-400" />,
      accent: "border-cyan-500/20 text-cyan-300",
    },
    {
      title: "Active Analysts",
      value: activeAnalysts,
      change: "Assigned owners",
      icon: <FaUserShield className="text-violet-400" />,
      accent: "border-violet-500/20 text-violet-300",
    },
  ];

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 p-8">
          <PageHeader
            title="Incident Management"
            subtitle="Coordinate response playbooks, monitor critical incidents, and keep the SOC aligned."
          />
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
  {metrics.map((item, index) => (
    <motion.div
      key={item.title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <GlassCard className={`p-6 border ${item.accent}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{item.title}</p>
            <p className="text-3xl font-bold text-white mt-2">
              {item.value}
            </p>
          </div>
          <div className="text-2xl">{item.icon}</div>
        </div>
        <p className="text-sm mt-4 text-slate-400">{item.change}</p>
      </GlassCard>
    </motion.div>
  ))}
</div>
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-8 items-start">
            <GlassCard className="p-6 min-w-0">
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Active Incident Queue</h2>
                  <p className="text-slate-400 mt-1">Priority items requiring immediate analyst attention.</p>
                </div>
                <div className="rounded-full bg-rose-500/15 border border-rose-400/20 px-3 py-1 text-sm text-rose-300">
                  {criticalIncidents} P1 incidents
                </div>
              </div>

              {actionMessage ? (
                <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-300">
                  {actionMessage}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Incident title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


<select
    value={form.severity}
    onChange={(e)=>setForm({...form,severity:e.target.value})}
    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
>
    <option value="Critical">Critical</option>
    <option value="High">High</option>
    <option value="Medium">Medium</option>
    <option value="Low">Low</option>
</select>

<select
    value={form.priority}
    onChange={(e)=>setForm({...form,priority:e.target.value})}
    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
>
    <option value="P1">P1 - Critical</option>
    <option value="P2">P2 - High</option>
    <option value="P3">P3 - Medium</option>
    <option value="P4">P4 - Low</option>
</select>

</div>
                </div>
                <textarea
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  rows="3"
                  placeholder="Incident description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  {users.length > 0 ? (
                    <select
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      value={form.assignedTo || ""}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    >
                      <option value="">Select Analyst (Unassigned)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.username || u.email} ({u.role?.name ? u.role.name.replace("ROLE_", "") : "ANALYST"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      placeholder="Assigned user ID"
                      value={form.assignedTo || ""}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    />
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
                    {editingId ? "Update Incident" : "Add Incident"}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm({
title:"",
description:"",
severity:"High",
priority:"P3",
status:"OPEN",
assignedTo:""
})
                      }}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              {/* Search Bar & View Mode Toggle */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search incidents by ID, title, severity, assignee, status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 pl-10 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                  />
                  <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
                </div>
                <div className="flex rounded-xl border border-slate-800 bg-slate-900/60 p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      viewMode === "table"
                        ? "bg-cyan-500 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FaList size={11} /> List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      viewMode === "kanban"
                        ? "bg-cyan-500 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FaThLarge size={11} /> Kanban
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
                  Loading incidents from the backend...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
                  {error}
                </div>
              ) : incidents.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
                  No incidents were returned by the backend yet.
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
                  No incidents match your search query "{searchQuery}".
                </div>
              ) : viewMode === "table" ? (
                <div className="max-h-[550px] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-800 no-scrollbar">
                  <table className="w-full min-w-[950px] text-left text-sm">
                    <thead className="bg-slate-800/80 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-center">Incident</th>
                        <th className="px-4 py-3 text-center">Severity</th>
                        <th className="px-4 py-3 text-center">Owner</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Priority</th>
                        <th className="px-4 py-3 text-center">Escalated</th>
                        <th className="px-4 py-3 text-center">SLA</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map((incident) => (
                        <motion.tr
                          key={incident.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.4)" }}
                          className="border-t border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-colors duration-300"
                        >
                          <td className="px-4 py-3 text-center">
                            <p className="font-semibold text-white">{incident.title}</p>
                            <p className="text-slate-400 text-xs mt-1">#{incident.id}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                              incident.severity?.toUpperCase() === "CRITICAL"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : incident.severity?.toUpperCase() === "HIGH"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : incident.severity?.toUpperCase() === "MEDIUM"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                incident.severity?.toUpperCase() === "CRITICAL"
                                  ? "bg-rose-400 animate-pulse"
                                  : incident.severity?.toUpperCase() === "HIGH"
                                  ? "bg-amber-400"
                                  : incident.severity?.toUpperCase() === "MEDIUM"
                                  ? "bg-cyan-400"
                                  : "bg-emerald-400"
                              }`} />
                              {incident.severity || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-center">
                            {incident.assignedTo?.name || incident.assignedTo?.username || "Unassigned"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                              incident.status === "CLOSED"
                                ? "bg-slate-800 text-slate-400 border-slate-700/50"
                                : incident.status === "RESOLVED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : incident.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            }`}>
                              {incident.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2.5 py-1 text-xs font-semibold">
                              {incident.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                                incident.escalated
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                                  : "bg-slate-800 text-slate-400 border-slate-700/50"
                              }`}
                            >
                              {incident.escalated ? "ESCALATED" : "NORMAL"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-center">
                            <SlaTimer deadline={incident.slaDeadline} status={incident.status} />
                          </td>                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <div className="relative group">
                                <button
                                  onClick={() => handleEdit(incident)}
                                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-300 hover:bg-cyan-500 hover:text-white transition-all duration-300 cursor-pointer"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                  Edit Incident
                                </span>
                              </div>

                              <div className="relative group">
                                <button
                                  onClick={() => handleDelete(incident.id)}
                                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500 hover:text-white transition-all duration-300 cursor-pointer"
                                >
                                  <FaTrash size={12} />
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                  Delete Incident
                                </span>
                              </div>

                              <div className="relative group">
                                <button
                                  type="button"
                                  disabled={incident.escalated}
                                  onClick={() => handleEscalate(incident.id)}
                                  className={`rounded-lg p-2 transition-all duration-300 ${
                                    incident.escalated
                                      ? "bg-slate-800 text-slate-600 border border-slate-700/30 cursor-not-allowed"
                                      : "border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500 hover:text-white cursor-pointer"
                                  }`}
                                >
                                  <FaArrowUp size={12} />
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                  {incident.escalated ? "Already Escalated" : "Escalate Incident"}
                                </span>
                              </div>

                              <div className="relative group">
                                <button
                                  type="button"
                                  disabled={incident.status === "RESOLVED"}
                                  onClick={() => handleResolve(incident.id)}
                                  className={`rounded-lg p-2 transition-all duration-300 ${
                                    incident.status === "RESOLVED"
                                      ? "bg-slate-800 text-slate-600 border border-slate-700/30 cursor-not-allowed"
                                      : "border border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500 hover:text-white cursor-pointer"
                                  }`}
                                >
                                  <FaCheck size={12} />
                                </button>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                  {incident.status === "RESOLVED" ? "Already Resolved" : "Resolve Incident"}
                                </span>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {[
                    { key: "OPEN", label: "Open", border: "border-sky-500/25", bg: "bg-sky-950/15", text: "text-sky-400", badgeBg: "bg-sky-500/10 text-sky-400" },
                    { key: "IN_PROGRESS", label: "In Progress", border: "border-amber-500/25", bg: "bg-amber-950/15", text: "text-amber-400", badgeBg: "bg-amber-500/10 text-amber-400" },
                    { key: "RESOLVED", label: "Resolved", border: "border-emerald-500/25", bg: "bg-emerald-950/15", text: "text-emerald-400", badgeBg: "bg-emerald-500/10 text-emerald-400" },
                    { key: "CLOSED", label: "Closed", border: "border-slate-800/50", bg: "bg-slate-900/5", text: "text-slate-400", badgeBg: "bg-slate-800 text-slate-400" }
                  ].map((status) => {
                    const cards = filteredIncidents.filter((incident) => incident.status === status.key);
                    return (
                      <div key={status.key} className={`rounded-2xl border ${status.border} ${status.bg} p-4 space-y-4 flex-shrink-0 w-[290px]`}>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <h3 className={`font-bold text-sm ${status.text}`}>{status.label}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.badgeBg}`}>
                            {cards.length}
                          </span>
                        </div>
                        
                        <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                          {cards.length === 0 ? (
                            <p className="text-slate-500 text-xs py-8 text-center italic">No incidents</p>
                          ) : (
                            cards.map((incident) => (
                              <motion.div
                                key={incident.id}
                                whileHover={{ y: -3, borderColor: "rgba(6, 182, 212, 0.4)" }}
                                className="rounded-xl border border-slate-800/80 bg-slate-950/90 p-3.5 space-y-3 transition-all duration-300 shadow-lg shadow-black/20"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-slate-500 text-[10px] font-mono">#{incident.id}</span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                                    incident.severity?.toUpperCase() === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                    incident.severity?.toUpperCase() === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  }`}>
                                    {incident.severity}
                                  </span>
                                </div>
                                
                                <div>
                                  <h4 className="font-bold text-white text-sm line-clamp-1">{incident.title}</h4>
                                  <p className="text-slate-400 text-[11px] line-clamp-2 mt-1">{incident.description}</p>
                                </div>

                                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60">
                                  <span className="text-slate-400 text-[10px]">Owner: <strong className="text-slate-300">{incident.assignedTo?.name || incident.assignedTo?.username || "Unassigned"}</strong></span>
                                  <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 text-[9px] font-semibold">
                                    {incident.priority}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                  <SlaTimer deadline={incident.slaDeadline} status={incident.status} />
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                                    incident.escalated ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-800 text-slate-500 border-slate-700/50"
                                  }`}>
                                    {incident.escalated ? "ESCALATED" : "NORMAL"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                                  <div>
                                    {incident.status === "OPEN" && (
                                      <button
                                        onClick={() => handleStatusTransition(incident, "IN_PROGRESS")}
                                        className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-1 text-[10px] font-semibold text-sky-400 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"
                                      >
                                        Start Work
                                      </button>
                                    )}
                                    {incident.status === "IN_PROGRESS" && (
                                      <button
                                        onClick={() => handleResolve(incident.id)}
                                        className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                                      >
                                        Resolve
                                      </button>
                                    )}
                                    {incident.status === "RESOLVED" && (
                                      <button
                                        onClick={() => handleStatusTransition(incident, "CLOSED")}
                                        className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                                      >
                                        Close
                                      </button>
                                    )}
                                    {incident.status === "CLOSED" && (
                                      <span className="text-slate-500 text-[10px] italic">Closed</span>
                                    )}
                                  </div>

                                  <div className="flex gap-1">
                                    <div className="relative group">
                                      <button
                                        onClick={() => handleEdit(incident)}
                                        className="rounded border border-cyan-500/30 bg-cyan-500/10 p-1 text-cyan-300 hover:bg-cyan-500 hover:text-white transition-all cursor-pointer"
                                      >
                                        <FaEdit size={10} />
                                      </button>
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                        Edit
                                      </span>
                                    </div>

                                    <div className="relative group">
                                      <button
                                        onClick={() => handleDelete(incident.id)}
                                        className="rounded border border-rose-500/30 bg-rose-500/10 p-1 text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                                      >
                                        <FaTrash size={10} />
                                      </button>
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                        Delete
                                      </span>
                                    </div>

                                    <div className="relative group">
                                      <button
                                        type="button"
                                        disabled={incident.escalated}
                                        onClick={() => handleEscalate(incident.id)}
                                        className={`rounded p-1 transition-all ${
                                          incident.escalated
                                            ? "bg-slate-800 text-slate-600 border border-slate-700/30 cursor-not-allowed"
                                            : "border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500 hover:text-white cursor-pointer"
                                        }`}
                                      >
                                        <FaArrowUp size={10} />
                                      </button>
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200 bg-slate-950/95 border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-lg shadow-black/40">
                                        {incident.escalated ? "Escalated" : "Escalate"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            <div className="space-y-8">
              {/* Live Security Audit Log Widget */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaListAlt className="text-cyan-400 text-xl" />
                  <h3 className="text-xl font-semibold text-white">Live System Timeline</h3>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
                  {auditLogs.length === 0 ? (
                    <div className="text-slate-500 text-sm py-2">No system activities tracked yet.</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            log.action === "DELETE" ? "bg-rose-500/15 text-rose-300" :
                            log.action === "CREATE" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-slate-500">
                            {log.timestamp ? log.timestamp.split("T")[1]?.substring(0, 8) : "00:00:00"}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-normal">{log.description}</p>
                        {log.user && (
                          <p className="text-slate-500 text-[10px] mt-1.5 flex items-center gap-1">
                            <FaUserShield className="text-slate-600" /> Analyst: {log.user.name || log.user.email || log.user.username}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaCheckCircle className="text-emerald-400 text-xl" />
                  <h3 className="text-xl font-semibold text-white">Response Workflow</h3>
                </div>
                <div className="space-y-3">
                  {workflow.map((step, index) => (
                    <div key={step} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-800/60 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-300">
                        {index + 1}
                      </div>
                      <p className="text-slate-300 text-sm self-center">{step}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default IncidentManagement;