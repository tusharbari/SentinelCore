import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";

import PageHeader from "../components/ui/PageHeader";
import GlassCard from "../components/ui/GlassCard";
import TableContainer from "../components/ui/TableContainer";

function UserList() {

    const navigate = useNavigate();

    const [users, setUsers] = useState([]);

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] = useState("All");

    useEffect(() => {

        fetchUsers();

    }, []);

    const fetchUsers = async () => {

        try {

            const response = await api.get("/users");

            setUsers(response.data);

        } catch (error) {

            console.error(error);

            alert("Failed to load users.");

        }

    };

    const deleteUser = async (id) => {

        if (!window.confirm("Delete this user?"))
            return;

        try {

            await api.delete(`/users/${id}`);

            fetchUsers();

        } catch (error) {

            console.error(error);

            alert("Failed to delete user.");

        }

    };

    const filteredUsers = users.filter((user) => {

        const matchesSearch =
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());

        const matchesRole =
            roleFilter === "All" ||
            user.role?.name === roleFilter;

        return matchesSearch && matchesRole;

    });

    const getRoleBadge = (role) => {

        switch (role) {

            case "ADMIN":
                return "bg-red-500/20 text-red-400 border border-red-500/30";

            case "ANALYST":
                return "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30";

            case "USER":
                return "bg-blue-500/20 text-blue-400 border border-blue-500/30";

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
                title="User Management"
                subtitle="Manage users, roles and permissions"
            />

            {/* Search & Controls */}

            <GlassCard className="p-6 mb-8">

                <div className="flex flex-col lg:flex-row gap-5">

                    <input
                        type="text"
                        placeholder="🔍 Search user..."
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
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="
                            w-full
                            lg:w-52
                            bg-slate-800
                            border
                            border-slate-700
                            rounded-xl
                            px-5
                            py-3
                            text-white
                            outline-none
                            focus:border-cyan-400
                        "
                    >
                        <option value="All">All Roles</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="USER">USER</option>
                    </select>

                    <button
                        onClick={() => navigate("/add-user")}
                        className="
                            px-6
                            py-3
                            rounded-xl
                            bg-gradient-to-r
                            from-emerald-600
                            to-cyan-600
                            text-white
                            font-semibold
                            hover:scale-105
                            transition
                            shadow-xl
                        "
                    >
                        ➕ Add User
                    </button>

                </div>

            </GlassCard>

            {/* Users Table */}

            <TableContainer>

                <table className="w-full">

                    <thead className="bg-slate-950 text-slate-300 uppercase tracking-wider">

                        <tr>

                            <th className="p-4">User</th>

                            <th className="p-4">Email</th>

                            <th className="p-4">Role</th>

                            <th className="p-4">Status</th>

                            <th className="p-4">Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredUsers.length > 0 ? (

                            filteredUsers.map((user, index) => (

                                <motion.tr

                                    key={user.id}

                                    initial={{
                                        opacity: 0,
                                        y: 20,
                                    }}

                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}

                                    transition={{
                                        delay: index * 0.05,
                                    }}

                                    className="
                                        border-b
                                        border-slate-800
                                        hover:bg-slate-800/40
                                        transition-all
                                    "

                                >

                                    {/* Avatar + Name */}

                                    <td className="p-5">

                                        <div className="flex items-center gap-4">

                                            <div
                                                className="
                                                    w-12
                                                    h-12
                                                    rounded-full
                                                    bg-gradient-to-r
                                                    from-cyan-500
                                                    to-blue-600
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-white
                                                    font-bold
                                                    text-lg
                                                "
                                            >
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>

                                            <div>

                                                <p className="text-white font-semibold">

                                                    {user.name}

                                                </p>

                                                <p className="text-slate-500 text-sm">

                                                    ID #{user.id}

                                                </p>

                                            </div>

                                        </div>

                                    </td>

                                    {/* Email */}

                                    <td className="p-5 text-slate-300">

                                        {user.email}

                                    </td>

                                    {/* Role */}

                                    <td className="p-5">

                                        <span
                                            className={`
                                                px-4
                                                py-2
                                                rounded-full
                                                text-sm
                                                font-semibold
                                                ${getRoleBadge(user.role?.name)}
                                            `}
                                        >
                                            {user.role?.name}
                                        </span>

                                    </td>

                                    {/* Status */}

                                    <td className="p-5">

                                        {user.enabled ? (

                                            <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 font-semibold">

                                                Active

                                            </span>

                                        ) : (

                                            <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 font-semibold">

                                                Disabled

                                            </span>

                                        )}

                                    </td>

                                    {/* Actions */}

                                    <td className="p-5">

                                        <button
                                            onClick={() =>
                                                navigate(`/edit-user/${user.id}`)
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
                                                deleteUser(user.id)
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
                                    colSpan="5"
                                    className="py-12 text-center text-slate-500"
                                >
                                    No Users Found
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

export default UserList;