/**
 * headerConfig.js
 * ---------------
 * Centralized configuration for the mobile page header (blue bar at the top).
 * Ensures consistent sizing across IT and User pages.
 *
 * Reference: UserPageHeader.jsx (user/report and other user pages)
 *   - padding:       py-4  (16px top + 16px bottom)
 *   - side padding:  px-5  (20px)
 *   - border-radius: rounded-b-[2rem] (32px)
 *   - background:    gradient from-blue-700 via-blue-800 to-blue-900
 *   - shadow:        shadow-[0_4px_20px_rgba(0,0,0,0.15)]
 */

export const HEADER_CONFIG = {
    /** Vertical padding — matches UserPageHeader py-4 */
    paddingY: "py-4",

    /** Horizontal padding — matches UserPageHeader px-5 */
    paddingX: "px-5",

    /** Bottom border radius — matches UserPageHeader rounded-b-[2rem] */
    borderRadius: "rounded-b-[2rem]",

    /** Background gradient — matches UserPageHeader */
    background:
        "bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0d1b2a]",

    /** Box shadow */
    shadow: "shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-none",

    /** Border */
    border: "border-b border-transparent dark:border-white/10",

    /**
     * Combined Tailwind classes for the header wrapper.
     * Use this as className in MobileHeader or ITPageHeader.
     */
    wrapperClasses:
        "bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0d1b2a] px-5 py-4 sticky top-0 z-50 lg:hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-none border-b border-transparent dark:border-white/10 rounded-b-[2rem]",
};

export default HEADER_CONFIG;
