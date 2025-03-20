import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const PATTERNS = [
  'Full House',
  'Top Line',
  'Middle Line',
  'Bottom Line',
  'Four Corners',
  'T Pattern',
  'X Pattern',
  'L Pattern'
];

const CartellaRegistration = ({ open, onClose, onSelect }) => {
  const [selectedCartellas, setSelectedCartellas] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [availableCartellas, setAvailableCartellas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const totalBetAmount = selectedCartellas.length * betAmount;

  useEffect(() => {
    if (open) {
      fetchCartellas();
      fetchUserBalance();
    }
  }, [open]);

  const fetchCartellas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cartellas/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch cartellas');
      }
      const data = await response.json();
      setAvailableCartellas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/users/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch balance');
      }
      const data = await response.json();
      setUserBalance(data.balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    }
  };

  const handleCartellaToggle = (cartella) => {
    const isSelected = selectedCartellas.some(c => c.id === cartella.id);
    if (isSelected) {
      setSelectedCartellas(selectedCartellas.filter(c => c.id !== cartella.id));
    } else {
      setSelectedCartellas([...selectedCartellas, cartella]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCartellas.length) {
      setError('Please select at least one cartella');
      return;
    }
    if (!selectedPattern) {
      setError('Please select a pattern');
      return;
    }
    if (totalBetAmount > userBalance) {
      setError('Insufficient balance');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/games/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cartellaIds: selectedCartellas.map(c => c.id),
          pattern: selectedPattern,
          betAmount: totalBetAmount
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to register cartellas');
      }
      
      const data = await response.json();
      console.log('Game registration successful:', data);
      
      onSelect({
        cartellas: selectedCartellas.map(c => c.numbers),
        pattern: selectedPattern,
        betAmount: totalBetAmount
      });
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Select Cartellas</Typography>
          <Box>
            <Typography variant="subtitle1" color="primary">
              Balance: {userBalance} Birr
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Cartellas
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {availableCartellas.map((cartella) => (
                    <Grid item xs={12} sm={6} key={cartella.id}>
                      <Box
                        elevation={3}
                        onClick={() => handleCartellaToggle(cartella)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: 2,
                          borderColor: selectedCartellas.some(c => c.id === cartella.id) 
                            ? 'primary.main' 
                            : 'transparent',
                          '&:hover': {
                            borderColor: 'primary.main'
                          }
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom>
                          Cartella #{cartella.id}
                        </Typography>
                        <Grid container spacing={1}>
                          {cartella.numbers.map((row, rowIndex) => (
                            <Grid item xs={12} key={rowIndex}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                {row.map((number, colIndex) => (
                                  <Box
                                    key={colIndex}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      bgcolor: number === 'FREE' ? 'primary.light' : 'background.paper',
                                      color: number === 'FREE' ? 'white' : 'text.primary'
                                    }}
                                  >
                                    {number}
                                  </Box>
                                ))}
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>Game Pattern</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={selectedPattern}
                    onChange={(e) => setSelectedPattern(e.target.value)}
                  >
                    {PATTERNS.map((pattern) => (
                      <FormControlLabel
                        key={pattern}
                        value={pattern}
                        control={<Radio />}
                        label={pattern}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>Bet Amount (per cartella)</Typography>
                <TextField
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
                {selectedCartellas.length > 0 && (
                  <Typography variant="subtitle1" sx={{ mt: 1 }}>
                    Total Bet: {totalBetAmount} Birr
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            submitting || selectedCartellas.length === 0 ||
            !selectedPattern ||
            totalBetAmount > userBalance
          }
        >
          {submitting ? <CircularProgress size={24} /> : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartellaRegistration;
