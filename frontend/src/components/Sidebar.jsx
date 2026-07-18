import {
  FaUsers,
  FaHome,
  FaShieldAlt,
  FaPlusCircle,
  FaExclamationTriangle,
  FaSearch,
  FaFileAlt,
  FaCog,
  FaList,
  FaBell,
  FaCircle,
  FaBug,
} from "react-icons/fa";

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { getCurrentRole } from "../services/auth";

function Sidebar() {

  const navigate = useNavigate();
  const location = useLocation();

  const role = getCurrentRole();

  const menu = [
    {
      title: "Dashboard",
      icon: <FaHome />,
      path: "/dashboard",
    },
     {
      title: "Add Threat",
      icon: <FaPlusCircle />,
      path: "/add-threat",
      roles: ["ADMIN", "ANALYST"],
    },
    {
      title: "Threat List",
      icon: <FaShieldAlt />,
      path: "/threat-list",
    },
   
    {
      title: "Add IOC",
      icon: <FaSearch />,
      path: "/add-ioc",
      roles: ["ADMIN", "ANALYST"],
    },
    {
      title: "IOC List",
      icon: <FaList />,
      path: "/ioc-list",
    },
    {
      title: "Add Alert",
      icon: <FaBell />,
      path: "/add-alert",
      roles: ["ADMIN", "ANALYST"],
    },
    {
      title: "Alert List",
      icon: <FaExclamationTriangle />,
      path: "/alert-list",
    },
    {
      title: "Vulnerabilities",
      icon: <FaBug />,
      path: "/vulnerabilities",
    },
    {
      title: "Users",
      icon: <FaUsers />,
      path: "/users",
      roles: ["ADMIN"],
    },
    {
      title: "Reports",
      icon: <FaFileAlt />,
      path: "/reports",
    },
  ];

  return (
    <aside
      className="
        fixed
        left-0
        top-16
        w-64
        h-[calc(100vh-4rem)]
        bg-slate-950/95
        backdrop-blur-xl
        border-r
        border-white/10
        text-white
        flex
        flex-col
        overflow-y-auto
        scrollbar-thin
        scrollbar-thumb-slate-700
        scrollbar-track-transparent
        z-40
      "
    >

      {/* Logo */}

      <div className="p-8 border-b border-white/10">

        <h1 className="text-3xl font-bold text-sky-400">
          🛡 SentinelCore
        </h1>

        <p className="text-slate-400 text-sm mt-2">
          Role-based security operations
        </p>

      </div>

      {/* Menu */}

      <div className="flex-1 mt-5 px-3 pb-6">

        {menu.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {

          const active = location.pathname === item.path;

          return (

            <motion.div
              key={item.title}
              whileHover={{ x: 6 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center
                gap-4
                px-4
                py-3
                rounded-2xl
                cursor-pointer
                mb-2
                transition-all
                duration-300

                ${
                  active
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                    : "hover:bg-slate-800 text-slate-300"
                }
              `}
            >

              <span className="text-lg">
                {item.icon}
              </span>

              <span className="font-medium">
                {item.title}
              </span>

            </motion.div>

          );
        })}

      </div>

      {/* Footer */}

      <div className="mt-auto p-6 border-t border-white/10">

        <div className="flex items-center gap-2 text-emerald-400">

          <FaCircle className="text-xs animate-pulse" />

          <span className="text-sm">
            System Online
          </span>

        </div>

        <p className="text-slate-500 text-xs mt-3">
          Signed in as: {role}
        </p>

      </div>

    </aside>
  );
}

export default Sidebar;
