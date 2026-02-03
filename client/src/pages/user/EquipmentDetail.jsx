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
import useAuthStore from "../../store/auth-store";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();

  const [equipment, setEquipment] = useState(location.state?.equipment || null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(!equipment);

  const loadEquipmentData = useCallback(async () => {
    try {
      const res = await axios.get(`/api/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Standard Header */}
      <div className="bg-[#193C6C] px-4 py-4 flex items-center shadow-sm sticky top-0 z-10 -mx-4 md:-mx-6 mb-6">
        <button
          onClick={() => navigate("/user")}
          className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          Equipment Details
        </span>
      </div>

      {/* Equipment Info Card */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Equipment Image/Icon Area */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
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
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === "info"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
                }`}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
                }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === "specs"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
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
                  <MapPin className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{equipment?.room?.roomNumber}</p>
                    <p className="text-sm text-gray-500">
                      {equipment?.room?.building} • Floor{" "}
                      {equipment?.room?.floor}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Serial Number</p>
                    <p className="font-medium">
                      {equipment?.serialNo || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Last Maintenance</p>
                    <p className="font-medium">
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
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTicketStatusIcon(ticket.status)}
                          <span className="font-medium text-sm">
                            #{String(ticket.id).padStart(4, "0")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {dayjs(ticket.createdAt).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        {ticket.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{ticket.category?.name}</span>
                        <span className="capitalize">
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="mx-auto mb-2 text-gray-300" size={48} />
                    <p className="text-sm">No maintenance history</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specs" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Type</p>
                    <p className="font-medium">{equipment?.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Brand</p>
                    <p className="font-medium">{equipment?.brand || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Model</p>
                    <p className="font-medium">{equipment?.model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Year</p>
                    <p className="font-medium">{equipment?.year || "N/A"}</p>
                  </div>
                </div>

                {equipment?.specifications && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">
                      Additional Specs
                    </p>
                    <p className="text-sm text-gray-700">
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
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            View Quick Fix Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;
