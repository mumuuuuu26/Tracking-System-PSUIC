// MyTasks.jsx - Enhanced Version
import React, { useEffect, useState } from "react";
import { getMyTasks, acceptJob, closeJob } from "../../api/it";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  Bell,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const MyTasks = () => {
  const { token, user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    urgent: 0,
    pending: 0,
    inProgress: 0,
    todaySchedule: [],
  });
  const [selectedTab, setSelectedTab] = useState("new");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTasks();
    loadSchedule();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await getMyTasks(token);
      setTasks(res.data);

      // คำนวณสถิติ
      setStats((prev) => ({
        ...prev,
        urgent: res.data.filter(
          (t) => t.urgency === "High" || t.urgency === "Critical"
        ).length,
        pending: res.data.filter((t) => t.status === "pending").length,
        inProgress: res.data.filter((t) => t.status === "in_progress").length,
      }));
    } catch (err) {
      console.log(err);
    }
  };

  const loadSchedule = async () => {
    try {
      const res = await axios.get("/api/it/schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats((prev) => ({ ...prev, todaySchedule: res.data }));
    } catch (err) {
      console.log(err);
    }
  };

  const handleAcceptTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setShowAcceptModal(true);
  };

  const confirmAccept = async () => {
    try {
      await acceptJob(token, selectedTicket.id);
      toast.success("Ticket Accepted!");
      setShowAcceptModal(false);
      loadTasks();
    } catch (err) {
      toast.error("Failed to accept ticket");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍🔧</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hello!</p>
              <h1 className="text-xl font-bold">IT Support</h1>
            </div>
          </div>
          <button className="relative p-2">
            <Bell size={24} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-4 text-white mb-4">
          <h3 className="text-sm opacity-90 mb-1">Your today's ticket</h3>
          <p className="text-lg font-semibold mb-3">almost done!</p>

          {/* Circular Progress */}
          <div className="flex items-center justify-between">
            <button className="bg-white text-blue-500 px-4 py-2 rounded-lg text-sm font-semibold">
              View Tickets
            </button>
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  opacity="0.3"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 30 * 0.85} ${
                    2 * Math.PI * 30 * 0.15
                  }`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                85%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <p className="text-lg font-bold text-gray-800">{stats.urgent}</p>
            <p className="text-xs text-gray-600">Urgent</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Clock className="text-orange-500" size={20} />
            </div>
            <p className="text-lg font-bold text-gray-800">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="text-blue-500" size={20} />
            </div>
            <p className="text-lg font-bold text-gray-800">
              {stats.inProgress}
            </p>
            <p className="text-xs text-gray-600">In progress</p>
          </div>
        </div>
      </div>

      {/* Other Services */}
      <div className="px-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Other Services</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedTab("new")}
            className="bg-green-50 rounded-xl p-4 flex flex-col items-center relative"
          >
            {tasks.filter((t) => t.status === "pending").length > 0 && (
              <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                New
              </span>
            )}
            <div className="w-10 h-10 bg-green-100 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-xs text-gray-700">New Tickets</p>
          </button>

          <button
            onClick={() => setSelectedTab("all")}
            className="bg-blue-50 rounded-xl p-4 flex flex-col items-center"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg mb-2 flex items-center justify-center">
              <Users className="text-blue-500" size={20} />
            </div>
            <p className="text-xs text-gray-700">All Tickets</p>
          </button>

          <button
            onClick={() => navigate("/it/schedule")}
            className="bg-purple-50 rounded-xl p-4 flex flex-col items-center"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg mb-2 flex items-center justify-center">
              <Calendar className="text-purple-500" size={20} />
            </div>
            <p className="text-xs text-gray-700">Schedule</p>
          </button>
        </div>
      </div>

      {/* My Schedule Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">My Schedule</h3>
          <button className="text-blue-500 text-sm">See all</button>
        </div>

        {stats.todaySchedule.map((schedule, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-3 mb-2 flex items-center gap-3"
          >
            <img
              src="/api/placeholder/60/60"
              alt="Room"
              className="w-14 h-14 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">{schedule.title}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Calendar size={12} />
                {dayjs(schedule.scheduledAt).format("DD MMM YYYY")}
              </p>
            </div>
            <button>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Accept Modal */}
      {showAcceptModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 text-center">
              Accept this tickets?
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Are you sure you want to accept this ticket now ?
            </p>

            <button
              onClick={confirmAccept}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold mb-3"
            >
              Accept Now
            </button>

            <button
              onClick={() => navigate("/it/reschedule/" + selectedTicket.id)}
              className="w-full text-gray-600 py-3 font-medium"
            >
              Reschedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
