import { useEffect, useRef } from "react";

export default function useIdleLogout(onLogout, timeout = 120000) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onLogout, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // initialize timer on load

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
