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
} from 'recharts';
import { startOfDay, endOfDay } from 'date-fns/fp';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
  }, [startDate, endDate, period, branchId, userId]);

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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: format(startDate, 'yyyy-MM-dd'),
          branchId: user.role === 'agent' ? user.branchId : branchId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      console.log('Daily Report Data:', data);
      
      // Calculate totals from daily report data
      const totalIncome = data.reduce((sum, item) => {
        console.log('Current item:', item);
        console.log('Current income:', item.income);
        console.log('Running sum:', sum + (item.income || 0));
        return sum + (Number(item.income) || 0);
      }, 0);
      
      console.log('Final Total Income:', totalIncome);

      setSalesData({
        totalSales: totalIncome,
        salesByPeriod: data.map(item => ({
          period: `Round ${item.round}`,
          sales: Number(item.income) || 0
        }))
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)} Birr`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(startOfDay(newValue))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(endOfDay(newValue))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
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
                {user.role === 'superadmin' && (
                  <Grid item xs={12} sm={6} md={2}>
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
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>User</InputLabel>
                    <Select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
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
              </Grid>
            </Paper>
          </Grid>

          {/* Summary Cards */}
          {salesData && (
            <>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Sales
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(salesData.totalSales)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Average Income per Round
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(salesData.totalSales / (salesData.salesByPeriod?.length || 1))}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Charts */}
          {salesData?.salesByPeriod && (
            <>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Sales by Round
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData.salesByPeriod}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="sales" name="Sales" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesAnalytics;
