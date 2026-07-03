import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "./lib/pwa-utils";

registerSW();

createRoot(document.getElementById("root")!).render(<App />);
