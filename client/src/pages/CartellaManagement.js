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
import apiService from '../utils/apiService';

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
      setLoading(true);
      const response = await apiService.get('branches');
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      
      const data = await response.json();
      const branchesArray = Array.isArray(data) ? data : [];
      setBranches(branchesArray);
      
      // If user is an agent and there are branches, select the first one
      if (user?.role === 'agent' && branchesArray.length > 0) {
        console.log('Auto-selecting branch for agent:', branchesArray[0].id);
        setSelectedBranch(branchesArray[0].id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to fetch branches: ' + error.message);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartellas = async () => {
    try {
      if (!selectedBranch) {
        console.log('No branch selected, skipping cartella fetch');
        return;
      }
      
      setError('');
      setLoading(true);
      
      console.log('Fetching cartellas for branch:', selectedBranch);
      const response = await apiService.get(`cartellas?branchId=${selectedBranch}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cartellas:', errorText);
        throw new Error('Failed to fetch cartellas');
      }
      
      const data = await response.json();
      console.log('Fetched cartellas:', data);
      
      // Sort cartellas in ascending order by ID and update state
      setCartellas(prevCartellas => {
        const newCartellas = Array.isArray(data) ? data : [];
        // Sort cartellas by ID in ascending order (treating IDs as numbers for proper numeric sort)
        const sortedCartellas = [...newCartellas].sort((a, b) => {
          const idA = parseInt(a.id, 10) || 0;
          const idB = parseInt(b.id, 10) || 0;
          return idA - idB;
        });
        console.log('Setting sorted cartellas:', sortedCartellas);
        return sortedCartellas;
      });
      
    } catch (error) {
      console.error('Error in fetchCartellas:', error);
      setError('Failed to fetch cartellas: ' + error.message);
      setCartellas([]);
    } finally {
      setLoading(false);
    }
  };

  const generateNewNumbers = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await apiService.post('cartellas/generate', {});
      
      if (!response.ok) {
        throw new Error('Failed to generate cartella numbers');
      }
      
      const data = await response.json();
      setNewCartella(prev => ({ ...prev, numbers: data.numbers }));
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
      
      const response = await apiService.post('cartellas', {
        id: newCartella.id,
        numbers: numbers,
        branchId: selectedBranch
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create cartella');
      }
      
      setSuccess('Cartella created successfully');
      setCreateDialogOpen(false);
      fetchCartellas();
      setNewCartella({ id: '', numbers: null });
      setManualNumbers(Array(5).fill().map(() => Array(5).fill('')));
      setTabValue(0);
      setSelectedBranch('');
    } catch (error) {
      console.error('Error creating cartella:', error);
      setError(error.message || 'Failed to create cartella. Please try again.');
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
    if (!cartella || !cartella.branchId) {
      setError('Cannot edit cartella: Missing branch information');
      return;
    }
    
    setSelectedCartella(cartella);
    setSelectedBranch(cartella.branchId);
    setManualNumbers(cartella.numbers);
    setEditDialog(true);
  };

  const handleDeleteCartella = (cartella) => {
    setSelectedCartella(cartella);
    setDeleteDialog(true);
  };

  const handleUpdateCartella = async () => {
    try {
      if (!selectedCartella) {
        setError('No cartella selected');
        return;
      }

      setLoading(true);
      setError('');
      setSuccess('');

      // Ensure cartella ID is a string
      const cartellaId = String(selectedCartella.id);
      console.log('Starting cartella update for ID:', cartellaId, typeof cartellaId);
      
      // Convert manual numbers to proper format
      const numbers = [];
      for (let i = 0; i < 5; i++) {
        const row = [];
        for (let j = 0; j < 5; j++) {
          if (i === 2 && j === 2) {
            row.push('FREE');
          } else {
            const cell = manualNumbers[i]?.[j] || '';
            const num = parseInt(cell, 10);
            if (isNaN(num) || num < 1 || num > 75) {
              throw new Error(`Invalid number at position ${i+1},${j+1}. Must be between 1 and 75.`);
            }
            row.push(num);
          }
        }
        numbers.push(row);
      }

      console.log('Validated numbers:', JSON.stringify(numbers, null, 2));

      // Get the current branch ID from the selected cartella
      const branchId = selectedCartella.branchId;
      if (!branchId) {
        throw new Error('No branch ID found for the selected cartella');
      }

      console.log('Using branch ID from cartella:', branchId, typeof branchId);

      // Prepare the update data with proper types and structure
      const requestBody = {
        numbers: numbers,
        branchId: String(branchId) // Ensure branchId is a string
      };

      console.log('Sending update data:', JSON.stringify(requestBody, null, 2));

      // Use the apiService for all environments
      const response = await apiService.put(`cartellas/${cartellaId}/${branchId}`, { numbers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${response.status}`);
      }
      
      // Refresh the cartella list
      console.log('Refreshing cartellas list...');
      await fetchCartellas();
      
      // Update UI state
      setSuccess('Cartella updated successfully!');
      setEditDialog(false);
      setSelectedCartella(null);
      setManualNumbers(Array(5).fill().map(() => Array(5).fill('')));
      
      // Clear success message after delay
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error in handleUpdateCartella:', error);
      setError(`Failed to update cartella: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (!selectedCartella) return;

      setLoading(true);
      setError('');

      const branchId = selectedCartella.branchId;
      if (!branchId) {
        throw new Error('Cannot delete: Branch ID is missing.');
      }

      const response = await apiService.delete(`cartellas/${selectedCartella.id}/${branchId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete cartella');
      }

      setSuccess('Cartella deleted successfully');
      setDeleteDialog(false);
      fetchCartellas();
      setSelectedCartella(null);
    } catch (error) {
      console.error('Error deleting cartella:', error);
      setError(error.message || 'Failed to delete cartella. Please try again.');
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
