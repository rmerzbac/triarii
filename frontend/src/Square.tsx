import React, { FC } from "react";
import WhitePiece from "./pieces/White.png";
import BlackPiece from "./pieces/Black.png";

interface SquareProps {
  pieces: any;
  row: number;
  col: number;
  color: string;
  onSelect: (row: number, col: number, isClick: boolean) => void;
}

function isWhite(code : string) {
  if (!code) return false;
  const wIndex = code.indexOf('w');
  const bIndex = code.indexOf('b');
  if (bIndex === -1) return true;
  if (wIndex === -1) return false;
  if (wIndex < bIndex) return true;
  return false;
}

export function getPieceImagePath(pieceCode: string): string {
  if (pieceCode)
    return isWhite(pieceCode) ? WhitePiece : BlackPiece;
  return "";
}

const Square: FC<SquareProps> = ({ pieces, row, col, color, onSelect }) => {
  const handleSelect = () => {
    onSelect(row, col, true);
  };

  return (
    <td
      className="square"
      style={{
        backgroundColor: color,
        color: !isWhite(pieces) ? "white" : "black"
      }}
      id={row + "," + col}
      onClick={handleSelect}
    >
      <div className="square-contents">
        <span className="piece-text">{pieces}</span>
        {pieces && (
          <img className="piece" src={getPieceImagePath(pieces)} alt={""}/>
        )}
      </div>
    </td>
  );
};

export default Square;
