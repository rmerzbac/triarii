import React, { FC } from "react";

interface EndzoneProps {
  color: string;
  pieces: number;
}

const Endzone: FC<EndzoneProps> = (props) => {
  return (
    <td
      colSpan={6}
      className="endzone"
      id={"endzone-" + (props.color === "white" ? "black" : "white")}
      style={{
        "background": props.color === "white" ? "#FAF0F0" : "#181818",
        "color": props.color === "white" ? "black" : "white"
      }}
    >{props.pieces}/6</td>
  );
};

export default Endzone;
