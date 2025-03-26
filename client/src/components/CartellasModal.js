import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
        bgcolor: 'white',
        color: '#333',
        boxShadow: 1,
        height: 100,
        display: 'flex',
        alignItems: 'center',
        p: 2
      }}>
        <Box display="flex" alignItems="center">
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#333',
              fontSize: '1.25rem',
              mr: 2,
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.main'
              }
            }}
            onClick={onClose}
          >
            Play Bingo
          </Typography>
          <img 
            src="/logob.png" 
            alt="Bingo Logo"
            style={{ height: '100px', width: '600px' }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', height: 'calc(100vh - 100px)' }}>
        <Box sx={{ 
          width: 240, 
          bgcolor: '#333',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          flexShrink: 0,
          height: '100%'
        }} />

        <Box sx={{ 
          flexGrow: 1, 
          p: 4, 
          bgcolor: '#f5f5f5',
          overflowY: 'auto'
        }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const CartellasModal = ({ open, onClose }) => {
  const { userBranch } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [existingCartellas, setExistingCartellas] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCartella, setSelectedCartella] = useState(null);
  const [newCartella, setNewCartella] = useState({
    id: '',
    numbers: Array(5).fill().map(() => Array(5).fill('')),
    branchId: userBranch
  });

  const handlePlayBingoClick = () => {
    onClose();
    navigate('/bingo-game');
  };

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
          bgcolor: 'white',
          color: '#333',
          boxShadow: 1,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          p: 2
        }}>
          <Box display="flex" alignItems="center">
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#333',
                fontSize: '1.25rem',
                mr: 2,
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main'
                }
              }}
              onClick={handlePlayBingoClick}
            >
              Play Bingo
            </Typography>
            <img 
              src="/logob.png" 
              alt="Bingo Logo"
              style={{ height: '100px', width: '600px' }}
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', height: 'calc(100vh - 100px)' }}>
          <Box sx={{ 
            width: 240, 
            bgcolor: '#333',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            flexShrink: 0,
            height: '100%'
          }} />

          <Box sx={{ 
            flexGrow: 1, 
            p: 4, 
            bgcolor: '#f5f5f5',
            overflowY: 'auto'
          }}>
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
                <Box sx={{ 
                  bgcolor: 'white',
                  p: 4,
                  borderRadius: 2,
                  boxShadow: 3,
                  maxWidth: 600,
                  mx: 'auto'
                }}>
                  <Grid container spacing={0}>
                    {/* Column Headers */}
                    <Grid container item xs={12} sx={{ mb: 1 }}>
                      <Grid item xs={2.4}>
                        <Box sx={{ bgcolor: '#000080', color: 'white', p: 1, textAlign: 'center', fontWeight: 'bold' }}>B</Box>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Box sx={{ bgcolor: '#800000', color: 'white', p: 1, textAlign: 'center', fontWeight: 'bold' }}>I</Box>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Box sx={{ bgcolor: '#4B4B4B', color: 'white', p: 1, textAlign: 'center', fontWeight: 'bold' }}>N</Box>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Box sx={{ bgcolor: '#996515', color: 'white', p: 1, textAlign: 'center', fontWeight: 'bold' }}>G</Box>
                      </Grid>
                      <Grid item xs={2.4}>
                        <Box sx={{ bgcolor: '#808080', color: 'white', p: 1, textAlign: 'center', fontWeight: 'bold' }}>O</Box>
                      </Grid>
                    </Grid>

                    {/* Number Grid */}
                    <Grid container item xs={12} spacing={0.5}>
                      {newCartella.numbers.map((row, i) => (
                        row.map((num, j) => (
                          <Grid item xs={2.4} key={`${i}-${j}`}>
                            {i === 2 && j === 2 ? (
                              <Paper
                                sx={{
                                  p: 1.5,
                                  textAlign: 'center',
                                  bgcolor: '#f5f5f5',
                                  color: '#4B4B4B',
                                  fontWeight: 'bold',
                                  fontSize: '1.2rem',
                                  border: '1px solid #ddd'
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
                                    padding: '8px'
                                  },
                                  min: 1,
                                  max: 75
                                }}
                                type="number"
                                sx={{
                                  width: '100%',
                                  '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                      borderColor: '#ddd',
                                    },
                                    '&:hover fieldset': {
                                      borderColor: '#999',
                                    },
                                    '&.Mui-focused fieldset': {
                                      borderColor: '#666',
                                    }
                                  }
                                }}
                              />
                            )}
                          </Grid>
                        ))
                      ))}
                    </Grid>

                    {/* Card Number Input */}
                    <Grid item xs={12} sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, color: '#666' }}>
                        Card Number:
                      </Typography>
                      <TextField
                        fullWidth
                        value={newCartella.id}
                        onChange={(e) => setNewCartella({ ...newCartella, id: e.target.value })}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            '& fieldset': {
                              borderColor: '#ddd',
                            },
                            '&:hover fieldset': {
                              borderColor: '#999',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#666',
                            }
                          }
                        }}
                      />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={handleCreateCartella}
                        sx={{ 
                          bgcolor: '#0277bd',
                          px: 4,
                          py: 1,
                          '&:hover': {
                            bgcolor: '#01579b'
                          }
                        }}
                      >
                        Submit
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12}>
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
          </Box>
        </DialogContent>
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
