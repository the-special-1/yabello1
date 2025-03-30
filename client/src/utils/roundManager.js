// Function to get the current round number from the server
export const getRoundNumber = async (branchId) => {
  try {
    // Return 1 if no branchId is provided
    if (!branchId) {
      console.warn('No branchId provided to getRoundNumber');
      return 1;
    }

    const response = await fetch(`/api/rounds/current/${branchId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      if (response.status === 400) {
        console.warn('Invalid branch ID provided');
        return 1;
      }
      throw new Error('Failed to get round number');
    }

    const data = await response.json();
    return data.currentRound;
  } catch (error) {
    console.error('Error getting round number:', error);
    return 1; // Default to 1 if there's an error
  }
};

// Function to increment the round number
export const incrementRound = async (branchId) => {
  try {
    if (!branchId) {
      console.warn('No branchId provided to incrementRound');
      return null;
    }

    const response = await fetch(`/api/rounds/increment/${branchId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      if (response.status === 400) {
        console.warn('Invalid branch ID provided');
        return null;
      }
      throw new Error('Failed to increment round');
    }

    const data = await response.json();
    return data.currentRound;
  } catch (error) {
    console.error('Error incrementing round:', error);
    return null;
  }
};

// Function to set a specific round number
export const setRoundNumber = async (branchId, roundNumber) => {
  if (!branchId || typeof roundNumber !== 'number' || roundNumber < 1) {
    console.warn('Invalid parameters provided to setRoundNumber');
    return null;
  }

  try {
    const response = await fetch(`/api/rounds/set/${branchId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roundNumber })
    });

    if (!response.ok) {
      if (response.status === 400) {
        console.warn('Invalid branch ID provided');
        return null;
      }
      throw new Error('Failed to set round number');
    }

    const data = await response.json();
    return data.currentRound;
  } catch (error) {
    console.error('Error setting round number:', error);
    return null;
  }
};

// Function to reset round number to 1
export const resetRoundNumber = async (branchId) => {
  try {
    if (!branchId) {
      console.warn('No branchId provided to resetRoundNumber');
      return null;
    }

    const response = await fetch(`/api/rounds/reset/${branchId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      if (response.status === 400) {
        console.warn('Invalid branch ID provided');
        return null;
      }
      throw new Error('Failed to reset round number');
    }

    const data = await response.json();
    return data.currentRound;
  } catch (error) {
    console.error('Error resetting round number:', error);
    return null;
  }
};
