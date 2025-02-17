import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Prefetch 전략 적용
const HomePage = lazy(() => import("./pages/home/HomePage"));
const Edit1Page = lazy(
  () => import(/* webpackPrefetch: true */ "./pages/Edit1Page")
);
const Edit2Page = lazy(
  () => import(/* webpackPrefetch: true */ "./pages/Edit2Page")
);

// 로딩 컴포넌트 분리
const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
  </div>
);

function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/edit1/:transactionId" element={<Edit1Page />} />
          <Route path="/edit2" element={<Edit2Page />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default Router;
