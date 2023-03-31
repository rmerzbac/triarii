import React, { RefObject } from 'react';
import Board, { BoardProps } from './Board';
import GameInformation from './GameInformation';
import Instructions from './Instructions';

export interface PresentationProps {
    boardRef: RefObject<HTMLDivElement>;
    currentBoard: BoardProps['board'];
    currentWhiteInEndzone: BoardProps['whiteInEndzone'];
    currentBlackInEndzone: BoardProps['blackInEndzone'];
    isWhiteMoving: boolean;
    piecesRemaining: number;
    errorMessage: string | null;
    showInput: { visible: boolean; top: number; left: number };
    inputData: { value: string };
    inputRef: RefObject<HTMLInputElement>;
    handleInputSubmit: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    nextSelection: number[] | null;
    playerColor: string;
    showInstructions: boolean;
    toggleInstructions: () => void;
    handleClick: (row: number, col: number) => void;
    gameOver: string | null;
}

export const PresentationLayer: React.FC<PresentationProps> = ({
    currentBoard,
    currentWhiteInEndzone,
    currentBlackInEndzone,
    isWhiteMoving,
    piecesRemaining,
    errorMessage,
    showInput,
    inputData,
    inputRef,
    handleInputSubmit,
    handleChange,
    playerColor,
    showInstructions,
    toggleInstructions,
    handleClick,
    gameOver,
  }) => {
    return (
      <div className="gameDiv">
        <div className="boardDiv">
          <div className="game">
            <Board
              board={currentBoard}
              whiteInEndzone={currentWhiteInEndzone}
              blackInEndzone={currentBlackInEndzone}
              onSelect={handleClick}
            />
            <GameInformation
              isWhiteMoving={isWhiteMoving}
              piecesRemaining={piecesRemaining}
              errorMessage={errorMessage}
              playerColor={playerColor}
              gameOver={gameOver}
            />
            {showInput.visible && (
              <input
                type="number"
                id="stack-input"
                ref={inputRef}
                className="stack-input"
                style={{ top: showInput.top, left: showInput.left }}
                onKeyDown={handleInputSubmit}
                onChange={handleChange}
                value={inputData.value}
              />
            )}
          </div>
        </div>
        <button className="instructions-button" onClick={toggleInstructions}>
          <i className="fa fa-info" style={{ fontSize: "24px" }}></i>
        </button>
        {showInstructions && <Instructions />}
      </div>
    );
  };
  
  export default PresentationLayer;
