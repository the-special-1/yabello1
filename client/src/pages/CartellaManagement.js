import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CartellaManagement = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [cartellas, setCartellas] = useState([]);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedCartella, setSelectedCartella] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [newCartella, setNewCartella] = useState({
    id: '',
    numbers: null
  });
  const [manualNumbers, setManualNumbers] = useState(Array(5).fill().map(() => Array(5).fill('')));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || !['superadmin', 'agent'].includes(user.role)) {
      navigate('/login');
      return;
    }

    fetchBranches();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedBranch) {
      fetchCartellas();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get('/api/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to fetch branches');
    }
  };

  const fetchCartellas = async () => {
    try {
      setError('');
      const response = await axios.get('/api/cartellas', {
        params: {
          branchId: selectedBranch
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartellas(response.data || []);
    } catch (error) {
      console.error('Error fetching cartellas:', error);
      setError('Failed to fetch cartellas');
      setCartellas([]);
    }
  };

  const generateNewNumbers = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.post('/api/cartellas/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCartella(prev => ({ ...prev, numbers: response.data.numbers }));
    } catch (error) {
      console.error('Error generating numbers:', error);
      setError('Failed to generate cartella numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCartella = async () => {
    try {
      if (!newCartella.id) {
        setError('Please enter a cartella ID');
        return;
      }

      if (!selectedBranch) {
        setError('Please select a branch');
        return;
      }

      setLoading(true);
      setError('');

      let numbers = tabValue === 0 ? newCartella.numbers : manualNumbers;

      if (!numbers && tabValue === 0) {
        setError('Please generate or enter cartella numbers');
        return;
      }

      // Validate manual numbers if using manual entry
      if (tabValue === 1) {
        // Convert empty strings to numbers and validate
        try {
          numbers = manualNumbers.map((row, i) => 
            row.map((cell, j) => {
              if (i === 2 && j === 2) return 'FREE';
              const num = parseInt(cell);
              if (isNaN(num) || num < 1 || num > 75) {
                throw new Error(`Invalid number at position ${i+1},${j+1}. Must be between 1 and 75.`);
              }
              return num;
            })
          );
        } catch (error) {
          setError(error.message);
          return;
        }
      }
      
      await axios.post('/api/cartellas', {
        id: newCartella.id,
        numbers: numbers,
        branchId: selectedBranch
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Cartella created successfully');
      setCreateDialogOpen(false);
      fetchCartellas();
      setNewCartella({ id: '', numbers: null });
      setManualNumbers(Array(5).fill().map(() => Array(5).fill('')));
      setTabValue(0);
      setSelectedBranch('');
    } catch (error) {
      console.error('Error creating cartella:', error);
      setError(error.response?.data?.error || 'Failed to create cartella. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualNumberChange = (row, col, value) => {
    // Don't allow editing the center cell
    if (row === 2 && col === 2) return;

    // Only allow numbers and empty string
    if (value !== '' && !/^\d+$/.test(value)) return;

    // Only allow numbers between 1 and 75
    if (value !== '' && (parseInt(value) < 1 || parseInt(value) > 75)) return;

    const newManualNumbers = [...manualNumbers];
    newManualNumbers[row][col] = value;
    setManualNumbers(newManualNumbers);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewCartella = (cartella) => {
    setSelectedCartella(cartella);
    setViewDialog(true);
  };

  const handleEditCartella = (cartella) => {
    setSelectedCartella(cartella);
    setManualNumbers(cartella.numbers);
    setEditDialog(true);
  };

  const handleDeleteCartella = (cartella) => {
    setSelectedCartella(cartella);
    setDeleteDialog(true);
  };

  const handleUpdateCartella = async () => {
    try {
      if (!selectedCartella) return;

      setLoading(true);
      setError('');

      // Convert empty strings to numbers and validate
      const numbers = manualNumbers.map((row, i) => 
        row.map((cell, j) => {
          if (i === 2 && j === 2) return 'FREE';
          const num = parseInt(cell);
          if (isNaN(num) || num < 1 || num > 75) {
            throw new Error(`Invalid number at position ${i+1},${j+1}. Must be between 1 and 75.`);
          }
          return num;
        })
      );

      await axios.put(`/api/cartellas/${selectedCartella.id}`, {
        numbers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Cartella updated successfully');
      setEditDialog(false);
      fetchCartellas();
      setSelectedCartella(null);
      setManualNumbers(Array(5).fill().map(() => Array(5).fill('')));
    } catch (error) {
      console.error('Error updating cartella:', error);
      setError(error.response?.data?.error || 'Failed to update cartella. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedCartella) return;

      setLoading(true);
      setError('');

      await axios.delete(`/api/cartellas/${selectedCartella.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Cartella deleted successfully');
      setDeleteDialog(false);
      fetchCartellas();
      setSelectedCartella(null);
    } catch (error) {
      console.error('Error deleting cartella:', error);
      setError(error.response?.data?.error || 'Failed to delete cartella. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewCartella({ id: '', numbers: null });
    setManualNumbers(Array(5).fill().map(() => Array(5).fill('')));
    setTabValue(0);
    setError(null);
    setSelectedBranch('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Cartella Management
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={fetchCartellas}
                  sx={{ mr: 1 }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Cartella
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Cartellas Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartellas.map((cartella) => (
                    <TableRow key={cartella.id}>
                      <TableCell>{cartella.id}</TableCell>
                      <TableCell>{cartella.status}</TableCell>
                      <TableCell>{cartella.creator?.username}</TableCell>
                      <TableCell>
                        {new Date(cartella.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton onClick={() => handleViewCartella(cartella)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {cartella.status === 'available' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton onClick={() => handleEditCartella(cartella)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton onClick={() => handleDeleteCartella(cartella)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Cartella</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cartella ID"
                  value={newCartella.id}
                  onChange={(e) => setNewCartella(prev => ({ ...prev, id: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    label="Branch"
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.location})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Auto Generate" />
              <Tab label="Manual Entry" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Button
                variant="contained"
                onClick={generateNewNumbers}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Generate Numbers
              </Button>

              {newCartella.numbers && (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableBody>
                      {newCartella.numbers.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((num, j) => (
                            <TableCell key={j} align="center">
                              {num}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableBody>
                    {manualNumbers.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((num, j) => (
                          <TableCell key={j} align="center" sx={{ p: 1 }}>
                            {i === 2 && j === 2 ? (
                              'FREE'
                            ) : (
                              <TextField
                                value={num}
                                onChange={(e) => handleManualNumberChange(i, j, e.target.value)}
                                size="small"
                                sx={{ width: 60 }}
                                inputProps={{ style: { textAlign: 'center' } }}
                              />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button
            onClick={handleCreateCartella}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)}>
        <DialogTitle>View Cartella</DialogTitle>
        <DialogContent>
          {selectedCartella && (
            <Box>
              <Typography variant="body1" gutterBottom>
                ID: {selectedCartella.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Status: {selectedCartella.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Created By: {selectedCartella.creator?.username}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Created At: {new Date(selectedCartella.createdAt).toLocaleString()}
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableBody>
                    {selectedCartella.numbers.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((num, j) => (
                          <TableCell key={j} align="center">
                            {num}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Cartella</DialogTitle>
        <DialogContent>
          {selectedCartella && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                ID: {selectedCartella.id}
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableBody>
                    {manualNumbers.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((num, j) => (
                          <TableCell key={j} align="center" sx={{ p: 1 }}>
                            {i === 2 && j === 2 ? (
                              'FREE'
                            ) : (
                              <TextField
                                value={num}
                                onChange={(e) => handleManualNumberChange(i, j, e.target.value)}
                                size="small"
                                sx={{ width: 60 }}
                                inputProps={{ style: { textAlign: 'center' } }}
                              />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateCartella}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Cartella</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete cartella {selectedCartella?.id}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CartellaManagement;
