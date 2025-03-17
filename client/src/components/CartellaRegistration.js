import React, { useState } from 'react';
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
  Select,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  IconButton
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InfoIcon from '@mui/icons-material/Info';

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

const CartellaRegistration = ({ open, onClose, onSelect, cartellas }) => {
  const [selectedCartellas, setSelectedCartellas] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardNumbers, setNewCardNumbers] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [newCardId, setNewCardId] = useState('');
  const [registeredCartellas, setRegisteredCartellas] = useState(cartellas);
  const [userBalance, setUserBalance] = useState(1000);

  const totalBetAmount = selectedCartellas.length * betAmount;

  const handleCartellaToggle = (index) => {
    const isSelected = selectedCartellas.includes(index);
    if (isSelected) {
      setSelectedCartellas(selectedCartellas.filter(i => i !== index));
    } else {
      setSelectedCartellas([...selectedCartellas, index]);
    }
  };

  const handleSubmit = () => {
    if (selectedCartellas.length > 0 && selectedPattern && totalBetAmount <= userBalance) {
      onSelect({
        cartellas: selectedCartellas.map(index => registeredCartellas[index]),
        pattern: selectedPattern,
        betAmount: totalBetAmount
      });
      setUserBalance(prev => prev - totalBetAmount);
      onClose();
    }
  };

  const handleNewCardSubmit = () => {
    if (!newCardId.trim()) {
      alert('Please enter a card ID');
      return;
    }

    // Validate numbers
    const allNumbers = newCardNumbers.flat();
    const middleIndex = Math.floor(allNumbers.length / 2);
    const hasInvalidNumbers = allNumbers.some((num, index) => {
      if (index === middleIndex) return false; // Skip middle cell
      return !num || isNaN(num) || num < 1 || num > 75;
    });

    if (hasInvalidNumbers) {
      alert('Please fill all cells with valid numbers (1-75)');
      return;
    }

    // Create new cartella with middle cell as 'FREE'
    const newCartella = newCardNumbers.map((row, i) => 
      row.map((num, j) => {
        if (i === 2 && j === 2) return 'FREE';
        return parseInt(num);
      })
    );

    setRegisteredCartellas(prev => [...prev, newCartella]);
    setNewCardNumbers(Array(5).fill().map(() => Array(5).fill('')));
    setNewCardId('');
    setShowNewCardForm(false);
  };

  const handleNumberChange = (rowIndex, colIndex, value) => {
    if (rowIndex === 2 && colIndex === 2) return; // Middle cell is always FREE
    
    const newNumbers = [...newCardNumbers];
    // Only allow numbers 1-75
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 75)) {
      newNumbers[rowIndex][colIndex] = value;
      setNewCardNumbers(newNumbers);
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Available Cartellas</Typography>
                <Button
                  startIcon={<AddCircleIcon />}
                  onClick={() => setShowNewCardForm(true)}
                >
                  Add New Card
                </Button>
              </Stack>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {registeredCartellas.map((cartella, index) => (
                  <Grid item xs={4} key={index}>
                    <Box
                      onClick={() => handleCartellaToggle(index)}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 2,
                        borderColor: selectedCartellas.includes(index) ? 'primary.main' : 'grey.300',
                        bgcolor: selectedCartellas.includes(index) ? 'primary.light' : 'background.paper',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <Typography variant="h5" color={selectedCartellas.includes(index) ? 'primary.main' : 'text.primary'}>
                        {index + 1}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
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
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">Bet Amount</Typography>
                  <Tooltip title="Amount per cartella">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Stack>
                <Select
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mt: 1 }}
                >
                  {[10, 20, 50, 100, 200, 500].map((amount) => (
                    <MenuItem key={amount} value={amount}>{amount} Birr</MenuItem>
                  ))}
                </Select>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Total bet: {totalBetAmount} Birr
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Dialog
          open={showNewCardForm}
          onClose={() => setShowNewCardForm(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Cartella</DialogTitle>
          <DialogContent>
            <TextField
              label="Card ID"
              fullWidth
              value={newCardId}
              onChange={(e) => setNewCardId(e.target.value)}
              margin="normal"
              required
            />
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {newCardNumbers.map((row, rowIndex) => (
                <Grid item xs={12} key={rowIndex}>
                  <Grid container spacing={1}>
                    {row.map((num, colIndex) => (
                      <Grid item xs={2.4} key={colIndex}>
                        <TextField
                          size="small"
                          value={rowIndex === 2 && colIndex === 2 ? 'FREE' : num}
                          onChange={(e) => handleNumberChange(rowIndex, colIndex, e.target.value)}
                          inputProps={{
                            min: 1,
                            max: 75,
                            style: { textAlign: 'center' }
                          }}
                          type="number"
                          disabled={rowIndex === 2 && colIndex === 2}
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              WebkitTextFillColor: '#1976d2',
                              fontWeight: 'bold'
                            }
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewCardForm(false)}>Cancel</Button>
            <Button onClick={handleNewCardSubmit} variant="contained">Add Card</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Typography variant="body1" color="error" sx={{ flexGrow: 1 }}>
          {totalBetAmount > userBalance ? 'Insufficient balance!' : ''}
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            selectedCartellas.length === 0 ||
            !selectedPattern ||
            totalBetAmount > userBalance
          }
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartellaRegistration;
