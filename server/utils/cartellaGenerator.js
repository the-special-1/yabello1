function generateCartellaNumbers() {
  // Initialize 5x5 grid with null values
  const grid = Array(5).fill(null).map(() => Array(5).fill(null));
  
  // Set the middle cell as free
  grid[2][2] = 'FREE';
  
  // Define number ranges for each column
  const columnRanges = [
    [1, 15],   // B: 1-15
    [16, 30],  // I: 16-30
    [31, 45],  // N: 31-45
    [46, 60],  // G: 46-60
    [61, 75]   // O: 61-75
  ];

  // Fill each column with unique numbers from its range
  for (let col = 0; col < 5; col++) {
    const [min, max] = columnRanges[col];
    const numbers = [];
    
    // Generate pool of numbers for this column
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    
    // Pick 5 numbers for this column (or 4 for middle column)
    const count = col === 2 ? 4 : 5; // Middle column needs only 4 numbers due to FREE space
    for (let i = 0; i < count; i++) {
      numbers.push(pool[i]);
    }
    
    // Sort numbers in ascending order
    numbers.sort((a, b) => a - b);
    
    // Place numbers in the grid
    let numIndex = 0;
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) continue; // Skip middle cell
      grid[row][col] = numbers[numIndex++];
    }
  }
  
  return grid;
}

module.exports = { generateCartellaNumbers };
