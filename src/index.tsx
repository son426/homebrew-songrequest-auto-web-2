import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Firebase 초기화를 위한 import
import "./lib/firebase.ts";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
