import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import Edit1Page from "./pages/Edit1Page";
import Edit2Page from "./pages/Edit2Page";
import HomePage from "./pages/HomePage";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/edit1/:transactionId" element={<Edit1Page />} />
        <Route path="/edit2" element={<Edit2Page />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
