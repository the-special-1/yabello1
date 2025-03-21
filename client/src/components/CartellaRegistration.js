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
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const { user } = useAuth();

  const totalBetAmount = selectedCartellas.length * betAmount;

  useEffect(() => {
    if (open) {
      fetchCartellas();
      fetchUserBalance();
    }
  }, [open]);

  const fetchCartellas = async () => {
    try {
      console.log('Fetching cartellas...');
      const response = await fetch('/api/cartellas/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch cartellas');
      }

      const text = await response.text();
      console.log('Raw response:', text);
      
      const data = JSON.parse(text);
      console.log('Parsed cartellas:', data);
      
      setAvailableCartellas(data.cartellas || []); // Access cartellas array from response
    } catch (err) {
      console.error('Error fetching cartellas:', err);
      setError(err.message);
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
      setUserBalance(data.credits || 0);
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
    if (!selectedPattern) {
      setError('Please select a pattern');
      return;
    }

    if (selectedCartellas.length === 0) {
      setError('Please select at least one cartella');
      return;
    }

    if (totalBetAmount > userBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      onSelect({
        cartellas: selectedCartellas,
        pattern: selectedPattern,
        betAmount
      });
      onClose();
    } catch (err) {
      setError(err.message);
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
              <Grid container spacing={2}>
                {availableCartellas.map((cartella) => (
                  <Grid item xs={12} sm={6} key={cartella.id}>
                    <Box
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
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 0 }}>
              <Typography variant="h6" gutterBottom>
                Game Settings
              </Typography>
              
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Pattern
                </Typography>
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

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Bet Amount (Birr)
                </Typography>
                <TextField
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  inputProps={{ min: 10 }}
                  fullWidth
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">
                  Selected Cartellas: {selectedCartellas.length}
                </Typography>
                <Typography variant="subtitle1">
                  Total Bet Amount: {totalBetAmount} Birr
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedCartellas.length === 0 || !selectedPattern || totalBetAmount > userBalance}
        >
          Confirm Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartellaRegistration;
