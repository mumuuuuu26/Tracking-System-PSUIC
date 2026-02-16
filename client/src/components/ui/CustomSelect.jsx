import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect Component
 * 
 * A styled dropdown menu that matches the "PSUIC Deep Blue" aesthetic.
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of objects with { id, name (or label/value) }
 * @param {String|Number} props.value - Current selected value (id)
 * @param {Function} props.onChange - Callback (value) => {}
 * @param {String} props.placeholder - Placeholder text
 * @param {Boolean} props.disabled - Disabled state
 */
const CustomSelect = ({ options = [], value, onChange, placeholder, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Find selected item for display
    const selectedItem = options.find(opt =>
        // Handle both id/name and value/label structures if needed, defaulting to id
        (opt.id !== undefined ? opt.id === value : opt === value)
    );

    const getLabel = (opt) => opt.name || opt.label || opt;
    const getValue = (opt) => opt.id !== undefined ? opt.id : opt;

    // Handle click outside to close
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
        onChange({ target: { value: getValue(option) } }); // Mimic event object for compatibility
        setIsOpen(false);
    };

    return (
        <div className={`relative ${disabled ? "opacity-60 pointer-events-none" : ""}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={placeholder}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
          w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all
          ${isOpen
                        ? "bg-white border-blue-500 ring-4 ring-blue-500/20"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300"
                    }
        `}
            >
                <span className={`font-medium ${selectedItem ? "text-gray-900" : "text-gray-500"}`}>
                    {selectedItem ? getLabel(selectedItem) : placeholder}
                </span>
                <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    role="listbox"
                    className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {options.length > 0 ? (
                            options.map((opt, index) => {
                                const isSelected = getValue(opt) === value;
                                return (
                                    <div
                                        key={index}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => !opt.disabled && handleSelect(opt)}
                                        className={`
                      px-4 py-3 rounded-lg flex items-center justify-between group transition-colors
                      ${opt.disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
                      ${isSelected && !opt.disabled
                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                : !opt.disabled ? "text-gray-700 hover:bg-gray-50 hover:text-gray-900" : "text-gray-400"
                                            }
                    `}
                                    >
                                        <span className="font-medium">{getLabel(opt)}</span>
                                        {isSelected && <Check size={16} className="text-blue-600" />}
                                    </div>
                                );
                            })
                        ) : (
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

export default CustomSelect;
