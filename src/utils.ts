const WHITE_PINNING = 1;
const BLACK_PINNING = -1;
const NO_PIN = 0;

interface SquareStatus {
  numWhitePieces: number;
  numBlackPieces: number;
  pinStatus: number;
}

export function parseCode(code: string) : number[] {
  if (code === null) return [0, 0, NO_PIN];
  const pIndex = code.indexOf('P'); 

  function isWhite(index: number) {
    return code.charAt(index) === 'w';
  }

  function stackSizeToInt(startIndex: number, endIndex: number) {
    return parseInt(code.substring(startIndex, endIndex));
  }

  function getStackSize(isPinning: boolean) {
    return isPinning ? stackSizeToInt(0, pIndex - 1) : stackSizeToInt(pIndex + 1, code.length - 2);
  }

  const isStackPinned = pIndex === -1;
  if (isStackPinned) {
    const count = stackSizeToInt(0, code.length - 1);
    // check if stack is white or black and then return the stack sizes and pin status (NO_PIN)
    return isWhite(code.length - 1) ? [count, 0, NO_PIN] : [0, count, NO_PIN];
  } else {
    const pIndex = code.indexOf('P');
    const isWhitePinning = isWhite(pIndex - 1);
    const whitePieces = getStackSize(isWhitePinning);
    const blackPieces = getStackSize(!isWhitePinning);
    return [whitePieces, blackPieces, isWhitePinning ? WHITE_PINNING : BLACK_PINNING];
  }
};

export function makeCode(square: [number, number, number]) : string | null {
  const [numWhite, numBlack, pinStatus] = square;
  if (numWhite === 0 && numBlack === 0) return null;
  if (pinStatus === NO_PIN) {
    const isStackWhite = numWhite !== 0;
    return isStackWhite ? numWhite + "w" : numBlack + "b";
  } else {
    const isWhitePinning = pinStatus === WHITE_PINNING;
    // return stack code with pinning format (<pinning stack>P<pinned stack>)
    return  isWhitePinning ? numWhite + "wP" + numBlack + "b" : numBlack + "bP" + numWhite + "w";
  }
};

export function addStack(stacker: string, stackee: string, whiteMoving: boolean): string | null {
  let [whiteStacker, blackStacker, stackerPinStatus] = parseCode(stacker);
  let [whiteStackee, blackStackee, stackeePinStatus] = parseCode(stackee);

  if (
    (whiteMoving && stackerPinStatus === BLACK_PINNING) ||
    (!whiteMoving && stackerPinStatus === WHITE_PINNING) ||
    (whiteMoving && whiteStacker === 0) ||
    (!whiteMoving && blackStacker === 0)
  ) {
    throw new Error("Invalid move");
  }

  let pinStatus;
  if (whiteMoving) {
    whiteStackee += whiteStacker;
    pinStatus = blackStackee ? WHITE_PINNING : NO_PIN;
  } else {
    blackStackee += blackStacker;
    pinStatus = whiteStackee ? BLACK_PINNING : NO_PIN;
  }
  return makeCode([whiteStackee, blackStackee, pinStatus]);
};