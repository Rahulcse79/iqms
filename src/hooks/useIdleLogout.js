import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutAPI } from "../utils/endpoints";
import Cookies from "js-cookie";

/**
 * useIdleLogout
 * - Listens for user activity and logs out after `timeout` ms of inactivity.
 * - Calls `logoutAPI()` and then navigates to `/login` (with fallbacks).
 * - Accepts either a callback `onLogout` or will perform the default logout flow.
 */
export default function useIdleLogout(onLogout, timeout = 5 * 60 * 1000) {
  const timerRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const navigate = useNavigate();

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // If there's no auth cookie, just ensure cleanup and redirect
      const authData = Cookies.get("authData");
      if (!authData) {
        try {
          localStorage.clear();
        } catch (e) {}
        navigate("/login", { replace: true });
        return;
      }

      // Attempt server-side logout; don't throw the user if the network fails
      try {
        await logoutAPI();
      } catch (err) {
        console.error("useIdleLogout: logoutAPI failed:", err);
        // Best-effort cleanup even if API fails
        try {
          localStorage.clear();
        } catch (e) {}
        try {
          Cookies.remove("authData", { path: "/" });
        } catch (e) {}
      }

      // Try to navigate to login; if react-router isn't available, fall back to window.location
      try {
        navigate("/login", { replace: true });
      } catch (err) {
        window.location.href = "/login";
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [navigate]);

  const handleIdle = useCallback(() => {
    // If a custom onLogout callback was provided, call it first
    if (typeof onLogout === "function") {
      try {
        const maybePromise = onLogout();
        if (maybePromise && typeof maybePromise.then === "function") {
          // If user returned a promise, wait then perform default logout as fallback
          maybePromise
            .catch((e) => console.error("onLogout handler failed:", e))
            .finally(() => performLogout());
          return;
        }
      } catch (err) {
        console.error("onLogout handler threw:", err);
      }
    }

    // Default: call performLogout
    performLogout();
  }, [onLogout, performLogout]);

  const resetTimer = useCallback(() => {
    try {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdle, timeout);
    } catch (err) {
      console.error("useIdleLogout resetTimer error:", err);
    }
  }, [handleIdle, timeout]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Also reset on visibility change (user returned to tab)
    const handleVisibility = () => {
      if (!document.hidden) resetTimer();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Initialize
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return null;
}
