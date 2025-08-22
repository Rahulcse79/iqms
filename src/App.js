import "./App.css";
import { BrowserRouter, Routes } from "react-router-dom";

function App() {
  document.body.style.backgroundColor = "#000";

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* no routes yet */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
