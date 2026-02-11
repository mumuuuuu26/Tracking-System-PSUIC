import React, { useState, useEffect, useCallback } from "react";
import { getPermissions, updatePermissions } from "../../api/permission";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import { ArrowLeft, Check, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Permission = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState("admin"); // Default to first role in list usually, but admin/it_support common
    const [permissions, setPermissions] = useState({
        viewTickets: false,
        editTickets: false,
        assignIT: false,
        manageUsers: false,
        manageEquipment: false
    });


    const roles = [
        { id: "admin", label: "Admin" },
        { id: "it_support", label: "IT Staff" },
        { id: "user", label: "User" }
    ];

    const loadPermissions = useCallback(async (role) => {

        try {
            const res = await getPermissions(token, role);
            if (res.data) {
                setPermissions({
                    viewTickets: res.data.viewTickets,
                    editTickets: res.data.editTickets,
                    assignIT: res.data.assignIT,
                    manageUsers: res.data.manageUsers,
                    manageEquipment: res.data.manageEquipment
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load permissions");
        }
    }, [token]);

    useEffect(() => {
        loadPermissions(selectedRole);
    }, [selectedRole, loadPermissions]);

    const handleToggle = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        try {
            await updatePermissions(token, selectedRole, permissions);
            toast.success("Permissions updated successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update permissions");
        }
    };

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
                {/* Header Card */}
                <AdminHeader
                    title="Permission Management"
                    subtitle="Manage roles and access control"
                    onBack={() => navigate(-1)}
                />

                {/* Role Selector */}
                <div className="bg-white rounded-3xl p-8 shadow-sm mb-8">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full border-2 border-gray-300"></div> Select Role to Configure
                    </label>

                    <div className="flex bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 relative">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${selectedRole === role.id
                                    ? "text-[#1e2e4a] shadow-sm bg-white ring-1 ring-black/5"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                                    }`}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Groups */}
                <div className="space-y-8">
                    {/* Ticket Management */}
                    <div>
                        <h2 className="text-xs font-bold text-[#1e2e4a] uppercase mb-4 tracking-widest pl-1">
                            Ticket Management
                        </h2>
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            <ToggleItem
                                label="View tickets"
                                desc="Allow access to read ticket details"
                                checked={permissions.viewTickets}
                                onChange={() => handleToggle('viewTickets')}
                            />
                            <ToggleItem
                                label="Edit tickets"
                                desc="Allow editing ticket status and details"
                                checked={permissions.editTickets}
                                onChange={() => handleToggle('editTickets')}
                            />
                            <ToggleItem
                                label="Assign IT personnel"
                                desc="Allow assigning tickets to staff"
                                checked={permissions.assignIT}
                                onChange={() => handleToggle('assignIT')}
                            />
                        </div>
                    </div>

                    {/* System Administration */}
                    <div>
                        <h2 className="text-xs font-bold text-[#1e2e4a] uppercase mb-4 tracking-widest pl-1">
                            System Administration
                        </h2>
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            <ToggleItem
                                label="Manage users"
                                desc="Create, edit, or delete accounts"
                                checked={permissions.manageUsers}
                                onChange={() => handleToggle('manageUsers')}
                                disabled={selectedRole === 'admin'} // Example safety: prevent removing admin's own access if needed
                            />
                            <ToggleItem
                                label="Manage equipment"
                                desc="Add or edit equipment inventory"
                                checked={permissions.manageEquipment}
                                onChange={() => handleToggle('manageEquipment')}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center gap-4 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            className="w-40 py-2.5 bg-[#1e2e4a] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-[#15325b] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Save
                        </button>
                        <button
                            onClick={() => loadPermissions(selectedRole)}
                            className="w-40 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </AdminWrapper >
    );
};

const ToggleItem = ({ label, desc, checked, onChange, disabled }) => (
    <div className={`p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
            <h3 className="text-base font-bold text-gray-800">{label}</h3>
            {desc && <p className="text-xs text-slate-400 font-medium mt-1">{desc}</p>}
        </div>
        <button
            onClick={onChange}
            className={`w-14 h-8 rounded-full transition-all duration-300 relative focus:outline-none focus:ring-4 focus:ring-[#1e2e4a]/10 ${checked ? "bg-[#1e2e4a]" : "bg-gray-200"
                }`}
        >
            <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${checked ? "translate-x-6" : ""
                    }`}
            />
        </button>
    </div>
);

export default Permission;
