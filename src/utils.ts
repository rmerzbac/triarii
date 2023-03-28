const WHITE_PINNING = 1;
const BLACK_PINNING = -1;
const NO_PIN = 0;

interface SquareStatus {
  numWhitePieces: number;
  numBlackPieces: number;
  pinStatus: number;
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

  function getStackSize(isPinning: boolean) : number {
    return isPinning ? stackSizeToInt(0, pIndex - 1) : stackSizeToInt(pIndex + 1, code.length - 2);
  }

  const isStackPinned = pIndex === -1;
  if (isStackPinned) {
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
    const pIndex = code.indexOf('P');
    const isWhitePinning = isWhite(pIndex - 1);
    const whitePieces = getStackSize(isWhitePinning);
    const blackPieces = getStackSize(!isWhitePinning);
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

export function makeMove(movingStackSize: number, stackerCode: string, stackeeCode: string, isWhiteMoving: boolean): [string | null, string | null] {
  let stacker = parseCode(stackerCode);
  if (
    (isWhiteMoving && stacker.pinStatus === BLACK_PINNING) ||
    (!isWhiteMoving && stacker.pinStatus === WHITE_PINNING) ||
    (isWhiteMoving && stacker.numWhitePieces === 0) ||
    (!isWhiteMoving && stacker.numBlackPieces === 0)
  ) {
    throw new Error("Invalid move");
  }
  return [addStack(movingStackSize, stackeeCode, isWhiteMoving), removeStack(movingStackSize, stacker, isWhiteMoving)];
};

function addStack(stackerSize: number, stackeeCode: string, whiteMoving: boolean): string | null {
  let stackee = parseCode(stackeeCode);

  let newStack = {numWhitePieces: 0, numBlackPieces: 0, pinStatus: NO_PIN};
  if (whiteMoving) {
    newStack.numWhitePieces = stackee.numWhitePieces + stackerSize;
    newStack.pinStatus = stackee.numBlackPieces ? WHITE_PINNING : NO_PIN;
  } else {
    newStack.numBlackPieces = stackee.numBlackPieces + stackerSize;
    newStack.pinStatus = stackee.numWhitePieces ? BLACK_PINNING : NO_PIN;
  }
  return makeCode(newStack);
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