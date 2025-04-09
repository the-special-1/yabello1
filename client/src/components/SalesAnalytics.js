import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SalesAnalytics = () => {
  const auth = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));
  const [period, setPeriod] = useState('daily');
  const [userId, setUserId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userIncomes, setUserIncomes] = useState({});

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get selected user's username if we have a userId
      const selectedUsername = userId ? users.find(u => u._id === userId)?.username : null;
      console.log('Selected username:', selectedUsername);

      const response = await fetch('/api/reports/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromDate: startDate.toISOString(),
          toDate: endDate.toISOString(),
          branchId: auth?.user?.role === 'agent' ? auth?.user?.branchId : branchId || undefined,
          userId: userId || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const data = await response.json();
      console.log('Raw sales data:', data);

      // Transform data for the bar chart
      const transformedData = {
        userIncome: [],
        totalIncome: 0
      };

      // Group sales by user
      const userSalesMap = new Map();

      data.forEach(report => {
        // Extract user info and amount
        const reportUsername = report.user?.username || report.username || report.name;
        const amount = parseFloat(report.totalCommission || 0);

        console.log('Processing report:', {
          reportUsername,
          selectedUsername,
          amount,
          report
        });

        // Skip if we're filtering for a specific user and this isn't them
        if (selectedUsername && reportUsername !== selectedUsername) {
          console.log('Skipping report - username mismatch');
          return;
        }

        const currentTotal = userSalesMap.get(reportUsername) || 0;
        const newTotal = currentTotal + amount;
        console.log(`Updating total for ${reportUsername}: ${currentTotal} + ${amount} = ${newTotal}`);
        
        userSalesMap.set(reportUsername, newTotal);
        transformedData.totalIncome += amount;
      });

      // Convert to array format for the chart
      transformedData.userIncome = Array.from(userSalesMap.entries()).map(([name, value]) => ({
        name,
        value: parseFloat(value) || 0
      }));

      // Sort by value in descending order
      transformedData.userIncome.sort((a, b) => b.value - a.value);

      // Update user incomes state
      const newUserIncomes = {};
      userSalesMap.forEach((value, username) => {
        newUserIncomes[username] = parseFloat(value) || 0;
      });
      setUserIncomes(newUserIncomes);

      console.log('Transformed data:', transformedData);
      setSalesData(transformedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Failed to fetch sales data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        console.log('Raw user data:', data);
        // Make sure we have the required fields
        const usersList = data
          .filter(u => u.role === 'user')
          .map(u => ({
            _id: u._id || u.id,
            username: u.username || u.name
          }));
        console.log('Processed users:', usersList);
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setBranches(data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchUsers();
    if (auth?.user?.role === 'superadmin') {
      fetchBranches();
    }
  }, [auth]);

  useEffect(() => {
    if (auth && users.length > 0) {
      fetchSalesData();
    }
  }, [userId, startDate, endDate, period, branchId, auth, users]);

  // Only proceed if we have auth context
  if (!auth) {
    return (
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item>
          <CircularProgress />
        </Grid>
      </Grid>
    );
  }

  const { user } = auth;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Grid container spacing={3}>
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}
      {loading ? (
        <Grid item xs={12} container justifyContent="center">
          <CircularProgress />
        </Grid>
      ) : (
        <>
          {/* Filters */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      label="Period"
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Select User</InputLabel>
                    <Select
                      value={userId || ''}
                      onChange={(e) => {
                        const newUserId = e.target.value;
                        console.log('Selected new user ID:', newUserId);
                        const selectedUser = users.find(u => u._id === newUserId);
                        console.log('Found user:', selectedUser);
                        if (selectedUser) {
                          console.log('Selected user income:', userIncomes[selectedUser.username]);
                          setUserId(newUserId);
                          setSelectedUser(selectedUser);
                        } else if (newUserId === '') {
                          // Handle "All Users" selection
                          setUserId('');
                          setSelectedUser(null);
                        }
                      }}
                      label="Select User"
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            width: 250
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>All Users</em>
                      </MenuItem>
                      {users.map((user) => {
                        console.log(`Rendering user: ${user.username} (${user._id})`);
                        if (!user._id) {
                          console.warn('User missing _id:', user);
                          return null;
                        }
                        return (
                          <MenuItem 
                            key={user._id} 
                            value={user._id}
                            sx={{
                              minHeight: '48px',
                              display: 'flex',
                              alignItems: 'center',
                              px: 2
                            }}
                          >
                            {user.username}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                {user.role === 'superadmin' && (
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>Branch</InputLabel>
                      <Select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        label="Branch"
                      >
                        <MenuItem value="">All Branches</MenuItem>
                        {branches.map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Commission by User
                  </Typography>
                  {salesData?.userIncome?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesData.userIncome}
                        margin={{
                          top: 16,
                          right: 16,
                          bottom: 0,
                          left: 24,
                        }}
                      >
                        <XAxis
                          dataKey="name"
                          stroke={theme.palette.text.secondary}
                          style={{ fontSize: 12 }}
                        />
                        <YAxis
                          stroke={theme.palette.text.secondary}
                          style={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      No sales data available
                    </Typography>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Total Commission
                  </Typography>
                  <Typography component="p" variant="h4">
                    {formatCurrency(salesData?.totalIncome || 0)}
                  </Typography>
                  {userId && (
                    <Typography color="text.secondary" sx={{ flex: 1 }}>
                      Showing sales for {users.find(u => u._id === userId)?.username}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Sales Table */}
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Commission</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesData?.userIncome?.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{formatCurrency(row.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default SalesAnalytics;