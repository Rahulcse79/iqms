// React and Router
import { useContext } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// State Management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Theme Provider (MUI-based centralized theming)
import { ThemeProvider } from "./theme/ThemeProvider";

// Context Providers
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CallProvider } from "./context/CallContext";

// Layout
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardOfficer from "./pages/DashboardOfficer";
import NotFound from "./pages/NotFound";
import SearchQuery from "./pages/SearchQuery";
import Comparision from "./pages/Comparison";
import Iqmsmsi from "./pages/IQMSMSI";
import FreqQuery from "./pages/FreqQuery";
import CDR from "./pages/CDR";
import FAQPage from "./pages/FAQ";
import KnowledgeCenter from "./pages/KnowledgeCenter";
import Inauguration from "./pages/Inauguration";

// Query Pages
import IncomingQueries from "./pages/Queries/IncomingQueries";
import RepliedQueries from "./pages/Queries/RepliedQueries";
import TransferredQueries from "./pages/Queries/TransferredQueries";
import QueryView from "./pages/Queries/QueryView";
import SearchResults from "./pages/Queries/SearchResults";
import QueryComparision from "./pages/Queries/QueryComparison";

// Profile Pages
import ProfileView from "./pages/ProfileView/ProfileView";

// Task Management Pages
import TaskDetails from "./pages/TaskManagement/TaskList";
import FeedbackList from "./pages/TaskManagement/FeedbackList";
import CreateTask from "./pages/TaskManagement/TaskCreate";

// DAV Pages
import DavHome from "./Dav/QueryRegistration";
import DavQuery from "./Dav/QueryView";
import NewQuery from "./Dav/NewQuery";

/**
 * App Routes Component
 * Defines all application routes
 */
function AppRoutes() {
  const { auth } = useContext(AuthContext);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            auth?.user?.roles?.includes("ROLE_OFFICER")
              ? <DashboardOfficer />
              : <Dashboard />
          }
        />
        <Route path="search-query" element={<SearchQuery />} />
        <Route path="comparision" element={<Comparision />} />
        <Route path="iqms-mis" element={<Iqmsmsi />} />
        <Route path="view/queries/incoming" element={<IncomingQueries />} />
        <Route path="freq-query" element={<FreqQuery />} />
        <Route path="view/queries/transferred" element={<TransferredQueries />} />
        <Route path="view/queries/replied" element={<RepliedQueries />} />
        <Route path="view/query/:id" element={<QueryView />} />
        <Route path="view/profile" element={<ProfileView />} />
        <Route path="search-results" element={<SearchResults />} />
        <Route path="query/comparision" element={<QueryComparision />} />
        <Route path="FAQ" element={<FAQPage />} />
        <Route path="knowledge-center" element={<KnowledgeCenter />} />

        <Route path="cdr" element={<CDR />} />

        <Route path="interim-reply" element={<TaskDetails/>} />
        <Route path="feedback" element={<FeedbackList/>} />
        <Route path="task-create" element={<CreateTask/>} />


        {/* DAV */}
        <Route path="home" element={<DavHome />} />
        <Route path="dav-query" element={<DavQuery />} />
        <Route path="new-query" element={<NewQuery />} />

        <Route path="inauguration" element={<Inauguration />} />

      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main App Component
 * Wraps the entire application with providers:
 * - ThemeProvider: MUI theming (light/dark mode)
 * - AuthProvider: Authentication context
 * - CallProvider: Call/dialpad context
 * - QueryClientProvider: React Query for data fetching
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CallProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter basename="/app2">
              <AppRoutes />
            </BrowserRouter>
          </QueryClientProvider>
        </CallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
