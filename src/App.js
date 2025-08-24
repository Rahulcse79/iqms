import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IncomingQueries from "./pages/Queries/IncomingQueries";
import RepliedQueries from "./pages/Queries/RepliedQueries";
import TransferredQueries from "./pages/Queries/TransferredQueries";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchQuery from "./pages/SearchQuery";
import DashboardLayout from "./layouts/DashboardLayout";
import Comparision from "./pages/Comparison";

function App() {
  document.body.style.backgroundColor = "#f4f6f9";

  return (
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
          <Route path="view/queries/incoming" element={<IncomingQueries />} />
          <Route path="view/queries/transferred" element={<TransferredQueries />} />
          <Route path="view/queries/replied" element={<RepliedQueries />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
