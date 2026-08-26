import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installDemoFetch } from "./lib/demoApi";

const isDemo =
  new URLSearchParams(window.location.search).has("demo") ||
  import.meta.env.VITE_DEMO === "1";

if (isDemo) {
  console.info("%c★ DEMO MODE — browsing with mock data", "color:#2B50F6;font-weight:bold");
  installDemoFetch();
}

createRoot(document.getElementById("root")!).render(<App />);
