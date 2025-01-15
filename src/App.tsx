import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SelectVersion from './components/SelectVersion';
import { RecoilRoot } from 'recoil';
import SelectAlbumCover from './components/SelectAlbumCover';


function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SelectVersion />} />
          <Route path="/select-album-cover" element={<SelectAlbumCover />} />
        </Routes>
      </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
