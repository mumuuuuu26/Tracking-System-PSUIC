import React, { useState, useEffect } from "react";
import { Search, MapPin, MoreVertical, Plus } from "lucide-react";
import { listRooms } from "../../api/room"; // You need to ensure this exists or create it
import useAuthStore from "../../store/auth-store";
import axios from "axios";

// Temporary helper if not in api/room.js
const getRooms = async (token) => {
    return await axios.get('/api/room', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

const RoomManagement = () => {
    const { token } = useAuthStore();
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const res = await getRooms(token);
            setRooms(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Room Management</h1>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search room..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:bg-white"
                    />
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 outline-none focus:border-blue-500">
                        <option>All Buildings</option>
                    </select>
                    <select className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 outline-none focus:border-blue-500">
                        <option>Any Floor</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                        {/* Room Image Placeholder */}
                        <div className="w-32 h-24 bg-gray-200 rounded-2xl overflow-hidden shrink-0 relative">
                            <img
                                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300&h=200"
                                alt="Room"
                                className="w-full h-full object-cover"
                            />
                            <div className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white ${room.status === 'busy' ? 'bg-red-500' : 'bg-green-500'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Room {room.roomNumber}</h3>
                                    <p className="text-gray-500 text-sm">Computer Lab</p>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <MapPin size={14} />
                                <span>Building {room.building || '1'}, Floor {room.floor}</span>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                                    Available
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Room Card */}
                <button className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center h-40 hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-500 group">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="font-semibold">Add New Room</span>
                </button>
            </div>
        </div>
    );
};

export default RoomManagement;
