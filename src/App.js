import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ViewIncomeQueries from "./components/Queries/View_Income_Queries";
import SideBar from "./components/SideBar";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SearchQuery from "./components/SearchQuery";

function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="layout">
      {!hideSidebar && <SideBar />}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="search-query"
            element={
              <ProtectedRoute>
                <SearchQuery />
              </ProtectedRoute>
            }
          />
          <Route
            path="view/income/queries"
            element={
              <ProtectedRoute>
                <ViewIncomeQueries />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  document.body.style.backgroundColor = "#000";

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
