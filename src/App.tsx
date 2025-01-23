import { RecoilRoot } from "recoil";
import Router from "./Router";
import Modal from "./components/modal/Modal";

function App() {
  return (
    <RecoilRoot>
      <Router />
      <Modal />
    </RecoilRoot>
  );
}

export default App;
