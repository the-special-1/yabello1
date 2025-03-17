import React from 'react';
import { Grid, Box } from '@mui/material';

const PATTERN_CONFIGS = {
  'Full House': Array(25).fill(true),
  'Top Line': Array(25).fill(false).map((_, i) => i < 5),
  'Middle Line': Array(25).fill(false).map((_, i) => i >= 10 && i < 15),
  'Bottom Line': Array(25).fill(false).map((_, i) => i >= 20),
  'Four Corners': Array(25).fill(false).map((_, i) => [0, 4, 20, 24].includes(i)),
  'T Pattern': Array(25).fill(false).map((_, i) => i < 5 || i % 5 === 2),
  'X Pattern': Array(25).fill(false).map((_, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;
    return row === col || row + col === 4;
  }),
  'L Pattern': Array(25).fill(false).map((_, i) => i >= 20 || i % 5 === 0)
};

const PatternVisualizer = ({ pattern }) => {
  const dots = PATTERN_CONFIGS[pattern] || Array(25).fill(false);

  return (
    <Grid container spacing={0.5}>
      {dots.map((isActive, i) => (
        <Grid item xs={2.4} key={i}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: isActive ? 'primary.main' : 'grey.300',
              border: 1,
              borderColor: 'grey.400'
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default PatternVisualizer;
