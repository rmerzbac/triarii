import React, { FC } from "react";

interface TitleProps {
  title: string;
}

const Title: FC<TitleProps> = (props) => {
  return <h1>{props.title}</h1>;
};

export default Title;
