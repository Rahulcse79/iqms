import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ViewIncomeQueries from "./components/Queries/View_Income_Queries";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchQuery from "./components/SearchQuery";
import DashboardLayout from "./layouts/DashboardLayout";

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
          <Route path="view/income/queries" element={<ViewIncomeQueries />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
