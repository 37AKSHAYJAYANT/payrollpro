import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LayoutContext = createContext({
  currentPage: '',
  setCurrentPage: () => {},
  pendingLeavesCount: 0,
  setPendingLeavesCount: () => {},
  pendingLoansCount: 0,
  setPendingLoansCount: () => {},
  pendingExpensesCount: 0,
  setPendingExpensesCount: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  mobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
  toggleSidebar: () => {},
  toggleMobileSidebar: () => {},
});

export function LayoutProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('');
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [pendingLoansCount, setPendingLoansCount] = useState(0);
  const [pendingExpensesCount, setPendingExpensesCount] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('payrollpro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Automatically close mobile drawer when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('payrollpro_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }

  function toggleMobileSidebar() {
    setMobileSidebarOpen((prev) => !prev);
  }

  return (
    <LayoutContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        pendingLeavesCount,
        setPendingLeavesCount,
        pendingLoansCount,
        setPendingLoansCount,
        pendingExpensesCount,
        setPendingExpensesCount,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleSidebar,
        toggleMobileSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
