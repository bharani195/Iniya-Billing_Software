import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Custom Dropdown Component
 * Uses a portal so the options list is never clipped by parent overflow.
 */
const Dropdown = ({
    options = [],
    value,
    onChange,
    label,
    placeholder = 'Select option',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({});
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    // Calculate position of the dropdown menu relative to the button
    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const menuHeight = Math.min(options.length * 40 + 12, 240);
        const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;

        setMenuStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            top: openAbove ? rect.top - menuHeight - 4 : rect.bottom + 4,
            zIndex: 9999,
        });
    }, [options.length]);

    // Update position when opening
    useEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen, updatePosition]);

    // Close on outside scroll/resize (but NOT when scrolling inside the menu)
    useEffect(() => {
        if (!isOpen) return;
        const handleScroll = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            setIsOpen(false);
        };
        const handleResize = () => setIsOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
    };

    const menu = isOpen ? createPortal(
        <ul
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 max-h-60 overflow-y-auto"
        >
            {options.map((option) => (
                <li
                    key={String(option.value)}
                    className={`px-3 py-2.5 flex items-center gap-2 cursor-pointer text-sm transition-colors ${String(option.value) === String(value)
                        ? 'bg-violet-500 text-white'
                        : 'hover:bg-violet-50 text-gray-700 hover:text-violet-700'
                        }`}
                    onClick={() => handleSelect(option)}
                >
                    {option.icon && <span>{option.icon}</span>}
                    <span className="font-medium">{option.label}</span>
                </li>
            ))}
        </ul>,
        document.body
    ) : null;

    return (
        <div className={`relative ${className}`}>
            {label && (
                <p className="font-medium text-gray-700 pb-1.5 text-sm">{label}</p>
            )}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center justify-between w-full text-left px-3 py-2.5 border rounded-xl bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.icon && (
                        <span className="text-gray-500">{selectedOption.icon}</span>
                    )}
                    <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <svg
                    width="11" height="17" viewBox="0 0 11 17" fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="M9.92546 6L5.68538 1L1.44531 6" stroke="#6B7280" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1.44564 11L5.68571 16L9.92578 11" stroke="#6B7280" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {menu}
        </div>
    );
};

export default Dropdown;
