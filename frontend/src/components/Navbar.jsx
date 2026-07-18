import { FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Navbar() {

    const navigate = useNavigate();

    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        localStorage.removeItem("isLoggedIn");

        navigate("/");

    };

    return (

        <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-lg z-50">

            <h1 className="text-2xl font-bold text-cyan-400">
                SentinelCore
            </h1>

            <div className="flex items-center gap-6">

                <FaBell
                    className="text-2xl cursor-pointer hover:text-cyan-400 transition"
                />

                <div className="flex items-center gap-3">

                    <FaUserCircle className="text-3xl text-cyan-400" />

                    <div>

                        <p className="text-sm font-semibold">
                            {email}
                        </p>

                        <span
                            className={`text-xs px-2 py-1 rounded-full font-bold ${
                                role === "ADMIN"
                                    ? "bg-red-600 text-white"
                                    : "bg-blue-600 text-white"
                            }`}
                        >
                            {role}
                        </span>

                    </div>

                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
                >
                    <FaSignOutAlt />
                    Logout
                </button>

            </div>

        </nav>

    );

}

export default Navbar;