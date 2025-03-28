import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Stack,
  Slider,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartellaRegistration from '../components/CartellaRegistration';
import PatternVisualizer from '../components/PatternVisualizer';
import CartellaCheckModal from '../components/CartellaCheckModal';
import { motion } from 'framer-motion';
import { getRoundNumber, incrementRound } from '../utils/roundManager';

const patternAnimations = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const BingoGame = () => {
  const [numbers] = useState(Array.from({ length: 75 }, (_, i) => i + 1));
  const [drawnNumbers, setDrawnNumbers] = useState(() => {
    const saved = localStorage.getItem('drawnNumbers');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastDrawn, setLastDrawn] = useState(() => {
    const saved = localStorage.getItem('lastDrawn');
    return saved ? JSON.parse(saved) : null;
  });
  const [showStartModal, setShowStartModal] = useState(() => {
    const gameInProgress = localStorage.getItem('gameInProgress');
    return !gameInProgress;
  });
  const [isDrawing, setIsDrawing] = useState(() => {
    const saved = localStorage.getItem('isDrawing');
    return saved ? JSON.parse(saved) : false;
  });
  const [drawSpeed, setDrawSpeed] = useState(1000);
  const [gameStarted, setGameStarted] = useState(() => {
    const saved = localStorage.getItem('gameStarted');
    return saved ? JSON.parse(saved) : false;
  });
  const [showCartellaRegistration, setShowCartellaRegistration] = useState(false);
  const [activeCartellas, setActiveCartellas] = useState(() => {
    const saved = localStorage.getItem('activeCartellas');
    return saved ? JSON.parse(saved) : [];
  });
  const [gamePattern, setGamePattern] = useState(() => {
    const saved = localStorage.getItem('gamePattern');
    return saved || null;
  });
  const [checkNumber, setCheckNumber] = useState('');
  const [checkedCartella, setCheckedCartella] = useState(null);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [totalBetAmount, setTotalBetAmount] = useState(() => {
    const saved = localStorage.getItem('totalBetAmount');
    return saved ? parseFloat(saved) : 0;
  });
  const [calculationDetails, setCalculationDetails] = useState(null);
  const [currentRound, setCurrentRound] = useState(getRoundNumber);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [selectedPattern, setSelectedPattern] = useState('oneLine'); // Example state

  // Update round number when component mounts and every minute
  useEffect(() => {
    setCurrentRound(getRoundNumber);
    const interval = setInterval(() => {
      setCurrentRound(getRoundNumber);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('drawnNumbers', JSON.stringify(drawnNumbers));
  }, [drawnNumbers]);

  useEffect(() => {
    localStorage.setItem('lastDrawn', JSON.stringify(lastDrawn));
  }, [lastDrawn]);

  useEffect(() => {
    localStorage.setItem('gameStarted', JSON.stringify(gameStarted));
    localStorage.setItem('gameInProgress', gameStarted ? 'true' : '');
  }, [gameStarted]);

  useEffect(() => {
    localStorage.setItem('isDrawing', JSON.stringify(isDrawing));
  }, [isDrawing]);

  useEffect(() => {
    localStorage.setItem('activeCartellas', JSON.stringify(activeCartellas));
  }, [activeCartellas]);

  useEffect(() => {
    if (gamePattern) {
      localStorage.setItem('gamePattern', gamePattern);
    }
  }, [gamePattern]);

  useEffect(() => {
    localStorage.setItem('totalBetAmount', totalBetAmount.toString());
  }, [totalBetAmount]);

  const handleCheckCartella = () => {
    const number = parseInt(checkNumber);
    if (isNaN(number)) {
      alert('Please enter a valid cartella number');
      return;
    }
    
    // Find cartella by its actual ID/number
    const cartella = activeCartellas.find(c => c.id === number.toString() || c.id === number);
    if (!cartella) {
      alert('Cartella not found or not registered for this game');
      return;
    }

    setCheckedCartella(cartella);
    setShowCheckModal(true);
  };

  const drawNumber = useCallback(() => {
    const remainingNumbers = numbers.filter(n => !drawnNumbers.includes(n));
    if (remainingNumbers.length === 0) {
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
    setShowStartModal(false);
    localStorage.setItem('gameStarted', 'true');
    localStorage.setItem('gameInProgress', 'true');
    setIsDrawing(true);
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  const handleSpeedChange = (_, newValue) => {
    setDrawSpeed(3000 - newValue);
  };

  const handleCartellaSelect = async ({ cartellas, pattern, betAmount, totalBet, calculationDetails }) => {
    try {
      const response = await fetch('http://localhost:5001/api/cartellas/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          selectedCartellas: cartellas,
          pattern,
          betAmount
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place bet');
      }

      const data = await response.json();
      setActiveCartellas(cartellas);
      setGamePattern(pattern);
      setTotalBetAmount(calculationDetails.rawTotalBet); // Use raw total bet from calculations
      setCalculationDetails(calculationDetails);
      setShowCartellaRegistration(false);
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
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

  const checkWin = (cartella) => {
    if (!cartella || !cartella.numbers || !gamePattern) return false;

    const checkLine = (numbers) => numbers.every(num => num === 'free' || drawnNumbers.includes(num));
    const getColumn = (colIndex) => cartella.numbers.map(row => row[colIndex]);
    const getDiagonal = (reverse = false) => {
      return cartella.numbers.map((row, i) => row[reverse ? 4 - i : i]);
    };

    switch (gamePattern) {
      case 'Any 1 Line': {
        // Check rows
        if (cartella.numbers.some(row => checkLine(row))) return true;
        // Check columns
        for (let col = 0; col < 5; col++) {
          if (checkLine(getColumn(col))) return true;
        }
        // Check diagonals
        if (checkLine(getDiagonal()) || checkLine(getDiagonal(true))) return true;
        return false;
      }

      case 'Any 2 Lines': {
        let lineCount = 0;
        // Check rows
        lineCount += cartella.numbers.filter(row => checkLine(row)).length;
        // Check columns
        for (let col = 0; col < 5; col++) {
          if (checkLine(getColumn(col))) lineCount++;
        }
        // Check diagonals
        if (checkLine(getDiagonal())) lineCount++;
        if (checkLine(getDiagonal(true))) lineCount++;
        return lineCount >= 2;
      }

      case 'T Pattern':
        return checkLine(cartella.numbers[0]) && // Top row
               checkLine(getColumn(2)); // Middle column

      case 'Reverse T':
        return checkLine(cartella.numbers[4]) && // Bottom row
               checkLine(getColumn(2)); // Middle column

      case 'X Pattern':
        return checkLine(getDiagonal()) && checkLine(getDiagonal(true));

      case 'L Pattern':
        return checkLine(cartella.numbers[4]) && // Bottom row
               checkLine(getColumn(0)); // Left column

      case 'Reverse L':
        return checkLine(cartella.numbers[4]) && // Bottom row
               checkLine(getColumn(4)); // Right column

      case 'Half Above':
        return cartella.numbers.slice(0, 3).every(row => checkLine(row));

      case 'Half Below':
        return cartella.numbers.slice(2).every(row => checkLine(row));

      case 'Half Left':
        return [0, 1, 2].every(col => checkLine(getColumn(col)));

      case 'Half Right':
        return [2, 3, 4].every(col => checkLine(getColumn(col)));

      case 'G and O':
        return checkLine(getColumn(3)) && checkLine(getColumn(4));

      case 'B and O':
        return checkLine(getColumn(0)) && checkLine(getColumn(4));

      case 'Mark':
        return checkLine(cartella.numbers[0]) && // Top row
               checkLine(cartella.numbers[4]) && // Bottom row
               checkLine(getColumn(0)) && // Left column
               checkLine(getColumn(4)); // Right column

      case 'T Cross':
        return checkLine(cartella.numbers[2]) && // Middle row
               checkLine(getColumn(2)); // Middle column

      default:
        return false;
    }
  };

  const handleNewBingo = async () => {
    if (!calculationDetails) {
      alert('No calculation details available');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/reports/save-round', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          round: currentRound,
          price: calculationDetails.betPerCartella,
          noPlayer: calculationDetails.numberOfCartellas,
          winnerPrice: calculationDetails.adjustedTotalBet,
          income: calculationDetails.cutAmount,
          date: new Date().toISOString(),
          branchId: user.branchId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save round data');
      }

      // Reset game state completely
      setDrawnNumbers([]);
      setLastDrawn(null);
      incrementRound(); // Use the incrementRound function
      setActiveCartellas([]);
      setGamePattern(null);
      setTotalBetAmount(0);
      setCalculationDetails(null);
      setGameStarted(false);
      setIsDrawing(false);
      setShowStartModal(true); // Show start modal instead of cartella registration
      setShowCartellaRegistration(false);
      setCheckedCartella(null);
      
      // Clear local storage except round number
      localStorage.removeItem('drawnNumbers');
      localStorage.removeItem('lastDrawn');
      localStorage.removeItem('gameStarted');
      localStorage.removeItem('isDrawing');
      localStorage.removeItem('gameInProgress');
      localStorage.removeItem('activeCartellas');
      localStorage.removeItem('gamePattern');
      localStorage.removeItem('totalBetAmount');
      
    } catch (error) {
      console.error('Error starting new game:', error);
      alert('Failed to start new game. Please try again.');
    }
  };

  // Update round number when game state changes
  useEffect(() => {
    if (showStartModal) {
      setCurrentRound(getRoundNumber);
    }
  }, [showStartModal]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Dialog
        open={showStartModal}
        onClose={() => {}}
        minWidth='600px'
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#f5f5f5',
            overflow: 'hidden',
            maxHeight: '80vh',
            opacity: 0.9,
            m: 1,
            borderRadius: 0,
            mt:-2
          }
        }}
      >
        {/* Header with Register/Logout and Round */}
        <Box sx={{ 
          bgcolor: '#242424',
          py: 1,
          px: 2,
          opacity: 0.9,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Left side - Register/Logout/Report */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography 
              onClick={handleLogout}
              sx={{ 
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Logout
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>/</Typography>
            <Typography 
              onClick={() => setShowCartellaRegistration(true)}
              sx={{ 
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Register Card
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>/</Typography>
            <Typography 
              onClick={() => navigate('/report')}
              sx={{ 
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Report
            </Typography>
          </Box>

          {/* Right side - Round count */}
          <Typography sx={{ 
            color: 'white',
            fontSize: '1.2rem'
          }}>
            Round {currentRound}
          </Typography>
        </Box>

        <DialogContent sx={{ bgcolor: '#f5f5f5', p: 2 }}>
          {/* Amharic Text */}
          <Typography
            align="center"
            sx={{
              // mb: 2,
              fontSize: '1.9rem',
              color: '#666',
              fontWeight: 'bold',
            }}
          >
            የጨዋታው ትእዛዝ
          </Typography>

          {/* Cartella Grid with BINGO header */}
          <Box sx={{ 
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
            mb: 2
          }}>
            {/* BINGO Header */}
            <Box sx={{ 
              bgcolor: '#E9AD01',
              display: 'flex',
              justifyContent: 'space-between',
              mb: '1px',
              opacity: 0.9,
            }}>
              {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                <Typography
                  key={letter}
                  sx={{
                    fontSize: '2rem',
                    fontWeight: 'bolder',
                    color: 'red',
                    width: '20%',
                    textAlign: 'center',
                    py: 0.5,
                   
                  }}
                >
                  {letter}
                </Typography>
              ))}
            </Box>

            {/* Numbers Grid */}
            <Box>
              {[
                [12, 16, 33, 56, 61],
                [1, 26, 44, 55, 71],
                [3, 23, 'free', 46, 72],
                [5, 17, 37, 49, 74],
                [15, 28, 42, 60, 75]
              ].map((row, rowIndex) => (
                <Box
                  key={rowIndex}
                  sx={{ 
                    display: 'flex',
                    '& > div': {
                      width: '40%',
                      height: 45,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #ddd',
                      borderTop: 0,
                      borderRight: 0,
                      bgcolor: rowIndex % 2 === 0 ? '#fff3e0' : '#fff',
                      '&:last-child': {
                        borderRight: '1px solid #ddd'
                      }
                    }
                  }}
                >
                  {row.map((number, colIndex) => (
                    <Box key={colIndex}>
                      <Typography sx={{
                        fontSize: '2rem',
                        fontStyle:'sans-serif',
                        color: '#333',
                        textTransform: number === 'free' ? 'lowercase' : 'none'
                      }}>
                        {number}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>

            {/* Bet Amount in Amharic */}
            {totalBetAmount > 0 && (
              <Typography
                align="center"
                sx={{
                  // mt: 3,
                  // mb: 2,
                  fontSize: '4rem',
                  color: '#666',
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                }}
              >
                {totalBetAmount} ወሳጅ
              </Typography>
            )}

            {/* Start Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleCloseModal}
                sx={{
                  minWidth: 200,
                  // py: 1,
                  fontSize: '1.2rem',
                  bgcolor: '#800000',
                  '&:hover': {
                    bgcolor: '#600000'
                  },
                  borderRadius: 0
                }}
              >
                Start
              </Button>
            </Box>
          </Box>

          {/* Start Button */}
        </DialogContent>
      </Dialog>

      <CartellaRegistration
        open={showCartellaRegistration}
        onClose={() => setShowCartellaRegistration(false)}
        onSelect={handleCartellaSelect}
      />

      <Paper sx={{ p: 0 }}>
        <Box>
          {gamePattern && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <PatternVisualizer 
                pattern={gamePattern} 
                gameStarted={gameStarted}
                lastDrawn={lastDrawn}
              />
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 3 }}>
            {/* <Typography variant="h4" color="primary">
              Bingo Game
            </Typography> */}
            <Box>
            </Box>
            {/* <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button> */}
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

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <TextField
                label="Check Cartella"
                variant="outlined"
                size="small"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckCartella();
                  }
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
        </Box>
      </Paper>

      <CartellaCheckModal
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        cartella={checkedCartella}
        cartellaNumber={checkNumber}
        drawnNumbers={drawnNumbers}
        winningPattern={gamePattern}
        isWinner={checkWin(checkedCartella)}
        onAdditional={() => {
          setShowCheckModal(false);
          // Continue the game
        }}
        onNewBingo={handleNewBingo}
      />
    </Container>
  );
};

export default BingoGame;
