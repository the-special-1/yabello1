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
  const [activeTab, setActiveTab] = useState(0);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      setActiveTab(0);
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
    if (!numbers) return '';
    let columnNumbers = numbers.map(row => row[colIndex]);
    if (colIndex === 2) { // N column
      columnNumbers[2] = '0'; // Set middle number to 0
    }
    return columnNumbers.join(', ');
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Existing Cartellas" />
            <Tab label="Create New Cartella" />
          </Tabs>
        </Box>

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

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ width: '100%', overflow: 'auto' }}>
              <Table sx={{ 
                '& .MuiTableCell-root': { 
                  borderRight: '1px solid #dee2e6',
                  '&:last-child': {
                    borderRight: 'none'
                  }
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(to right, #8B4513, #CD853F)',
                        color: 'white',
                        fontWeight: 'bold',
                        width: '60px',
                        textAlign: 'center'
                      }}
                    >
                      Card
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(to right, #000080, #0000FF)',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      B
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(to right, #8B0000, #800000)',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      I
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'whitesmoke',
                        color: 'black',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      N
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(to right, #8B4513, #CD853F)',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      G
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(to right, #2F4F4F, #708090)',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      O
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        background: 'linear-gradient(to right, #D35400, #E67E22)',
                        color: 'white',
                        fontWeight: 'bold',
                        width: '100px',
                        textAlign: 'center'
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {existingCartellas
                    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                    .map((cartella) => (
                    <TableRow 
                      key={cartella.id}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' },
                        '&:hover': { bgcolor: '#e9ecef' }
                      }}
                    >
                      <TableCell sx={{ textAlign: 'center', color: '#1a202c', fontWeight: 500 }}>
                        {cartella.id}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#2d3748' }}>
                        {getColumnNumbers(cartella.numbers, 0)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#2d3748' }}>
                        {getColumnNumbers(cartella.numbers, 1)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#2d3748' }}>
                        {getColumnNumbers(cartella.numbers, 2)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#2d3748' }}>
                        {getColumnNumbers(cartella.numbers, 3)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: '#2d3748' }}>
                        {getColumnNumbers(cartella.numbers, 4)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditCartella(cartella)}
                          sx={{
                            color: 'lightblue',
                            '&:hover': {
                              color: '#D35400'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ 
              width: '1000px', 
              mx: 'auto', 
              mt: 4
            }}>
              <Box sx={{ mb: 1 }}>
                <Grid container spacing={0.5}>
                  <Grid item xs={2.4}>
                    <Paper sx={{ 
                      p: 0.5,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      background: 'linear-gradient(to right, #000080, #0000FF)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      B
                    </Paper>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Paper sx={{ 
                      p: 0.5,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      background: 'linear-gradient(to right, #8B0000, #800000)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      I
                    </Paper>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Paper sx={{ 
                      p: 0.5,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      background: 'linear-gradient(to right, #808080, #A9A9A9)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      N
                    </Paper>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Paper sx={{ 
                      p: 0.5,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      background: 'linear-gradient(to right, #8B4513, #CD853F)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      G
                    </Paper>
                  </Grid>
                  <Grid item xs={2.4}>
                    <Paper sx={{ 
                      p: 0.5,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', 
                      background: 'linear-gradient(to right, #2F4F4F, #708090)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      O
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Number Grid */}
              <Grid container spacing={0.5}>
                {newCartella.numbers.map((row, i) => (
                  row.map((num, j) => (
                    <Grid item xs={2.4} key={`${i}-${j}`}>
                      {i === 2 && j === 2 ? (
                        <Paper
                          sx={{
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            bgcolor: '#ffffff',
                            border: '1px solid #dee2e6',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            color: '#000'
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
                              padding: '14px',
                              color: '#000'
                            },
                            min: 1,
                            max: 75
                          }}
                          type="number"
                          sx={{
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              height: '50px',
                              bgcolor: '#ffffff',
                              border: '1px solid #dee2e6',
                              borderRadius: 1,
                              '&:hover': {
                                borderColor: '#ced4da'
                              },
                              '&.Mui-focused': {
                                borderColor: '#ced4da',
                                boxShadow: 'none'
                              }
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            }
                          }}
                        />
                      )}
                    </Grid>
                  ))
                ))}
              </Grid>

              {/* Card Number Field */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  mb: 1, 
                  color: '#6c757d',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}>
                  Card Number:
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={newCartella.id}
                  onChange={(e) => setNewCartella({ ...newCartella, id: e.target.value })}
                  inputProps={{
                    style: { 
                      color: '#000'
                    }
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#ffffff',
                      border: '1px solid #dee2e6',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: '#ced4da'
                      },
                      '&.Mui-focused': {
                        borderColor: '#ced4da',
                        boxShadow: 'none'
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mt: 3 ,textAlign: 'center'}}>
                <Button
                  variant="contained"
                 
                  size="medium"
                  // startIcon={<AddIcon />}
                  onClick={handleCreateCartella}
                  sx={{ 
                    py: 1,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  submit
                </Button>
              </Box>
            </Box>
          </TabPanel>
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
