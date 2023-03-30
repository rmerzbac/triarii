import React, { FC } from "react";
import {
  Link
} from 'react-router-dom';

interface TitleProps {
  title: string;
}

const Title: FC<TitleProps> = (props) => {
  return <h1><Link to="/">{props.title}</Link></h1>;
};

export default Title;
