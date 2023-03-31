  export const loadGameState = async (gameId: string) => {
    try {
      const response = await fetch(process.env.REACT_APP_DOMAIN + `game/${gameId}`);
      const allBoards = await response.json();
      return allBoards;
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };
  
  export const updateGameState = async (
    gameId: string,
    token: string,
    boardCode: string,
    selected: string | null,
  ) => {
    console.log("Sending game state to server");
    try {
      await fetch(process.env.REACT_APP_DOMAIN + `game/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boardCode, selected }),
      });
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  };
  
  export const createNewGame = async (boardCode: string) => {
    try {
      const response = await fetch(process.env.REACT_APP_DOMAIN + 'game/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardCode }),
      });
  
      const { id } = await response.json();
      return id;
    } catch (error) {
      console.error('Error creating a new game:', error);
    }
  };
  
  export const joinGame = async (gameId: string, token?: string) => {
    try {
      const joinResponse = await fetch(process.env.REACT_APP_DOMAIN + 'join/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, token }),
      });
  
      const joinData = await joinResponse.json();
      return joinData;
    } catch (error) {
      console.error('Error joining the game:', error);
    }
  };