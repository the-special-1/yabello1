import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    return saved || 'Any 1 Line';  // Set default pattern to 'Any 1 Line'
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
  const [selectedPattern, setSelectedPattern] = useState('oneLine'); // Example state
  const [selectedCaller, setSelectedCaller] = useState('amharic');
  const audioCache = useRef({});
  const effectSounds = useRef({});

  // Preload and cache audio files
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

  useEffect(() => {
    // Preload effect sounds
    const effects = {
      start: new Audio('/sounds/effects/start.wav'),
      shuffle: new Audio('/sounds/effects/shuffle.wav'),
      goodBingo: new Audio('/sounds/effects/good.wav'),
      notBingo: new Audio('/sounds/effects/notgood.wav')
    };
    
    // Enable quick playback
    Object.values(effects).forEach(audio => {
      audio.preload = 'auto';
    });
    
    effectSounds.current = effects;

    // Preload number sounds for current caller
    if (selectedCaller === 'amharic') {
      for (let i = 1; i <= 75; i++) {
        const audio = new Audio(`/sounds/amharic/${i}.mp3`);
        audio.preload = 'auto';
        audioCache.current[i] = audio;
      }
    }
  }, [selectedCaller]);
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

      // Check if we need to reset the round (new day)
      const lastResetDate = localStorage.getItem('lastRoundResetDate');
      const today = new Date().toDateString();
      
      if (lastResetDate !== today) {
        // It's a new day, reset round to 1
        try {
          await fetch('/api/rounds/reset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ branchId: user.branchId })
          });
          localStorage.setItem('lastRoundResetDate', today);
          setCurrentRound(1);
          return;
        } catch (error) {
          console.error('Error resetting round:', error);
        }
      }

      // Get current round
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
    if (calculationDetails) {
      localStorage.setItem('calculationDetails', JSON.stringify(calculationDetails));
    } else {
      localStorage.removeItem('calculationDetails');
    }
  }, [calculationDetails]);

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

  // Fetch current round and set up polling
  useEffect(() => {
    const fetchCurrentRound = async () => {
      if (!user?.branchId) return;
      
      try {
        const response = await fetch(`/api/rounds/current/${user.branchId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentRound(data.currentRound);
        }
      } catch (error) {
        console.error('Error fetching current round:', error);
      }
    };

    // Initial fetch
    fetchCurrentRound();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchCurrentRound, 30000);

    return () => clearInterval(interval);
  }, [user?.branchId]);

  const handleCheckCartella = async () => {
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

  const playSound = (type, number = null) => {
    try {
      if (type === 'number' && selectedCaller === 'amharic') {
        const numberOnly = number.toString().replace(/[BINGO]-/g, '');
        const audio = audioCache.current[numberOnly];
        if (audio) {
          audio.currentTime = 0;
          return audio.play();
        }
      } else if (effectSounds.current[type]) {
        const audio = effectSounds.current[type];
        audio.currentTime = 0;
        return audio.play();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playNumberSound = (number) => {
    playSound('number', number);
  };

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
      setGamePattern('Any 1 Line');
      
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

  // Add callers list
  const callers = [
    { id: 'auto', name: 'Auto Caller' },
    { id: 'amharic', name: 'Amharic' },
    { id: 'english', name: 'English' },
    { id: 'oromifa', name: 'Oromifa' }
  ];

  const toggleDrawing = () => {
    const newIsDrawing = !isDrawing;
    setIsDrawing(newIsDrawing);
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
    height: 'auto', // Allow height to adjust dynamically
    width: '100%',
    backgroundColor: '#1a1a1a',
    mb: 0,
    minHeight: '0', // Allows the parent to shrink
  }}>

          {/* Ball display */}
          <Box sx={{
            width: '25%',
            height: '90%',
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
            width: '32%',
            height: '90%',
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
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `url(/selected.png)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: '#444444',
                  fontSize: '4rem',
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
                  height: '60px',
                  width: '480px',
                  mb:2,
                }}
              />
            
            </Box>
          </Box>

          {/* Win Amount Box */}
          <Box sx={{
            width: '20%',
            height: '90%',
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
          
              width: '300px',
              height: '100px',
              alignSelf: 'center'
            }}>
              <Typography variant="h1" sx={{ 
                color: '#4a0000',
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
              <Typography sx={{ 
                fontSize: '5rem',
                mb:-7,
                color: '#f0efe7',
                fontWeight: 'bolder',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                {Number(totalBet).toLocaleString('en-US', {
                  maximumFractionDigits: 0
                })}
              </Typography>
              <Typography sx={{ 
                fontSize: '5rem',
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
                      color: '#444444',
                      ml: 6,
                      width: 70,
                      height: 70,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `url(/bingo.png)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      fontSize: '3rem'
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
                              ml: 16,
                              p: 1.5,
                              height: '70px',
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
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#444444',
                                fontSize: '3.1rem',
                                fontWeight: 'bolder',
                                zIndex: 999,
                                animation: 'scaleUpDown 2s ease-in-out',
                                '@keyframes scaleUpDown': {
                                  '0%': { transform: 'scale(1)' },
                                  '30%': { transform: 'scale(1.2)' },
                                  '50%': { transform: 'scale(1.2)' },
                                  '70%': { transform: 'scale(1.5)' },
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
            ml: 20,
            backgroundColor: '#1a1a1a'
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                // color={isDrawing ? 'success' : 'primary'}
                onClick={toggleDrawing}
                sx={{ 
                  minWidth: 120,
                  height: 40,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: isDrawing ? '#4CAF50' : '#1976D2',
                 
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
                onChange={(e) => setSelectedCaller(e.target.value)}
                IconComponent={ArrowDropDown}
                sx={{ 
                  minWidth: 100,
                  height: 40,
                  color: 'black',
                  backgroundColor: 'whitesmoke',
                  '& .MuiSelect-select': {
                    py: 1
                  },
                  '& .MuiSelect-icon': {
                    color: 'black'
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
                width: 370,
                height: 45,
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
            <Stack direction="row" spacing={0} alignItems="center">
              <TextField
                inputRef={checkInputRef}
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                onKeyDown={handleCheckInputKeyDown}
                placeholder="Enter Card Number"
                variant="outlined"
                size="small"
                sx={{
                  width: 200,
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
