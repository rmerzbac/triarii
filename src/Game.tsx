import React, { useState, useEffect, useCallback, useRef, ChangeEventHandler} from 'react';
import _ from 'lodash';
import Board from './Board';
import {makeMove, MakeMoveResponse, convertBoardToString, isViolatingFourOrFewerCondition} from './gameLogic';
import { BOARD_SIZE, DEFAULT_PIECES_REMAINING } from './constants';


const Game = () => {
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
    },
  ]);

  function select(row: number, col: number, isClick: boolean) {
    if (isClick && !isFirstAction) return;
  
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
  
  const [selected, setSelected] = useState<number[] | null>(null);
  const [currentBoard, setCurrentBoard] = useState(history[history.length - 1].board);
  const [currentWhiteInEnzone, setCurrentWhiteInEndzone] = useState(history[history.length - 1].whiteInEndzone);
  const [currentBlackInEnzone, setCurrentBlackInEndzone] = useState(history[history.length - 1].blackInEndzone);
  const [isWhiteMoving, setIsWhiteMoving] = useState(true);
  const [piecesRemaining, setPiecesRemaining] = useState(DEFAULT_PIECES_REMAINING);
  const [isFirstAction, setIsFirstAction] = useState(true);

  useEffect(() => {
    setCurrentBoard(history[history.length - 1].board);
    setCurrentWhiteInEndzone(history[history.length - 1].whiteInEndzone);
    setCurrentBlackInEndzone(history[history.length - 1].blackInEndzone);
  }, [history]);

  useEffect(() => {
    console.log('Updated history:', history);
  }, [history]);

  const [showInput, setShowInput] = useState({ visible: false, top: 0, left: 0 });
  const [inputData, setInputData] = useState({value: ""})
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

  const [boardDictionary, setBoardDictionary] = useState<Record<string, number>>({});
  useEffect(() => {
    console.log('Updated dictionary:', boardDictionary);
  }, [boardDictionary]);
  
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

  const endTurn = () => {
    setIsWhiteMoving(!isWhiteMoving);
    setPiecesRemaining(1000);
    setIsFirstAction(true);
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
    (movingStackSize: number, dir: string) => {
      if (movingStackSize < 1) throw new Error("You must move at least one piece. Press space to end your turn.");
      if (selected === null) return;
      const row = selected[0];
      const col = selected[1];
      const nextBoard = _.cloneDeep(currentBoard);
      const stack = nextBoard[row][col];
      if (stack === null) return;

      let nextRow = row;
      let nextCol = col;
      if (dir === "u") {
        nextRow -= 1;
      }
      if (dir === "l") {
        nextCol -= 1;
      }
      if (dir === "d") {
        nextRow += 1;
      }
      if (dir === "r") {
        nextCol += 1;
      }
      
      if (piecesRemaining < movingStackSize) movingStackSize = piecesRemaining;

      if (nextCol < 0 || nextCol >= BOARD_SIZE) throw new Error("Out of bounds");
      if (nextRow === BOARD_SIZE && isWhiteMoving) throw new Error("Out of bounds");
      if (nextRow === -1 && !isWhiteMoving) throw new Error("Out of bounds");

      let nextSquare = null;
      if (!(nextRow === BOARD_SIZE && !isWhiteMoving) &&
        !(nextRow === -1 && isWhiteMoving))
        nextSquare = nextBoard[nextRow][nextCol];
      
      const makeMoveResponse = makeMove(movingStackSize, nextBoard[row][col]!, nextSquare ?? "", isWhiteMoving, isFirstAction);
      
      let endzoneWhite = currentWhiteInEnzone;
      let endzoneBlack = currentBlackInEnzone;
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

      if (endzoneWhite >= 6)
        endGame(true);
      if (endzoneBlack >= 6)
        endGame(false);
      
      const stringifiedBoard = convertBoardToString({board: nextBoard, whiteInEndzone: endzoneWhite, blackInEndzone: endzoneBlack});

      updateDictionary(stringifiedBoard, (newBoardDictionary) => {
        if (newBoardDictionary[stringifiedBoard] >= 3) endGame(null); // Threefold repetition
        console.log(newBoardDictionary);
      });

      if (isViolatingFourOrFewerCondition(nextBoard, true)) {
        endGame(false);
      }
      if (isViolatingFourOrFewerCondition(nextBoard, false)) {
        endGame(true);
      }

      setHistory((prevHistory) => [...prevHistory, { board: nextBoard, whiteInEndzone: endzoneWhite, blackInEndzone: endzoneBlack}]);
      if (isTurnOver || movingStackSize - makeMoveResponse.piecesUsedInMove <= 1 || nextRow === BOARD_SIZE || nextRow === -1) {
        endTurn();
      } else {
        setPiecesRemaining(movingStackSize - makeMoveResponse.piecesUsedInMove);
        setIsFirstAction(false);
      }
    },
    [selected, currentBoard, currentWhiteInEnzone, currentBlackInEnzone, history, isWhiteMoving, piecesRemaining, isFirstAction, boardDictionary]
  );

  const handleInputSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputRef.current) {
        const movingStackSize = parseInt(inputRef.current.value, 10);
        if (!isNaN(movingStackSize) && movingStackSize >= 0) {
          if (selectedDirection) {
            move(movingStackSize, selectedDirection);
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
      endTurn();
      return;
    }

    if (inputRef.current === document.activeElement) return;
  
    if (!selected) return;
    if (event.code === 'ArrowUp') {
      setSelectedDirection('u');
      showInputBox(selected[0], selected[1]);
      event.preventDefault(); // Prevent arrow keys from scrolling the page
    } else if (event.code === 'ArrowRight') {
      setSelectedDirection('r');
      showInputBox(selected[0], selected[1]);
      event.preventDefault();
    } else if (event.code === 'ArrowDown') {
      setSelectedDirection('d');
      showInputBox(selected[0], selected[1]);
      event.preventDefault();
    } else if (event.code === 'ArrowLeft') {
      setSelectedDirection('l');
      showInputBox(selected[0], selected[1]);
      event.preventDefault();
    }
  }, [selected]);
  
  
  
  useEffect(() => {
    console.log('listener added');
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

  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="boardDiv">
      <div ref={boardRef} tabIndex={0}>
        <Board
          board={history[history.length - 1].board}
          whiteInEndzone={currentWhiteInEnzone}
          blackInEndzone={currentBlackInEnzone}
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
        <p>Current player: {isWhiteMoving ? "White" : "Black"}</p>
        <p>{piecesRemaining === DEFAULT_PIECES_REMAINING ? "" : "Pieces remaining: " + piecesRemaining}</p>
      </div>
    </div>
  );
}

export default Game;
