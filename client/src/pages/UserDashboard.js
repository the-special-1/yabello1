import React from 'react';
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
  const { logout } = useAuth();

  const handleStartGame = () => {
    navigate('/game');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Bingo Game
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleStartGame}
              sx={{ 
                fontSize: '1.5rem',
                padding: '1rem 4rem'
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
                fontSize: '1.5rem',
                padding: '1rem 2rem'
              }}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserDashboard;
