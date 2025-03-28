// Function to get the current round number from localStorage
export const getRoundNumber = () => {
  const saved = localStorage.getItem('bingoRoundCount');
  return saved ? parseInt(saved) : 1;
};

// Function to increment the round number
export const incrementRound = () => {
  const currentRound = getRoundNumber();
  const newRound = currentRound + 1;
  localStorage.setItem('bingoRoundCount', newRound.toString());
  return newRound;
};

// Function to set a specific round number
export const setRoundNumber = (roundNumber) => {
  if (typeof roundNumber === 'number' && roundNumber > 0) {
    localStorage.setItem('bingoRoundCount', roundNumber.toString());
  }
};

// Function to reset round number to 1
export const resetRoundNumber = () => {
  localStorage.setItem('bingoRoundCount', '1');
};
