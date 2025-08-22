import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ViewIncomeQueries from "./components/Queries/View_Income_Queries";
import SideBar from "./components/SideBar";
import NotFound from "./pages/NotFound";

function Layout() {
  const location = useLocation();

  const hideSidebar = location.pathname === "/login";

  return (
    <div className="layout">
      {!hideSidebar && <SideBar />}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="view/income/queries" element={<ViewIncomeQueries />} />
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
