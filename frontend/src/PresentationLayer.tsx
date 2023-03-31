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
    endTurnButton: { visible: boolean; top: number; left: number };
    handleEndTurnButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
    endTurnButton,
    handleEndTurnButton
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
                style={{ top: showInput.top - 15, left: showInput.left - 15}}
                onKeyDown={handleInputSubmit}
                onChange={handleChange}
                value={inputData.value}
              />
            )}
            {endTurnButton.visible && (
              <button
                id="end-turn-button"
                className="end-turn-button"
                onClick={handleEndTurnButton}
                style={{ top: endTurnButton.top - 15, left: endTurnButton.left - 15}}
              >End turn</button>
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
