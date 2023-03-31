  export const loadGameState = async (gameId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/game/${gameId}`);
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
    try {
      await fetch(`http://localhost:3001/game/${gameId}`, {
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
  