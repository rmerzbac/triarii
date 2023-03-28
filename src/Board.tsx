import React, { FC } from "react";
import Square from "./Square";
import Endzone from "./Endzone";


interface BoardProps {
  board: any;
  onSelect: (row: number, col: number) => void;
}

function createGrid(onSelect: (row: number, col: number) => void): JSX.Element[] {
  let table: JSX.Element[] = [];
  table.push(<tr><td colSpan={6} className="endzone"></td></tr>);
  // Outer loop to create parent
  for (let i = 0; i < 6; i++) {
    let children: JSX.Element[] = [];
    // Inner loop to create children
    for (let j = 0; j < 6; j++) {
      children.push(<td id={("g" + i + "," + j)} onClick={() => onSelect(i, j)} className="square"></td>);
    }
    // Create the parent and add the children
    table.push(<tr>{children}</tr>);
  }
  table.push(<tr><td colSpan={6} className="endzone"></td></tr>);
  return table;
}

function createBoard(board: any, onSelect: (row: number, col: number) => void) {
  let table = [];
  table.push(<tr>{<Endzone color={"white"} />}</tr>);
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
  table.push(<tr>{<Endzone color={"black"} />}</tr>);
  return table;
}

const Board: FC<BoardProps> = ({ board, onSelect }) => {
  return (
    <div>
      <table className="grid" cellSpacing={0}>
        <tbody>{createGrid(onSelect)}</tbody>
      </table>
      <table cellSpacing={0}>
        <tbody>{createBoard(board, onSelect)}</tbody>
      </table>
    </div>
  );
};

export default Board;
