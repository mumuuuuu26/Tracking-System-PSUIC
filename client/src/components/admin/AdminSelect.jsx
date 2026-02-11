import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const AdminSelect = ({
    value,
    onChange,
    options = [],
    placeholder = "Select...",
    icon: Icon,
    className = "",
    minWidth = "min-w-[120px]",
    buttonClassName = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dropdownMenuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                (!dropdownMenuRef.current || !dropdownMenuRef.current.contains(event.target))
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option) => {
        const val = typeof option === 'object' ? option.value : option;
        onChange(val);
        setIsOpen(false);
    };

    // Find label for current value
    const currentOption = options.find(opt => {
        const val = typeof opt === 'object' ? opt.value : opt;
        return val === value;
    });

    const displayLabel = currentOption
        ? (typeof currentOption === 'object' ? currentOption.label : currentOption)
        : placeholder;

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 text-xs font-bold bg-white border border-gray-200 
                    text-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 
                    transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a]
                    ${minWidth} ${buttonClassName}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={14} className="text-gray-400" />}
                    <span>{displayLabel}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    ref={dropdownMenuRef}
                    className="absolute right-0 mt-2 w-full min-w-[140px] max-h-[240px] overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                >
                    <div className="py-1">
                        {options.map((option, index) => {
                            const val = typeof option === 'object' ? option.value : option;
                            const label = typeof option === 'object' ? option.label : option;
                            const isSelected = val === value;

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        w-full text-left px-4 py-2.5 text-xs font-bold transition-colors block
                                        ${isSelected
                                            ? 'text-[#1e2e4a] bg-gray-50'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#1e2e4a]'
                                        }
                                    `}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSelect;
