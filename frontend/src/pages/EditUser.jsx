import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import api from "../services/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";

import GlassCard from "../components/ui/GlassCard";
import PageHeader from "../components/ui/PageHeader";
import FormSection from "../components/ui/FormSection";
import ModernInput from "../components/ui/ModernInput";
import ModernSelect from "../components/ui/ModernSelect";
import PrimaryButton from "../components/ui/PrimaryButton";

function EditUser() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: {
        id: "",
    },
    enabled: true,
});

    useEffect(() => {

        loadUser();

    }, []);

    const loadUser = async () => {

    try {

        const response = await api.get(`/users/${id}`);

        setUser({
            ...response.data,
            password: "",
        });

    } catch (error) {

        console.log(error);

        alert("Failed to load user");

    }

};
const updateUser = async () => {

    try {

        await api.put(`/users/${id}`, user);

        alert("User Updated Successfully");

        navigate("/users");

    } catch (error) {

        console.log(error.response?.data);

        alert("Failed to update user");

    }

};

    return (<>
    <Navbar />
    <Sidebar />

    <main className="ml-64 mt-16 min-h-screen bg-slate-950 relative overflow-hidden">

        <AnimatedBackground />

        <div className="relative z-10 p-8">

            <PageHeader
                title="Edit User"
                subtitle="Update user information and permissions"
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >

                <GlassCard className="max-w-5xl mx-auto p-10">

                    <FormSection>

                        <ModernInput
                            label="Full Name"
                            placeholder="Enter full name"
                            value={user.name}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    name: e.target.value,
                                })
                            }
                        />

                        <ModernInput
                            label="Email Address"
                            type="email"
                            placeholder="Enter email"
                            value={user.email}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    email: e.target.value,
                                })
                            }
                        />

                        <ModernInput
                            label="New Password (Optional)"
                            type="password"
                            placeholder="Leave blank to keep current password"
                            value={user.password}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    password: e.target.value,
                                })
                            }
                        />

                        <ModernSelect
                            label="Role"
                            value={user.role?.id || ""}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    role: {
                                        id: Number(e.target.value),
                                    },
                                })
                            }
                            options={[
                                { value: 1, label: "ADMIN" },
                                { value: 2, label: "ANALYST" },
                            ]}
                        />

                        <ModernSelect
                            label="Account Status"
                            value={user.enabled ? "Active" : "Disabled"}
                            onChange={(e) =>
                                setUser({
                                    ...user,
                                    enabled: e.target.value === "Active",
                                })
                            }
                            options={[
                                "Active",
                                "Disabled",
                            ]}
                        />

                    </FormSection>

                    <div className="flex justify-end gap-4 mt-10">

                        <PrimaryButton
                            onClick={() => navigate("/users")}
                            className="
                                bg-slate-700
                                hover:bg-slate-600
                                text-white
                            "
                        >
                            Cancel
                        </PrimaryButton>

                        <PrimaryButton
                            onClick={updateUser}
                            className="
                                bg-gradient-to-r
                                from-cyan-600
                                via-blue-600
                                to-indigo-600
                                hover:from-cyan-500
                                hover:to-indigo-500
                                text-white
                                shadow-xl
                            "
                        >
                            💾 Update User
                        </PrimaryButton>

                    </div>

                </GlassCard>

            </motion.div>

        </div>

    </main>

</>
);

}

export default EditUser;