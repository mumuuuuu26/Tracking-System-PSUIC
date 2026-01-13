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
  Wrench
} from "lucide-react";
import { listQuickFixes } from "../../api/quickFix";
import { listCategories } from "../../api/category";
import useAuthStore from "../../store/auth-store";

const QuickFix = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore(); // Using token if available, but API might need to be public or we use guest token concept. 
  // However, listQuickFixes uses authCheck. user/QuickFix is under LayoutUser, so user is logged in.

  const equipmentType = location.state?.equipmentType;

  // Initial State: "all" or specific category ID if we can map it
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [quickFixes, setQuickFixes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // If specific equipment type came from navigation, try to select that category
    if (equipmentType && categories.length > 0) {
      const found = categories.find(c => c.name.toLowerCase() === equipmentType.toLowerCase());
      if (found) {
        setSelectedCategory(found.id);
      }
    }
  }, [equipmentType, categories]);

  const loadData = async () => {
    try {
      // NOTE: ensure listQuickFixes and listCategories work for user role
      // In routes/category.js: router.get("/category", authCheck, list); -> Accessible by any auth user
      // In routes/quickFix.js: router.get("/quick-fix", authCheck, list); -> Accessible by any auth user

      const [fixRes, catRes] = await Promise.all([
        listQuickFixes(token),
        listCategories(token)
      ]);
      setQuickFixes(fixRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get icon based on category name
  const getCategoryIcon = (catName) => {
    switch (catName?.toLowerCase()) {
      case "hardware": return <Monitor className="text-blue-500" />;
      case "computer": return <Monitor className="text-blue-500" />;
      case "printer": return <Printer className="text-green-500" />;
      case "network": return <Wifi className="text-purple-500" />;
      case "software": return <Wrench className="text-orange-500" />;
      default: return <HelpCircle className="text-gray-500" />;
    }
  };

  const filteredGuides = quickFixes.filter(guide => {
    // Filter by category
    const matchesCategory = selectedCategory === "all" || guide.categoryId === selectedCategory;
    // Filter by search
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.steps.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-100"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === cat.id
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-100"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-40 rounded-xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : filteredGuides.length > 0 ? (
          <div className="space-y-3">
            {filteredGuides.map((guide) => (
              <div key={guide.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {getCategoryIcon(guide.category?.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 flex-1">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-gray-400">{guide.category?.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Handle steps: split by newline if string */}
                  {/* We assume guide.steps is a string from DB text field */}
                  {guide.steps && guide.steps.split('\n').map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-600 flex-1 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    If the issue persists
                  </p>
                  <button
                    onClick={() => navigate("/user/create-ticket")}
                    className="mt-2 w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <HelpCircle className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No guides found</p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
              className="mt-2 text-blue-500 text-sm font-medium"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickFix;
