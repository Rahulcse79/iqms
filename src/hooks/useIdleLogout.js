import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutAPI } from "../utils/endpoints";
import Cookies from "js-cookie";
import variables from "../utils/variables";

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
  const isRefreshRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

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

  // Best-effort logout for unload/close events.
  // Distinguishes between refresh (don't logout) and close/unload (do logout).
  // Uses fetch with `keepalive` (so the request may complete during unload) and
  // falls back to navigator.sendBeacon when needed. Always clears client-side
  // state (localStorage + cookie) so reopening won't re-authenticate.
  const performUnloadLogout = useCallback(() => {
    // Detect if this is a refresh or a real unload/close
    // Refresh typically has very short time since last activity
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    const isLikelyRefresh =
      isRefreshRef.current || timeSinceLastActivity < 500; // <500ms = likely refresh

    if (isLikelyRefresh) {
      console.log("Detected page refresh — skipping unload logout");
      return;
    }

    try {
      const authCookie = Cookies.get("authData");
      let token = null;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie)?.token;
        } catch (e) {
          // ignore
        }
      }

      const url = `${variables.api.services}agentStatus/create`;
      const payload = JSON.stringify({ status: "Logout" });

      // Try fetch with keepalive first (modern browsers)
      if (typeof fetch === "function") {
        try {
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: payload,
            keepalive: true,
          });
        } catch (e) {
          // fall through to sendBeacon
          try {
            if (navigator && typeof navigator.sendBeacon === "function") {
              navigator.sendBeacon(url, payload);
            }
          } catch (e2) {
            // last resort: do nothing
          }
        }
      } else if (navigator && typeof navigator.sendBeacon === "function") {
        try {
          navigator.sendBeacon(url, payload);
        } catch (e) {}
      }
    } catch (err) {
      console.error("performUnloadLogout error:", err);
    } finally {
      try {
        localStorage.clear();
      } catch (e) {}
      try {
        Cookies.remove("authData", { path: "/" });
      } catch (e) {}
    }
  }, []);

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
      lastActivityRef.current = Date.now(); // Update last activity timestamp
    } catch (err) {
      console.error("useIdleLogout resetTimer error:", err);
    }
  }, [handleIdle, timeout]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Detect page reload/refresh
    const handleBeforeUnload = (e) => {
      // Check if this is a TYPE_RELOAD using performance.navigation (deprecated but still useful)
      if (
        typeof performance !== "undefined" &&
        performance.navigation &&
        performance.navigation.type === 1
      ) {
        isRefreshRef.current = true;
      }
      performUnloadLogout();
    };

    // Ensure we attempt to logout when the page is being unloaded/hidden
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", performUnloadLogout);

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
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", performUnloadLogout);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer, performUnloadLogout]);

  return null;
}
