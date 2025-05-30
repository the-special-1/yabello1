import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../utils/apiService';
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
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import { Refresh as RefreshIcon, Logout as LogoutIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import TransactionHistory from '../components/TransactionHistory';
import SalesAnalytics from '../components/SalesAnalytics';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

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
    cut: '0',
  });
  const [creditTransfer, setCreditTransfer] = useState({
    userId: '',
    amount: '',
  });
  const [balance, setBalance] = useState(0);
  const [commission, setCommission] = useState(0);
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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
      const response = await apiService.get('users/my-users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await apiService.get('users/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      setBalance(data.credits || 0);
      setCommission(data.commission || 0);
      setBranchName(data.branch?.name || '');
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0); // Set default value to prevent undefined errors
    }
  };

  const handleCreateUser = async () => {
    try {
      setError('');
      
      // Validate username length (must be at least 3 characters)
      if (!formData.username || formData.username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      
      // Validate password
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      const response = await apiService.post('users/create-user', {
        ...formData,
        cut: parseFloat(formData.cut)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      setSuccess('User created successfully');
      setOpenDialog(false);
      setFormData({ username: '', password: '', cut: '0' });
      fetchUsers();
    } catch (error) {
      setError(error.message || 'Failed to create user');
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

      const response = await apiService.post('users/transfer-credits', {
        receiverId: userId,
        amount: parseFloat(creditTransfer.amount)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer credits');
      }

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
      const response = await apiService.put(`users/${selectedUser.id}`, {
        username: formData.username,
        ...(formData.password ? { password: formData.password } : {}),
        cut: parseFloat(formData.cut)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      setSuccess('User updated successfully');
      setOpenEditDialog(false);
      setFormData({ username: '', password: '', cut: '0' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      setError('');
      const response = await apiService.delete(`users/${selectedUser.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      setSuccess('User deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.message || 'Failed to delete user');
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({ 
      username: user.username, 
      password: '',
      cut: user.cut.toString()
    });
    setOpenEditDialog(true);
  };

  const openDelete = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              Agent Dashboard
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <IconButton onClick={fetchData} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={logout} color="error">
              <LogoutIcon />
            </IconButton>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Account Dashboard
          </Typography>
          <Typography variant="body1" gutterBottom>
            Branch: {branchName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Available Credits: {balance.toFixed(2)} ETB
          </Typography>
          <Typography variant="body1" gutterBottom>
            Commission Rate: {commission}%
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenDialog(true)}
            >
              Create New User
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/cartellas')}
            >
              Manage Cartellas
            </Button>
          </Box>
        </Paper>

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

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Users" />
            <Tab label="Transactions" />
            <Tab label="Sales Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Users Management
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Credits</TableCell>
                      <TableCell>Cut (%)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.credits} ETB</TableCell>
                        <TableCell>{user.cut}%</TableCell>
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
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TransactionHistory />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SalesAnalytics />
        </TabPanel>

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
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Cut Percentage"
                type="number"
                value={formData.cut}
                onChange={(e) => setFormData({ ...formData, cut: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                helperText="Enter a value between 0 and 100"
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
              <TextField
                fullWidth
                label="Cut Percentage"
                type="number"
                value={formData.cut}
                onChange={(e) => setFormData({ ...formData, cut: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                helperText="Enter a value between 0 and 100"
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
      </Box>
    </Container>
  );
};

export default AgentDashboard;
