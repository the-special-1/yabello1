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
  Select,
  MenuItem,
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAuth } from '../context/AuthContext';
import CartellasModal from './CartellasModal';
import CartellaCircleView from './CartellaCircleView';

const PATTERNS = [
  { name: 'Full House', description: 'Full house pattern' },
  { name: 'Top Line', description: 'Top line pattern' },
  { name: 'Middle Line', description: 'Middle line pattern' },
  { name: 'Bottom Line', description: 'Bottom line pattern' },
  { name: 'Four Corners', description: 'Four corners pattern' },
  { name: 'T Pattern', description: 'T pattern' },
  { name: 'X Pattern', description: 'X pattern' },
  { name: 'L Pattern', description: 'L pattern' }
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
  const [error, setError] = useState('');
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
    
    try {
      console.log('Selected pattern:', selectedPattern); // Debug log
      onSelect({
        cartellas: selectedCartellas,
        pattern: selectedPattern,
        betAmount
      });
      onClose(); // Close the dialog after successful submission
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePatternChange = (event) => {
    setSelectedPattern(event.target.value);
    setError(''); // Clear any existing errors
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
              {selectedCartellas.length > 0 && selectedPattern && (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<PlayArrowIcon sx={{ fontSize: 24 }} />}
                  onClick={handleSubmit}
                  sx={{ 
                    minWidth: 150,
                    height: 45,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    backgroundColor: '#ff1744',
                    boxShadow: 4,
                    '&:hover': {
                      backgroundColor: '#d50000',
                      boxShadow: 6,
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  START GAME
                </Button>
              )}
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

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>Available Cartellas:</Typography>
            <CartellaCircleView 
              cartellas={availableCartellas}
              selectedCartella={selectedCartellas[0]}
              onSelect={handleCartellaToggle}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>Select Pattern:</Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={selectedPattern}
                onChange={handlePatternChange}
                displayEmpty
                size="small"
                sx={{
                  '& .MuiSelect-select': {
                    py: 1
                  }
                }}
              >
                <MenuItem value="" disabled>
                  <em>Choose a pattern</em>
                </MenuItem>
                {PATTERNS.map((pattern) => (
                  <MenuItem key={pattern.name} value={pattern.name}>
                    {pattern.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          bgcolor: 'grey.100',
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          gap: 2
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancel
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
