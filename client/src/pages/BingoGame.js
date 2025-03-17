import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid
} from '@mui/material';

const BingoGame = () => {
  const [numbers] = useState(Array.from({ length: 75 }, (_, i) => i + 1));
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);

  const drawNumber = () => {
    const remainingNumbers = numbers.filter(n => !drawnNumbers.includes(n));
    if (remainingNumbers.length === 0) {
      setLastDrawn('Game Over!');
      return;
    }
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const drawn = remainingNumbers[randomIndex];
    setDrawnNumbers([...drawnNumbers, drawn]);
    setLastDrawn(drawn);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Bingo Game
        </Typography>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={drawNumber}
            sx={{ mb: 2 }}
          >
            Draw Number
          </Button>
          <Typography variant="h3" sx={{ mb: 3 }}>
            {lastDrawn ? `Last Drawn: ${lastDrawn}` : 'Click to Start'}
          </Typography>
        </Box>

        <Grid container spacing={1}>
          {numbers.map((number) => (
            <Grid item xs={1} key={number}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: drawnNumbers.includes(number) ? 'primary.main' : 'background.paper',
                  color: drawnNumbers.includes(number) ? 'white' : 'text.primary',
                }}
              >
                {number}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default BingoGame;
