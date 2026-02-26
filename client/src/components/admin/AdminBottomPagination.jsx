import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const buildPages = (currentPage, totalPages) => {
  const pages = [];
  const addPage = (num, type = "visible") => pages.push({ num, type });
  const addEllipsis = () => pages.push({ num: "...", type: "visible" });

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) addPage(i);
    return pages;
  }

  if (currentPage <= 4) {
    for (let i = 1; i <= 5; i += 1) {
      addPage(i, i > 3 && i < 5 ? "desktop-only" : "visible");
    }
    addEllipsis();
    addPage(totalPages);
    return pages;
  }

  if (currentPage >= totalPages - 3) {
    addPage(1);
    addEllipsis();
    for (let i = totalPages - 4; i <= totalPages; i += 1) {
      addPage(i, i > totalPages - 4 && i < totalPages - 2 ? "desktop-only" : "visible");
    }
    return pages;
  }

  addPage(1);
  addEllipsis();
  addPage(currentPage - 1, "desktop-only");
  addPage(currentPage);
  addPage(currentPage + 1, "desktop-only");
  addEllipsis();
  addPage(totalPages);
  return pages;
};

const AdminBottomPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages < 1) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 flex justify-center items-center gap-1 py-3 flex-wrap">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
      >
        <ChevronLeft size={20} />
      </button>

      {buildPages(currentPage, totalPages).map((page, index) => (
        <button
          key={`${page.num}-${index}`}
          type="button"
          onClick={() => typeof page.num === "number" && onPageChange(page.num)}
          disabled={page.num === "..."}
          className={`flex items-center justify-center rounded-lg text-sm transition-all ${
            page.type === "desktop-only" ? "hidden md:flex" : "flex"
          } ${
            page.num === "..." ? "w-6 md:w-8 cursor-default text-gray-400" : "w-8 h-8 md:w-9 md:h-9"
          } ${
            page.num === currentPage
              ? "bg-[#1e2e4a] text-white shadow-md shadow-blue-900/10"
              : page.num === "..."
                ? ""
                : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {page.num}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default AdminBottomPagination;
