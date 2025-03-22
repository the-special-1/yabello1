import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  Grid
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useAuth } from '../context/AuthContext';
import CartellasModal from '../components/CartellasModal';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState('Loading...');
  const [openCartellasModal, setOpenCartellasModal] = useState(false);

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

  const handleOpenCartellasModal = () => {
    setOpenCartellasModal(true);
  };

  const handleCloseCartellasModal = () => {
    setOpenCartellasModal(false);
  };

  const handleSelectCartella = (cartella) => {
    // Handle cartella selection here
    console.log('Selected cartella:', cartella);
    setOpenCartellasModal(false);
    // You can navigate to the game with the selected cartella
    navigate('/game', { state: { selectedCartella: cartella } });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
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
                onClick={handleOpenCartellasModal}
                startIcon={<LibraryBooksIcon />}
                sx={{ fontSize: '1.2rem', py: 2, px: 4 }}
              >
                Manage Cartellas
              </Button>
              <Button
                variant="contained"
                color="success"
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
        </Grid>
      </Grid>

      <CartellasModal
        open={openCartellasModal}
        onClose={handleCloseCartellasModal}
        onSelect={handleSelectCartella}
      />
    </Container>
  );
};

export default UserDashboard;
