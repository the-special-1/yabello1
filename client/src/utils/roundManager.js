const getRoundNumber = () => {
  const now = new Date();
  const today = now.toLocaleDateString();
  const lastRoundDate = localStorage.getItem('lastRoundDate');
  let roundCount = parseInt(localStorage.getItem('bingoRoundCount') || '1');

  if (lastRoundDate !== today) {
    // Reset round count at the start of a new day
    roundCount = 1;
    localStorage.setItem('bingoRoundCount', roundCount.toString());
    localStorage.setItem('lastRoundDate', today);
  }

  return roundCount;
};

const incrementRound = () => {
  const roundCount = getRoundNumber();
  localStorage.setItem('bingoRoundCount', (roundCount + 1).toString());
  return roundCount + 1;
};

export { getRoundNumber, incrementRound };
