import React, { FC } from "react";

interface EndzoneProps {
  color: string;
}

const Endzone: FC<EndzoneProps> = (props) => {
  return (
    <td
      colSpan={6}
      className="endzone"
      style={{
        "background": props.color === "white" ? "#FAF0F0" : "#181818",
      }}
    ></td>
  );
};

export default Endzone;
