import React, { useState, useEffect, useCallback, useRef, ChangeEventHandler} from 'react';
import _ from 'lodash';
import PresentationLayer from './PresentationLayer';
import {makeMove, GameInterface, convertBoardToString, convertStringToBoard, isViolatingFourOrFewerCondition} from './gameLogic';
import { BOARD_SIZE, DEFAULT_PIECES_REMAINING, POLL_REQUEST_RATE } from './constants';
import {updateGameState, loadGameState} from './api';


interface GameProps {
  gameId: string;
  playerColor: string;
  token: string;
}

const Game = ({gameId, playerColor, token}: GameProps) => {
  // State hooks
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
      if (gameState.piecesRemaining === DEFAULT_PIECES_REMAINING) throw new Error("No move made.");
      selectNext(null);

      const nextGameState = _.cloneDeep(gameState);
      endTurn(nextGameState);

      setGameState(() => nextGameState);
      const stringifiedBoard = convertBoardToString(nextGameState);

      console.log(stringifiedBoard);

      updateGameState(gameId, token, stringifiedBoard, null);
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
  }, [selected, nextSelection, gameState]);

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

  const processNewGameState = (allBoards : any) => {
    const { boardCode, selected } = allBoards[0];
    // console.log(boardCode);
    const game = convertStringToBoard(boardCode);

    const parsedSelected = selected
      ? selected.split(",").map((value: string) => parseInt(value, 10))
      : [-1, -1];
    select(parseInt(parsedSelected[0], 10), parseInt(parsedSelected[1], 10), false);

    if (isThreeFoldRepetition(allBoards)) {
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

  const isThreeFoldRepetition = (allBoards: GameInterface[]) : boolean => {
    if (allBoards.length < 5) return false;
    let counter = 0;
    for (let i = 1; i < allBoards.length; i++) {
      if (gameState == allBoards[i]) {
        counter++;
        if (counter === 2) return true;
      }
    }
    return false;
  }

  const select = (row: number, col: number, isClick: boolean) => {
    if (gameState.isWhiteMoving ? playerColor === "black" : playerColor === "white") throw new Error("Not your turn.");

    if (isClick && !gameState.isFirstAction) return;

    if (isClick) {
      const nextGameState = _.cloneDeep(gameState);
      const stringifiedBoard = convertBoardToString(nextGameState);
      setGameState(() => nextGameState);
      updateGameState(gameId, token, stringifiedBoard, row + "," + col);
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
      
      if (nextRow === BOARD_SIZE && !gameState.isWhiteMoving) {
        document.getElementById("endzone-black")?.classList.add("selected-next");
      } else if (nextRow === -1 && gameState.isWhiteMoving) {
        document.getElementById("endzone-white")?.classList.add("selected-next");
      } else {
        document.getElementById(nextRow + "," + nextCol)?.classList.add("selected-next");
      }
      return [nextRow, nextCol];
    });
  }

  const endTurn = (gameState : GameInterface) => {
    gameState.isWhiteMoving = !gameState.isWhiteMoving;
    gameState.piecesRemaining = 1000;
    gameState.isFirstAction = true;
    select(-1, -1, false);
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
        select(nextRow, nextCol, false);
        selectNext(null);

        let nextGameState : GameInterface = {board: nextBoard,
          whiteInEndzone: endzoneWhite,
          blackInEndzone: endzoneBlack,
          isWhiteMoving: gameState.isWhiteMoving,
          piecesRemaining: gameState.piecesRemaining,
          isFirstAction: gameState.isFirstAction};

        let nextSelectedForJSON : string | null = nextRow + "," + nextCol;
        if (isTurnOver || movingStackSize - makeMoveResponse.piecesUsedInMove < 1 || nextRow === BOARD_SIZE || nextRow === -1) {
          endTurn(nextGameState);
          nextSelectedForJSON = null;
        } else {
          nextGameState.piecesRemaining = movingStackSize - makeMoveResponse.piecesUsedInMove;
          nextGameState.isFirstAction = false;
        }

        setGameState(() => nextGameState);
        const stringifiedBoard = convertBoardToString(nextGameState);

        console.log(stringifiedBoard);

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
      playerColor={playerColor}
      showInstructions={showInstructions}
      toggleInstructions={toggleInstructions}
      select={select}
      nextSelection={nextSelection}
      gameOver={gameOver}
    />
  );
}

export default Game;
