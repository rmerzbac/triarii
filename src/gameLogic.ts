const WHITE_PINNING = 1;
const BLACK_PINNING = -1;
const NO_PIN = 0;

interface SquareStatus {
  numWhitePieces: number;
  numBlackPieces: number;
  pinStatus: number;
}

export interface MakeMoveResponse {
  nextSquareCode: string | null;
  origSquareCode: string | null;
  isTurnOver: boolean;
}

export function parseCode(code: string) : SquareStatus {
  if (code === null) return {numWhitePieces: 0, numBlackPieces: 0, pinStatus: NO_PIN};
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

function validateMove(stackerSize: number, stackee: SquareStatus, isWhiteMoving: boolean) {
  if (isPinning(stackee, isWhiteMoving)) return;
  const opponentSize = getStackSize(stackee, !isWhiteMoving);
  if (opponentSize > 8) return; // oversized stacks can always be pinned
  if (opponentSize <= stackerSize / 2) return;
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
  validateMove(movingStackSize, stackee, isWhiteMoving);
  return {nextSquareCode: addStack(movingStackSize, stackee, isWhiteMoving), 
    origSquareCode: removeStack(movingStackSize, stacker, isWhiteMoving),
    isTurnOver: isTurnOver};
};