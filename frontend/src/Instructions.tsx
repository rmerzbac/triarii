import React from "react";
import { start } from "repl";

import startingposition from "./instructionsImages/startingposition.png";


const Instructions = () => {
  return (
    <div className="instructions">
        <h4>Triarii Rules and Information</h4>
        <p>Welcome to Triarii! Triarii is an extremely easy game to learn, but it has remarkably 
            complex strategy. I hope you enjoy playing it! Please contact <a href="https://reidmerzbacher.com" target="_blank" rel="noreferrer">
            Reid Merzbacher</a>, the game's creator, at rmerzbacher@gmail.com for any questions, 
            feature requests, bugs, or general comments.</p>
        <h5>Overview</h5>
        <div className="image-formatter">
        <p>Triarii is played on a 6x6 board, with two endzones. Each player has 42 pieces, initially arranged 
            in stacks of 4 and 6, as shown on the right.
        </p>
        <img src={startingposition}/>
        </div>
        <h5>Ending the game</h5>
        <p>A player wins if they get 6 or more pieces in their opponent's endzone. A threefold 
            repetition is a draw.
        </p>
        <h5>Moves</h5>
        <p>On a player's turn, they can move a stack in one of two ways:</p>
        <ol><li>By <b>moving</b> the entire stack horizontally or vertically one space:
        <ul><li>A player can move into an empty space, into a space that they already control, or onto their 
            opponent's stack if they can <b>pin</b> them (described below).</li></ul>
        </li>
        <li>By <b>unstacking</b>:
        <ul><li>The player may make unlimited <b>moves</b>, but at least one piece must remain in each square, 
        including the starting square.</li></ul></li></ol>
        <p>Once pieces are placed in the endzone, they can never be moved again. (It also follows that 
            pieces can only be placed in the endzone as the final move in an unstacking.)</p>
        
        <h5>Pinning</h5>
        <ul><li>A player can <b>pin</b> one of their opponent's stacks, depending on the size of both stacks:
            <ul><li>A stack of size <b>1 - 4</b> can be pinned by a stack that is at least <b>double</b> in size.</li>
            <li>A stack of size <b>5 - 8</b> can be pinned by a stack that is <b>8 or greater</b>.</li>
            <li>A stack of size <b>9 - 12</b> can be pinned by a stack that is <b>4 or greater</b>.</li>
            <li>A stack <b>greater than 12</b> can be pinned by a stack that is <b>1 or greater</b>.</li>
        </ul>
        </li>
        <li>Following the turn that a stack is pinned, only <b>one piece</b> is needed to keep it pinned.</li>
        <li>The pinned stack cannot be moved until:
            <ol><li>The other player vacates the square.</li>
            <li>The pinned player pins the pinning stack. The previously pinned pieces now join the rest of 
                the pinning stack—they do not count toward the number needed to pin the opponent.</li></ol> 
        </li>
        </ul>
        <h5>Who were the Triarii?</h5>
        <p>The Triarii were one of the three main infantry types in the Roman Republic's military during 
        the mid-Republican period (4th to 3rd centuries BCE). They were the most experienced and seasoned 
        soldiers in the Roman legions, typically older men who had already served multiple campaigns.</p>

        <p>The Roman army of this period was structured around the manipular system, with soldiers divided 
        into three lines according to their experience and equipment. The first line was composed of the 
        youngest and least experienced soldiers, called Hastati. The second line was made up of more 
        experienced soldiers, known as Principes. The Triarii formed the third and final line of defense.</p>

        <p>Equipped with a large rectangular shield called the scutum, a spear called the hasta, and a short 
        sword called the gladius, the Triarii were expected to hold their ground and provide a strong, 
        reliable backbone for the legion. In battle, they would usually only engage in combat if the 
        Hastati and Principes were unable to repel the enemy. There was a saying in Latin, "res ad 
        triarios venit," which translates to "it has come to the Triarii," meaning that a situation had 
        become serious or desperate. (Source: ChatGPT)</p>
        
    </div>
  );
};

export default Instructions;
