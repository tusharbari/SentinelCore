import { useEffect, useState } from "react";
import api from "../services/api";

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
} from "recharts";

import {
  exportThreatsPDF,
  exportThreatsExcel,
  exportAnalyticsReport,
} from "../services/reportService";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/ui/GlassCard";

function Reports() {

  const [threats, setThreats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [iocs, setIOCs] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchThreats();
    fetchAlerts();
    fetchIOCs();
    fetchUsers();
  }, []);

  const fetchThreats = async () => {
    try {
      const response = await api.get("/threats");
      setThreats(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/alerts");
      setAlerts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchIOCs = async () => {
    try {
      const response = await api.get("/ioc");
      setIOCs(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const severityData = [
    {
      name: "Critical",
      value: threats.filter((t) => t.severity === "Critical").length,
    },
    {
      name: "High",
      value: threats.filter((t) => t.severity === "High").length,
    },
    {
      name: "Medium",
      value: threats.filter((t) => t.severity === "Medium").length,
    },
    {
      name: "Low",
      value: threats.filter((t) => t.severity === "Low").length,
    },
  ];

  const COLORS = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
  ];

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">

        <AnimatedBackground />

        <div className="relative z-10 p-8">

          <PageHeader
            title="Reports"
            subtitle="Generate Professional Cyber Security Reports"
          />

          <GlassCard className="p-8 mt-8">

            <h2 className="text-3xl font-bold text-white mb-2">
              Reports Center
            </h2>

            <p className="text-slate-400 mb-10">
              Analyze threats and generate downloadable reports.
            </p>

            {/* Summary Cards */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">

              <div className="bg-slate-800 rounded-2xl p-6 border border-cyan-500/20">

                <h3 className="text-slate-400">
                  Total Threats
                </h3>

                <p className="text-5xl font-bold text-cyan-400 mt-3">
                  {threats.length}
                </p>

              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-red-500/20">

                <h3 className="text-slate-400">
                  Critical Threats
                </h3>

                <p className="text-5xl font-bold text-red-400 mt-3">

                  {
                    threats.filter(
                      (t) => t.severity === "Critical"
                    ).length
                  }

                </p>

              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-yellow-500/20">

                <h3 className="text-slate-400">
                  Alerts
                </h3>

                <p className="text-5xl font-bold text-yellow-400 mt-3">
                  {alerts.length}
                </p>

              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-green-500/20">

                <h3 className="text-slate-400">
                  IOCs
                </h3>

                <p className="text-5xl font-bold text-green-400 mt-3">
                  {iocs.length}
                </p>

              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-violet-500/20">

                <h3 className="text-slate-400">
                  Users
                </h3>

                <p className="text-5xl font-bold text-violet-400 mt-3">
                  {users.length}
                </p>

              </div>

            </div>

            {/* Charts */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">

              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">

                <h2 className="text-2xl font-bold text-white mb-6">
                  Threat Severity
                </h2>

                <ResponsiveContainer width="100%" height={320}>

                  <BarChart data={severityData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#CBD5E1"
                    />

                    <YAxis
                      stroke="#CBD5E1"
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      fill="#06b6d4"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">

                <h2 className="text-2xl font-bold text-white mb-6">
                  Threat Distribution
                </h2>

                <ResponsiveContainer width="100%" height={320}>

                  <PieChart>

                    <Pie
                      data={severityData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={4}
                    >

                      {severityData.map((entry, index) => (

                        <Cell
                          key={index}
                          fill={COLORS[index]}
                        />

                      ))}

                    </Pie>

                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>

              </div>

            </div>

            {/* Export Buttons */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <button
                onClick={() => exportThreatsPDF(threats)}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 font-semibold hover:scale-105 transition"
              >
                📄 Export PDF
              </button>

              <button
                onClick={() => exportThreatsExcel(threats)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 font-semibold hover:scale-105 transition"
              >
                📊 Export Excel
              </button>

              <button
                onClick={() => exportAnalyticsReport(threats)}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 font-semibold hover:scale-105 transition"
              >
                📈 Analytics Report
              </button>

            </div>

          </GlassCard>

        </div>

      </main>

    </>
  );
}

export default Reports;