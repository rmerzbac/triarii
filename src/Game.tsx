import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import Board from './Board';
import {makeMove} from './utils';

let selected: number[] | null;

function select(row: number, col: number) {
  if (selected && selected[0] !== null && selected[1] !== null) {
    document.getElementById(selected[0] + "," + selected[1])?.classList.remove("selected");
  }
  selected = [row, col];
  document.getElementById(selected[0] + "," + selected[1])?.classList.add("selected");
}

const Game = () => {
  const [history, setHistory] = useState([
    {
      board: [
        [null, '6b', null, '6b', null, '6b'],
        ['4b', null, '4b', null, '4b', null],
        [null, '2b', null, '2b', null, '2b'],
        ['2w', null, '2w', null, '2w', null],
        [null, '4w', null, '4w', null, '4w'],
        ['6w', null, '6w', null, '6w', null],
      ],
    },
  ]);

  const [currentBoard, setCurrentBoard] = useState(history[history.length - 1].board);
  const [whiteToPlay, setWhiteToPlay] = useState(true);

  useEffect(() => {
    setCurrentBoard(history[history.length - 1].board);
  }, [history]);

  useEffect(() => {
    console.log('Updated history:', history);
  }, [history]);

  const move = useCallback(
    (dir: string) => {
      const nextBoard = _.cloneDeep(currentBoard);

      if (selected === null) return;
      const row = selected[0];
      const col = selected[1];
      const stack = nextBoard[row][col];
      if (stack === null) return;

      nextBoard[row][col] = null;
      let nextRow = row;
      let nextCol = col;
      if (dir === "u") {
        nextRow -= 1;
      }
      if (dir === "l") {
        nextCol -= 1;
      }
      if (dir === "d") {
        nextRow += 1;
      }
      if (dir === "r") {
        nextCol += 1;
      }

      // TODO: ADD REAL STACK SIZES
      [nextBoard[nextRow][nextCol], nextBoard[row][col]] = makeMove(12, nextBoard[row][col]!, nextBoard[nextRow][nextCol]!, whiteToPlay);
      select(nextRow, nextCol);



      setHistory((prevHistory) => [...prevHistory, { board: nextBoard }]);
      console.log('After update (new history will be logged by useEffect):', history);
      setWhiteToPlay(!whiteToPlay);
    },
    [currentBoard, history, whiteToPlay]
  );


  const handleKeyUp = (event: KeyboardEvent) => {
    event.preventDefault();
    if (event.code === 'ArrowUp') {
      move('u');
    } else if (event.code === 'ArrowRight') {
      move('r');
    } else if (event.code === 'ArrowDown') {
      move('d');
    } else if (event.code === 'ArrowLeft') {
      move('l');
    }
  };

  useEffect(() => {
    console.log('listener added');
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      // Clean up the listener when the component is unmounted
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [move]);

  // ...

  return (
    <div className="boardDiv">
      <div>
        <Board
          board={history[history.length - 1].board}
          onSelect={select} // Pass select function as a prop
        />
      </div>
    </div>
  );
};

export default Game;
