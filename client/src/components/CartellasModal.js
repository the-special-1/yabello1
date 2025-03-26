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
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const CartellasModal = ({ open, onClose }) => {
  const [cartellas, setCartellas] = useState([]);
  const [error, setError] = useState('');
  const [newCartella, setNewCartella] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchCartellas();
    }
  }, [open]);

  const fetchCartellas = async () => {
    try {
      const response = await fetch('/api/cartellas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cartellas');
      }
      const data = await response.json();
      setCartellas(data.cartellas);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate the new cartella grid
      const flatNumbers = newCartella.flat().filter(num => num !== '');
      if (flatNumbers.length !== 24) { // 24 because center is always 0
        throw new Error('Please fill all cells (except center which is always 0)');
      }

      // Check for duplicate numbers
      const uniqueNumbers = new Set(flatNumbers);
      if (uniqueNumbers.size !== flatNumbers.length) {
        throw new Error('Duplicate numbers are not allowed');
      }

      // Check number ranges for each column
      for (let col = 0; col < 5; col++) {
        const minRange = col * 15 + 1;
        const maxRange = (col + 1) * 15;
        for (let row = 0; row < 5; row++) {
          if (row === 2 && col === 2) continue; // Skip center cell
          const num = parseInt(newCartella[row][col]);
          if (num < minRange || num > maxRange) {
            throw new Error(`Numbers in column ${['B','I','N','G','O'][col]} must be between ${minRange} and ${maxRange}`);
          }
        }
      }

      // Create the cartella
      const response = await fetch('/api/cartellas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          numbers: newCartella.map((row, i) => 
            row.map((num, j) => i === 2 && j === 2 ? 0 : parseInt(num))
          )
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create cartella');
      }

      // Reset form and refresh list
      setNewCartella(Array(5).fill().map(() => Array(5).fill('')));
      fetchCartellas();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCellChange = (row, col, value) => {
    if (row === 2 && col === 2) return; // Center cell is always 0
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 75)) {
      const newGrid = [...newCartella];
      newGrid[row][col] = value;
      setNewCartella(newGrid);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#f5f5f5',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#1a237e', 
        color: 'white',
        p: 2
      }}>
        <Typography variant="h5">Play Bingo</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* New Cartella Creation Grid */}
        <Box sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                  <Box
                    key={letter}
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: ['#0000ff', '#00ff00', '#808080', '#ffa500', '#808080'][i],
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}
                  >
                    {letter}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {newCartella.map((row, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                  {row.map((cell, j) => (
                    <TextField
                      key={j}
                      value={i === 2 && j === 2 ? '0' : cell}
                      onChange={(e) => handleCellChange(i, j, e.target.value)}
                      disabled={i === 2 && j === 2}
                      sx={{
                        width: 60,
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          bgcolor: i === 2 && j === 2 ? '#f0f0f0' : 'white'
                        },
                        '& input': {
                          textAlign: 'center',
                          p: 0,
                          fontSize: '1.1rem'
                        }
                      }}
                      inputProps={{
                        maxLength: 2,
                        style: { textAlign: 'center' }
                      }}
                    />
                  ))}
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ minWidth: 120 }}
              >
                Submit
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Existing Cartellas Table */}
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Card</TableCell>
                <TableCell>B</TableCell>
                <TableCell>I</TableCell>
                <TableCell>N</TableCell>
                <TableCell>G</TableCell>
                <TableCell>O</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cartellas.map((cartella, index) => (
                <TableRow key={cartella.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{cartella.numbers[0].join(',')}</TableCell>
                  <TableCell>{cartella.numbers[1].join(',')}</TableCell>
                  <TableCell>{cartella.numbers[2].join(',')}</TableCell>
                  <TableCell>{cartella.numbers[3].join(',')}</TableCell>
                  <TableCell>{cartella.numbers[4].join(',')}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {}}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartellasModal;
