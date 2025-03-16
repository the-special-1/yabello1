import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  AppBar,
  Toolbar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { user, token } = response.data;
      login(user, token);

      const redirectUrl = sessionStorage.getItem('redirectUrl');
      sessionStorage.removeItem('redirectUrl');

      if (redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/') {
        navigate(redirectUrl);
      } else {
        switch (user.role) {
          case 'superadmin':
            navigate('/superadmin');
            break;
          case 'agent':
            navigate('/agent');
            break;
          case 'user':
            navigate('/user');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.response?.data?.error || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#ffffff',
          boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.5)',
          borderBottom: 'none',
          mb: 2,
          position: 'relative',
          zIndex: 3
        }}
      >
        <Container maxWidth="xl">
          <Toolbar 
            disableGutters 
            sx={{ 
              minHeight: '80px !important', 
              justifyContent: 'space-between',
              px: { xs: 2, sm: 3, md: 4 }
            }}
          >
            <Box
              component="img"
              src="/logo-small.jpg"
              alt="Yabello Bingo"
              sx={{
                height: { xs: 40, sm: 64, md: 100 },
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '700px', bgcolor: '#ffffff' }}>
        <Typography
          variant="h2"
          component="h1"
          align="center"
          sx={{
            position: 'absolute',
            top: '10px',
            left: '30%',
            transform: 'translateX(-50%)',
            color: '#8B0000',
            fontFamily: 'serif',
            fontWeight: 'lighter',
            fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
            textAlign: 'center',
            width: '100%',
            lineHeight: 0.9,
            zIndex: 2,
            textShadow: '2px 2px 8px rgba(255, 255, 255, 1), -2px -2px 8px rgba(255, 255, 255, 1)',
            pointerEvents: 'none',
            letterSpacing: '0.09em',
            px: 1,
            userSelect: 'none'
          }}
        >
          ETHIOPIA'S BEST
          <br />
          BINGO SOFTWARE
        </Typography>

        <Container 
          maxWidth={false}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, md: 4 },
            maxWidth: '1600px',
            position: 'relative',
            mt: { xs: 4, md: 2 }
          }}
        >
          <Box
            component="img"
            src="/logo-large.jpg"
            alt="Happy Bingo Logo with Characters"
            sx={{
              // width: { xs: '100%', sm: '800px', md: '2500px' },
              width:'4000px',
              height: { xs: '300px', sm: '400px', md: '600px' },
              objectFit: 'contain',
              flexShrink: 0,
              opacity: 0.98,
              ml: { xs: 0, md: '-40%' },
              mt: { xs: 4, md: 5 }
            }}
          />

          <Paper
            elevation={0}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            
              bgcolor: '#ffffff',
              width: '500px',
              height:'300px',
              boxShadow: '10px 10px 10px 10px rgba(0, 0, 0, 0.5)',
              position: { xs: 'relative', md: 'absolute' },
              left: { md: '50%' },
              top: { md: '40%' },
              transform: { md: 'translateY(-50%)' },
              zIndex: 1,
              mt: { xs: 4, md: 0 },
              borderRadius:7
            }}
          >
            <Typography
              component="h2"
              variant="h6"
              sx={{
                mb: 4,
                color: '#8B0000',
                fontWeight: 'bold',
                letterSpacing: 1,
                fontSize: '1rem'
              }}
            >
              PLEASE LOGIN
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  mb: 2,
                  '& .MuiAlert-message': {
                    color: '#d32f2f'
                  }
                }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '& .MuiTextField-root': { 
                  mb: 3,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  '& .MuiInputBase-root': {
                    borderRadius: 1
                  }
                }
              }}
            >
              <TextField
                required
                fullWidth
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="username"
                size="small"
                variant="standard"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#8B0000', fontSize: 20, ml: 1 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    height: '42px',
                    '&:before': {
                      borderBottom: 'none'
                    },
                    '&:after': {
                      borderBottom: 'none'
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottom: 'none'
                    },
                    '& input': {
                      pl: 1,
                      color: '#8B0000',
                      fontSize: '15px',
                      fontWeight: 500,
                      '&::placeholder': {
                        color: '#8B0000',
                        opacity: 0.7,
                        fontSize: '15px',
                        fontWeight: 500
                      }
                    }
                  }
                }}
              />
              <TextField
                required
                fullWidth
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                size="small"
                variant="standard"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#8B0000', fontSize: 20, ml: 1 }} />
                    </InputAdornment>
                  ),
                  sx: {
                    height: '42px',
                    '&:before': {
                      borderBottom: 'none'
                    },
                    '&:after': {
                      borderBottom: 'none'
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottom: 'none'
                    },
                    '& input': {
                      pl: 1,
                      color: '#8B0000',
                      fontSize: '15px',
                      fontWeight: 500,
                      '&::placeholder': {
                        color: '#8B0000',
                        opacity: 0.7,
                        fontSize: '15px',
                        fontWeight: 500
                      }
                    }
                  }
                }}
              />
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                mt: 3,
                position: 'relative',
                zIndex: 2
              }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: '#800000 !important',
                    color: '#ffffff !important',
                    '&:hover': {
                      bgcolor: '#660000 !important'
                    },
                    height: 36,
                    minWidth: '100px',
                    
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    letterSpacing: 1,
                    fontSize: '14px',
                    px: 3,
                    '&:disabled': {
                      bgcolor: '#8B0000 !important',
                      color: '#ffffff !important',
                      opacity: 0.8
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    'LOGIN'
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;
