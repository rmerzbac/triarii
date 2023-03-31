import React, { useState, useEffect, useCallback, useRef, ChangeEventHandler} from 'react';
import _ from 'lodash';
import PresentationLayer from './PresentationLayer';
import {makeMove, GameInterface, convertBoardToString, convertStringToBoard, isThreefoldRepetition, isViolatingFourOrFewerCondition} from './gameLogic';
import { BOARD_SIZE, DEFAULT_PIECES_REMAINING, POLL_REQUEST_RATE } from './constants';
import {updateGameState, loadGameState} from './api';


interface GameProps {
  gameId: string;
  playerColor: string;
  token: string;
}

const Game = ({gameId, playerColor, token}: GameProps) => {
  // ------------------ STATE HOOKS ---------------------
  const [gameState, setGameState] = useState(
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
      piecesRemaining: DEFAULT_PIECES_REMAINING,
      isFirstAction: true
    });
  const [pollingInterval, setPollingInterval] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[] | null>(null);
  const [nextSelection, setNextSelection] = useState<number[] | null>(null);
  const [showInput, setShowInput] = useState({ visible: false, top: 0, left: 0 });
  const [inputData, setInputData] = useState({ value: "" });
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [endTurnButton, setEndTurnButton] = useState({ visible: false, top: 0, left: 0 });

  // ------------------ REFS ---------------------
  const inputRef = useRef<HTMLInputElement>(null);
  const endTurnButtonRef = useRef<HTMLButtonElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // ------------------ EVENT HANDLERS ---------------------
  const handleInputSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputRef.current) {
        const movingStackSize = parseInt(inputRef.current.value, 10);
        if (!isNaN(movingStackSize) && movingStackSize >= 0) {
          if (nextSelection) {
            move(movingStackSize);
          }
          hideInputBox();
        }
      }
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      initiateEndTurn();
      return;
    }

    /* if (inputRef.current === document.activeElement) return;
  
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
    event.preventDefault(); */
  }, [selected, nextSelection, gameState]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const target = event.target as HTMLInputElement;
    if (target) {
      setInputData({ ...inputData, value: target.value });
    }
  };

  const handleEndTurnButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    initiateEndTurn();
  }

  // ------------------ SHOW/HIDE ELEMENTS -------------------

  const showInputBox = (row: number, col: number) => {
    let square;
    if (row === -1) square = document.getElementById("endzone-white");
    else if (row === BOARD_SIZE) square = document.getElementById("endzone-black");
    else square = document.getElementById(row + ',' + col);
    if (square) {
      const rect = square.getBoundingClientRect();
      setShowInput({ visible: true, top: rect.top + rect.height, left: rect.left });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const showEndTurnButton = (row: number, col: number) => {
    let square;
    square = document.getElementById(row + ',' + col);
    if (square) {
      const rect = square.getBoundingClientRect();
      setEndTurnButton({ visible: true, top: rect.bottom, left: rect.left });
      console.log(rect.bottom + rect.height, rect.right);
    }
  }

  const hideEndTurnButton = () => {
    setEndTurnButton({ ...endTurnButton, visible: false })
  }

  const hideInputBox = () => {
    if (inputRef.current) inputRef.current.value = '';
    setShowInput({ ...showInput, visible: false });
    setInputData({ ...inputData, value: "" })
  }

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  // ------------------ USEEFFECT HOOKS ---------------------
  useEffect(() => {
    const fetchGameState = async () => {
      await loadGameState(gameId);
    };
  
    if (gameId) {
      fetchGameState();
    }
  }, [gameId, loadGameState]);  

  useEffect(() => {
    if (!pollingInterval) {
      const interval = setInterval(async () => {
        try {
          const allBoards = await loadGameState(gameId);
          processNewGameState(allBoards);
        } catch (error) {
          console.error('Error loading game state:', error);
        }
      }, POLL_REQUEST_RATE);
      setPollingInterval(interval);
    }
  
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [pollingInterval, loadGameState]);

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

  // ------------------ GAME STATE PROCESSING ---------------------
  const processNewGameState = (allBoards : any) => {
    const { boardCode, selected } = allBoards[0];
    // console.log(boardCode);
    const game = convertStringToBoard(boardCode);

    const parsedSelected = selected ?
      selected.split(",").map((value: string) => parseInt(value, 10)) : 
      [-1, -1];
    
    select(parseInt(parsedSelected[0], 10), parseInt(parsedSelected[1], 10));

    if (isThreefoldRepetition(allBoards)) {
      endGame(null, false); // Draw
    }

    if (game.whiteInEndzone >= 6) {
      console.log("White has 6 in endzone");
      endGame(true, false);
    }
    if (game.blackInEndzone >= 6) {
      endGame(false, false);
    }
    if (isViolatingFourOrFewerCondition(game.board, true)) {
      endGame(false, true);
    }
    if (isViolatingFourOrFewerCondition(game.board, false)) {
      endGame(true, true);
    }

    setGameState(() => game);
  }

  // ------------------ SELECTION ---------------------
  const isAdjacent = (row1: number, col1: number, row2: number, col2: number) : boolean => {
    // Endzones
    if (row1 === 0 && row2 === -1) return true;
    if (row2 === 0 && row1 === -1) return true;
    if (row1 === BOARD_SIZE && row2 === BOARD_SIZE - 1) return true;
    if (row2 === BOARD_SIZE && row1 === BOARD_SIZE - 1) return true;

    const rowAdjacency = (row1 - row2) ** 2; // 1 = adjacent, 0 = same
    const colAdjacency = (col1 - col2) ** 2
    return (rowAdjacency + colAdjacency) == 1; // One should be 1, one should be 0
  }

  const select = (row: number, col: number) => {
    setSelected((prevSelected) => {
      if (prevSelected && prevSelected[0] !== null && prevSelected[1] !== null) {
        document.getElementById(prevSelected[0] + "," + prevSelected[1])?.classList.remove("selected");
      }
      document.getElementById(row + "," + col)?.classList.add("selected");
      return [row, col]
    });
  }

  const deselectSelected = () => {
    setSelected((prevSelected) => {
      if (prevSelected && prevSelected[0] !== null && prevSelected[1] !== null) {
        document.getElementById(prevSelected[0] + "," + prevSelected[1])?.classList.remove("selected");
      }
      return null;
    });
  }

  const deselectNextSelection = () => {
    setNextSelection((prevSelected) => {
      if (prevSelected && prevSelected[0] !== null && prevSelected[1] !== null) {
        document.getElementById(prevSelected[0] + "," + prevSelected[1])?.classList.remove("selected-next");
      }
      document.getElementById("endzone-white")?.classList.remove("selected-next");
      document.getElementById("endzone-black")?.classList.remove("selected-next");
      return null;
    });
  }

  const deselectAll = () => {
    deselectNextSelection();
    deselectSelected();
  }

  const isOutOfBounds = (row: number, col: number) => {
    if (row < 0) return true;
    if (row >= BOARD_SIZE) return true;
    if (col < 0) return true;
    if (col >= BOARD_SIZE) return true;
    return false;
  }

  const handleClick = (row: number, col: number) => {
    if (gameOver !== null) return;
    if (gameState.isWhiteMoving ? playerColor === "black" : playerColor === "white") throw new Error("Not your turn.");

    // Nothing is selected
    if (!selected || (selected[0] === -1 && selected[1] === -1)) {
      if (isOutOfBounds(row, col)) return;
      select(row, col);
      const stringifiedBoard = convertBoardToString(gameState);
      updateGameState(gameId, token, stringifiedBoard, row+","+col);
    }

    // Something is selected
    // Selected thing is clicked && is first action (remove all selections)
    else if (gameState.isFirstAction && selected[0] === row && selected[1] === col) {
      deselectAll();
      hideInputBox();
      const stringifiedBoard = convertBoardToString(gameState);
      updateGameState(gameId, token, stringifiedBoard, null);
    }
    // Square adjacent to selected is clicked (select next)
    else if (isAdjacent(selected[0], selected[1], row, col)) {
      deselectNextSelection();
      if (row === BOARD_SIZE && !gameState.isWhiteMoving) {
        document.getElementById("endzone-black")?.classList.add("selected-next");
      } else if (row === -1 && gameState.isWhiteMoving) {
        document.getElementById("endzone-white")?.classList.add("selected-next");
      } else {
        document.getElementById(row + "," + col)?.classList.add("selected-next");
      }
      setNextSelection(() => [row, col]);
      showInputBox(row, col);
    }
    // Something else is clicked
    else {
      console.log("Must click adjacent square or deselect.")
    }
  }

  // ------------------ GAME ACTIONS (MOVE, END TURN, END GAME) ---------------------

  const initiateEndTurn = () => {
    if (gameState.piecesRemaining === DEFAULT_PIECES_REMAINING) throw new Error("No move made.");
    deselectAll();

    const nextGameState = _.cloneDeep(gameState);
    endTurn(nextGameState);

    setGameState(() => nextGameState);
    const stringifiedBoard = convertBoardToString(nextGameState);

    console.log(stringifiedBoard);

    updateGameState(gameId, token, stringifiedBoard, null);
    hideInputBox();
    hideEndTurnButton();
  }
  
  const endTurn = (gameState : GameInterface) => {
    gameState.isWhiteMoving = !gameState.isWhiteMoving;
    gameState.piecesRemaining = 1000;
    gameState.isFirstAction = true;
    deselectAll();
  }

  const endGame = useCallback((isWinnerWhite : boolean | null, isFOFViolation : boolean) => {
    if (isWinnerWhite === null) {
      setGameOver("Draw (threefold repetition).");
    } else {
      const winner = isWinnerWhite ? "White wins!" : "Black wins!"
      setGameOver(winner + (isFOFViolation ? " (Violation of \"Four or Fewer\" rule.)" : ""));
    }
    console.log(gameOver);
  },[gameOver]);

  const move = useCallback(
    (movingStackSize: number) => {
      try {
        setErrorMessage(null);
        if (nextSelection === null) throw new Error("No direction specified.");
        if (movingStackSize < 1) throw new Error("You must move at least one piece. Press space to end your turn.");
        if (selected === null) throw new Error("No square selected.");
        const row = selected[0];
        const col = selected[1];
        const nextBoard = _.cloneDeep(gameState.board);
        const stack = nextBoard[row][col];
        if (stack === null) return;

        const [nextRow, nextCol] = nextSelection;
        
        if (gameState.piecesRemaining < movingStackSize) movingStackSize = gameState.piecesRemaining;

        if (nextCol < 0 || nextCol >= BOARD_SIZE) throw new Error("Illegal move (out of bounds).");
        if (nextRow === BOARD_SIZE && gameState.isWhiteMoving) throw new Error("Illegal move (out of bounds).");
        if (nextRow === -1 && !gameState.isWhiteMoving) throw new Error("Illegal move (out of bounds).");

        let nextSquare = null;
        if (!(nextRow === BOARD_SIZE && !gameState.isWhiteMoving) &&
          !(nextRow === -1 && gameState.isWhiteMoving))
          nextSquare = nextBoard[nextRow][nextCol];
        
        const makeMoveResponse = makeMove(movingStackSize, nextBoard[row][col]!, nextSquare ?? "", gameState.isWhiteMoving, gameState.isFirstAction);
        
        let endzoneWhite = gameState.whiteInEndzone;
        let endzoneBlack = gameState.blackInEndzone;
        if (nextRow === BOARD_SIZE && !gameState.isWhiteMoving) {
          endzoneBlack += movingStackSize;
        } else if (nextRow === -1 && gameState.isWhiteMoving) {
          endzoneWhite += movingStackSize;
        } else {
          nextBoard[nextRow][nextCol] = makeMoveResponse.nextSquareCode;
        }
        nextBoard[row][col] = makeMoveResponse.origSquareCode;

        const isTurnOver = makeMoveResponse.isTurnOver;
        deselectNextSelection();
        select(nextRow, nextCol);

        let nextGameState : GameInterface = {board: nextBoard,
          whiteInEndzone: endzoneWhite,
          blackInEndzone: endzoneBlack,
          isWhiteMoving: gameState.isWhiteMoving,
          piecesRemaining: gameState.piecesRemaining,
          isFirstAction: gameState.isFirstAction};

        let nextSelectedForJSON : string | null = nextRow + "," + nextCol;
        if (isTurnOver || movingStackSize - makeMoveResponse.piecesUsedInMove < 1 || nextRow === BOARD_SIZE || nextRow === -1) {
          endTurn(nextGameState);
          hideEndTurnButton();
          nextSelectedForJSON = null;
        } else {
          showEndTurnButton(nextRow, nextCol);
          nextGameState.piecesRemaining = movingStackSize - makeMoveResponse.piecesUsedInMove;
          nextGameState.isFirstAction = false;
        }

        setGameState(() => nextGameState);
        const stringifiedBoard = convertBoardToString(nextGameState);

        updateGameState(gameId, token, stringifiedBoard, nextSelectedForJSON);

      } catch (e : any) {
        console.error(e);
        setErrorMessage(e.message);
      }
    },
    [selected, nextSelection, gameState]
  );
  

  return (
    <PresentationLayer
      boardRef={boardRef}
      currentBoard={gameState.board}
      currentWhiteInEndzone={gameState.whiteInEndzone}
      currentBlackInEndzone={gameState.blackInEndzone}
      isWhiteMoving={gameState.isWhiteMoving}
      piecesRemaining={gameState.piecesRemaining}
      errorMessage={errorMessage}
      showInput={showInput}
      inputData={inputData}
      inputRef={inputRef}
      handleInputSubmit={handleInputSubmit}
      handleChange={handleChange}
      handleClick={handleClick}
      playerColor={playerColor}
      showInstructions={showInstructions}
      toggleInstructions={toggleInstructions}
      nextSelection={nextSelection}
      gameOver={gameOver}
      endTurnButton={endTurnButton}
      handleEndTurnButton={handleEndTurnButton}
    />
  );
}

export default Game;
