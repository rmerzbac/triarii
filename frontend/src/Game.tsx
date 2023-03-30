import React, { useState, useEffect, useCallback, useRef, ChangeEventHandler} from 'react';
import _ from 'lodash';
import Board from './Board';
import GameInformation from './GameInformation';
import {makeMove, GameInterface, convertBoardToString, convertStringToBoard, isViolatingFourOrFewerCondition} from './gameLogic';
import { BOARD_SIZE, DEFAULT_PIECES_REMAINING } from './constants';
import Instructions from './Instructions';


// TODO: CURRENTLY THREEFOLD REPETITION WILL NOT WORK, SINCE THE HISTORY IS NOT SENT VIA THE API.
// NEED TO RESTRUCTURE:
//  1. API sends full history, in text form
//  2. Remove dictionary. Simply scan the list for two instances of the board state. 
// (This will be reasonably efficient, since the history is in text format)
// 3. History is now in text form. Create and use currentGameState to update other states


interface GameProps {
  gameId: string;
  playerColor: string;
  token: string;
}

const Game = ({gameId, playerColor, token}: GameProps) => {
  // State hooks
  const [history, setHistory] = useState([
    {
      board: [
        [null, '6b', null, '6b', null, '6b'],
        ['4b', null, '4b', null, '4b', null],
        [null, '2b', null, '2b', null, '2b'],
        ['2w', null, '2w', null, '2w', null],
        [null, '4w', null, '4w', null, '4w'],
        ['6w', null, '6w', null, '6w', null],
      ],
      whiteInEndzone: 0,
      blackInEndzone: 0,
      isWhiteMoving: true,
      piecesRemaining: 1000,
      isFirstAction: true
    },
  ]);
  const [pollingInterval, setPollingInterval] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[] | null>(null);
  const [nextSelection, setNextSelection] = useState<number[] | null>(null);
  const [currentBoard, setCurrentBoard] = useState(history[history.length - 1].board);
  const [currentWhiteInEndzone, setCurrentWhiteInEndzone] = useState(history[history.length - 1].whiteInEndzone);
  const [currentBlackInEndzone, setCurrentBlackInEndzone] = useState(history[history.length - 1].blackInEndzone);
  const [isWhiteMoving, setIsWhiteMoving] = useState(true);
  const [piecesRemaining, setPiecesRemaining] = useState(DEFAULT_PIECES_REMAINING);
  const [isFirstAction, setIsFirstAction] = useState(true);
  const [showInput, setShowInput] = useState({ visible: false, top: 0, left: 0 });
  const [inputData, setInputData] = useState({ value: "" });
  const [boardDictionary, setBoardDictionary] = useState<Record<string, number>>({});
  const [showInstructions, setShowInstructions] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Key event handlers
  const handleInputSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputRef.current) {
        const movingStackSize = parseInt(inputRef.current.value, 10);
        if (!isNaN(movingStackSize) && movingStackSize >= 0) {
          if (nextSelection) {
            move(movingStackSize);
          }
          setShowInput({ ...showInput, visible: false });
          inputRef.current.value = '';
          setInputData({ ...inputData, value: "" })
        }
      }
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (piecesRemaining === DEFAULT_PIECES_REMAINING) throw new Error("No move made.");
      selectNext(null);

      const nextGameState = _.cloneDeep(history[history.length - 1]);
      endTurn(nextGameState);

      setHistory((prevHistory) => [...prevHistory, nextGameState]);
      const stringifiedBoard = convertBoardToString(nextGameState);

      updateDictionary(stringifiedBoard, (newBoardDictionary) => {
        if (newBoardDictionary[stringifiedBoard] >= 3) endGame(null); // Threefold repetition
      });

      console.log(stringifiedBoard);

      updateGameState(stringifiedBoard, null);
      return;
    }

    if (inputRef.current === document.activeElement) return;
  
    if (!selected) return;
    
    let arrowCode = '';
    if (event.code === 'ArrowUp') {
      arrowCode = 'u';
    } else if (event.code === 'ArrowRight') {
      arrowCode = 'r';
    } else if (event.code === 'ArrowDown') {
      arrowCode = 'd'
    } else if (event.code === 'ArrowLeft') {
      arrowCode = 'l'
    }
    selectNext(arrowCode);
    showInputBox(selected[0], selected[1]);
    event.preventDefault();
  }, [selected, nextSelection, history]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const target = event.target as HTMLInputElement;
    if (target) {
      setInputData({ ...inputData, value: target.value });
    }
  };

  const showInputBox = (row: number, col: number) => {
    const square = document.getElementById(row + ',' + col);
    if (square) {
      const rect = square.getBoundingClientRect();
      setShowInput({ visible: true, top: rect.top + rect.height, left: rect.left });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  // useEffect hooks
  useEffect(() => {
    setCurrentBoard(history[history.length - 1].board);
    setCurrentWhiteInEndzone(history[history.length - 1].whiteInEndzone);
    setCurrentBlackInEndzone(history[history.length - 1].blackInEndzone);
    setIsWhiteMoving(history[history.length - 1].isWhiteMoving);
    setPiecesRemaining(history[history.length - 1].piecesRemaining);
    setIsFirstAction(history[history.length - 1].isFirstAction);
  }, [history]);

  /*useEffect(() => {
    console.log('Updated history:', history);
  }, [history]);*/

  useEffect(() => {
    console.log('Updated dictionary:', boardDictionary);
  }, [boardDictionary]);

  useEffect(() => {
    const fetchGameState = async () => {
      await loadGameState();
    };
  
    if (gameId) {
      fetchGameState();
    }
  }, [gameId]);  

  useEffect(() => {
    if (!pollingInterval) {
      const interval = setInterval(() => {
        loadGameState();
      }, 1000); // Polling interval in milliseconds (1000 ms = 1 second)
      setPollingInterval(interval);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [pollingInterval]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      // Clean up the listener when the component is unmounted
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);  

  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.focus();
    }
  }, []);

  // API calls  
  async function loadGameState() {
    try {
      const response = await fetch(`http://localhost:3001/game/${gameId}`);
      const allBoards = await response.json();
      const { boardCode, selected } = allBoards[0];
      // console.log(boardCode);
      const game = convertStringToBoard(boardCode);
      setHistory((prevHistory) => [game]);

      const parsedSelected = selected
      ? selected.split(",").map((value: string) => parseInt(value, 10))
      : [-1, -1];
      select(parseInt(parsedSelected[0], 10), parseInt(parsedSelected[1], 10), false);
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }
  
  async function updateGameState(boardCode : string, selected : string | null) {
    console.log("PUT:" + selected);
    try {
      await fetch(`http://localhost:3001/game/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ boardCode, selected}),
      });
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  }

  const select = (row: number, col: number, isClick: boolean) => {
    if (isWhiteMoving ? playerColor === "black" : playerColor === "white") throw new Error("Not your turn.");

    if (isClick && !isFirstAction) return;

    if (isClick) {
      const nextGameState = _.cloneDeep(history[history.length - 1]);
      const stringifiedBoard = convertBoardToString(nextGameState);
      setHistory((prevHistory) => [...prevHistory, nextGameState]);
      updateGameState(stringifiedBoard, row + "," + col);
    }
  
    setSelected(prevSelected => {
      if (prevSelected && prevSelected[0] !== null && prevSelected[1] !== null) {
        document.getElementById(prevSelected[0] + "," + prevSelected[1])?.classList.remove("selected");
      }
      if (row === -1 || col === -1) {
        return null;
      }
      document.getElementById(row + "," + col)?.classList.add("selected");
      return [row, col];
    });
  }

  const selectNext = (dir : string | null) => {
    setNextSelection(prevNextSelection => {
      if (prevNextSelection && prevNextSelection[0] !== null && prevNextSelection[1] !== null) {
        document.getElementById(prevNextSelection[0] + "," + prevNextSelection[1])?.classList.remove("selected-next");
      }
      if (!dir) {
        setShowInput({ ...showInput, visible: false });
        return null;
      }
      if (!selected) return null;

      let nextRow = selected[0];
      let nextCol = selected[1];
      if (dir === "u") nextRow -= 1;
      else if (dir === "l") nextCol -= 1;
      else if (dir === "d") nextRow += 1;
      else if (dir === "r") nextCol += 1;
      else return prevNextSelection;

      if (nextCol < 0 || nextCol >= BOARD_SIZE) return null;
      
      if (nextRow === BOARD_SIZE && !isWhiteMoving) {
        document.getElementById("endzone-black")?.classList.add("selected-next");
      } else if (nextRow === -1 && isWhiteMoving) {
        document.getElementById("endzone-white")?.classList.add("selected-next");
      } else {
        document.getElementById(nextRow + "," + nextCol)?.classList.add("selected-next");
      }
      return [nextRow, nextCol];
    });
  }
  
  const updateDictionary = (
    hashedBoard: string,
    callback: (updatedBoardDictionary: Record<string, number>) => void
  ): void => {
    setBoardDictionary(prevBoardDictionary => {
      let updatedBoardDictionary: Record<string, number>;
      if (prevBoardDictionary.hasOwnProperty(hashedBoard)) {
        updatedBoardDictionary = {
          ...prevBoardDictionary,
          [hashedBoard]: prevBoardDictionary[hashedBoard] + 1,
        };
      } else {
        updatedBoardDictionary = {
          ...prevBoardDictionary,
          [hashedBoard]: 1,
        };
      }
      callback(updatedBoardDictionary);
      return updatedBoardDictionary;
    });
  };

  const endTurn = (gameState : GameInterface) => {
    gameState.isWhiteMoving = !isWhiteMoving;
    gameState.piecesRemaining = 1000;
    gameState.isFirstAction = true;
    select(-1, -1, false);
  }

  const endGame = (isWinnerWhite: boolean | null) => {
    if (isWinnerWhite === null) {
      alert("Draw");
    } else if (isWinnerWhite) {
      alert("White wins!");
    } else {
      alert("Black wins!");
    }
  }

  const move = useCallback(
    (movingStackSize: number) => {
      try {
        setErrorMessage(null);
        if (nextSelection === null) throw new Error("No direction specified.");
        if (movingStackSize < 1) throw new Error("You must move at least one piece. Press space to end your turn.");
        if (selected === null) throw new Error("No square selected.");
        const row = selected[0];
        const col = selected[1];
        const nextBoard = _.cloneDeep(currentBoard);
        const stack = nextBoard[row][col];
        if (stack === null) return;

        const [nextRow, nextCol] = nextSelection;
        
        if (piecesRemaining < movingStackSize) movingStackSize = piecesRemaining;

        if (nextCol < 0 || nextCol >= BOARD_SIZE) throw new Error("Illegal move (out of bounds).");
        if (nextRow === BOARD_SIZE && isWhiteMoving) throw new Error("Illegal move (out of bounds).");
        if (nextRow === -1 && !isWhiteMoving) throw new Error("Illegal move (out of bounds).");

        let nextSquare = null;
        if (!(nextRow === BOARD_SIZE && !isWhiteMoving) &&
          !(nextRow === -1 && isWhiteMoving))
          nextSquare = nextBoard[nextRow][nextCol];
        
        const makeMoveResponse = makeMove(movingStackSize, nextBoard[row][col]!, nextSquare ?? "", isWhiteMoving, isFirstAction);
        
        let endzoneWhite = currentWhiteInEndzone;
        let endzoneBlack = currentBlackInEndzone;
        if (nextRow === BOARD_SIZE && !isWhiteMoving) {
          endzoneBlack += movingStackSize;
        } else if (nextRow === -1 && isWhiteMoving) {
          endzoneWhite += movingStackSize;
        } else {
          nextBoard[nextRow][nextCol] = makeMoveResponse.nextSquareCode;
        }
        nextBoard[row][col] = makeMoveResponse.origSquareCode;

        const isTurnOver = makeMoveResponse.isTurnOver;
        select(nextRow, nextCol, false);
        selectNext(null);

        let nextGameState : GameInterface = {board: nextBoard,
          whiteInEndzone: endzoneWhite,
          blackInEndzone: endzoneBlack,
          isWhiteMoving,
          piecesRemaining,
          isFirstAction};

        if (endzoneWhite >= 6)
          endGame(true);
        if (endzoneBlack >= 6)
          endGame(false);

        if (isViolatingFourOrFewerCondition(nextBoard, true)) {
          endGame(false);
        }
        if (isViolatingFourOrFewerCondition(nextBoard, false)) {
          endGame(true);
        }

        let nextSelectedForJSON : string | null = nextRow + "," + nextCol;
        if (isTurnOver || movingStackSize - makeMoveResponse.piecesUsedInMove < 1 || nextRow === BOARD_SIZE || nextRow === -1) {
          endTurn(nextGameState);
          nextSelectedForJSON = null;
        } else {
          nextGameState.piecesRemaining = movingStackSize - makeMoveResponse.piecesUsedInMove;
          nextGameState.isFirstAction = false;
        }

        setHistory((prevHistory) => [...prevHistory, nextGameState]);
        const stringifiedBoard = convertBoardToString(nextGameState);

        updateDictionary(stringifiedBoard, (newBoardDictionary) => {
          if (newBoardDictionary[stringifiedBoard] >= 3) endGame(null); // Threefold repetition
        });

        console.log(stringifiedBoard);

        updateGameState(stringifiedBoard, nextSelectedForJSON);

      } catch (e : any) {
        console.error(e);
        setErrorMessage(e.message);
      }
    },
    [selected, nextSelection, currentBoard, currentWhiteInEndzone, currentBlackInEndzone, history, isWhiteMoving, piecesRemaining, isFirstAction, boardDictionary]
  );
  

  return (
    <div className="gameDiv">
      <div className="boardDiv">
        <div ref={boardRef} tabIndex={0}>
          <Board
            board={history[history.length - 1].board}
            whiteInEndzone={currentWhiteInEndzone}
            blackInEndzone={currentBlackInEndzone}
            onSelect={select} // Pass select function as a prop
          />
          {showInput.visible && (
            <input
              ref={inputRef}
              value={inputData.value}
              onChange={handleChange}
              type="number"
              className="moveInput"
              style={{ position: 'absolute', top: showInput.top, left: showInput.left }}
              onKeyDown={handleInputSubmit}
            />
          )}
          <GameInformation 
            playerColor={playerColor}
            isWhiteMoving={isWhiteMoving} 
            piecesRemaining={piecesRemaining}
            errorMessage={errorMessage}
          />
        </div>
      </div>
      <button className="rules-toggle" onClick={toggleInstructions}>
        <i className="fa fa-info" style={{ fontSize: "24px" }}></i>
      </button>
      {showInstructions && <Instructions />}
    </div>
  );
}

export default Game;
