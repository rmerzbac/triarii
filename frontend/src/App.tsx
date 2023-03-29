import './App.css';
import React from "react";
import Title from './Title';
import Game from './Game';

const App: React.FC = () => {
  return (
    <div>
      <div className="main">
        <Title title="TRIARII" />
        <Game />
      </div>
    </div>
  );
};

export default App;
