import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardOfficer from "./pages/DashboardOfficer";
import IncomingQueries from "./pages/Queries/IncomingQueries";
import RepliedQueries from "./pages/Queries/RepliedQueries";
import TransferredQueries from "./pages/Queries/TransferredQueries";
import QueryView from "./pages/Queries/QueryView";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchQuery from "./pages/SearchQuery";
import Comparision from "./pages/Comparison";
import Iqmsmsi from "./pages/IQMSMSI";
import ProfileView from "./pages/ProfileView/ProfileView";
import FreqQuery from "./pages/FreqQuery";
import DashboardLayout from "./layouts/DashboardLayout";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import SearchResults from "./pages/Queries/SearchResults";

function AppRoutes() {
  const { user } = useContext(AuthContext);

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
        {/* ✅ Conditionally render based on role */}
        <Route
          index
          element={
            user?.role === "officer" ? <DashboardOfficer /> : <Dashboard />
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
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  document.body.style.backgroundColor = "#f4f6f9";

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
