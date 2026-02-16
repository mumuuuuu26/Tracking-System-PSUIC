import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * UserSelect Component
 * 
 * A custom select component with a white background dropdown
 * to match the redesign requirements.
 * 
 * @param {Array} options - Array of objects {id, name} or strings
 * @param {String|Number} value - Selected value
 * @param {Function} onChange - Callback (e) => {} mimicking event
 * @param {String} placeholder - Placeholder text
 * @param {Boolean} disabled - Disabled state
 */
const UserSelect = ({ options = [], value, onChange, placeholder = "Select", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to get display label and value
    const getLabel = (opt) => (typeof opt === 'object' ? opt.name : opt);
    const getValue = (opt) => (typeof opt === 'object' ? opt.id : opt);

    const selectedOption = options.find(opt => getValue(opt) === value);

    const handleSelect = (opt) => {
        onChange({ target: { value: getValue(opt) } });
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger Area */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={placeholder}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-3 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all
                    ${isOpen ? "border-blue-500 ring-2 ring-blue-500/10" : "border-gray-200 hover:border-blue-300"}
                    ${disabled ? "opacity-60 bg-gray-50 cursor-not-allowed" : ""}
                `}
            >
                <span className={`text-base font-normal ${selectedOption ? "text-gray-700" : "text-gray-400"}`}>
                    {selectedOption ? getLabel(selectedOption) : placeholder}
                </span>
                <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div
                    role="listbox"
                    className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="max-h-60 overflow-y-auto p-2 scrollbar-hide">
                        {options.map((opt, idx) => {
                            const isSelected = getValue(opt) === value;
                            return (
                                <div
                                    key={idx}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(opt)}
                                    className={`
                                        flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors mb-1 last:mb-0
                                        ${isSelected
                                            ? "bg-blue-50 text-[#193C6C]"
                                            : "text-gray-600 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <span className={`text-base ${isSelected ? "font-bold" : "font-medium"}`}>
                                        {getLabel(opt)}
                                    </span>
                                    {isSelected && <Check size={18} className="text-[#193C6C]" />}
                                </div>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-gray-400 text-center text-sm">
                                No options available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSelect;
