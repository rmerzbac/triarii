import './App.css';
import React, { FC } from "react";
import { useState, useEffect } from 'react';
import cloneDeep from "lodash";

let selected: number[] | null;

interface TitleProps {
  title: string;
}
const Title: FC<TitleProps> = (props) => {
  return <h1>{props.title}</h1>;
};

interface SquareProps {
  color: string;
  row: number;
  col: number;
  pieces: number;
}
const Square: FC<SquareProps> = (props) => {
  return (
    <td
    className="square"
    style={{ "background": props.color }}
    id={props.row + "," + props.col}
    >
    {props.pieces}
    </td>
    );
};

function select(row: number, col: number) {
  if (selected && selected[0] !== null && selected[1] !== null) {
    document.getElementById(selected[0] + "," + selected[1])?.classList.remove("selected");
  }
  selected = [row, col];
  document.getElementById(selected[0] + "," + selected[1])?.classList.add("selected");
}

interface EndzoneProps {
  color: string;
}
const Endzone: FC<EndzoneProps> = (props) => {
  return (
    <td colSpan={6}
    className="endzone"
    style={{
      "background": props.color === "white" ? "#FAF0F0" : "#181818"
    }}
    >
    </td>
    );
};

// 1 = wPb, -1 = bPw, 0 = no pin
function parseCode(code: string) : number[] {
  if (code === null) return [0, 0, 0];
  if (!code.includes("P")) {
    const count = parseInt(code.substring(0, code.length - 1))
    return code.charAt(code.length - 1) === 'w' ? [count, 0, 0] : [0, count, 0];
  }
  return [0, 0, 0]; //not implemented
};

function makeCode(square: any) : string | null {
  if (square[0] === 0 && square[1] === 0) return null;
  if (square[2] === 0) return square[0] ? square[0] + "w" : square[1] + "b";
  else return square[2] === 1 ? square[0] + "wP" + square[1] + "b" : square[1] + "bP" + square[0] + "w";
};

function addStack(stacker: string, stackee: string, whiteMoving: boolean): string | null {
  let stackerCode = parseCode(stacker);
  let stackeeCode = parseCode(stackee);
  let pin = 0;
  if (whiteMoving) {
    stackeeCode[0] += stackerCode[0];
    pin = stackeeCode[1] ? 1 : 0;
  } else {
    stackeeCode[1] += stackerCode[1];
    pin = stackeeCode[0] ? -1 : 0;
  }
  stackeeCode[2] = pin;
  return makeCode(stackeeCode);
};

function createGrid(): JSX.Element[] {
  let table: JSX.Element[] = [];
  table.push(<tr><td colSpan={6} className="endzone"></td></tr>);
  // Outer loop to create parent
  for (let i = 0; i < 6; i++) {
    let children: JSX.Element[] = [];
    //Inner loop to create children
    for (let j = 0; j < 6; j++) {
      children.push(<td id={("g" + i + "," + j)} onClick={() => select(i, j)} className="square"></td>);
    }
    // Create the parent and add the children
    table.push(<tr>{children}</tr>);
  }
  table.push(<tr><td colSpan={6} className="endzone"></td></tr>);
  return table;
};

function createBoard(board: any) {
  let table = [];
  table.push(<tr>{<Endzone color={"white"} />}</tr>);
  // Outer loop to create parent
  for (let i = 0; i < 6; i++) {
    let children = [];
    //Inner loop to create children
    for (let j = 0; j < 6; j++) {
      children.push(

        <Square
        pieces={board[i][j]}
        row={i}
        col={j}
        color={
          (i % 2 || j % 2) && !(i % 2 && j % 2) ? "#7E2A7E" : "#FAF0F0"
        }
        />

        );
    }
    //Create the parent and add the children
    table.push(<tr>{children}</tr>);
  }
  table.push(<tr>{<Endzone color={"black"} />}</tr>);
  return table;
};

const Board = (props: any) => {
  return (
    <div>
    <table className="grid" cellSpacing={0}><tbody>{createGrid()}</tbody></table>
    <table cellSpacing={0}><tbody>{createBoard(props.board)}</tbody></table>
    </div>
    );
};

interface Props {}

interface State {
  history: any;
  whiteToPlay: boolean;
}


const Game = () => {
  const [history, setHistory] = useState([
    { board: [
      [null, "6b", null, "6b", null, "6b"],
      ["4b", null, "4b", null, "4b", null],
      [null, "2b", null, "2b", null, "2b"],
      ["2w", null, "2w", null, "2w", null],
      [null, "4w", null, "4w", null, "4w"],
      ["6w", null, "6w", null, "6w", null]
      ]}
    ]);
  console.log(history);
  const [whiteToPlay, setWhiteToPlay] = useState(true);
  
  useEffect(() => {
    console.log("listener added")
    document.addEventListener('keyup', event => {
      event.preventDefault();
      if (event.code === 'ArrowUp') {
        move("u");
      } else if (event.code === 'ArrowRight') {
        move("r");
      } else if (event.code === 'ArrowDown') {
        move("d");
      } else if (event.code === 'ArrowLeft') {
        move("l");
      }
    });
  }, []);

  const move = (dir: string) => {
    const _ = require('lodash');
    const board = history[history.length - 1].board;
    const nextBoard = _.cloneDeep(board);
    if (selected === null) return;
    const row = selected[0];
    const col = selected[1];
    const stack = nextBoard[row][col];

    nextBoard[row][col] = null;
    if (dir === "u") {
      nextBoard[row-1][col] = addStack(stack, nextBoard[row-1][col], true);
      select(row-1, col);
    }
    if (dir === "l") {
      nextBoard[row][col-1] = addStack(stack, nextBoard[row][col-1], true);
      select(row, col-1);
    }
    if (dir === "d") {
      nextBoard[row+1][col] = addStack(stack, nextBoard[row+1][col], true);
      select(row+1, col);
    }
    if (dir === "r") {
      nextBoard[row][col+1] = addStack(stack, nextBoard[row][col+1], true);
      select(row, col+1);
    }
    setHistory([...history, {board: nextBoard}]);
    setWhiteToPlay(!whiteToPlay);
  }
  
  return (
    <div className="boardDiv">
    <div>
    <Board
    board={history[history.length-1].board}
          //onClick={i => this.handleClick(i)}
    />

    </div>
    </div>
    );

}

const App: React.FC = () => {
  return (
    <div>
    <div className="main">
    <Title title="TRIARII" />
    <Game />
    </div>
    </div>
    );
};


export default App;