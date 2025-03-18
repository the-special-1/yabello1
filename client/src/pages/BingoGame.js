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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartellaRegistration from '../components/CartellaRegistration';
import PatternVisualizer from '../components/PatternVisualizer';
import CartellaCheckModal from '../components/CartellaCheckModal';

const BingoGame = () => {
  const [numbers] = useState(Array.from({ length: 75 }, (_, i) => i + 1));
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawSpeed, setDrawSpeed] = useState(1000); // 1 second default
  const [gameStarted, setGameStarted] = useState(false);
  const [showCartellaRegistration, setShowCartellaRegistration] = useState(false);
  const [activeCartellas, setActiveCartellas] = useState([]);
  const [gamePattern, setGamePattern] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [checkedCartella, setCheckedCartella] = useState(null);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [totalBetAmount, setTotalBetAmount] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Mock data for registered cartellas - replace with API call
  const [registeredCartellas] = useState([
    // Example cartella 1
    [
      [1, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, 'FREE', 48, 63],
      [4, 19, 33, 49, 64],
      [5, 20, 34, 50, 65]
    ],
    // Example cartella 2
    [
      [6, 21, 35, 51, 66],
      [7, 22, 36, 52, 67],
      [8, 23, 'FREE', 53, 68],
      [9, 24, 37, 54, 69],
      [10, 25, 38, 55, 70]
    ]
  ]);

  const handleCheckCartella = () => {
    const num = parseInt(checkNumber);
    if (num && num > 0 && num <= activeCartellas.length) {
      setCheckedCartella(activeCartellas[num - 1]);
      setShowCheckModal(true);
    } else {
      setCheckedCartella(null);
    }
  };

  const drawNumber = useCallback(() => {
    const remainingNumbers = numbers.filter(n => !drawnNumbers.includes(n));
    if (remainingNumbers.length === 0) {
      setLastDrawn('Game Over!');
      setIsDrawing(false);
      return;
    }
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const drawn = remainingNumbers[randomIndex];
    setDrawnNumbers(prev => [...prev, drawn]);
    setLastDrawn(drawn);
  }, [numbers, drawnNumbers]);

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

  const handleCloseModal = () => {
    if (activeCartellas.length > 0) {
      setShowStartModal(false);
    }
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setIsDrawing(true);
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  const handleSpeedChange = (_, newValue) => {
    setDrawSpeed(3000 - newValue);
  };

  const handleCartellaSelect = ({ cartellas, pattern, betAmount }) => {
    // Map the selected cartella indices to actual cartella data
    const selectedCartellaData = cartellas.map(cartella => {
      // If cartella is already in the correct format, return as is
      if (Array.isArray(cartella) && cartella.length === 5 && Array.isArray(cartella[0])) {
        return cartella;
      }
      // Otherwise, create a 5x5 grid from the cartella data
      const grid = Array(5).fill().map(() => Array(5).fill(null));
      const numbers = [...cartella];
      
      // Fill the grid with numbers, leaving the center as 'FREE'
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (i === 2 && j === 2) {
            grid[i][j] = 'FREE';
          } else {
            grid[i][j] = numbers.shift() || 0;
          }
        }
      }
      return grid;
    });

    setActiveCartellas(selectedCartellaData);
    setGamePattern(pattern);
    setTotalBetAmount(betAmount);
    setCheckedCartella(null);
    setCheckNumber('');
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

  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];

  const organizedNumbers = [];
  for (let i = 0; i < 75; i += 15) {
    organizedNumbers.push(numbers.slice(i, i + 15));
  }

  const sampleCartella = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, 'FREE', 48, 63],
    [4, 19, 33, 49, 64],
    [5, 20, 34, 50, 65]
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Dialog
        open={showStartModal}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {/* Sample Cartella Display */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 2,
                backgroundColor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                maxWidth: 300,
                mx: 'auto',
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              <Grid container spacing={1}>
                {sampleCartella.map((row, rowIndex) => (
                  <Grid item xs={12} key={rowIndex}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      '& > *': { flex: 1 }
                    }}>
                      {row.map((number, colIndex) => (
                        <Paper
                          key={colIndex}
                          elevation={1}
                          sx={{
                            p: 1.5,
                            m: 0.5,
                            textAlign: 'center',
                            backgroundColor: number === 'FREE' ? 'primary.light' : 'background.default',
                            color: number === 'FREE' ? 'white' : 'text.primary',
                            border: '1px solid',
                            borderColor: 'divider',
                            fontWeight: number === 'FREE' ? 'bold' : 'normal',
                            fontSize: '0.9rem',
                            minWidth: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: `pop 0.3s ease-out ${(rowIndex * 5 + colIndex) * 0.05}s`,
                            '@keyframes pop': {
                              '0%': {
                                opacity: 0,
                                transform: 'scale(0.5)'
                              },
                              '70%': {
                                transform: 'scale(1.1)'
                              },
                              '100%': {
                                opacity: 1,
                                transform: 'scale(1)'
                              }
                            }
                          }}
                        >
                          {number}
                        </Paper>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={() => setShowCartellaRegistration(true)}
            >
              Register
            </Button>
            <Button
              variant="contained"
              onClick={() => setShowStartModal(false)}
            >
              Continue
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <CartellaRegistration
        open={showCartellaRegistration}
        onClose={() => setShowCartellaRegistration(false)}
        onSelect={handleCartellaSelect}
        cartellas={registeredCartellas}
      />

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="primary">
              Bingo Game
            </Typography>
            {gamePattern && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" color="primary.dark" gutterBottom>
                  Pattern: {gamePattern}
                </Typography>
                <Box sx={{ maxWidth: 200 }}>
                  <PatternVisualizer pattern={gamePattern} />
                </Box>
              </Box>
            )}
            {totalBetAmount > 0 && (
              <Typography variant="subtitle1" color="secondary">
                Total Bet: {totalBetAmount} Birr
              </Typography>
            )}
          </Box>
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
          {!gameStarted ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartGame}
              startIcon={<PlayArrowIcon />}
              sx={{ 
                fontSize: '1.2rem',
                padding: '0.8rem 3rem',
                mb: 2
              }}
            >
              Start Game
            </Button>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
              <Typography>Slower</Typography>
              <Slider
                value={3000 - drawSpeed}
                onChange={handleSpeedChange}
                min={500}
                max={2500}
                step={100}
                sx={{ width: 200 }}
                disabled={!isDrawing}
              />
              <Typography>Faster</Typography>
              <IconButton 
                color="primary" 
                onClick={toggleDrawing}
                size="large"
                sx={{ ml: 2 }}
              >
                {isDrawing ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Stack>
          )}
          <Typography variant="h3" sx={{ mb: 3 }}>
            {lastDrawn ? `Last Drawn: ${lastDrawn}` : 'Click Start Game'}
          </Typography>
          {gameStarted && (
            <Typography variant="subtitle1" color="text.secondary">
              Numbers Drawn: {drawnNumbers.length} / 75
            </Typography>
          )}
        </Box>

        <Grid container spacing={1}>
          {organizedNumbers.map((row, rowIndex) => (
            <Grid item xs={12} key={rowIndex}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    width: 40, 
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}
                >
                  {bingoLetters[rowIndex]}
                </Typography>
                <Grid container spacing={1} sx={{ flex: 1 }}>
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
                          fontWeight: 'normal'
                        }}
                      >
                        {number}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Display Active Cartellas */}
        {activeCartellas.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Your Active Cartellas
            </Typography>
            <Grid container spacing={3}>
              {activeCartellas.map((cartella, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper 
                    elevation={3}
                    sx={{ 
                      p: 2,
                      backgroundColor: 'background.paper',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="h6" gutterBottom align="center" color="primary">
                      Cartella #{index + 1}
                    </Typography>
                    <Grid container spacing={1}>
                      {cartella.map((row, rowIndex) => (
                        <Grid item xs={12} key={rowIndex}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            '& > *': { flex: 1 }
                          }}>
                            {row.map((number, colIndex) => (
                              <Paper
                                key={colIndex}
                                elevation={1}
                                sx={{
                                  p: 1.5,
                                  m: 0.5,
                                  textAlign: 'center',
                                  backgroundColor: number === 'FREE' ? 'primary.light' :
                                    drawnNumbers.includes(number) ? 'primary.main' : 'background.default',
                                  color: (number === 'FREE' || drawnNumbers.includes(number)) ? 'white' : 'text.primary',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  fontWeight: 'bold',
                                  fontSize: '1.1rem',
                                  minWidth: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {number}
                              </Paper>
                            ))}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <TextField
              label="Check Cartella"
              variant="outlined"
              size="small"
              value={checkNumber}
              onChange={(e) => {
                setCheckNumber(e.target.value);
                if (!e.target.value) setCheckedCartella(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCheckCartella();
                }
              }}
              type="number"
              inputProps={{ 
                min: 1, 
                max: activeCartellas.length,
                style: { textAlign: 'center' }
              }}
              sx={{ width: 150 }}
            />
            <Button
              variant="contained"
              onClick={handleCheckCartella}
              disabled={!checkNumber}
            >
              Check
            </Button>
          </Stack>
        </Box>
      </Paper>

      <CartellaCheckModal
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        cartella={checkedCartella}
        cartellaNumber={checkNumber}
        drawnNumbers={drawnNumbers}
      />
    </Container>
  );
};

export default BingoGame;
