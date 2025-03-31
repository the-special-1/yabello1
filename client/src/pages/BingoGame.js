import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
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
  Select,
  MenuItem,
  Snackbar,
  Alert
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
  const [drawSpeed, setDrawSpeed] = useState(10000); // Start with slowest speed (10)
  const [isSliding, setIsSliding] = useState(false);
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
  const checkInputRef = useRef(null);
  const [checkedCartella, setCheckedCartella] = useState(null);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [totalBetAmount, setTotalBetAmount] = useState(() => {
    const saved = localStorage.getItem('totalBetAmount');
    return saved ? parseFloat(saved) : 0;
  });
  const [calculationDetails, setCalculationDetails] = useState(null);
  const [currentRound, setCurrentRound] = useState(1); // Initialize with 1
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [selectedPattern, setSelectedPattern] = useState('oneLine'); // Example state
  const [selectedCaller, setSelectedCaller] = useState('auto');
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState('--');
  const [shufflingNumbers, setShufflingNumbers] = useState([]);
  const [recentNumbers, setRecentNumbers] = useState([]);
  const [totalBet, setTotalBet] = useState(0);
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userCut, setUserCut] = useState(null);

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenToast(false);
  };

  const showErrorToast = (message) => {
    setToastMessage(message);
    setOpenToast(true);
  };

  // Helper function to get the prefix based on number range
  const getPrefix = (number) => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  };

  // Update round number when component mounts and every minute
  useEffect(() => {
    const fetchRound = async () => {
      if (!user || !user.branchId) return;
      const round = await getRoundNumber(user.branchId);
      setCurrentRound(round);
    };

    fetchRound();
    const interval = setInterval(fetchRound, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user?.branchId]);

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

  useEffect(() => {
    if (lastDrawn) {
      setRecentNumbers(prev => {
        const updated = [lastDrawn, ...prev].slice(0, 5);
        return updated;
      });
    }
  }, [lastDrawn]);

  useEffect(() => {
    setTotalBet(25000); // Example value
  }, []);

  useEffect(() => {
    const adjustedAmount = totalBetAmount * (1 - (userCut || 20) / 100); // Use userCut or fallback to 20%
    setTotalBet(adjustedAmount);
  }, [totalBetAmount, userCut]); // Add userCut as dependency

  useEffect(() => {
    const fetchUserCut = async () => {
      try {
        const response = await fetch('/api/users/my-data', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('User data received:', data);
          setUserCut(data.cut);
          console.log('Setting user cut to:', data.cut);
        }
      } catch (error) {
        console.error('Error fetching user cut:', error);
      }
    };
    fetchUserCut();
  }, []);

  const handleCheckCartella = () => {
    const number = parseInt(checkNumber);
    if (isNaN(number)) {
      showErrorToast('Cartela not selected or doesn\'t exist!');
      return;
    }
    
    // Find cartella by its actual ID/number
    const cartella = activeCartellas.find(c => c.id === number.toString() || c.id === number);
    if (!cartella) {
      showErrorToast('Cartela not selected or doesn\'t exist!');
      return;
    }

    setCheckedCartella(cartella);
    setShowCheckModal(true);
    setCheckNumber(''); // Clear the input
  };

  const handleCheckInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCheckCartella();
    } else if (e.key === 'Backspace' && checkNumber === '') {
      // When backspace is pressed on empty input, close modal
      setShowCheckModal(false);
    }
  };

  // Keep input focused when modal opens
  useEffect(() => {
    if (showCheckModal && checkInputRef.current) {
      checkInputRef.current.focus();
    }
  }, [showCheckModal]);

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

  const handleStartGame = async () => {
    try {
      if (!calculationDetails) {
        throw new Error('please register cards');
      }

      // Calculate the total amount to deduct (bet amount)
      const totalDeduction = calculationDetails.betPerCartella * activeCartellas.length;
      
      // Calculate the cut amount using user's actual cut percentage
      const cutAmount = totalDeduction * ((userCut || 20) / 100); // Fallback to 20% if userCut is not loaded
      console.log('Using cut percentage:', userCut || 20);
      
      // Place bet and deduct only the cut amount
      const response = await fetch('/api/cartellas/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          selectedCartellas: activeCartellas,
          betAmount: cutAmount, // Only deduct the cut amount
          pattern: gamePattern,
          totalBet: totalDeduction,
          cutAmount: cutAmount,
          adjustedTotalBet: totalDeduction - cutAmount // Full amount minus cut
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place bet');
      }

      const data = await response.json();
      setRecentNumbers([]); // Reset recent numbers
      setGameStarted(true);
      setShowStartModal(false);
      setDrawnNumbers([]);
      setLastDrawn(null);
      setIsDrawing(false);
      incrementRound();
    } catch (error) {
      console.error('Error starting game:', error);
      alert(error.message || 'Failed to start game. Please check your balance.');
    }
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  const handleSpeedChange = (_, newValue) => {
    // Convert slider value (2-10) to milliseconds (2000-10000)
    setDrawSpeed((12 - newValue) * 1000);
  };

  const handleCartellaSelect = async ({ cartellas, pattern, betAmount, totalBet, calculationDetails }) => {
    try {
      // First update the state
      setActiveCartellas(cartellas);
      setGamePattern(pattern);
      setTotalBetAmount(calculationDetails.rawTotalBet);
      setCalculationDetails(calculationDetails);
      setShowCartellaRegistration(false);
    } catch (error) {
      console.error('Error in handleCartellaSelect:', error);
      setShowCartellaRegistration(true); // Show registration again on error
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
    [3, 23, 'FREE', 48, 63],
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
      const response = await fetch('/api/reports/save-round', {
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
      if (user?.branchId) {
        const newRound = await incrementRound(user.branchId);
        if (newRound) {
          setCurrentRound(newRound);
        }
      }
      setActiveCartellas([]);
      setGamePattern(null);
      setTotalBetAmount(0);
      setCalculationDetails(null);
      setGameStarted(false);
      setIsDrawing(false);
      setShowStartModal(true); // Show start modal instead of cartella registration
      setShowCartellaRegistration(false);
      setCheckedCartella(null);
      setRecentNumbers([]); // Reset recent numbers
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

  const handleGameEnd = async () => {
    try {
      if (!user?.branchId) {
        console.warn('No branch ID available for round increment');
        return;
      }

      // Increment round number in database
      const newRound = await incrementRound(user.branchId);
      if (newRound) {
        setCurrentRound(newRound);
      }

      // Reset game state
      setDrawnNumbers([]);
      setLastDrawn(null);
      setIsDrawing(false);
      setGameStarted(false);
      setActiveCartellas([]);
      setTotalBetAmount(0);
      
      // Clear localStorage game state
      localStorage.removeItem('drawnNumbers');
      localStorage.removeItem('lastDrawn');
      localStorage.removeItem('isDrawing');
      localStorage.removeItem('gameStarted');
      localStorage.removeItem('activeCartellas');
      localStorage.removeItem('totalBetAmount');
      
      // Show start modal for next game
      setShowStartModal(true);
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const handleShuffle = () => {
    if (isShuffling) return;
    setIsShuffling(true);
    
    const startTime = Date.now();
    const SHUFFLE_DURATION = 5000; // 5 seconds
    
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime >= SHUFFLE_DURATION) {
        clearInterval(interval);
        setIsShuffling(false);
        setShufflingNumbers([]);
        drawNumber(); // Draw the actual number after animation
        return;
      }
      
      // Generate 6 random numbers for this iteration
      const newShuffleNumbers = Array.from({length: 6}, () => 
        Math.floor(Math.random() * 75) + 1
      );
      setShufflingNumbers(newShuffleNumbers);
      
    }, 300); // Change numbers every 300ms
  };

  // Add callers list
  const callers = [
    { id: 'auto', name: 'Auto Caller' },
    { id: 'amharic', name: 'Amharic' },
    { id: 'english', name: 'English' },
    { id: 'oromifa', name: 'Oromifa' }
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        backgroundColor: '#1a1a1a',
        overflow: 'hidden'
      }}
    >
      <Dialog
        open={showStartModal}
        onClose={() => {}}
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#f5f5f5',
            overflow: 'visible',
            minWidth: '600px',
            height: 'auto',
            maxHeight: 'none',
            opacity: 0.9,
            m: 1,
            borderRadius: 0,
            top: -60,
            left: 0,
            right: 0,
            bottom: 'auto',
            '& .MuiDialogContent-root': {
              overflow: 'visible',
              padding: 0
            }
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
                    fontSize: '3rem',
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
                      fontFamily: 'serif',
                      fontWeight: 'bolder',
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
                        fontFamily:'inherit',
                        fontWeight: 'bold',
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
            {calculationDetails && (
              <Typography
                align="center"
                sx={{
                  fontSize: '4rem',
                  color: '#666',
                  fontFamily: 'sans-serif',
                  fontWeight: 'bold',
                }}
              >
                {calculationDetails.adjustedTotalBet} ወሳጅ
              </Typography>
            )}

            {/* Start Button */}
            <Box sx={{ display: 'flex', justifyContent: 'start' }}>
              <Button
                variant="contained"
                onClick={handleStartGame}
                sx={{
                  minWidth: 220,
                  maxHeight: "40px",
                  py: 1,
                  mt: 1,
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
        currentRound={currentRound}
      />

<Box sx={{ 
  flex: 1,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '0', // Allows the parent to shrink
}}>
  {/* Top section - all boxes */}
  <Box sx={{ 
    display: 'flex',
    height: 'auto', // Allow height to adjust dynamically
    width: '100%',
    backgroundColor: '#1a1a1a',
    mb: 0,
    minHeight: '0', // Allows the parent to shrink
  }}>

          {/* Ball display */}
          <Box sx={{
            width: '25%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            p: 0,
            border: '1px solid #fff',
          }}>
            <Box sx={{
              width: 280,
              height: 280,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 30% 30%, #ff0000, #990000)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.2)',
              border: '10px solid #ffffff'
            }}>
              <motion.div
                animate={{
                  scale: [1.1, 0.7, 1.1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                style={{
                  width: '70%',
                  height: '70%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h2" sx={{
                    color: '#990000',
                    fontWeight: 'bold',
                    fontFamily: "'Roboto Condensed', sans-serif"
                  }}>
                    {isShuffling ? shuffleDisplay : (lastDrawn ? `${getPrefix(lastDrawn)}-${lastDrawn}` : '')}
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          </Box>

          {/* Pattern display */}
          <Box
  sx={{
    width: '580px',
    height: '340px',
    // backgroundColor: 'red',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }}
>
   <PatternVisualizer
        pattern={gamePattern}
        gameStarted={gameStarted}
        lastDrawn={lastDrawn}
      />
</Box>
          {/* <Box
      sx={{
        width: '500px', // Adjust width as needed
        height: '300px', // Adjust height as needed
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1px',
        border: '1px solid red', // Debugging: Visualize the box
        overflow: 'hidden', // Prevents content from overflowing
      }}
    > */}
      {/* <PatternVisualizer
        pattern={gamePattern}
        gameStarted={gameStarted}
        lastDrawn={lastDrawn}
      /> */}
    {/* </Box> */}



          {/* Recent Numbers */}
          <Box sx={{
            width: '40%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(to right, #4a0000, #800000)',
            p: 1,
            borderRadius: '8px',
            m: 0,
            
          }}>
            <Typography variant="h4" sx={{ 
              color: 'white', 
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              mt: '10px',
           
            }}>
              Recent 5 Numbers
            </Typography>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              flex: 1,
              // alignItems: 'center',
              // justifyContent: 'center',
              mt: '50px',
            }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFA500',
                  backgroundImage: 'linear-gradient(135deg, #FFA500, #FF8C00)',
                  color: '#000',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  border: '3px solid #FF8C00',
                  mt:0,
                }}>
                  {recentNumbers[4 - index] || ''}
                </Box>
              ))}
            </Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 0,
              gap: 0
            }}>
              <Box
                component="img"
                src="/phoneimage.png"
                alt="Phone"
                sx={{
                  height: '60px',
                  width: '380px',
                  mt:2,
                }}
              />
            
            </Box>
          </Box>

          {/* Win Amount Box */}
          <Box sx={{
            width: '20%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(to right, #4a0000, #800000)',
            p: 0,
            // borderRadius: '8px',
            m: 0,
          }}>
            <Box sx={{
              backgroundColor: '#fff',
              // borderRadius: '4px',
              px: 6,
              py: 0,
              mb: 1,
              width: '300px',
              alignSelf: 'center'
            }}>
              <Typography variant="h1" sx={{ 
                color: '#800000',
                fontWeight: 'bold'
              }}>
                ደራሽ
              </Typography>
            </Box>
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0
            }}>
              <Typography variant="h2" sx={{ 
                color: '#fff',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                {Number(totalBet).toLocaleString('en-US', {
                  maximumFractionDigits: 0
                })}
              </Typography>
              <Typography variant="h2" sx={{ 
                color: 'white',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                mt: 0,
              }}>
                ብር
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Numbers grid */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: '#1a1a1a'
        }}>
          <Grid 
            container 
            spacing={0.2} 
            sx={{ 
              width: '100%',
              margin: 0,
              padding: '0 16px',
              backgroundColor: '#1a1a1a'
            }}
          >
            {organizedNumbers.map((row, rowIndex) => (
              <Grid item xs={12} key={rowIndex}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  width: '100%',
                  mb: 0.2
                }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      minWidth: 40,
                      fontWeight: 'bold',
                      color: 'primary.main',
                      mr: 2
                    }}
                  >
                    {bingoLetters[rowIndex]}
                  </Typography>
                  <Grid container spacing={0.3} sx={{ flex: 1, m: 0 }}>
                    {row.map((number) => (
                      <Grid item xs={0.65} key={number} sx={{ p: 0.1, mx: 0.3 }}>
                        <Box sx={{ position: 'relative' }}>
                          <Paper
                            id={`cell-${number}`}
                            elevation={2}
                            sx={{
                              ml: 20,
                              p: 1.5,
                              height: '70px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              background: drawnNumbers.includes(number) && !(drawnNumbers[drawnNumbers.length - 1] === number)
                                ? `url(/selected.png)`
                                : `linear-gradient(rgba(128, 128, 128, 0.08), rgba(128, 128, 128, 0.08)), url(/normal.png)`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundBlendMode: 'normal',
                              // opacity: drawnNumbers.includes(number) ? 1 : 0.9,
                              color: drawnNumbers.includes(number) && !(drawnNumbers[drawnNumbers.length - 1] === number) 
                                ? 'gray' 
                                : 'gray',
                              fontSize: '3.1rem',
                              fontWeight: 'bolder',
                              width: '100%',
                              border: '1px solid rgba(0,0,0,0.1)',
                              position: 'relative',
                              zIndex: 1
                            }}
                          >
                            {number}
                          </Paper>
                          {(shufflingNumbers.includes(number) || (drawnNumbers.includes(number) && drawnNumbers[drawnNumbers.length - 1] === number)) && (
                            <motion.div
                              initial={{ scale: 1, translateZ: 0 }}
                              animate={{
                                scale: [1, 1.2, 1.2, 1.4, 1.4, 1],
                                translateZ: [0, 100, 100, 150, 150, 0]
                              }}
                              transition={{
                                duration: 2,
                                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                                ease: "easeInOut"
                              }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: '160px',
                                width: '100%',
                                height: '70px',
                                backgroundColor: '#ff0000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '3.1rem',
                                fontWeight: 'bolder',
                                transformStyle: "preserve-3d",
                                perspective: "1000px",
                                zIndex: 2
                              }}
                              onAnimationComplete={() => {
                                if (drawnNumbers.includes(number)) {
                                  const element = document.getElementById(`cell-${number}`);
                                  if (element) {
                                    element.style.background = 'linear-gradient(90deg, #FF6B00 0%, #FF9B00 100%)';
                                    element.style.color = '#000000';
                                  }
                                }
                              }}
                            >
                              {number}
                            </motion.div>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Bottom controls */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0 16px',
            mt: 0,
            backgroundColor: '#1a1a1a'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                color="primary"
                onClick={toggleDrawing}
                sx={{ 
                  minWidth: 120,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Bingo
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleShuffle}
                disabled={isShuffling || isDrawing}
                sx={{ 
                  minWidth: 120,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Bowzew
              </Button>
              <Select
                value={selectedCaller}
                onChange={(e) => setSelectedCaller(e.target.value)}
                sx={{ 
                  minWidth: 150,
                  height: 40,
                  color: 'black',
                  backgroundColor: 'whitesmoke',
                  '& .MuiSelect-select': {
                    py: 1
                  }
                }}
              >
                {callers.map(caller => (
                  <MenuItem key={caller.id} value={caller.id}>
                    {caller.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: 380,
                height: 45,
                backgroundColor: 'silver',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: '#E5E4E2',
                  '& .speed-text': {
                    opacity: 0
                  }
                }
              }}
              onMouseEnter={() => setIsSliding(true)}
              onMouseLeave={() => setIsSliding(false)}
            >
              {!isSliding && (
                <Typography 
                  className="speed-text"
                  variant="caption" 
                  sx={{ 
                    position: 'absolute',
                    left: 8,
                    color: 'white',
                    zIndex: 2,
                    fontSize: '1rem',
                    transition: 'opacity 0.2s'
                  }}
                >
                  play speed: {drawSpeed/1000}
                </Typography>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  height: '100%',
                  width: '7%',
                  backgroundColor: '#01796f',
                  right: `${((drawSpeed/1000 - 2) / 8) * 85}%`
                }}
              />
              <Slider
                value={12 - drawSpeed/1000}
                onChange={handleSpeedChange}
                min={2}
                max={10}
                step={1}
                sx={{ 
                  width: '100%',
                  height: '100%',
                  padding: '0 !important',
                  opacity: 0,
                  position: 'absolute',
                  zIndex: 1
                }}
              />
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                inputRef={checkInputRef}
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                onKeyDown={handleCheckInputKeyDown}
                placeholder="Enter cartella number"
                variant="outlined"
                size="small"
                sx={{
                  width: 200,
                  mr: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    color: 'black',
                    placeholderColor: 'black',
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleCheckCartella}
                sx={{
                  minWidth: 120,
                  height: 40,
                  fontSize: '1rem',
                  backgroundColor: 'darkred',
                  // fontWeight: 'bold'
                }}
              >
                Check
              </Button>
            </Stack>
          </Box>
        </Box>

      </Box>

      <CartellaCheckModal
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        cartella={checkedCartella}
        cartellaNumber={checkedCartella?.id || ''}
        drawnNumbers={drawnNumbers}
        winningPattern={gamePattern}
        isWinner={checkWin(checkedCartella)}
        onAdditional={() => {
          setShowCheckModal(false);
          // Continue the game
        }}
        onNewBingo={handleNewBingo}
      />

      {/* Toast Message */}
      <Snackbar
        open={openToast}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="error"
          onClose={handleCloseToast}
          sx={{
            width: '100%',
            backgroundColor: '#ff0000',
            color: '#ffffff',
            '& .MuiAlert-icon': {
              color: '#ffffff'
            },
            '& .MuiAlert-action': {
              color: '#ffffff'
            },
            fontSize: '1rem',
            alignItems: 'center'
          }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BingoGame;
