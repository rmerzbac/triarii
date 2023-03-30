import './App.css';
import React, {useState, useEffect} from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams
} from 'react-router-dom';
import Title from './Title';
import Game from './Game';

const Home: React.FC<{ setPlayerColor: (color: string) => void; setToken: (token: string) => void }> = ({ setPlayerColor, setToken }) => {
  const navigate = useNavigate();

  const handleCreateNewGame = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const boardCode =
      '//_/6b/_/6b/_/6b//4b/_/4b/_/4b/_//_/2b/_/2b/_/2b//2w/_/2w/_/2w/_//_/4w/_/4w/_/4w//6w/_/6w/_/6w/_//0,0,true,1000,true//';
  
    try {
      // Create a new game
      const response = await fetch('http://localhost:3001/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardCode }),
      });
  
      const { id } = await response.json();
      const shareableUrl = `${window.location.origin}/game/${id}`;
      console.log('Shareable URL:', shareableUrl);
  
      // Join the created game
      const joinResponse = await fetch('http://localhost:3001/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: id}),
      });
  
      const joinData = await joinResponse.json();
      setPlayerColor(joinData.playerColor);
      setToken(joinData.token);
      console.log("Create and join token: " + joinData.token);
  
      navigate(`/game/${id}`);
    } catch (error) {
      console.error('Error creating and joining a new game:', error);
    }
  };
  
  

  return (
    <div>
      Welcome to Triarii!
      <button onClick={handleCreateNewGame}>
        Create New Game
      </button>
    </div>
  );
};

const GameWrapper: React.FC<{ playerColor: string; token: string; setPlayerColor: (color: string) => void; setToken: (token: string) => void }> = ({ playerColor, token, setPlayerColor, setToken }) => {

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const joinGame = async () => {
      try {
        console.log("Pre join token: " + token);
        const joinResponse = await fetch('http://localhost:3001/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameId: id, token }),
        });

        const joinData = await joinResponse.json();
        setPlayerColor(joinData.playerColor);
        setToken(joinData.token);
        console.log("Just join token: " + token);
      } catch (error) {
        console.error('Error joining the game:', error);
      }
    };

    if (!playerColor || !token) {
      joinGame();
    }
  }, [id, navigate, playerColor, setPlayerColor, setToken, token]);

  return <Game gameId={id!} playerColor={playerColor!} token={token!} />;
};


const App: React.FC = () => {
  const [playerColor, setPlayerColor] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    console.log('Updated token:', token);
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
        </div>
      </div>
    </Router>
  );
};

export default App;