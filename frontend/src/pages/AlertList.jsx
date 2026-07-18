import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";

import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import TableContainer from "../components/ui/TableContainer";

function AlertList() {

    const navigate = useNavigate();

    const [alerts, setAlerts] = useState([]);

    const [search, setSearch] = useState("");

    const [severityFilter, setSeverityFilter] = useState("All");

    useEffect(() => {

        fetchAlerts();

    }, []);

    const fetchAlerts = async () => {

        try {

            const response = await api.get("/alerts");

            setAlerts(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    const deleteAlert = async (id) => {

        if (!window.confirm("Delete this alert?"))
            return;

        try {

            await api.delete(`/alerts/${id}`);

            fetchAlerts();

        } catch (error) {

            console.log(error);

            alert("Failed to Delete Alert");

        }

    };

    const filteredAlerts = alerts.filter((alert) => {

        const matchesSearch =
            alert.title.toLowerCase().includes(search.toLowerCase()) ||
            alert.source.toLowerCase().includes(search.toLowerCase());

        const matchesSeverity =
            severityFilter === "All" ||
            alert.severity === severityFilter;

        return matchesSearch && matchesSeverity;

    });

    const getSeverityBadge = (severity) => {

        switch (severity) {

            case "Critical":
                return "bg-red-500/20 text-red-400 border border-red-500/30";

            case "High":
                return "bg-orange-500/20 text-orange-400 border border-orange-500/30";

            case "Medium":
                return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";

            case "Low":
                return "bg-green-500/20 text-green-400 border border-green-500/30";

            default:
                return "bg-slate-700 text-white";

        }

    };

    const getStatusBadge = (status) => {

        switch (status) {

            case "Open":
                return "bg-blue-500/20 text-blue-400";

            case "Investigating":
                return "bg-yellow-500/20 text-yellow-300";

            case "Resolved":
                return "bg-green-500/20 text-green-400";

            default:
                return "bg-slate-700 text-white";

        }

    };

    return (<>
    <Navbar />
    <Sidebar />

    <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">

        <AnimatedBackground />

        <div className="relative z-10 p-8">

            <PageHeader
                title="Alert Management"
                subtitle="Monitor and manage security alerts"
            />

            {/* Search & Filter */}

            <GlassCard className="p-6 mb-8">

                <div className="flex flex-col lg:flex-row gap-5">

                    <input
                        type="text"
                        placeholder="🔍 Search Alert..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
                            flex-1
                            bg-slate-800
                            border
                            border-slate-700
                            rounded-xl
                            px-5
                            py-3
                            text-white
                            placeholder:text-slate-500
                            focus:border-cyan-400
                            focus:ring-2
                            focus:ring-cyan-500/30
                            outline-none
                        "
                    />

                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="
                            w-full
                            lg:w-60
                            bg-slate-800
                            border
                            border-slate-700
                            rounded-xl
                            px-5
                            py-3
                            text-white
                            focus:border-cyan-400
                            outline-none
                        "
                    >
                        <option value="All">All Severity</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                </div>

            </GlassCard>

            {/* Alert Table */}

            <TableContainer>

                <table className="w-full">

                    <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider">

                        <tr>

                            <th className="p-4">ID</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Severity</th>
                            <th className="p-4">Source</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredAlerts.length > 0 ? (

                            filteredAlerts.map((alert, index) => (

                                <motion.tr

                                    key={alert.id}

                                    initial={{ opacity: 0, y: 20 }}

                                    animate={{ opacity: 1, y: 0 }}

                                    transition={{
                                        delay: index * 0.05,
                                    }}

                                    className="
                                        border-b
                                        border-slate-800
                                        text-center
                                        text-slate-300
                                        hover:bg-slate-800/40
                                        transition-all
                                        duration-300
                                    "

                                >

                                    <td className="p-4">

                                        {alert.id}

                                    </td>

                                    <td className="p-4 font-semibold text-white">

                                        {alert.title}

                                    </td>

                                    <td className="p-4">

                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityBadge(alert.severity)}`}
                                        >
                                            {alert.severity}
                                        </span>

                                    </td>

                                    <td className="p-4">

                                        {alert.source}

                                    </td>

                                    <td className="p-4">

                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(alert.status)}`}
                                        >
                                            {alert.status}
                                        </span>

                                    </td>

                                    <td className="p-4 max-w-xs truncate">

                                        {alert.description}

                                    </td>

                                    <td className="p-4">

                                        <button
                                            onClick={() =>
                                                navigate(`/edit-alert/${alert.id}`)
                                            }
                                            className="
                                                px-4
                                                py-2
                                                rounded-xl
                                                bg-gradient-to-r
                                                from-blue-600
                                                to-cyan-500
                                                text-white
                                                mr-3
                                                hover:scale-105
                                                transition
                                            "
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                deleteAlert(alert.id)
                                            }
                                            className="
                                                px-4
                                                py-2
                                                rounded-xl
                                                bg-gradient-to-r
                                                from-red-600
                                                to-red-500
                                                text-white
                                                hover:scale-105
                                                transition
                                            "
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </motion.tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="7"
                                    className="py-12 text-center text-slate-500"
                                >
                                    No Alerts Found
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </TableContainer>

        </div>

    </main>

</>
);

}

export default AlertList;