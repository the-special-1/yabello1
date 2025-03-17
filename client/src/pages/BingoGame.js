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
  TextField
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartellaRegistration from '../components/CartellaRegistration';
import CartellaCheckDisplay from '../components/CartellaCheckDisplay';

const BingoGame = () => {
  const [numbers] = useState(Array.from({ length: 75 }, (_, i) => i + 1));
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [showStartModal, setShowStartModal] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawSpeed, setDrawSpeed] = useState(1000); // 1 second default
  const [gameStarted, setGameStarted] = useState(false);
  const [showCartellaRegistration, setShowCartellaRegistration] = useState(false);
  const [showCartellaCheck, setShowCartellaCheck] = useState(false);
  const [activeCartellas, setActiveCartellas] = useState([]);
  const [gamePattern, setGamePattern] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Mock data for registered cartellas - replace with API call
  const [registeredCartellas] = useState([
    // Example cartella 1
    Array.from({ length: 5 }, () => {
      const nums = Array.from({ length: 75 }, (_, i) => i + 1);
      const shuffled = nums.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    }),
    // Example cartella 2
    Array.from({ length: 5 }, () => {
      const nums = Array.from({ length: 75 }, (_, i) => i + 1);
      const shuffled = nums.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    })
  ]);

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

  const handleCartellaSelect = ({ cartellas, pattern }) => {
    setActiveCartellas(cartellas);
    setGamePattern(pattern);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Modal
        open={showStartModal}
        onClose={() => {}}
        aria-labelledby="start-game-modal"
      >
        <Box sx={modalStyle}>
          <Typography variant="h4" gutterBottom align="center" sx={{ color: 'primary.main' }}>
            Game Setup
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selected Cartellas: {activeCartellas.length}
            </Typography>
            {gamePattern && (
              <Typography variant="h6" color="primary">
                Pattern: {gamePattern}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => setShowCartellaRegistration(true)}
              startIcon={<AddCircleIcon />}
              sx={{ 
                fontSize: '1.2rem',
                padding: '0.8rem 3rem'
              }}
            >
              Register Card
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCloseModal}
              disabled={activeCartellas.length === 0}
              sx={{ 
                fontSize: '1.2rem',
                padding: '0.8rem 3rem'
              }}
            >
              Continue
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

      <CartellaRegistration
        open={showCartellaRegistration}
        onClose={() => setShowCartellaRegistration(false)}
        onSelect={handleCartellaSelect}
        cartellas={registeredCartellas}
      />

      <CartellaCheckDisplay
        open={showCartellaCheck}
        onClose={() => setShowCartellaCheck(false)}
        cartellas={activeCartellas}
        drawnNumbers={drawnNumbers}
      />

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="primary">
              Bingo Game
            </Typography>
            {gamePattern && (
              <Typography variant="subtitle1" color="primary.dark">
                Pattern: {gamePattern}
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

        <Grid container spacing={1} sx={{ mb: 4 }}>
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

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowCartellaCheck(true)}
            size="large"
          >
            Check Cartellas
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BingoGame;
