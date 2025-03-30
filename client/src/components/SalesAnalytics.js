import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  TextField,
  MenuItem,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { startOfDay, endOfDay, parseISO } from 'date-fns/fp';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SalesAnalytics = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));
  const [period, setPeriod] = useState('daily');
  const [branchId, setBranchId] = useState('');
  const [userId, setUserId] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [userId, startDate, endDate, period, branchId]);

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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      // Store full user objects to have access to all user data
      setUsers(data.filter(u => u.role === 'user'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/reports/daily', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: format(startDate, 'yyyy-MM-dd'),
          period
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const data = await response.json();
      console.log('Raw data from server:', data);
      
      // Filter data if a user is selected
      const filteredData = userId 
        ? data.filter(report => String(report.userId) === String(userId))
        : data;
      
      console.log('Filtered data for userId:', userId, filteredData);
      
      // Calculate total income from filtered data
      const rawTotalIncome = filteredData.reduce((sum, report) => {
        const income = parseFloat(report.income) || 0;
        return sum + income;
      }, 0);
      
      // Group filtered data by date for visualization
      const groupedData = filteredData.reduce((acc, report) => {
        const date = format(new Date(report.date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = {
            date,
            games: 0,
            income: 0,
            users: new Set()
          };
        }
        acc[date].games += 1;
        acc[date].income += parseFloat(report.income) || 0;
        acc[date].users.add(report.user?.username);
        return acc;
      }, {});

      const details = Object.values(groupedData).map(item => ({
        ...item,
        users: Array.from(item.users),
        averageIncome: item.income / item.games
      }));

      // Sort details by date
      details.sort((a, b) => new Date(a.date) - new Date(b.date));

      const transformedData = {
        totalIncome: rawTotalIncome,
        totalGames: filteredData.length,
        details,
        // Only show user distribution in pie chart when no user is filtered
        userIncome: !userId ? Object.values(data.reduce((acc, report) => {
          const username = report.user?.username || 'Unknown';
          if (!acc[username]) {
            acc[username] = { name: username, value: 0 };
          }
          acc[username].value += parseFloat(report.income) || 0;
          return acc;
        }, {})) : []
      };
      
      console.log('Transformed data:', transformedData);
      setSalesData(transformedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const formatCurrency = (amount) => {
    // Ensure we're working with a number
    const value = parseFloat(amount) || 0;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
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
                <FormControl fullWidth>
                  <InputLabel>User</InputLabel>
                  <Select
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      console.log('Selected user:', e.target.value);
                    }}
                    label="User"
                  >
                    <MenuItem value="">All Users</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username}
                      </MenuItem>
                    ))}
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
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Sales
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(salesData?.totalIncome || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Games
                  </Typography>
                  <Typography variant="h5">
                    {salesData?.totalGames || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Income per Game
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(salesData?.totalGames ? salesData.totalIncome / salesData.totalGames : 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Daily Income Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData?.details || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#8884d8" 
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="averageIncome" 
                  stroke="#82ca9d" 
                  name="Avg Income/Game"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {salesData?.userIncome.length > 0 && (
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Income by User
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData?.userIncome || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {salesData?.userIncome?.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Grid>

        {/* Games Bar Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Games per Day
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData?.details || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="games" fill="#8884d8" name="Number of Games" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sales Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Games</TableCell>
                  <TableCell>Income</TableCell>
                  <TableCell>Average</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesData?.details?.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{format(new Date(row.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{row.games}</TableCell>
                    <TableCell>{formatCurrency(row.income)}</TableCell>
                    <TableCell>{formatCurrency(row.games ? row.income / row.games : 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesAnalytics;
