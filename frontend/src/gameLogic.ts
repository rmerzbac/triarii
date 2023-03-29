import { BOARD_SIZE, WHITE_PINNING, BLACK_PINNING, NO_PIN, DEFAULT_PIECES_REMAINING } from './constants';

interface SquareStatus {
  numWhitePieces: number;
  numBlackPieces: number;
  pinStatus: number;
}

export interface MakeMoveResponse {
  nextSquareCode: string | null;
  origSquareCode: string | null;
  isTurnOver: boolean;
  piecesUsedInMove: number;
}

export interface GameInterface {
  board: (string | null)[][],
  whiteInEndzone: number,
  blackInEndzone: number,
  isWhite: boolean,
  piecesRemaining: number,
  isFirstAction: boolean
}

export function convertBoardToString(boardState: GameInterface): string {
  let str = "//";
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      str += boardState.board[i][j] ?? "_";
      str += "/";
    }
    str += "/";
  }
  str += boardState.whiteInEndzone + "," + boardState.blackInEndzone;
  str += boardState.isWhite + ",";
  str += (boardState.piecesRemaining === DEFAULT_PIECES_REMAINING ? "MAX" : boardState.piecesRemaining) + ",";
  str += boardState.isFirstAction + "//";

  console.log(str);
  return str; 
}

function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'true';
}

export function convertStringToBoard(code: string): GameInterface {
  const split = code.split("//");
  console.log(split);
  let board = [];
  for (let i = 1; i <= BOARD_SIZE; i++) {
    let squares : (string | null)[] = split[i].split("/");
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (squares[j] === '_') squares[j] = null;
    }
    board.push(squares);
  }
  console.log(board);
  const [whiteInEndzone, blackInEndzone, isWhite, piecesRemaining, isFirstAction] = split[BOARD_SIZE+1].split(",");
  return {
    board,
    whiteInEndzone: parseInt(whiteInEndzone, 10),
    blackInEndzone: parseInt(blackInEndzone, 10),
    isWhite: parseBoolean(isWhite),
    piecesRemaining: parseInt(piecesRemaining, 10),
    isFirstAction: parseBoolean(isFirstAction),
  };
}


export function parseCode(code: string) : SquareStatus {
  if (code === null || code === "") return {numWhitePieces: 0, numBlackPieces: 0, pinStatus: NO_PIN};
  const pIndex = code.indexOf('P'); 

  function isWhite(index: number) {
    return code.charAt(index) === 'w';
  }

  function stackSizeToInt(startIndex: number, endIndex: number) : number {
    return parseInt(code.substring(startIndex, endIndex));
  }

  function getStackSizeFromCode(isPinning: boolean) : number {
    return isPinning ? stackSizeToInt(0, pIndex - 1) : stackSizeToInt(pIndex + 1, code.length - 1);
  }

  const isStackPinned = pIndex !== -1;
  if (!isStackPinned) {
    const count = stackSizeToInt(0, code.length - 1);
    // check if stack is white or black and then return the stack sizes and pin status (NO_PIN)
    return isWhite(code.length - 1) ? 
      { numWhitePieces: count, 
      numBlackPieces: 0, 
      pinStatus: NO_PIN } : 
      { numWhitePieces: 0, 
      numBlackPieces: count, 
      pinStatus: NO_PIN };
  } else {
    const isWhitePinning = isWhite(pIndex - 1);
    const whitePieces = getStackSizeFromCode(isWhitePinning);
    const blackPieces = getStackSizeFromCode(!isWhitePinning);
    const pinStatus = isWhitePinning ? WHITE_PINNING : BLACK_PINNING; 
    return {
      numWhitePieces : whitePieces, 
      numBlackPieces : blackPieces,
      pinStatus : pinStatus
    };
  }
};

export function makeCode(square: SquareStatus) : string | null {
  if (square.numWhitePieces === 0 && square.numBlackPieces === 0) return null;
  if (square.pinStatus === NO_PIN) {
    const isStackWhite = square.numWhitePieces !== 0;
    return isStackWhite ? square.numWhitePieces + "w" : square.numBlackPieces + "b";
  } else {
    const isWhitePinning = square.pinStatus === WHITE_PINNING;
    // return stack code with pinning format (<pinning stack>P<pinned stack>)
    return  isWhitePinning ? 
      square.numWhitePieces + "wP" + square.numBlackPieces + "b" : 
      square.numBlackPieces + "bP" + square.numWhitePieces + "w";
  }
};

function getStackSize(stack: SquareStatus, isWhite: boolean) {
  return isWhite ? stack.numWhitePieces : stack.numBlackPieces;
}

function isPinning(stack: SquareStatus, isWhite: boolean) : boolean {
  return isWhite ? stack.pinStatus === WHITE_PINNING : stack.pinStatus === BLACK_PINNING;
}

function isPrimaryStackWhite(stackCode: string): boolean {
  const wIndex = stackCode.indexOf('w');
  const bIndex = stackCode.indexOf('b');
  if (wIndex === -1) return false;
  if (bIndex === -1) return true;
  return wIndex < bIndex;
}

function getPiecesUsedInMove(stackerSize: number, stackee: SquareStatus, isWhiteMoving: boolean) : number {
  if (isPinning(stackee, isWhiteMoving)) return 1;
  const opponentSize = getStackSize(stackee, !isWhiteMoving);
  if (opponentSize === 0) return 1; // no pieces in square
  if (opponentSize > 8) return 1; // oversized stacks can always be pinned by one piece
  if (opponentSize <= stackerSize / 2) return opponentSize * 2;
  else throw new Error("Opponent cannot be stacked");
}

function addStack(stackerSize: number, stackee: SquareStatus, isWhiteMoving: boolean): string | null {

  if (isWhiteMoving) {
    stackee.numWhitePieces += stackerSize;
    stackee.pinStatus = stackee.numBlackPieces ? WHITE_PINNING : NO_PIN;
  } else {
    stackee.numBlackPieces += stackerSize;
    stackee.pinStatus = stackee.numWhitePieces ? BLACK_PINNING : NO_PIN;
  }
  return makeCode(stackee);
};

function subtractPieces(stackSize: number, removedPieces: number) : number{
  let newStackSize = stackSize - removedPieces;
  return newStackSize < 0 ? 0 : newStackSize;
}

function removeStack(numMovingPieces: number, stack: SquareStatus, isWhiteMoving: boolean) : string | null {
  const newStackSize = subtractPieces(isWhiteMoving ? stack.numWhitePieces : stack.numBlackPieces, numMovingPieces);
  const whitePieces = isWhiteMoving ? newStackSize : stack.numWhitePieces;
  const blackPieces = isWhiteMoving ? stack.numBlackPieces : newStackSize;
  const pinStatus = newStackSize === 0 ? NO_PIN : stack.pinStatus;
  return makeCode({numWhitePieces: whitePieces, numBlackPieces: blackPieces, pinStatus: pinStatus});
}

export function makeMove(movingStackSize: number, stackerCode: string, stackeeCode: string, isWhiteMoving: boolean, isFirstAction: boolean): MakeMoveResponse {
  let isTurnOver = false;
  let stacker = parseCode(stackerCode);
  let stackee = parseCode(stackeeCode);
  if (
    (isWhiteMoving && stacker.pinStatus === BLACK_PINNING) ||
    (!isWhiteMoving && stacker.pinStatus === WHITE_PINNING) ||
    (isWhiteMoving && stacker.numWhitePieces === 0) ||
    (!isWhiteMoving && stacker.numBlackPieces === 0)
  ) {
    throw new Error("Invalid move");
  }
  const stackSizeToMove = isWhiteMoving ? stacker.numWhitePieces : stacker.numBlackPieces;
  if (movingStackSize > stackSizeToMove) movingStackSize = stackSizeToMove;
  if (isFirstAction && getStackSize(stacker, isWhiteMoving) === movingStackSize) // Entire stack being moved
    isTurnOver = true;
  const piecesUsedInMove = getPiecesUsedInMove(movingStackSize, stackee, isWhiteMoving);
  return {nextSquareCode: addStack(movingStackSize, stackee, isWhiteMoving), 
    origSquareCode: removeStack(movingStackSize, stacker, isWhiteMoving),
    isTurnOver: isTurnOver,
    piecesUsedInMove: piecesUsedInMove
  };
};

function convertBoardToBooleans(board: (string | null)[][], isWhite: boolean) : (boolean | null)[][] {
  let convertedBoard : (boolean | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const square = board[i][j];
      if (square) {
        const isStackWhite = isPrimaryStackWhite(square);
        if (isStackWhite !== isWhite) {
          const stack = parseCode(square);
          const stackSize = isStackWhite ? stack.numWhitePieces : stack.numBlackPieces;
          convertedBoard[i][j] = stackSize <= 4;
        }
      }
    }
  }
  return convertedBoard;
}

function isInBounds(row: number, col: number) {
  if (row < 0) return false;
  if (row >= BOARD_SIZE) return false;
  if (col < 0) return false;
  if (col >= BOARD_SIZE) return false;
  return true;
}

function conditionalAddToQueue(row: number, col: number, stack: [number, number][], visited: Set<String>) {
  if (!isInBounds(row, col)) return;
  if (visited.has(`${row},${col}`)) return;
  stack.push([row, col]);
}

export function isViolatingFourOrFewerCondition(board: (string | null)[][], isWhite: boolean) : boolean {
  const convertedBoard = convertBoardToBooleans(board, !isWhite);
  console.log(convertedBoard);
  
  const stack : [number, number][] = [];
  const visited : Set<string> = new Set();
  
  isWhite ? stack.push([0, 0]) : stack.push([BOARD_SIZE - 1, BOARD_SIZE - 1]); // starting position

  while (stack.length > 0) {
    const [row, col] = stack.pop() as [number, number];
    visited.add(`${row},${col}`);
    if (convertedBoard[row][col] === null) {
      conditionalAddToQueue(row-1, col, stack, visited);
      conditionalAddToQueue(row+1, col, stack, visited);
      conditionalAddToQueue(row, col-1, stack, visited);
      conditionalAddToQueue(row, col+1, stack, visited);
    }
    if (convertedBoard[row][col]) return false;
  }

  return true;
}