// client/src/pages/user/EquipmentDetail.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Monitor,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getEquipment } from "../../api/equipment";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [equipment, setEquipment] = useState(location.state?.equipment || null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(!equipment);

  const loadEquipmentData = useCallback(async () => {
    try {
      const res = await getEquipment(id);
      setEquipment(res.data);
    } catch {
      // Silent fail — equipment may load from location state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!equipment) {
      loadEquipmentData();
    }
  }, [id, equipment, loadEquipmentData]);



  const getTicketStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-500" size={16} />;
      case "in_progress":
        return <Clock className="text-blue-500" size={16} />;
      case "not_start":
        return <AlertCircle className="text-yellow-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] text-gray-900 dark:text-white">
      {/* Header */}
      {/* Standard Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0d1b2a] px-5 py-4 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-none border-b border-transparent dark:border-b-white/10 rounded-b-[2rem] sticky top-0 z-10 -mx-4 md:-mx-6 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-bold text-white absolute left-1/2 -translate-x-1/2 tracking-wide">
          Equipment Details
        </h1>
      </div>

      {/* Equipment Info Card */}
      <div className="p-4">
        <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-200 dark:border-blue-800/30 transition-colors">
          {/* Equipment Image/Icon Area */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-[#193C6C] dark:to-[#15325A] p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Monitor size={48} className="text-white/80" />
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${equipment?.status === "Normal"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                  }`}
              >
                {equipment?.status || "Normal"}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{equipment?.name}</h2>
            <p className="text-blue-100 text-sm">{equipment?.type}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-blue-800/30">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === "info"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === "specs"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
                }`}
            >
              Specifications
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "info" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-gray-400 dark:text-blue-400/60 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-blue-300/80">Location</p>
                    <p className="font-medium text-gray-900 dark:text-white">{equipment?.room?.roomNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-blue-400/60">
                      {equipment?.room?.building} • Floor{" "}
                      {equipment?.room?.floor}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="text-gray-400 dark:text-blue-400/60 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-blue-300/80">Serial Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {equipment?.serialNo || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 dark:text-blue-400/60 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-blue-300/80">Last Maintenance</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {equipment?.lastMaintenance
                        ? dayjs(equipment.lastMaintenance).format("DD MMM YYYY")
                        : "No record"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3">
                {equipment?.tickets && equipment.tickets.length > 0 ? (
                  equipment.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-blue-700/50 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-blue-800/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTicketStatusIcon(ticket.status)}
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            #{String(ticket.id).padStart(4, "0")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-blue-400/60">
                          {dayjs(ticket.createdAt).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-blue-200 mb-1">
                        {ticket.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-blue-400/60">
                        <span>{ticket.category?.name}</span>
                        <span className="capitalize">
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-blue-400/60">
                    <Clock className="mx-auto mb-2 text-gray-300 dark:text-blue-800" size={48} />
                    <p className="text-sm">No maintenance history</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specs" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-blue-300/80 mb-1">Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">{equipment?.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-blue-300/80 mb-1">Brand</p>
                    <p className="font-medium text-gray-900 dark:text-white">{equipment?.brand || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-blue-300/80 mb-1">Model</p>
                    <p className="font-medium text-gray-900 dark:text-white">{equipment?.model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-blue-300/80 mb-1">Year</p>
                    <p className="font-medium text-gray-900 dark:text-white">{equipment?.year || "N/A"}</p>
                  </div>
                </div>

                {equipment?.specifications && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-blue-700/50">
                    <p className="text-sm text-gray-600 dark:text-blue-300/80 mb-2">
                      Additional Specs
                    </p>
                    <p className="text-sm text-gray-700 dark:text-blue-200">
                      {equipment.specifications}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-3">
          <button
            onClick={() =>
              navigate("/user/create-ticket", {
                state: {
                  equipmentId: equipment?.id,
                  equipmentName: equipment?.name,
                  roomId: equipment?.roomId,
                  roomNumber: equipment?.room?.roomNumber,
                },
              })
            }
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Report Issue
          </button>

          <button
            onClick={() =>
              navigate("/user/quick-fix", {
                state: { equipmentType: equipment?.type },
              })
            }
            className="w-full bg-gray-100 dark:bg-[#1a2f4e] text-gray-700 dark:text-blue-300 border border-transparent dark:border-blue-700/50 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#1e3558] transition"
          >
            View Quick Fix Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;
