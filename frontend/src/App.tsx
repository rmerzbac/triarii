import './App.css';
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams
} from 'react-router-dom';
import Title from './Title';
import Game from './Game';
import Instructions from './Instructions';
import { createNewGame, joinGame } from './api';

const Home: React.FC<{ setPlayerColor: (color: string) => void; setToken: (token: string) => void }> = ({ setPlayerColor, setToken }) => {
  const navigate = useNavigate();

  const handleCreateNewGame = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const boardCode = '//_/6b/_/6b/_/6b//4b/_/4b/_/4b/_//_/4b/_/4b/_/4b//4w/_/4w/_/4w/_//_/4w/_/4w/_/4w//6w/_/6w/_/6w/_//0,0,true,1000,true//';
    // const boardCode = '//25w/6b/_/6b/_/6b//4b/_/4b/_/4b/_//_/2b/_/2b/_/2b//2w/_/2w/_/2w/_//_/4w/_/4w/_/4w//6w/_/6w/_/6w/25b//0,0,true,1000,true//';
  
    try {
      // Create a new game
      const id = await createNewGame(boardCode);
      const shareableUrl = `${window.location.origin}/game/${id}`;
      console.log('Shareable URL:', shareableUrl);

      // Join the created game
      const joinData = await joinGame(id);
      setPlayerColor(joinData.playerColor);
      setToken(joinData.token);

      navigate(`/game/${id}`);
    } catch (error) {
      console.error('Error creating and joining a new game:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCreateNewGame} className="create-game-button">
        Create New Game
      </button>
      <Instructions />
    </div>
  );
};

const GameWrapper: React.FC<{ playerColor: string; token: string; setPlayerColor: (color: string) => void; setToken: (token: string) => void }> = ({ playerColor, token, setPlayerColor, setToken }) => {

  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) throw new Error("Game ID not found.");

  useEffect(() => {
    const fetchAndJoinGame = async () => {
      if (!playerColor || !token) {
        try {
          const joinData = await joinGame(id, token);
          setPlayerColor(joinData.playerColor);
          setToken(joinData.token);
        } catch (error) {
          console.error('Error joining the game:', error);
        }
      }
    };

    fetchAndJoinGame();
  }, [id, navigate, playerColor, setPlayerColor, setToken, token]);

  return <Game gameId={id!} playerColor={playerColor!} token={token!} />;
};

const App: React.FC = () => {
  const [playerColor, setPlayerColor] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
  }, [token]);

  return (
    <Router>
      <div>
        <div className="main">
          <Title title="TRIARII" />
          <Routes>
            <Route path="/" element={<Home setPlayerColor={setPlayerColor} setToken={setToken} />} />
            <Route path="/game/:id" element={<GameWrapper playerColor={playerColor} token={token} setPlayerColor={setPlayerColor} setToken={setToken} />} />
          </Routes>
          <div className="footer">Copyright © Reid Merzbacher 2023</div>
        </div>
      </div>
    </Router>
  );
};

export default App;