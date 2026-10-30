import './index.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HomeScreen } from './pages/HomeScreen';
import { LobbyScreen } from './pages/LobbyScreen';
import { GameBoard } from './pages/GameBoard';
import { ToastContainer } from './components/ToastContainer';
import { GlobalBackground } from './components/GlobalBackground';

function AppLayout() {
  const location = useLocation();
  const isInGame = location.pathname.startsWith('/game/');

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/lobby/:code" element={<LobbyScreen />} />
        <Route path="/game/:code" element={<GameBoard />} />
      </Routes>
      {/* Oyun sırasında arka planda gereksiz GPU/CPU harcamaması için GlobalBackground yalnızca ana ekranda ve lobide çalışır */}
      {!isInGame && <GlobalBackground />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
