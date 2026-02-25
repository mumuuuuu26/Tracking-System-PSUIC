import React, { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom';

import AppRoutes from './routes/AppRoutes'
import { ToastContainer, toast } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'
import socket from './utils/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useThemeStore from './store/themeStore'

dayjs.extend(relativeTime)

const App = () => {
    const isDarkMode = useThemeStore((state) => state.isDarkMode);
    const location = useLocation();

    const unlockStaleScrollLock = useCallback(() => {
        const bodyEl = document.body;
        const htmlEl = document.documentElement;
        if (!bodyEl || !htmlEl) return;

        const hasSweetAlertOpen = Boolean(
            document.querySelector(".swal2-container.swal2-backdrop-show, .swal2-container.swal2-shown")
        );

        if (hasSweetAlertOpen) return;

        const bodyHasLockClass =
            bodyEl.classList.contains("swal2-shown") ||
            bodyEl.classList.contains("swal2-height-auto") ||
            bodyEl.classList.contains("swal2-no-backdrop");
        const htmlHasLockClass =
            htmlEl.classList.contains("swal2-shown") ||
            htmlEl.classList.contains("swal2-height-auto");

        const bodyOverflow = `${bodyEl.style.overflow || ""}${bodyEl.style.overflowY || ""}`.toLowerCase();
        const htmlOverflow = `${htmlEl.style.overflow || ""}${htmlEl.style.overflowY || ""}`.toLowerCase();

        const hasLockStyle =
            bodyOverflow.includes("hidden") ||
            bodyOverflow.includes("clip") ||
            htmlOverflow.includes("hidden") ||
            htmlOverflow.includes("clip") ||
            bodyEl.style.position === "fixed" ||
            Boolean(bodyEl.style.top) ||
            Boolean(bodyEl.style.height) ||
            Boolean(htmlEl.style.height);

        // Avoid touching DOM styles/classes if page is already in healthy state.
        if (!bodyHasLockClass && !htmlHasLockClass && !hasLockStyle) return;

        bodyEl.classList.remove("swal2-shown", "swal2-height-auto", "swal2-no-backdrop");
        htmlEl.classList.remove("swal2-shown", "swal2-height-auto");

        bodyEl.style.removeProperty("overflow");
        bodyEl.style.removeProperty("overflow-y");
        bodyEl.style.removeProperty("padding-right");
        bodyEl.style.removeProperty("position");
        bodyEl.style.removeProperty("top");
        bodyEl.style.removeProperty("width");
        bodyEl.style.removeProperty("height");

        htmlEl.style.removeProperty("overflow");
        htmlEl.style.removeProperty("overflow-y");
        htmlEl.style.removeProperty("height");
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        socket.on('connect', () => {

        });

        socket.on('server:new-ticket', (data) => {
            toast.info(`New Ticket: ${data.title}`);
        });

        // [BUG FIX] Removed toast from server:update-ticket — it was noisy for ALL users.
        // User-specific notifications are handled by the in-app notification system.
        socket.on('server:update-ticket', () => {
            // Silent: triggers real-time data refresh on subscribed pages without toast noise
        });

        return () => {
            socket.off('connect');
            socket.off('server:new-ticket');
            socket.off('server:update-ticket');
        };
    }, []);

    useEffect(() => {
        const raf = requestAnimationFrame(unlockStaleScrollLock);
        return () => cancelAnimationFrame(raf);
    }, [location.pathname, location.search, location.hash, unlockStaleScrollLock]);

    useEffect(() => {
        const handleFocus = () => unlockStaleScrollLock();
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                unlockStaleScrollLock();
            }
        };

        const observer = new MutationObserver(() => {
            unlockStaleScrollLock();
        });

        observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            observer.disconnect();
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [unlockStaleScrollLock]);

    return (
        <>
            <ToastContainer />
            <AppRoutes />
        </>
    )
}


export default App
