import React, { useState, useEffect, useCallback, useRef, ChangeEventHandler} from 'react';
import _ from 'lodash';
import Board from './Board';
import {makeMove, MakeMoveResponse} from './gameLogic';

let selected: number[] | null;

function select(row: number, col: number) {
  if (selected && selected[0] !== null && selected[1] !== null) {
    document.getElementById(selected[0] + "," + selected[1])?.classList.remove("selected");
  }
  if (row === -1 || col === -1) {
    selected = null;
    return;
  }
  selected = [row, col];
  document.getElementById(selected[0] + "," + selected[1])?.classList.add("selected");
}

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
    },
  ]);
  
  const DEFAULT_PIECES_REMAINING = 1000; // Arbitrary number larger than the max stack size
  const [currentBoard, setCurrentBoard] = useState(history[history.length - 1].board);
  const [whiteToPlay, setWhiteToPlay] = useState(true);
  const [piecesRemaining, setPiecesRemaining] = useState(DEFAULT_PIECES_REMAINING);
  const [isFirstAction, setIsFirstAction] = useState(true);

  useEffect(() => {
    setCurrentBoard(history[history.length - 1].board);
  }, [history]);

  useEffect(() => {
    console.log('Updated history:', history);
  }, [history]);

  const [showInput, setShowInput] = useState({ visible: false, top: 0, left: 0 });
  const [inputData, setInputData] = useState({value: ""})
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

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
    setWhiteToPlay(!whiteToPlay);
    setPiecesRemaining(1000);
    setIsFirstAction(true);
    select(-1, -1);
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
      
      const makeMoveResponse = makeMove(movingStackSize, nextBoard[row][col]!, nextBoard[nextRow][nextCol]!, whiteToPlay, isFirstAction);
      nextBoard[nextRow][nextCol] = makeMoveResponse.nextSquareCode;
      nextBoard[row][col] = makeMoveResponse.origSquareCode;
      const isTurnOver = makeMoveResponse.isTurnOver;
      select(nextRow, nextCol);

      setHistory((prevHistory) => [...prevHistory, { board: nextBoard }]);
      console.log('After update (new history will be logged by useEffect):', history);
      if (isTurnOver || movingStackSize === 1) {
        endTurn();
      } else {
        setPiecesRemaining(movingStackSize - 1);
        setIsFirstAction(false);
      }
    },
    [currentBoard, history, whiteToPlay, piecesRemaining, isFirstAction]
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
  


  const handleKeyDown = (event: KeyboardEvent) => {
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
  };
  
  
  
  useEffect(() => {
    console.log('listener added');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Clean up the listener when the component is unmounted
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [move]);  

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
        <p>Current player: {whiteToPlay ? "White" : "Black"}</p>
        <p>{piecesRemaining === DEFAULT_PIECES_REMAINING ? "" : "Pieces remaining: " + piecesRemaining}</p>
      </div>
    </div>
  );
}

export default Game;
