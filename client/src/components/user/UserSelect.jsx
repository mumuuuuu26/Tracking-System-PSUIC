import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * UserSelect Component — Dark Navy Theme
 * 
 * A custom select component matching the dark blue UI design.
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getLabel = (opt) => (typeof opt === 'object' ? opt.name : opt);
    const getValue = (opt) => (typeof opt === 'object' ? opt.id : opt);

    const selectedOption = options.find(opt => getValue(opt) === value);

    const handleSelect = (opt) => {
        onChange({ target: { value: getValue(opt) } });
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={placeholder}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-3 bg-white dark:bg-[#1a2f4e] border rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-sm dark:shadow-none
                    ${isOpen ? "border-gray-400 dark:border-blue-700/70" : "border-gray-300 dark:border-blue-700/50"}
                    ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#152540]" : ""}
                `}
            >
                <span className={`text-sm font-normal ${selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-blue-400/50"}`}>
                    {selectedOption ? getLabel(selectedOption) : placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 dark:text-blue-400/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div
                    role="listbox"
                    className="absolute top-full z-50 left-0 right-0 mt-2 bg-white dark:bg-[#152540] border border-gray-200 dark:border-blue-700/50 rounded-2xl shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top"
                >
                    <div className="max-h-60 overflow-y-auto p-2">
                        {options.map((opt, idx) => {
                            const isSelected = getValue(opt) === value;
                            return (
                                <div
                                    key={idx}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(opt)}
                                    className={`
                                        flex items-center px-4 py-3 rounded-xl cursor-pointer transition-colors mb-1 last:mb-0
                                        ${isSelected
                                            ? "bg-blue-50 dark:bg-[#193C6C] text-blue-700 dark:text-white"
                                            : "text-gray-700 dark:text-blue-200 hover:bg-gray-50 dark:hover:bg-blue-800/40"
                                        }
                                    `}
                                >
                                    <span className={`text-sm ${isSelected ? "font-bold" : "font-medium"}`}>
                                        {getLabel(opt)}
                                    </span>
                                </div>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-gray-400 dark:text-blue-400/50 text-center text-sm">
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
