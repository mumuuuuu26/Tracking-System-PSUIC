// client/src/pages/user/QuickFix.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Monitor,
  Printer,
  Wifi,
  HelpCircle,
} from "lucide-react";

const QuickFix = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const equipmentType = location.state?.equipmentType;

  const [selectedCategory, setSelectedCategory] = useState(
    equipmentType || "all"
  );
  const [searchTerm, setSearchTerm] = useState("");

  const quickFixGuides = {
    Computer: [
      {
        id: 1,
        title: "คอมพิวเตอร์เปิดไม่ติด",
        icon: <Monitor className="text-blue-500" />,
        steps: [
          "ตรวจสอบสายไฟว่าเสียบแน่นหรือไม่",
          "กดปุ่ม Power ค้างไว้ 10 วินาที",
          "ถอดปลั๊กไฟ รอ 30 วินาที แล้วเสียบใหม่",
          "หากยังไม่ได้ ให้แจ้งซ่อม",
        ],
      },
      {
        id: 2,
        title: "จอภาพไม่แสดงผล",
        icon: <Monitor className="text-blue-500" />,
        steps: [
          "ตรวจสอบสาย VGA/HDMI",
          "ตรวจสอบว่าจอเปิดอยู่หรือไม่",
          "ลองเปลี่ยนพอร์ตเชื่อมต่อ",
          "Restart คอมพิวเตอร์",
        ],
      },
    ],
    Printer: [
      {
        id: 3,
        title: "เครื่องพิมพ์ไม่ทำงาน",
        icon: <Printer className="text-green-500" />,
        steps: [
          "ตรวจสอบว่ามีกระดาษหรือไม่",
          "ตรวจสอบหมึกพิมพ์",
          "ตรวจสอบ Queue การพิมพ์",
          "Restart เครื่องพิมพ์",
        ],
      },
    ],
    Network: [
      {
        id: 4,
        title: "อินเทอร์เน็ตไม่ทำงาน",
        icon: <Wifi className="text-purple-500" />,
        steps: [
          "ตรวจสอบสาย LAN",
          "Restart Router/Switch",
          "ตรวจสอบการตั้งค่า IP",
          "ติดต่อ IT Support",
        ],
      },
    ],
  };

  const allGuides = Object.values(quickFixGuides).flat();

  const filteredGuides =
    selectedCategory === "all"
      ? allGuides
      : quickFixGuides[selectedCategory] || [];

  const searchedGuides = filteredGuides.filter((guide) =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft className="text-gray-600" size={24} />
            </button>
            <h1 className="text-lg font-semibold">Quick Fix Guide</h1>
            <div className="w-8" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาปัญหา..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            ทั้งหมด
          </button>
          {Object.keys(quickFixGuides).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="px-4 pb-4">
        {searchedGuides.length > 0 ? (
          <div className="space-y-3">
            {searchedGuides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg">{guide.icon}</div>
                  <h3 className="font-semibold text-gray-800 flex-1">
                    {guide.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  {guide.steps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-600 flex-1">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    หากยังไม่สามารถแก้ไขได้
                  </p>
                  <button
                    onClick={() => navigate("/user/create-ticket")}
                    className="mt-2 w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium"
                  >
                    แจ้งปัญหา
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <HelpCircle className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">ไม่พบคู่มือที่ค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickFix;
