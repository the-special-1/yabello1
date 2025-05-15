import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Stack,
  Slider,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogContent,
  Snackbar,
  Alert
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartellaRegistration from '../components/CartellaRegistration';
import PatternVisualizer from '../components/PatternVisualizer';
import CartellaCheckModal from '../components/CartellaCheckModal';
import ReactConfetti from 'react-confetti';
import { getRoundNumber, incrementRound } from '../utils/roundManager';


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
  const [drawSpeed, setDrawSpeed] = useState(3000); // Default speed: 3s per draw
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
    return saved || 'Any one Line';  // Set default pattern to 'Any 1 Line'
  });
  const [checkNumber, setCheckNumber] = useState('');
  const checkInputRef = useRef(null);
  const [checkedCartella, setCheckedCartella] = useState(null);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [totalBetAmount, setTotalBetAmount] = useState(() => {
    const saved = localStorage.getItem('totalBetAmount');
    return saved ? parseFloat(saved) : 0;
  });
  const [calculationDetails, setCalculationDetails] = useState(() => {
    const saved = localStorage.getItem('calculationDetails');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentRound, setCurrentRound] = useState(1);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [selectedCaller, setSelectedCaller] = useState('bereket');
  const [selectedPattern, setSelectedPattern] = useState('oneLine'); // Example state
  const playSound = useCallback(async (type, number = null) => {
    if (type === 'number' && number) {
      try {
        const ext = selectedCaller === 'alex' ? 'mp3' : 'wav';
        const fileName = selectedCaller === 'alex' ? 
          `${number}` : 
          `${number <= 15 ? 'B' : number <= 30 ? 'I' : number <= 45 ? 'N' : number <= 60 ? 'G' : 'O'}${number}`;
        
        const audio = new Audio(`/sounds/${selectedCaller}/${fileName}.${ext}`);
        await audio.play();

        audio.onended = () => {
          audio.remove();
        };
      } catch (error) {
        console.warn('Error playing number sound:', error);
      }
    } else if (effectSounds.current[type]) {
      try {
        const audio = effectSounds.current[type];
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.warn('Error playing effect sound:', error);
      }
    }
  }, [selectedCaller]);



  // Simple audio player
  const callers = useMemo(() => [
    { id: 'bereket', name: 'Bereket' },
    { id: 'alex', name: 'Alex' },
    { id: 'arada', name: 'Arada' }
  ], []);

  // Preload next possible numbers
  const handleCallerChange = useCallback((e) => {
    const newCaller = e.target.value;
    if (newCaller === selectedCaller) return;
    setSelectedCaller(newCaller);
  }, [selectedCaller]);

  const effectSounds = useRef({});
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState('--');
  const [shufflingNumbers, setShufflingNumbers] = useState([]);
  const [recentNumbers, setRecentNumbers] = useState([]);
  const [totalBet, setTotalBet] = useState(0);
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userCut, setUserCut] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    // Load effect sounds
    const effectFiles = ['bingo', 'win', 'lose', 'start'];
    for (const effect of effectFiles) {
      try {
        const audio = new Audio(`/sounds/effects/${effect}.wav`);
        audio.preload = 'auto';
        effectSounds.current[effect] = audio;
      } catch (error) {
        console.warn(`Error loading effect sound ${effect}:`, error);
      }
    };
  }, []);

  const handleCheckCartella = useCallback(async () => {
    console.log('=== Starting Cartella Check ===');
    const number = parseInt(checkNumber);
    if (isNaN(number)) {
      showErrorToast('Please enter a valid cartella number');
      return;
    }
    
    // Find cartella by its actual ID/number
    const cartella = activeCartellas.find(c => c.id === number.toString() || c.id === number);
    console.log('Found cartella in activeCartellas:', cartella);
    
    if (!cartella) {
      showErrorToast('This cartella is not registered for the current game');
      return;
    }

    try {
      console.log('Fetching fresh cartella data for ID:', cartella.id);
      // Fetch fresh cartella data from server
      const response = await fetch(`/api/cartellas/${cartella.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cartella');
      }
      
      const freshCartella = await response.json();
      console.log('Fresh cartella data from server:', freshCartella);
      console.log('Fresh cartella numbers:', freshCartella.numbers);
      
      // Update both checked cartella and active cartellas
      setCheckedCartella(freshCartella);
      setActiveCartellas(prev => {
        const updated = prev.map(c => c.id === freshCartella.id ? freshCartella : c);
        console.log('Updated activeCartellas:', updated);
        return updated;
      });
      
      setShowCheckModal(true);
      setCheckNumber(''); // Clear the input
    } catch (err) {
      console.error('Error fetching fresh cartella data:', err);
      showErrorToast('Error checking cartella. Please try again.');
    }
  }, [activeCartellas, checkNumber, showErrorToast]);

  const handleCheckInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleCheckCartella();
    } else if (e.key === 'Backspace' && checkNumber === '') {
      // When backspace is pressed on empty input, close modal
      setShowCheckModal(false);
    }
  }, [handleCheckCartella, checkNumber]);

  const playNumberSound = useCallback((number) => {
    playSound('number', number);
  }, [playSound]);

  const drawNumber = useCallback(() => {
    const remainingNumbers = numbers.filter(n => !drawnNumbers.includes(n));
    if (remainingNumbers.length === 0) {
      setIsDrawing(false);
      return;
    }
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const drawn = remainingNumbers[randomIndex];
    
    // Update state first
    setDrawnNumbers(prev => [...prev, drawn]);
    setLastDrawn(drawn);
    
    // Update the background immediately and after a delay to ensure it sticks
    const updateBackground = () => {
      const element = document.getElementById(`cell-${drawn}`);
      if (element) {
        // Force immediate style update
        requestAnimationFrame(() => {
          element.style.cssText = `
            background: url(/selected.png);
            background-size: cover;
            background-position: center;
            color: #444444;
            transition: none;
            z-index: 1;
          `;
        });
      }
    };
    
    // Update immediately and after animation
    updateBackground();
    setTimeout(updateBackground, 2100); // After animation duration (2000ms) + buffer
    
    playNumberSound(drawn);
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
    if (!calculationDetails) {
      showErrorToast('Please register cards first');
      return;
    }
    if (activeCartellas.length > 0) {
      setShowStartModal(false);
    }
  };

  const handleStartGame = async () => {
    try {
      if (!calculationDetails) {
        throw new Error('please register cards');
      }

      // Play start sound
      playSound('start');

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

  const handleNewBingo = async () => {
    if (!calculationDetails) {
      showErrorToast('Please register cards first');
      return;
    }

    try {
      // Save round data
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

      // Increment round number
      if (user?.branchId) {
        const newRound = await incrementRound(user.branchId);
        if (newRound) {
          setCurrentRound(newRound);
        }
      }

      // Reset game state
      setDrawnNumbers([]);
      setLastDrawn(null);
      setIsDrawing(false);
      setGameStarted(false);
      setShowCheckModal(false);
      setShowStartModal(true);
      setActiveCartellas([]);
      setCalculationDetails(null);
      setTotalBetAmount(0);
      setRecentNumbers([]);
      setGamePattern('Any one Line');
      
      // Clear local storage
      localStorage.removeItem('drawnNumbers');
      localStorage.removeItem('lastDrawn');
      localStorage.removeItem('gameStarted');
      localStorage.removeItem('gameInProgress');
      localStorage.removeItem('activeCartellas');
      localStorage.removeItem('totalBetAmount');
      localStorage.removeItem('gamePattern');
      localStorage.removeItem('calculationDetails');

      // Reset all cell styles
      numbers.forEach(num => {
        const element = document.getElementById(`cell-${num}`);
        if (element) {
          element.style.transition = 'none';
          element.style.background = `linear-gradient(rgba(128, 128, 128, 0.08), rgba(128, 128, 128, 0.08)), url(/normal.png)`;
          element.style.backgroundSize = 'cover';
          element.style.backgroundPosition = 'center';
          element.style.color = 'gray';
          element.style.zIndex = 1;
        }
      });

    } catch (error) {
      console.error('Error starting new game:', error);
      showErrorToast('Failed to start new game. Please try again.');
    }
  };

  const handleShuffle = () => {
    if (isShuffling) return;
    playSound('shuffle');
    setIsShuffling(true);
    
    const startTime = Date.now();
    const SHUFFLE_DURATION = 5000; // 5 seconds
    
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime >= SHUFFLE_DURATION) {
        clearInterval(interval);
        setIsShuffling(false);
        setShufflingNumbers([]);
        return;
      }
      
      // Generate 6 random numbers for this iteration
      const newShuffleNumbers = Array.from({length: 6}, () => 
        Math.floor(Math.random() * 75) + 1
      );
      setShufflingNumbers(newShuffleNumbers);
      
    }, 300); // Change numbers every 300ms
  };



  const toggleDrawing = () => {
    const newIsDrawing = !isDrawing;
    setIsDrawing(newIsDrawing);
  };

  const handleSpeedChange = (_, newValue) => {
    // Convert slider value (2-10) to milliseconds (8000-2000)
    setDrawSpeed((12 - newValue) * 1000);
  };

  const handleCartellaSelect = async ({ cartellas, pattern, betAmount, totalBet, calculationDetails }) => {
    try {
      // First update the state
      setActiveCartellas(cartellas);
      setGamePattern(pattern);
      setTotalBetAmount(calculationDetails.adjustedTotalBet);
      setCalculationDetails(calculationDetails);
      setShowCartellaRegistration(false);
    } catch (error) {
      console.error('Error in handleCartellaSelect:', error);
      setShowCartellaRegistration(true); // Show registration again on error
      throw error;
    }
  };

  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];

  const organizedNumbers = [];
  for (let i = 0; i < 75; i += 15) {
    organizedNumbers.push(numbers.slice(i, i + 15));
  }

  const checkWin = (cartella) => {
    if (!cartella || !cartella.numbers || !gamePattern) return false;

    const checkLine = (numbers) => numbers.every(num => num === 'free' || drawnNumbers.includes(num));
    const getColumn = (colIndex) => cartella.numbers.map(row => row[colIndex]);
    const getDiagonal = (reverse = false) => {
      return cartella.numbers.map((row, i) => row[reverse ? 4 - i : i]);
    };

    switch (gamePattern) {
      case 'Any one Line': {
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

      case 'Any two Lines': {
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

  const refreshCartellaData = async () => {
    try {
      // If we have a checked cartella, refresh its data
      if (checkedCartella) {
        const response = await fetch(`/api/cartellas/${checkedCartella.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch cartella');
        }
        const updatedCartella = await response.json();
        setCheckedCartella(updatedCartella);

        // Also update the cartella in activeCartellas
        setActiveCartellas(prev => 
          prev.map(cartella => 
            cartella.id === updatedCartella.id ? updatedCartella : cartella
          )
        );
      }
    } catch (err) {
      console.error('Error refreshing cartella data:', err);
    }
  };

  useEffect(() => {
    const fetchActiveCartellas = async () => {
      try {
        const promises = activeCartellas.map(cartella =>
          fetch(`/api/cartellas/${cartella.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(res => res.json())
        );
        const updatedCartellas = await Promise.all(promises);
        setActiveCartellas(updatedCartellas);
      } catch (err) {
        console.error('Error refreshing active cartellas:', err);
      }
    };

    // Refresh active cartellas when showCheckModal is opened
    if (showCheckModal) {
      fetchActiveCartellas();
    }
  }, [showCheckModal]);

  // Persist game state to localStorage
  useEffect(() => {
    localStorage.setItem('gameStarted', JSON.stringify(gameStarted));
    if (gameStarted) {
      localStorage.setItem('gameInProgress', 'true');
    } else {
      localStorage.removeItem('gameInProgress');
    }
    localStorage.setItem('drawnNumbers', JSON.stringify(drawnNumbers));
    localStorage.setItem('lastDrawn', JSON.stringify(lastDrawn));
    localStorage.setItem('isDrawing', JSON.stringify(isDrawing));
    localStorage.setItem('activeCartellas', JSON.stringify(activeCartellas));
    localStorage.setItem('totalBetAmount', totalBetAmount);
    localStorage.setItem('gamePattern', gamePattern);
    localStorage.setItem('calculationDetails', calculationDetails ? JSON.stringify(calculationDetails) : '');
  }, [gameStarted, drawnNumbers, lastDrawn, isDrawing, activeCartellas, totalBetAmount, gamePattern, calculationDetails]);

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
                      height: { xs: 35, sm: 38, md: 40 },
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
                  backgroundColor: '#800000',
                  '&:hover': {
                    backgroundColor: '#600000'
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
        onCartellaUpdate={refreshCartellaData}
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
    flexDirection: { xs: 'column', md: 'row' },
    height: { xs: 'auto', md: '340px' },
    width: '100%',
    backgroundColor: '#1a1a1a',
    mb: 0,
    p: 0
  }}>

          {/* Ball display */}
          <Box sx={{
            width: { xs: '100%', md: '19%' },
            borderRight: '1px solid rgba(255,255,255,0.1)',
            height: '90%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            p: 0,
            border: '1px solid whitesmoke',

          }}>
            <Box sx={{
              width: { xs: 200, sm: 240, md: 280 },
              height: { xs: 200, sm: 240, md: 280 },
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 30% 30%, #791600, #cb2400)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.2)',
              border: '10px solid #ffffff'
            }}>
              <Box
                sx={{
                  width: '70%',
                  height: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' }
                  }
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
              </Box>
            </Box>
          </Box>

          {/* Pattern display */}
          <Box
  sx={{
    width: { xs: '100%', md: '23%' },
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    ml: 6.7
  }}
>
   <PatternVisualizer
        pattern={gamePattern}
        gameStarted={gameStarted}
        lastDrawn={lastDrawn}
      />
</Box>
         


          {/* Recent Numbers */}
          <Box sx={{
            width: { xs: '100%', md: '32%' },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(to right, #040124, #710819)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            p: 1,
            borderRadius: '8px',
            ml: 5,
            
            
            
          }}>
            <Typography variant="h4" sx={{ 
              color: 'white', 
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              mt: { xs: '5px', sm: '8px', md: '10px' },
           
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
              mt: { xs: '20px', sm: '35px', md: '50px' },
            }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box key={index} sx={{
                  width: { xs: 60, sm: 70, md: 80 },
                  height: { xs: 60, sm: 70, md: 80 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `url(/selected.png)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: '#444444',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.1rem' },
                  fontWeight: 'bolder',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  mt: 0
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
                  height: { xs: '40px', sm: '50px', md: '60px' },
                  width: { xs: '300px', sm: '400px', md: '480px' },
                  mb:5,
                }}
              />
            
            </Box>
          </Box>

          {/* Win Amount Box */}
          <Box sx={{
            width: { xs: '100%', md: '20%' },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(to right, #040124, #710819)',
            p: 0,
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            m: 0,
          }}>
             <Box
                component="img"
                src="/derash.png"
                alt="derash"
                sx={{
                  height: { xs: '50px', sm: '60px', md: '70px' },
                  width: { xs: '220px', sm: '300px', md: '320px' },
                  mb:5,
                }}
              />
            {/* <Box sx={{
              backgroundColor: '#fff',
              // borderRadius: '4px',
              px: 6,
          
              width: { xs: '250px', sm: '280px', md: '300px' },
              height: { xs: '60px', sm: '70px', md: '80px' },
              alignSelf: 'center',
              
            }}>
              <Typography  sx={{ 
                color: '#4a0000',
                fontWeight: 'bolder',
                fontSize: '4px',
                
                
              }}>
                ደራሽ
              </Typography>
            </Box> */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              mt: -16
            }}>
              <Typography sx={{ 
                fontSize: '5rem',
                mb:-7,
                color: '#f0efe7',
                fontWeight: 'bolder',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                {Number(totalBetAmount).toLocaleString('en-US', {
                  maximumFractionDigits: 0
                })}
              </Typography>
              <Typography sx={{ 
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
                color: '#f0efe7',
                fontWeight: 'bolder',
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
          backgroundColor: '#1a1a1a',
          mt:-5
        }}>
          <Grid 
            container 
            spacing={0.2} 
            sx={{ 
              width: '100%',
              margin: 0,
              padding: { xs: '0 8px', sm: '0 12px', md: '0 16px' },
              backgroundColor: '#1a1a1a'
            }}
          >
            {organizedNumbers.map((row, rowIndex) => (
              <Grid item xs={12} key={rowIndex}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  width: '100%',
                  mb: 0.1
                }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      minWidth: { xs: 30, sm: 35, md: 40 },
                      fontWeight: 'bold',
                      color: '#444444',
                       ml: { xs: 2, sm: 4, md: 6 },
                       width: { xs: 50, sm: 60, md: 70 },
                       height: { xs: 50, sm: 60, md: 70 },
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `url(/bingo.png)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      fontSize: '3.5rem',
                
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
                              ml: { xs: 8, sm: 12, md: 16 },
                              p: 1.5,
                              height: { xs: '50px', sm: '60px', md: '70px' },
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              background: drawnNumbers.includes(number) ? `url(/selected.png)` : `linear-gradient(rgba(128, 128, 128, 0.08), rgba(128, 128, 128, 0.08)), url(/normal.png)`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundBlendMode: 'normal',
                              color: drawnNumbers.includes(number) ? '#444444' : 'gray',
                              zIndex: 1,
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
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: '128px', // Match the margin-left of the Paper
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '3.1rem',
                                fontWeight: 'bolder',
                                zIndex: 999,
                                animation: 'scaleUpDown 2s ease-in-out',
                                '@keyframes scaleUpDown': {
                                  '0%': { transform: 'scale(1)', background: '#ff0000' },
                                  '30%': { transform: 'scale(1.2)', background: '#ff0000' },
                                  '50%': { transform: 'scale(1.2)', background: '#ff0000' },
                                  '70%': { transform: 'scale(1.5)', background: '#ff0000' },
                                  '90%': { transform: 'scale(1.1)', background: '#ff0000' },
                                  '100%': {
                                    transform: 'scale(1)',
                                    background: 'url(/selected.png)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }
                                }
                              }}
                            >
                              {number}
                            </Box>
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
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '0 16px',
            ml: { xs: 2, sm: 10, md: 20 },
            backgroundColor: '#1a1a1a'
          }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1, sm: 2 }} 
              alignItems={{ xs: 'stretch', sm: 'center' }}
              width={{ xs: '100%', sm: 'auto' }}
            >
              <Button
                variant="contained"
                // color={isDrawing ? 'success' : 'primary'}
                onClick={toggleDrawing}
                sx={{ 
                  minWidth: 120,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: isDrawing ? '#4CAF50' : '#790918',
                  '&:hover': {
                    backgroundColor: isDrawing ? '#4CAF50' : '#790918'
                  },
                }}
              >
                   {isDrawing ? 'STOP' : 'BINGO'}
              </Button>
              <Button
                variant="contained"
                onClick={handleShuffle}
                disabled={isShuffling || isDrawing}
                sx={{ 
                  minWidth: 120,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#f0efe7',
                  color:'black'
                }}
              >
                Bowzew
              </Button>

              <Select
                value={selectedCaller}
                onChange={handleCallerChange}
                IconComponent={ArrowDropDown}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'white',
                    }
                  }
                }}
                sx={{ 
                  minWidth: 100,
                  height: 40,
                  color: 'black',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease-in-out',
                  willChange: 'transform',
                  '& .MuiSelect-select': {
                    py: 1,
                    color: 'black',
                    fontWeight: 'bold',
                    transition: 'color 0.2s ease-in-out'
                  },
                  '& .MuiSelect-icon': {
                    color: 'black',
                    transition: 'transform 0.2s ease-in-out'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    transition: 'border-color 0.2s ease-in-out'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.87)'
                  },
                  '&:hover .MuiSelect-icon': {
                    transform: 'rotate(180deg)'
                  }
                }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      transition: 'opacity 0.2s ease-in-out',
                      transformOrigin: 'top'
                    }
                  }
                }}
              >
                {callers.map(caller => (
                  <MenuItem 
                    key={caller.id} 
                    value={caller.id}
                    sx={{
                      color: 'black',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      },
                      '&.Mui-selected': {
                        bgcolor: '#e3f2fd',
                        color: 'black',
                        '&:hover': {
                          bgcolor: '#bbdefb'
                        }
                      }
                    }}
                  >
                    {caller.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: { xs: '100%', sm: 300, md: 370 },
              height: { xs: 40, sm: 42, md: 45 },
                ml:2,
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
                  right: `${((drawSpeed/1000 - 2) / 8) * 100}%`
                }}
              />
              <Slider
                value={10 - drawSpeed/1000}
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
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1, sm: 0 }} 
              alignItems={{ xs: 'stretch', sm: 'center' }}
              width={{ xs: '100%', sm: 'auto' }}
            >
              <TextField
                inputRef={checkInputRef}
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                onKeyDown={handleCheckInputKeyDown}
                placeholder="Enter Card Number"
                variant="outlined"
                size="small"
                sx={{
                  width: { xs: '100%', sm: 200 },
                  ml: 2,
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
                  backgroundColor: '#790918',
                  // fontWeight: 'bold'
                }}
              >
                Check
              </Button>
            </Stack>
          </Box>
        </Box>

      </Box>

      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={500}
          recycle={false}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      <CartellaCheckModal
        setShowConfetti={setShowConfetti}
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
