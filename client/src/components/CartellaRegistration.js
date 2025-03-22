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
  Alert,
  IconButton,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import CartellasModal from './CartellasModal';

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

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cartella-tabpanel-${index}`}
      aria-labelledby={`cartella-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CartellaRegistration = ({ open, onClose, onSelect }) => {
  const [selectedCartellas, setSelectedCartellas] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [availableCartellas, setAvailableCartellas] = useState([]);
  const [error, setError] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [showNewCartellaModal, setShowNewCartellaModal] = useState(false);
  const { user } = useAuth();

  const totalBetAmount = selectedCartellas.length * betAmount;

  useEffect(() => {
    if (open) {
      fetchCartellas();
      fetchUserBalance();
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchCartellas = async () => {
    try {
      console.log('Fetching cartellas...');
      const response = await fetch('/api/cartellas/branch', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch cartellas');
      }

      const data = await response.json();
      console.log('Parsed cartellas:', data);
      
      // Filter out cartellas that are already registered in a game
      const filteredCartellas = data.filter(cartella => 
        !['playing', 'won', 'lost'].includes(cartella.status)
      );
      
      setAvailableCartellas(filteredCartellas || []);
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

  const handleSubmit = () => {
    if (selectedCartellas.length === 0) {
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
    onSelect({
      cartellas: selectedCartellas,
      pattern: selectedPattern,
      betAmount
    });
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth={false}
        fullScreen
        PaperProps={{
          style: {
            backgroundColor: '#f5f5f5'  
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight="bold">
              Select Cartellas
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Paper sx={{ p: 1, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
                <Typography variant="subtitle1" color="primary" fontWeight="bold">
                  Balance: {userBalance} ETB
                </Typography>
              </Paper>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                boxShadow: 1
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mb: 3,
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bgcolor: 'background.paper',
            py: 2,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowNewCartellaModal(true)}
              sx={{ 
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Register New Cartella
            </Button>
          </Box>

          <Grid container spacing={3}>
            {availableCartellas.map((cartella) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={cartella.id}>
                <Paper
                  elevation={selectedCartellas.some(c => c.id === cartella.id) ? 8 : 2}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedCartellas.some(c => c.id === cartella.id)
                      ? 'primary.main'
                      : 'transparent',
                    bgcolor: selectedCartellas.some(c => c.id === cartella.id)
                      ? 'primary.light'
                      : 'white',
                    '&:hover': {
                      boxShadow: 6,
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    }
                  }}
                  onClick={() => handleCartellaToggle(cartella)}
                >
                  <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                    Cartella #{cartella.id}
                  </Typography>
                  <Grid container spacing={1}>
                    {cartella.numbers.map((row, i) => (
                      row.map((num, j) => (
                        <Grid item xs={2.4} key={`${i}-${j}`}>
                          <Paper
                            sx={{
                              p: 1.5,
                              textAlign: 'center',
                              fontWeight: 'bold',
                              bgcolor: num === 'FREE' ? 'primary.main' : 'grey.100',
                              color: num === 'FREE' ? 'white' : 'text.primary',
                              border: 1,
                              borderColor: 'grey.300'
                            }}
                          >
                            {num === 'FREE' ? '0' : num}
                          </Paper>
                        </Grid>
                      ))
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ mt: 4, p: 3, boxShadow: 3 }}>
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Select Pattern:
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2,
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {PATTERNS.map((pattern) => (
                  <FormControlLabel
                    key={pattern}
                    value={pattern}
                    control={
                      <Radio 
                        sx={{
                          '&.Mui-checked': {
                            color: 'primary.main'
                          }
                        }}
                      />
                    }
                    label={
                      <Typography 
                        variant="subtitle1"
                        sx={{
                          fontWeight: selectedPattern === pattern ? 'bold' : 'normal',
                          color: selectedPattern === pattern ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {pattern}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </FormControl>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3} 
              alignItems="center"
              sx={{
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <TextField
                label="Bet Amount (ETB)"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                inputProps={{ min: 10 }}
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white'
                  }
                }}
              />
              <Typography variant="h6" color="primary" fontWeight="bold">
                Total Bet: {totalBetAmount} ETB
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                Balance: {userBalance} ETB
              </Typography>
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          bgcolor: 'grey.100',
          borderTop: '1px solid rgba(0, 0, 0, 0.12)'
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={selectedCartellas.length === 0 || !selectedPattern || totalBetAmount > userBalance}
            sx={{ 
              minWidth: 120,
              boxShadow: 2,
              '&:not(:disabled):hover': {
                boxShadow: 4
              }
            }}
          >
            Start Game
          </Button>
        </DialogActions>
      </Dialog>

      {showNewCartellaModal && (
        <CartellasModal
          open={showNewCartellaModal}
          onClose={() => {
            setShowNewCartellaModal(false);
            fetchCartellas();
          }}
        />
      )}
    </>
  );
};

export default CartellaRegistration;
