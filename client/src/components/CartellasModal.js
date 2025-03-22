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
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';

const CartellasModal = ({ open, onClose }) => {
  const [newCartella, setNewCartella] = useState({
    id: '',
    numbers: Array(5).fill().map(() => Array(5).fill(''))
  });
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleNumberChange = (row, col, value) => {
    const updatedNumbers = [...newCartella.numbers];
    updatedNumbers[row][col] = value === '' ? '' : parseInt(value, 10);
    setNewCartella({ ...newCartella, numbers: updatedNumbers });
  };

  const handleCreateCartella = async () => {
    try {
      const response = await fetch('/api/cartellas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCartella)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create cartella');
      }

      setNewCartella({
        id: '',
        numbers: Array(5).fill().map(() => Array(5).fill(''))
      });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // Set center cell to 0
    const updatedNumbers = [...newCartella.numbers];
    updatedNumbers[2][2] = '0';
    setNewCartella(prev => ({
      ...prev,
      numbers: updatedNumbers
    }));
  }, []);

  return (
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
            Register New Cartella
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
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
          maxWidth: 600, 
          mx: 'auto', 
          mt: 4,
          bgcolor: 'white',
          p: 4,
          borderRadius: 2,
          boxShadow: 3
        }}>
          <TextField
            fullWidth
            label="Cartella ID"
            value={newCartella.id}
            onChange={(e) => setNewCartella({ ...newCartella, id: e.target.value })}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'grey.50'
              }
            }}
          />
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              mb: 3,
              border: '1px solid',
              borderColor: 'primary.main'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
              Enter Numbers (1-75)
            </Typography>
            <Grid container spacing={1}>
              {newCartella.numbers.map((row, i) => (
                row.map((num, j) => (
                  <Grid item xs={2.4} key={`${i}-${j}`}>
                    {i === 2 && j === 2 ? (
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          bgcolor: '#1976d2',
                          color: 'white',
                          fontWeight: 'bold',
                          boxShadow: 2,
                          fontSize: '1.2rem'
                        }}
                      >
                        0
                      </Paper>
                    ) : (
                      <TextField
                        size="small"
                        value={num}
                        onChange={(e) => handleNumberChange(i, j, e.target.value)}
                        inputProps={{
                          style: { 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: '#1976d2'
                          },
                          min: 1,
                          max: 75
                        }}
                        type="number"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            border: '2px solid',
                            borderColor: 'grey.300',
                            '&:hover': {
                              borderColor: 'primary.main'
                            },
                            '&.Mui-focused': {
                              borderColor: 'primary.main'
                            }
                          },
                          '& .MuiOutlinedInput-input': {
                            color: '#1976d2',
                            '&::placeholder': {
                              color: 'grey.500',
                              opacity: 1
                            }
                          }
                        }}
                      />
                    )}
                  </Grid>
                ))
              ))}
            </Grid>
          </Paper>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<AddIcon />}
            onClick={handleCreateCartella}
            sx={{ 
              py: 1.5,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            Register Cartella
          </Button>
        </Box>
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
      </DialogActions>
    </Dialog>
  );
};

export default CartellasModal;
