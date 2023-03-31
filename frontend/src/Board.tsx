import React, { FC } from "react";
import Square from "./Square";
import Endzone from "./Endzone";
import { BOARD_SIZE } from "./constants";

export interface BoardProps {
  board: any;
  whiteInEndzone: number;
  blackInEndzone: number;
  onSelect: (row: number, col: number, isClick: boolean) => void;
}

function createGrid(onSelect: (row: number, col: number, isClick: boolean) => void): JSX.Element[] {
  let table: JSX.Element[] = [];
  table.push(<tr><td colSpan={6} onClick={() => onSelect(-1, 0, true)} className="endzone"></td></tr>);
  // Outer loop to create parent
  for (let i = 0; i < 6; i++) {
    let children: JSX.Element[] = [];
    // Inner loop to create children
    for (let j = 0; j < 6; j++) {
      children.push(<td id={("g" + i + "," + j)} onClick={() => onSelect(i, j, true)} className="square"></td>);
    }
    // Create the parent and add the children
    table.push(<tr>{children}</tr>);
  }
  table.push(<tr><td colSpan={6} onClick={() => onSelect(BOARD_SIZE, 0, true)} className="endzone"></td></tr>);
  return table;
}

function createBoard(board: any, whiteInEndzone: number, blackInEndzone: number, onSelect: (row: number, col: number, isClick: boolean) => void) {
  let table = [];
  table.push(<tr>{<Endzone color={"black"} pieces={whiteInEndzone} />}</tr>);
  // Outer loop to create parent
  for (let i = 0; i < 6; i++) {
    let children = [];
    // Inner loop to create children
    for (let j = 0; j < 6; j++) {
      children.push(
        <Square
          pieces={board[i][j]}
          row={i}
          col={j}
          color={
            (i % 2 || j % 2) && !(i % 2 && j % 2) ? "#7E2A7E" : "#FAF0F0"
          }
          onSelect={onSelect}
        />
      );
    }
    // Create the parent and add the children
    table.push(<tr>{children}</tr>);
  }
  table.push(<tr>{<Endzone color={"white"} pieces={blackInEndzone} />}</tr>);
  return table;
}

const Board: FC<BoardProps> = ({ board, whiteInEndzone, blackInEndzone, onSelect }) => {
  return (
    <div>
      <table className="grid" cellSpacing={0}>
        <tbody>{createGrid(onSelect)}</tbody>
      </table>
      <table cellSpacing={0}>
        <tbody>{createBoard(board, whiteInEndzone, blackInEndzone, onSelect)}</tbody>
      </table>
    </div>
  );
};

export default Board;
