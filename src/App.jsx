import Header from './components/Header.jsx';
import HUD from './components/HUD.jsx';
import Dock from './components/Dock.jsx';
import MovePad from './components/MovePad.jsx';
import Hint from './components/Hint.jsx';
import SolverPanel from './components/SolverPanel.jsx';
import KeyboardBridge from './components/KeyboardBridge.jsx';
import { Confetti, HelpModal, Toast } from './components/Overlays.jsx';
import CanvasRoot from './scene/CanvasRoot.jsx';

export default function App() {
  return (
    <div className="app">
      <div className="grain" />
      <div className="vignette" />
      <CanvasRoot />
      <Header />
      <HUD />
      <Hint />
      <MovePad />
      <Dock />
      <SolverPanel />
      <Toast />
      <HelpModal />
      <Confetti />
      <KeyboardBridge />
    </div>
  );
}
