// client/src/pages/user/TicketDetail.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

const TicketDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data - replace with actual API call
  const ticket = {
    id: "TK-01",
    status: "in_progress",
    createdAt: "22 Dec 25, 10:30 AM",
    equipment: "Projector",
    description: "Error",
    priority: "High",
    timeline: [
      {
        status: "Submitted",
        time: "Dec 22, 10:30 AM",
        completed: true,
        icon: <CheckCircle className="text-green-500" size={20} />,
      },
      {
        status: "Accepted",
        time: "Dec 22, 10:30 AM",
        completed: true,
        icon: <Clock className="text-yellow-500" size={20} />,
      },
      {
        status: "Waiting",
        time: "Pending resolution",
        completed: false,
        active: true,
      },
      {
        status: "Completed",
        time: "Pending resolution",
        completed: false,
      },
    ],
    beforeImage: "/api/placeholder/150/150",
    afterImage: null,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/user/my-tickets")}
          className="text-blue-600"
        >
          ← Back
        </button>
        <h1 className="font-semibold text-lg">Ticket Details</h1>
        <button className="text-blue-600">🔔</button>
      </div>

      {/* Ticket Info Card */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-sm text-gray-600">Ticket ID</span>
            <h2 className="text-lg font-semibold">#{ticket.id}</h2>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
            Waiting
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Submitted on</span>
            <span className="font-medium">{ticket.createdAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Equipment:</span>
            <span className="font-medium">{ticket.equipment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="font-medium">{ticket.description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Priority:</span>
            <span className="font-medium text-orange-600">
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-4">Ticket History</h3>

        <div className="relative">
          {ticket.timeline.map((item, index) => (
            <div key={index} className="flex items-start gap-3 mb-6 last:mb-0">
              {/* Icon & Line */}
              <div className="relative">
                {item.icon || (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.completed
                        ? "bg-green-100"
                        : item.active
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : item.active ? (
                      <Clock className="text-blue-500" size={16} />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>
                )}

                {index < ticket.timeline.length - 1 && (
                  <div
                    className={`absolute top-8 left-4 w-0.5 h-12 ${
                      item.completed ? "bg-green-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    item.completed
                      ? "text-gray-800"
                      : item.active
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {item.status}
                </p>
                <p className="text-sm text-gray-500">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Before/After Photos */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="font-semibold mb-4">Upload Photo</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-2">
              {ticket.beforeImage ? (
                <img
                  src={ticket.beforeImage}
                  alt="Before"
                  className="rounded-lg"
                />
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </div>
            <p className="text-sm font-medium">BEFORE</p>
          </div>

          <div className="text-center">
            <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-2">
              {ticket.afterImage ? (
                <img
                  src={ticket.afterImage}
                  alt="After"
                  className="rounded-lg"
                />
              ) : (
                <span className="text-gray-400">Pending</span>
              )}
            </div>
            <p className="text-sm font-medium">AFTER</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
