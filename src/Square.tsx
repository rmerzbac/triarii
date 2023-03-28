import React, { FC } from "react";

interface SquareProps {
  pieces: any;
  row: number;
  col: number;
  color: string;
  onSelect: (row: number, col: number) => void;
}

const Square: FC<SquareProps> = ({ pieces, row, col, color, onSelect }) => {
  const handleSelect = () => {
    onSelect(row, col);
  };

  return (
    <td
      className="square"
      style={{ backgroundColor: color }}
      id={row + "," + col}
      onClick={handleSelect}
    >
      {pieces}
    </td>
  );
};

export default Square;
