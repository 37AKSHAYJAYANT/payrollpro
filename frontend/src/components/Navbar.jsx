import { useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';

/**
 * Navbar component acting as a bridge to AppLayout.
 * Synchronizes page title breadcrumb and notification counts with the sidebar & header.
 */
function Navbar({ currentPage = '', pendingLeavesCount = 0, pendingLoansCount = 0, pendingExpensesCount = 0 }) {
  const { setCurrentPage, setPendingLeavesCount, setPendingLoansCount, setPendingExpensesCount } = useLayout();

  useEffect(() => {
    if (currentPage) {
      setCurrentPage(currentPage);
    }
  }, [currentPage, setCurrentPage]);

  useEffect(() => {
    if (typeof pendingLeavesCount === 'number') {
      setPendingLeavesCount(pendingLeavesCount);
    }
  }, [pendingLeavesCount, setPendingLeavesCount]);

  useEffect(() => {
    if (typeof pendingLoansCount === 'number') {
      setPendingLoansCount(pendingLoansCount);
    }
  }, [pendingLoansCount, setPendingLoansCount]);

  useEffect(() => {
    if (typeof pendingExpensesCount === 'number') {
      setPendingExpensesCount(pendingExpensesCount);
    }
  }, [pendingExpensesCount, setPendingExpensesCount]);

  return null;
}

export default Navbar;
