import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import SelectAlbumCoverPage from "./pages/SelectAlbumCoverPage";
import SelectVersionPage from "./pages/SelectVersionPage";

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SelectVersionPage />} />
          <Route
            path="/select-album-cover"
            element={<SelectAlbumCoverPage />}
          />
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
