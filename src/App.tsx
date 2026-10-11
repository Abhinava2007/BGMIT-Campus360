import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastContainer } from './components/ToastContainer.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { HODDashboard } from './components/dashboards/HODDashboard.js';
import { StudentDashboard } from './components/dashboards/StudentDashboard.js';
import { TasksView } from './components/tasks/TasksView.js';
import { ElectionsView } from './components/elections/ElectionsView.js';
import { ComplaintsView } from './components/complaints/ComplaintsView.js';
import { RequestsView } from './components/requests/RequestsView.js';
import { EventsView } from './components/events/EventsView.js';
import { NoticesView } from './components/notices/NoticesView.js';
import { RulesView } from './components/rules/RulesView.js';
import { AuditLogsView } from './components/audit/AuditLogsView.js';
import { UsersView } from './components/users/UsersView.js';
import { CampusLocationView } from './components/campus/CampusLocationView.js';
import { CampusFooter } from './components/CampusFooter.js';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer.js';

const MainAppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);

  // Render view based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentUser.role === 'student' ? (
          <StudentDashboard onNavigate={setActiveTab} onOpenAI={() => setAiDrawerOpen(true)} />
        ) : (
          <HODDashboard onNavigate={setActiveTab} onOpenAI={() => setAiDrawerOpen(true)} />
        );
      case 'tasks':
        return <TasksView />;
      case 'elections':
        return <ElectionsView />;
      case 'complaints':
        return <ComplaintsView />;
      case 'requests':
        return <RequestsView />;
      case 'events':
        return <EventsView />;
      case 'notices':
        return <NoticesView />;
      case 'rules':
        return <RulesView />;
      case 'audit':
        return <AuditLogsView />;
      case 'users':
        return <UsersView />;
      case 'campus':
        return <CampusLocationView onNavigate={setActiveTab} />;
      default:
        return currentUser.role === 'student' ? (
          <StudentDashboard onNavigate={setActiveTab} onOpenAI={() => setAiDrawerOpen(true)} />
        ) : (
          <HODDashboard onNavigate={setActiveTab} onOpenAI={() => setAiDrawerOpen(true)} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenAI={() => setAiDrawerOpen(true)}
        onNavigate={setActiveTab}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onNavigate={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenAI={() => setAiDrawerOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 min-w-0 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Campus Verified Footer */}
      <CampusFooter onNavigate={setActiveTab} />

      {/* Floating AI Drawer */}
      <AIAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        onNavigate={setActiveTab}
      />

      {/* Toast Feedback */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
