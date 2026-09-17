import AppSidebar from './AppSidebar';
import TopHeader from './TopHeader';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-row antialiased text-gray-900">
      {/* Left Collapsible Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
