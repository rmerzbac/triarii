import React from "react";

import { DEFAULT_PIECES_REMAINING } from "./constants";
import WhitePiece from "./pieces/White.png";
import BlackPiece from "./pieces/Black.png";
import {getPieceImagePath} from "./Square";

interface GameInformationProps {
  playerColor: string | null;
  isWhiteMoving: boolean;
  piecesRemaining: number;
  errorMessage: string | null;
  gameOver: string | null;
}

const GameInformation: React.FC<GameInformationProps> = ({
  playerColor,
  isWhiteMoving,
  piecesRemaining,
  errorMessage,
  gameOver,
}) => {
  return (
    <div>
        <div className="game-information">
            <p>You are playing as <b>{playerColor ?? "spectator"}</b></p>
            <p>Current player: <b>{isWhiteMoving ? "white" : "black"}</b></p>
            <p>{piecesRemaining === DEFAULT_PIECES_REMAINING ? "" : "Pieces remaining: "}<b>{piecesRemaining === DEFAULT_PIECES_REMAINING ? "" : piecesRemaining}</b></p>
            {errorMessage && <p className="error">{errorMessage}</p>}
            {gameOver !== null && <p className="game-over"><br/>{gameOver}</p>}
        </div>
        <div className="game-information-footer">
        <p>{playerColor !== undefined && (<span>You are <img className="piece-icon" src={playerColor === 'white' ? WhitePiece : BlackPiece} alt="" /></span>)}
            Current player: <img className="piece-icon" src={isWhiteMoving ? WhitePiece : BlackPiece} alt={""}/>
            {errorMessage && <span className="error">{errorMessage}</span>}
            {gameOver !== null && <span className="game-over"><br/>{gameOver}</span>}</p>
            
        </div>
    </div>
  );
}

export default GameInformation;
