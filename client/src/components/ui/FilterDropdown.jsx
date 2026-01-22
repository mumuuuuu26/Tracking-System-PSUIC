import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * FilterDropdown Component
 * 
 * A styled dropdown with checkbox-style options, matching the user's "Select days" request.
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of strings or {value, label}
 * @param {String} props.value - Currently selected value
 * @param {Function} props.onChange - Callback(newValue)
 * @param {String} props.label - Label for the dropdown menu header (e.g. "Select days")
 */
const FilterDropdown = ({ options = [], value, onChange, placeholder = "Select", label = "Select option" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const getLabel = (opt) => (typeof opt === 'object' ? opt.label : opt);
    const getValue = (opt) => (typeof opt === 'object' ? opt.value : opt);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange({ target: { value: getValue(option) } });
        setIsOpen(false);
    };

    const selectedLabel = options.find(o => getValue(o) === value)
        ? getLabel(options.find(o => getValue(o) === value))
        : placeholder;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all
                    ${isOpen
                        ? "bg-white border-blue-500 ring-4 ring-blue-500/20"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300"
                    }
                `}
            >
                <span className="font-medium text-gray-900">{selectedLabel}</span>
                <ChevronDown size={18} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="p-2 space-y-1">
                        {options.map((opt, idx) => {
                            const optValue = getValue(opt);
                            const optLabel = getLabel(opt);
                            const isSelected = optValue === value;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(opt)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer group"
                                >
                                    {/* Custom Checkbox UI */}
                                    <div className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                        ${isSelected ? "bg-[#193C6C] border-[#193C6C]" : "border-gray-300 group-hover:border-blue-400"}
                                    `}>
                                        {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>

                                    <span className={`text-sm font-medium ${isSelected ? "text-[#193C6C]" : "text-gray-600"}`}>
                                        {optLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
