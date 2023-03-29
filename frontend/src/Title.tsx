import React, { FC } from "react";
import {
  Link
} from 'react-router-dom';

interface TitleProps {
  title: string;
}

const Title: FC<TitleProps> = (props) => {
  return <Link to="/"><h1>{props.title}</h1></Link>;
};

export default Title;
