import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
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

function App() {
  document.body.style.backgroundColor = "#f4f6f9";

  return (
    <AuthProvider>
      <BrowserRouter>
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
            <Route index element={<Dashboard />} />
            <Route path="search-query" element={<SearchQuery />} />
            <Route path="comparision" element={<Comparision />} />
            <Route path="iqms-mis" element={<Iqmsmsi />} />
            <Route path="view/queries/incoming" element={<IncomingQueries />} />
            <Route path="freq-query" element={<FreqQuery />} />
            <Route path="view/queries/transferred" element={<TransferredQueries />} />
            <Route path="view/queries/replied" element={<RepliedQueries />} />
            <Route path="view/query/:id" element={<QueryView />} />
            <Route path="view/profile" element={<ProfileView />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
