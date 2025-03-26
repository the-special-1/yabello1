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
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../context/AuthContext';
import CartellaCircleView from './CartellaCircleView';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const EditCartellaDialog = ({ open, onClose, cartella, onSave }) => {
  const [editedNumbers, setEditedNumbers] = useState(cartella?.numbers || []);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cartella) {
      setEditedNumbers(cartella.numbers);
    }
  }, [cartella]);

  const handleNumberChange = (row, col, value) => {
    const updatedNumbers = [...editedNumbers];
    updatedNumbers[row][col] = value;
    setEditedNumbers(updatedNumbers);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/cartellas/${cartella.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          numbers: editedNumbers
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!cartella) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
            Edit Cartella #{cartella.id}
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
            sx={{ mb: 3 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

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
            Edit Numbers (1-75)
          </Typography>
          <Grid container spacing={1}>
            {editedNumbers.map((row, i) => (
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
                        }
                      }}
                    />
                  )}
                </Grid>
              ))
            ))}
          </Grid>
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
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          sx={{ 
            minWidth: 120,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CartellasModal = ({ open, onClose }) => {
  const { userBranch } = useAuth();
  const [error, setError] = useState('');
  const [existingCartellas, setExistingCartellas] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCartella, setSelectedCartella] = useState(null);
  const [newCartella, setNewCartella] = useState({
    id: '',
    numbers: Array(5).fill().map(() => Array(5).fill('')),
    branchId: userBranch
  });

  useEffect(() => {
    // Set center cell to 0
    const updatedNumbers = [...newCartella.numbers];
    updatedNumbers[2][2] = '0';
    setNewCartella(prev => ({
      ...prev,
      numbers: updatedNumbers
    }));
    
    // Fetch existing cartellas
    fetchCartellas();
  }, []);

  const fetchCartellas = async () => {
    try {
      const response = await fetch('/api/cartellas/branch/available?status=available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch cartellas');
      }
      const data = await response.json();
      setExistingCartellas(data);
    } catch (err) {
      console.error('Error fetching cartellas:', err);
      setError('Failed to load existing cartellas');
    }
  };

  const handleNumberChange = (row, col, value) => {
    const updatedNumbers = [...newCartella.numbers];
    updatedNumbers[row][col] = value;
    setNewCartella(prev => ({
      ...prev,
      numbers: updatedNumbers
    }));
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
        const error = await response.text();
        throw new Error(error);
      }

      await fetchCartellas();
      setError('');
      // Reset form
      setNewCartella({
        id: '',
        numbers: Array(5).fill().map(() => Array(5).fill('')),
        branchId: userBranch
      });
      const updatedNumbers = Array(5).fill().map(() => Array(5).fill(''));
      updatedNumbers[2][2] = '0';
      setNewCartella(prev => ({
        ...prev,
        numbers: updatedNumbers
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditCartella = (cartella) => {
    setSelectedCartella(cartella);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    await fetchCartellas();
  };

  // Helper function to get column numbers
  const getColumnNumbers = (numbers, colIndex) => {
    return numbers.map(row => row[colIndex]).filter(num => num !== '0').join(', ');
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
              Manage Cartellas
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
              sx={{ mb: 3 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 3 }}>
                Create New Cartella
              </Typography>
              <Box sx={{ 
                bgcolor: 'white',
                p: 4,
                borderRadius: 2,
                boxShadow: 3,
                maxWidth: 600,
                mx: 'auto'
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
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 3 }}>
                Existing Cartellas
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cartella ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Branch</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>B (1-15)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>I (16-30)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>N (31-45)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>G (46-60)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>O (61-75)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingCartellas.map((cartella) => (
                      <TableRow 
                        key={cartella.id}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            '& .edit-button': {
                              opacity: 1
                            }
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 'bold' }}>{cartella.id}</TableCell>
                        <TableCell>{cartella.branch?.name || 'Unknown Branch'}</TableCell>
                        <TableCell>{getColumnNumbers(cartella.numbers, 0)}</TableCell>
                        <TableCell>{getColumnNumbers(cartella.numbers, 1)}</TableCell>
                        <TableCell>{getColumnNumbers(cartella.numbers, 2)}</TableCell>
                        <TableCell>{getColumnNumbers(cartella.numbers, 3)}</TableCell>
                        <TableCell>{getColumnNumbers(cartella.numbers, 4)}</TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => handleEditCartella(cartella)}
                            className="edit-button"
                            sx={{ 
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              color: 'primary.main'
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
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

      <EditCartellaDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cartella={selectedCartella}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default CartellasModal;
