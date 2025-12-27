
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import App from "./app/App.tsx";
import "./styles/business-tech.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
  