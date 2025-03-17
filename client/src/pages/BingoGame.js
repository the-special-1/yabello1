import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Modal,
  Stack,
  Slider,
  IconButton,
  Divider
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BingoGame = () => {
  const [numbers] = useState(Array.from({ length: 75 }, (_, i) => i + 1));
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawSpeed, setDrawSpeed] = useState(1000); // 1 second default
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Generate random 5x5 cartella
  const [cartella] = useState(() => {
    const nums = Array.from({ length: 75 }, (_, i) => i + 1);
    const shuffled = nums.sort(() => Math.random() - 0.5);
    return Array.from({ length: 5 }, () => shuffled.splice(0, 5));
  });

  const checkBingo = () => {
    // Check rows
    for (let i = 0; i < 5; i++) {
      if (cartella[i].every(num => drawnNumbers.includes(num))) {
        return true;
      }
    }

    // Check columns
    for (let i = 0; i < 5; i++) {
      if (cartella.every(row => drawnNumbers.includes(row[i]))) {
        return true;
      }
    }

    // Check diagonals
    const diagonal1 = cartella.map((row, i) => row[i]);
    const diagonal2 = cartella.map((row, i) => row[4 - i]);
    
    if (diagonal1.every(num => drawnNumbers.includes(num)) ||
        diagonal2.every(num => drawnNumbers.includes(num))) {
      return true;
    }

    return false;
  };

  const hasBingo = checkBingo();

  useEffect(() => {
    if (hasBingo) {
      setIsDrawing(false);
    }
  }, [hasBingo]);

  const drawNumber = useCallback(() => {
    const remainingNumbers = numbers.filter(n => !drawnNumbers.includes(n));
    if (remainingNumbers.length === 0 || hasBingo) {
      setLastDrawn(hasBingo ? 'BINGO!' : 'Game Over!');
      setIsDrawing(false);
      return;
    }
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const drawn = remainingNumbers[randomIndex];
    setDrawnNumbers(prev => [...prev, drawn]);
    setLastDrawn(drawn);
  }, [numbers, drawnNumbers, hasBingo]);

  useEffect(() => {
    let intervalId;
    if (isDrawing) {
      intervalId = setInterval(drawNumber, drawSpeed);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDrawing, drawSpeed, drawNumber]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartGame = () => {
    setShowStartModal(false);
    setIsDrawing(true);
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  const handleSpeedChange = (_, newValue) => {
    setDrawSpeed(3000 - newValue); // Reverse the scale for intuitive control
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2
  };

  // Organize numbers into 5 rows of 15
  const organizedNumbers = [];
  for (let i = 0; i < 75; i += 15) {
    organizedNumbers.push(numbers.slice(i, i + 15));
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Modal
        open={showStartModal}
        onClose={() => {}}
        aria-labelledby="start-game-modal"
      >
        <Box sx={modalStyle}>
          <Typography variant="h4" gutterBottom align="center" sx={{ color: 'primary.main' }}>
            Your Cartella
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 4 }}>
            {cartella.map((row, i) => (
              <Grid item xs={12} key={i}>
                <Grid container spacing={1}>
                  {row.map((number, j) => (
                    <Grid item xs={2.4} key={`${i}-${j}`}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s',
                          backgroundColor: drawnNumbers.includes(number) ? 'primary.main' : 'background.paper',
                          color: drawnNumbers.includes(number) ? 'white' : 'text.primary',
                          transform: drawnNumbers.includes(number) ? 'scale(1.05)' : 'none',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          }
                        }}
                      >
                        {number}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartGame}
              startIcon={<PlayArrowIcon />}
              sx={{ 
                fontSize: '1.2rem',
                padding: '0.8rem 3rem'
              }}
            >
              Start Game
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="large"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ 
                fontSize: '1.2rem',
                padding: '0.8rem 2rem'
              }}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" color="primary">
            Bingo Game
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
            <Typography>Slower</Typography>
            <Slider
              value={3000 - drawSpeed}
              onChange={handleSpeedChange}
              min={500}
              max={2500}
              step={100}
              sx={{ width: 200 }}
              disabled={!isDrawing || hasBingo}
            />
            <Typography>Faster</Typography>
            <IconButton 
              color="primary" 
              onClick={toggleDrawing}
              size="large"
              sx={{ ml: 2 }}
              disabled={hasBingo}
            >
              {isDrawing ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Stack>
          <Typography variant="h3" sx={{ mb: 3 }}>
            {lastDrawn ? `Last Drawn: ${lastDrawn}` : 'Click Play to Start'}
          </Typography>
          {hasBingo && (
            <Typography variant="h2" color="success.main" sx={{ mb: 3 }}>
              🎉 BINGO! You Won! 🎉
            </Typography>
          )}
          <Typography variant="subtitle1" color="text.secondary">
            Numbers Drawn: {drawnNumbers.length} / 75
          </Typography>
        </Box>

        <Grid container spacing={1}>
          {organizedNumbers.map((row, rowIndex) => (
            <Grid item xs={12} key={rowIndex}>
              <Grid container spacing={1}>
                {row.map((number) => (
                  <Grid item xs={0.8} key={number}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        backgroundColor: drawnNumbers.includes(number) ? 'primary.main' : 'background.paper',
                        color: drawnNumbers.includes(number) ? 'white' : 'text.primary',
                        transition: 'all 0.3s',
                        opacity: drawnNumbers.includes(number) ? 1 : 0.7,
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {number}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default BingoGame;
