import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Clock, User } from "lucide-react";

const ITBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 py-2">
        <button
          onClick={() => navigate("/it")}
          className={`flex flex-col items-center p-2 ${isActive("/it") ? "text-blue-500" : "text-gray-400"
            }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </button>

        <button
          onClick={() => navigate("/it/schedule")}
          className={`flex flex-col items-center p-2 ${isActive("/it/schedule") ? "text-blue-500" : "text-gray-400"
            }`}
        >
          <Calendar size={24} />
          <span className="text-xs mt-1">Book</span>
        </button>

        <button
          onClick={() => navigate("/it/history")}
          className={`flex flex-col items-center p-2 ${isActive("/it/history") ? "text-blue-500" : "text-gray-400"
            }`}
        >
          <Clock size={24} />
          <span className="text-xs mt-1">History</span>
        </button>

        <button
          onClick={() => navigate("/it/profile")}
          className={`flex flex-col items-center p-2 ${isActive("/it/profile") ? "text-blue-500" : "text-gray-400"
            }`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default ITBottomNav;
