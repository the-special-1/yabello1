import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState('Loading...');

  useEffect(() => {
    const getBalance = async () => {
      try {
        const response = await fetch('/api/users/balance');
        const text = await response.text();
        console.log('Raw response text:', text);
        
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
        
        if (data && typeof data.credits !== 'undefined') {
          setCredits(data.credits.toString());
        } else {
          setCredits('Error');
        }
      } catch (error) {
        console.error('Error:', error);
        setCredits('Error');
      }
    };
    getBalance();
  }, []);

  const handleStartGame = () => {
    navigate('/game');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Bingo Game
        </Typography>
        
        <Typography variant="h5" sx={{ my: 4 }}>
          Cash: {credits} ETB
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleStartGame}
            sx={{ fontSize: '1.2rem', py: 2, px: 4 }}
          >
            Start Game
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="large"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ fontSize: '1.2rem', py: 2, px: 3 }}
          >
            Logout
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default UserDashboard;
