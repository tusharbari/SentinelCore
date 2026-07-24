import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import api from "../services/api";

import {
  FaBug,
  FaExclamationTriangle,
  FaBell,
  FaCheckCircle,
} from "react-icons/fa";

function DashboardCards() {
  const [stats, setStats] = useState({
    totalThreats: 0,
    criticalThreats: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
  });

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const cards = [
    {
      title: "Total Threats",
      value: stats.totalThreats,
      icon: <FaBug />,
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      glow: "hover:shadow-red-500/40",
    },
    {
      title: "Critical Threats",
      value: stats.criticalThreats,
      icon: <FaExclamationTriangle />,
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      glow: "hover:shadow-orange-500/40",
    },
    {
      title: "Total Alerts",
      value: stats.totalAlerts,
      icon: <FaBell />,
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      glow: "hover:shadow-blue-500/40",
    },
    {
      title: "Critical Alerts",
      value: stats.criticalAlerts,
      icon: <FaCheckCircle />,
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      glow: "hover:shadow-green-500/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card, index) => (

        <div
          key={index}
          className="
            relative
            overflow-hidden
            rounded-3xl
            p-6
            backdrop-blur-xl
            bg-white/5
            border border-white/10
            shadow-2xl
            transition-all
            duration-500
          "
        >

          {/* Icon */}

          <div
            className={`
              relative
              w-16
              h-16
              rounded-2xl
              flex
              items-center
              justify-center
              text-3xl
              ${card.iconBg}
              ${card.iconColor}
            `}
          >
            {card.icon}
          </div>

          {/* Title */}

          <p className="relative mt-6 text-slate-400 text-lg">
            {card.title}
          </p>

          {/* Number */}

          <h1 className="relative mt-2 text-5xl font-bold text-white">
            {card.value}
          </h1>

          {/* Live Badge */}

          <div className="relative mt-5 flex items-center gap-2">

            <div className="w-3 h-3 rounded-full bg-emerald-400" />

            <span className="text-sm text-emerald-400">
              Live Data
            </span>

          </div>

        </div>

      ))}

    </div>
  );
}

export default DashboardCards;