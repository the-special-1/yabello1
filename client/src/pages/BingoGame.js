import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const BingoGame = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [bingoCard, setBingoCard] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!location.state?.gameId) {
      navigate('/user');
      return;
    }
    initializeGame();
  }, [location.state?.gameId]);

  const initializeGame = () => {
    // Generate a 5x5 Bingo card with random numbers
    const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    const card = Array.from({ length: 5 }, () =>
      shuffled.splice(0, 5)
    );
    setBingoCard(card);
    setLoading(false);
  };

  const handleNumberSelect = (number) => {
    if (drawnNumbers.includes(number)) {
      if (selectedNumbers.includes(number)) {
        setSelectedNumbers(selectedNumbers.filter(n => n !== number));
      } else {
        setSelectedNumbers([...selectedNumbers, number]);
      }
      checkForBingo();
    }
  };

  const checkForBingo = () => {
    // Check rows
    for (let i = 0; i < 5; i++) {
      if (bingoCard[i].every(num => selectedNumbers.includes(num))) {
        declareWinner();
        return;
      }
    }

    // Check columns
    for (let i = 0; i < 5; i++) {
      if (bingoCard.every(row => selectedNumbers.includes(row[i]))) {
        declareWinner();
        return;
      }
    }

    // Check diagonals
    const diagonal1 = Array.from({ length: 5 }, (_, i) => bingoCard[i][i]);
    const diagonal2 = Array.from({ length: 5 }, (_, i) => bingoCard[i][4 - i]);

    if (diagonal1.every(num => selectedNumbers.includes(num)) ||
        diagonal2.every(num => selectedNumbers.includes(num))) {
      declareWinner();
    }
  };

  const declareWinner = async () => {
    try {
      await axios.post(
        `http://localhost:5001/api/games/${location.state.gameId}/end`,
        { winnerId: user.id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setSuccess('Congratulations! You won the game!');
      setTimeout(() => navigate('/user'), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process win');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Bingo Game
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={1} sx={{ mb: 3 }}>
          {bingoCard.map((row, i) => (
            <Grid item xs={12} key={i}>
              <Grid container spacing={1}>
                {row.map((number, j) => (
                  <Grid item xs={2.4} key={`${i}-${j}`}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        height: '60px',
                        backgroundColor: selectedNumbers.includes(number)
                          ? 'primary.main'
                          : drawnNumbers.includes(number)
                          ? 'action.hover'
                          : 'background.paper',
                        color: selectedNumbers.includes(number)
                          ? 'white'
                          : 'text.primary',
                      }}
                      onClick={() => handleNumberSelect(number)}
                    >
                      {number}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Last Number Drawn: {drawnNumbers[drawnNumbers.length - 1] || 'None'}
          </Typography>
          <Typography variant="body1">
            Selected Numbers: {selectedNumbers.length}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BingoGame;
