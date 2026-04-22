import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main content area to top on route change
    const mainContent = document.querySelector('.overflow-y-auto');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Also scroll window
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
