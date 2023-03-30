import './App.css';
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams
} from 'react-router-dom';
import Title from './Title';
import Game from './Game';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateNewGame = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const boardCode =
      '//_/6b/_/6b/_/6b//4b/_/4b/_/4b/_//_/2b/_/2b/_/2b//2w/_/2w/_/2w/_//_/4w/_/4w/_/4w//6w/_/6w/_/6w/_//0,0,true,1000,true//';

    try {
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
      navigate(`/game/${id}`);
    } catch (error) {
      console.error('Error creating a new game:', error);
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

const GameWrapper: React.FC = () => {
  const { id } = useParams();
  return <Game gameId={id} />;
};

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <div className="main">
          <Title title="TRIARII" />
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/game" element={<Game gameId={1}/>} />
            <Route path="/game/:id" element={<GameWrapper />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;