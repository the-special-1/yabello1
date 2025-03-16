import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container, Grid, Paper, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Box, Alert, Divider, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Refresh as RefreshIcon, Logout as LogoutIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [branches, setBranches] = useState([]);
  const [agents, setAgents] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    location: ''
  });
  const [agentForm, setAgentForm] = useState({
    username: '',
    password: '',
    branchId: '',
    commission: ''
  });
  const [creditTransfer, setCreditTransfer] = useState({
    agentId: '',
    amount: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      navigate('/login');
      return;
    }

    fetchBranches();
    fetchAgents();
  }, [user, navigate]);

  const fetchBranches = async () => {
    try {
      setError('');
      const response = await axios.get('/api/branches');
      setBranches(response.data);
    } catch (error) {
      setError('Failed to fetch branches');
    }
  };

  const fetchAgents = async () => {
    try {
      setError('');
      const response = await axios.get('/api/users/agents');
      setAgents(response.data);
    } catch (error) {
      setError('Failed to fetch agents');
    }
  };

  const handleRefresh = () => {
    fetchBranches();
    fetchAgents();
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await axios.post('/api/branches', branchForm);
      setSuccess('Branch created successfully');
      setBranchForm({ name: '', location: '' });
      fetchBranches();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create branch');
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await axios.post('/api/users/create-agent', {
        ...agentForm,
        commission: parseFloat(agentForm.commission)
      });
      setSuccess('Agent created successfully');
      setAgentForm({
        username: '',
        password: '',
        branchId: '',
        commission: ''
      });
      fetchAgents();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create agent');
    }
  };

  const handleTransferCredits = async (agentId) => {
    try {
      setError('');
      if (!creditTransfer.amount || parseFloat(creditTransfer.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      await axios.post('/api/users/transfer-credits', {
        receiverId: agentId,
        amount: parseFloat(creditTransfer.amount)
      });

      setSuccess('Credits transferred successfully');
      fetchAgents();
      setCreditTransfer({ agentId: '', amount: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to transfer credits');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleEditAgent = async () => {
    try {
      setError('');
      await axios.put(`/api/users/${selectedAgent.id}`, {
        username: agentForm.username,
        branchId: agentForm.branchId,
        commission: parseFloat(agentForm.commission),
        ...(agentForm.password ? { password: agentForm.password } : {})
      });
      
      setSuccess('Agent updated successfully');
      setOpenEditDialog(false);
      setAgentForm({
        username: '',
        password: '',
        branchId: '',
        commission: ''
      });
      setSelectedAgent(null);
      fetchAgents();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update agent');
    }
  };

  const handleDeleteAgent = async () => {
    try {
      setError('');
      await axios.delete(`/api/users/${selectedAgent.id}`);
      
      setSuccess('Agent deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedAgent(null);
      fetchAgents();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete agent');
    }
  };

  const openEdit = (agent) => {
    setSelectedAgent(agent);
    setAgentForm({
      username: agent.username,
      password: '',
      branchId: agent.branchId,
      commission: agent.commission
    });
    setOpenEditDialog(true);
  };

  const openDelete = (agent) => {
    setSelectedAgent(agent);
    setOpenDeleteDialog(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          SuperAdmin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={logout}
            startIcon={<LogoutIcon />}
          >
            Sign Out
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Branches" />
                <Tab label="Agents" />
              </Tabs>
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

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Create Branch
                  </Typography>
                  <form onSubmit={handleCreateBranch}>
                    <TextField
                      fullWidth
                      label="Branch Name"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Location"
                      value={branchForm.location}
                      onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                      margin="normal"
                      required
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      Create Branch
                    </Button>
                  </form>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Branch List
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {branches.map((branch) => (
                          <TableRow key={branch.id}>
                            <TableCell>{branch.name}</TableCell>
                            <TableCell>{branch.location}</TableCell>
                            <TableCell>{branch.status}</TableCell>
                            <TableCell>
                              {new Date(branch.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {branches.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No branches found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Create Agent
                  </Typography>
                  <form onSubmit={handleCreateAgent}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={agentForm.username}
                      onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      value={agentForm.password}
                      onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      select
                      label="Branch"
                      value={agentForm.branchId}
                      onChange={(e) => setAgentForm({ ...agentForm, branchId: e.target.value })}
                      margin="normal"
                      required
                      SelectProps={{
                        native: true
                      }}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      type="number"
                      label="Commission (%)"
                      value={agentForm.commission}
                      onChange={(e) => setAgentForm({ ...agentForm, commission: e.target.value })}
                      margin="normal"
                      required
                      inputProps={{
                        min: 0,
                        max: 100,
                        step: 0.01
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      Create Agent
                    </Button>
                  </form>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Agent List
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Username</TableCell>
                          <TableCell>Branch</TableCell>
                          <TableCell>Credits</TableCell>
                          <TableCell>Commission</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {agents.map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell>{agent.username}</TableCell>
                            <TableCell>{agent.branch?.name}</TableCell>
                            <TableCell>{agent.credits} ETB</TableCell>
                            <TableCell>{agent.commission}%</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Amount"
                                  value={creditTransfer.agentId === agent.id ? creditTransfer.amount : ''}
                                  onChange={(e) => setCreditTransfer({ agentId: agent.id, amount: e.target.value })}
                                  sx={{ width: 100 }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleTransferCredits(agent.id)}
                                  disabled={!creditTransfer.amount || creditTransfer.agentId !== agent.id}
                                >
                                  Transfer
                                </Button>
                                <Tooltip title="Edit Agent">
                                  <IconButton
                                    size="small"
                                    onClick={() => openEdit(agent)}
                                    color="primary"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Agent">
                                  <IconButton
                                    size="small"
                                    onClick={() => openDelete(agent)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {agents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              No agents found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={agentForm.username}
              onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="New Password (optional)"
              type="password"
              value={agentForm.password}
              onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Leave blank to keep current password"
            />
            <TextField
              fullWidth
              select
              label="Branch"
              value={agentForm.branchId}
              onChange={(e) => setAgentForm({ ...agentForm, branchId: e.target.value })}
              sx={{ mb: 2 }}
              required
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Commission Rate (%)"
              type="number"
              value={agentForm.commission}
              onChange={(e) => setAgentForm({ ...agentForm, commission: e.target.value })}
              required
              inputProps={{ min: 0, max: 100, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditAgent} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete agent "{selectedAgent?.username}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAgent} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminDashboard;
