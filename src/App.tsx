import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './pages/HomeScreen';
import { LobbyScreen } from './pages/LobbyScreen';
import { GameBoard } from './pages/GameBoard';
import { ToastContainer } from './components/ToastContainer';
import { GlobalBackground } from './components/GlobalBackground';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/lobby/:code" element={<LobbyScreen />} />
        <Route path="/game/:code" element={<GameBoard />} />
      </Routes>
      <GlobalBackground />
    </BrowserRouter>
  );
}

export default App;
