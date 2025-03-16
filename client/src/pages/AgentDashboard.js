import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider
} from '@mui/material';
import { Refresh as RefreshIcon, Logout as LogoutIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [creditTransfer, setCreditTransfer] = useState({
    userId: '',
    amount: '',
  });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      navigate('/login');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchBalance()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setError('');
      const response = await axios.get('/api/users/my-users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get('/api/users/balance');
      setBalance(response.data.credits);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      setError('');
      await axios.post('/api/users/create-user', formData);
      
      setSuccess('User created successfully');
      setOpenDialog(false);
      setFormData({ username: '', password: '' });
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleTransferCredits = async (userId) => {
    try {
      setError('');
      if (!creditTransfer.amount || parseFloat(creditTransfer.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (parseFloat(creditTransfer.amount) > balance) {
        setError('Insufficient credits');
        return;
      }

      await axios.post('/api/users/transfer-credits', {
        receiverId: userId,
        amount: parseFloat(creditTransfer.amount)
      });

      setSuccess('Credits transferred successfully');
      fetchData();
      setCreditTransfer({ userId: '', amount: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to transfer credits');
    }
  };

  const handleEditUser = async () => {
    try {
      setError('');
      await axios.put(`/api/users/${selectedUser.id}`, {
        username: formData.username,
        ...(formData.password ? { password: formData.password } : {})
      });
      
      setSuccess('User updated successfully');
      setOpenEditDialog(false);
      setFormData({ username: '', password: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError('');
      await axios.delete(`/api/users/${selectedUser.id}`);
      
      setSuccess('User deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({ username: user.username, password: '' });
    setOpenEditDialog(true);
  };

  const openDelete = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Agent Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Branch: {user?.branch?.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Available Credits: {balance} ETB
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Commission Rate: {user?.commission}%
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/cartellas')}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Manage Cartellas
                </Button>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="outlined"
                  color="error"
                  onClick={logout}
                  startIcon={<LogoutIcon />}
                  fullWidth
                >
                  Sign Out
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Users Management
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setOpenDialog(true)}
                >
                  Create New User
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.credits} ETB</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Amount"
                              value={creditTransfer.userId === user.id ? creditTransfer.amount : ''}
                              onChange={(e) => setCreditTransfer({ userId: user.id, amount: e.target.value })}
                              sx={{ width: 100 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleTransferCredits(user.id)}
                              disabled={!creditTransfer.amount || creditTransfer.userId !== user.id}
                            >
                              Transfer
                            </Button>
                            <Tooltip title="Edit User">
                              <IconButton
                                size="small"
                                onClick={() => openEdit(user)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                onClick={() => openDelete(user)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="New Password (optional)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Leave blank to keep current password"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.username}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentDashboard;
