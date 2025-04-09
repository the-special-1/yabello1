import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Switch,
  useMediaQuery,
  useTheme
} from '@mui/material';
import BarChart from '@mui/icons-material/BarChart';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Person from '@mui/icons-material/Person';
import AttachMoney from '@mui/icons-material/AttachMoney';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const AgentViewReport = () => {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [toDate, setToDate] = useState(new Date());
  const [reportType, setReportType] = useState('Daily');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userBalance, setUserBalance] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentCut, setCurrentCut] = useState(0);
  const [userCut, setUserCut] = useState(0);
  const [useUserCut, setUseUserCut] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { id: 'name', label: 'Name:', width: '20%' },
    { id: 'city', label: 'City:', width: '15%' },
    { id: 'address', label: 'Address:', width: '20%' },
    { id: 'income', label: 'Income', width: '10%' },
    { id: 'percent', label: 'Percent', width: '10%' },
    { id: 'totalCommission', label: 'Total Commission', width: '10%' },
  ];

  const formatNumber = (number) => {
    return parseFloat(number || 0).toFixed(2);
  };

  const formatDateForAPI = (date) => {
    if (!date || isNaN(date.getTime())) return null;
    return format(date, 'yyyy-MM-dd');
  };

  const fetchReportData = async (type = 'sales') => {
    try {
      // Validate dates
      if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        console.error('Invalid date range');
        return;
      }

      setLoading(true);
      const endpoint = type === 'daily' ? '/api/reports/daily' : '/api/reports/sales';

      // Format dates with timezone offset
      const formattedFromDate = fromDate.toISOString();
      const formattedToDate = toDate.toISOString();

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fromDate: formattedFromDate,
          toDate: formattedToDate,
          branchId: user.role === 'agent' ? user.branchId : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${type} report data`);
      }

      const data = await response.json();
      setReportData(data.map(row => ({
        ...row,
        date: row.date ? new Date(row.date) : null
      })));
    } catch (error) {
      console.error(`Error fetching ${type} report:`, error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/users/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      setUserBalance(data.credits || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setUserBalance(0);
    }
  };

  const fetchCut = async () => {
    try {
      // Fetch agent cut
      const agentResponse = await fetch('/api/users/my-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!agentResponse.ok) throw new Error('Failed to fetch agent cut');
      
      const agentData = await agentResponse.json();
      if (agentData.cut !== undefined) {
        setCurrentCut(agentData.cut);
      }

      // Fetch user cut
      const userResponse = await fetch('/api/users/my-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.user_cut !== undefined) {
          setUserCut(userData.user_cut);
        }
      }
    } catch (error) {
      console.error('Error fetching cut:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch commission cut. Please try again.',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchCut();
  }, []);

  // Fetch report data when tab changes
  useEffect(() => {
    if (fromDate && toDate) {
      fetchReportData(activeTab === 1 ? 'daily' : 'sales');
    }
  }, [activeTab]);

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      console.error('Please select valid dates');
      return;
    }
    
    // For daily reports, set toDate to same day as fromDate
    if (activeTab === 1) {
      const selectedDate = new Date(fromDate);
      setToDate(new Date(selectedDate));
    }
    
    fetchReportData(activeTab === 1 ? 'daily' : 'sales');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Reset data and dates when switching tabs
    setReportData([]);
    setPage(0);
    
    // For daily reports, set both dates to today
    if (newValue === 1) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      today.setMinutes(today.getMinutes() - offset);
      today.setHours(0, 0, 0, 0);
      setFromDate(today);
      
      const endToday = new Date(today);
      endToday.setHours(23, 59, 59, 999);
      setToDate(endToday);
    }
  };

  const handleFromDateChange = (newValue) => {
    if (newValue && !isNaN(new Date(newValue).getTime())) {
      // Adjust for timezone
      const date = new Date(newValue);
      const offset = date.getTimezoneOffset();
      date.setMinutes(date.getMinutes() - offset);
      date.setHours(0, 0, 0, 0);
      setFromDate(date);
      
      // For daily reports, also update toDate
      if (activeTab === 1) {
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        setToDate(endDate);
      }
    }
  };

  const handleToDateChange = (newValue) => {
    if (newValue && !isNaN(new Date(newValue).getTime())) {
      // Adjust for timezone
      const date = new Date(newValue);
      const offset = date.getTimezoneOffset();
      date.setMinutes(date.getMinutes() - offset);
      date.setHours(23, 59, 59, 999);
      setToDate(date);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0: // Sales Report
        return (
          <Box sx={{ p: 3, width: '100%' }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => {
                    if (newValue && !isNaN(new Date(newValue).getTime())) {
                      setFromDate(new Date(new Date(newValue).setHours(0, 0, 0, 0)));
                    }
                  }}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: false,
                      sx: { 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        '& .MuiInputBase-input': {
                          color: '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                        },
                        '& .MuiIconButton-root': {
                          color: '#666',
                        }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          bgcolor: 'white',
                          color: '#000',
                        },
                        '& .MuiPickersDay-root': {
                          color: '#000',
                          '&.Mui-selected': {
                            bgcolor: '#1976d2',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#1565c0',
                            }
                          }
                        }
                      }
                    }
                  }}
                />
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => {
                    if (newValue && !isNaN(new Date(newValue).getTime())) {
                      setToDate(new Date(new Date(newValue).setHours(23, 59, 59, 999)));
                    }
                  }}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: false,
                      sx: { 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        '& .MuiInputBase-input': {
                          color: '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                        },
                        '& .MuiIconButton-root': {
                          color: '#666',
                        }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          bgcolor: 'white',
                          color: '#000',
                        },
                        '& .MuiPickersDay-root': {
                          color: '#000',
                          '&.Mui-selected': {
                            bgcolor: '#1976d2',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#1565c0',
                            }
                          }
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>

              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                sx={{
                  minWidth: 120,
                  bgcolor: 'white',
                  '& .MuiSelect-select': {
                    color: '#333'
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#333'
                  }
                }}
              >
                <MenuItem value="Daily">Daily</MenuItem>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Yearly">Yearly</MenuItem>
              </Select>

              <Button 
                variant="contained" 
                onClick={handleSearch}
                disabled={loading}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#115293'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'white' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#1976d2' }}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        sx={{
                          color: 'white',
                          fontWeight: 'bold',
                          width: column.width
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                    <TableRow 
                      key={index}
                      sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}
                    >
                      <TableCell sx={{ color: 'black' }}>{row.name}</TableCell>
                      <TableCell sx={{ color: 'black' }}>yabello</TableCell>
                      <TableCell sx={{ color: 'black' }}>{row.address}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.income)}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{row.percent}%</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.totalCommission)}</TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Box sx={{ p: 2, bgcolor: 'white' }}>
                <Typography sx={{ color: 'green', fontSize: 24, fontWeight: 'bold' }}>
                  Balance: {userBalance?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={reportData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  bgcolor: 'white',
                  '.MuiTablePagination-select': {
                    color: 'black'
                  },
                  '.MuiTablePagination-displayedRows': {
                    color: 'black'
                  },
                  '.MuiTablePagination-selectLabel': {
                    color: 'black'
                  },
                  '.MuiTablePagination-menuItem': {
                    color: 'black'
                  }
                }}
              />
            </TableContainer>
          </Box>
        );
      case 1: // Daily Report
        return (
          <Box sx={{ p: 3, width: '100%' }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={fromDate}
                  onChange={handleFromDateChange}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: false,
                      sx: { 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        '& .MuiInputBase-input': {
                          color: '#000',
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666',
                        },
                        '& .MuiIconButton-root': {
                          color: '#666',
                        }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          bgcolor: 'white',
                          color: '#000',
                        },
                        '& .MuiPickersDay-root': {
                          color: '#000',
                          '&.Mui-selected': {
                            bgcolor: '#1976d2',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#1565c0',
                            }
                          }
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>

              <Button 
                variant="contained" 
                onClick={handleSearch}
                disabled={loading}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#115293'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'white' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#1976d2' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Round</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Players</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Winner Price</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Income</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                    <TableRow 
                      key={index}
                      sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}
                    >
                      <TableCell sx={{ color: 'black' }}>
                        {row.date ? format(new Date(row.date), 'yyyy-MM-dd') : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: 'black' }}>{row.round || 'N/A'}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.price)}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{row.noPlayer || 0}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.winnerPrice)}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.income)}</TableCell>
                    </TableRow>
                  ))}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && reportData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No data found for the selected date range
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Box sx={{ p: 2, bgcolor: 'white' }}>
                <Typography sx={{ color: 'green', fontSize: 24, fontWeight: 'bold' }}>
                  Total Income: {formatNumber(reportData.reduce((sum, row) => {
                    return sum + (parseFloat(row.income || 0));
                  }, 0))}
                </Typography>
              </Box>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={reportData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  bgcolor: 'white',
                  '.MuiTablePagination-select': { color: 'black' },
                  '.MuiTablePagination-displayedRows': { color: 'black' },
                  '.MuiTablePagination-selectLabel': { color: 'black' },
                  '.MuiTablePagination-menuItem': { color: 'black' }
                }}
              />
            </TableContainer>
          </Box>
        );
      case 2: // Daily Report
        return (
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, bgcolor: 'white' }}>
              <Typography variant="h6" sx={{ mb: 3, color: 'black', borderBottom: '2px solid #1976d2', pb: 1 }}>
                User Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>Username</Typography>
                    <Typography sx={{ color: 'black', fontWeight: 'bold' }}>{user?.username}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>Role</Typography>
                    <Typography sx={{ color: 'black', fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {user?.role || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>Branch ID</Typography>
                    <Typography sx={{ color: 'black', fontWeight: 'bold' }}>{user?.branchId || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>Current Balance</Typography>
                    <Typography sx={{ color: 'green', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {userBalance?.toLocaleString() || '0'} ETB
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>Current Cut</Typography>
                    <Typography sx={{ color: 'black', fontWeight: 'bold' }}>{currentCut}%</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ color: '#666', mb: 0.5, fontSize: '0.9rem' }}>Account Status</Typography>
                    <Typography 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        bgcolor: 'success.main',
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1
                      }}
                    >
                      Active
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      case 3: // User Info
        return (
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, bgcolor: 'white' }}>
              <Typography variant="h6" sx={{ mb: 3, color: 'black', borderBottom: '2px solid #1976d2', pb: 1 }}>
                Profit Margin Settings
              </Typography>
              
              <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ color: '#666', mb: 2 }}>Commission Cut Settings</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>Use User Cut Rate</Typography>
                    <Switch
                      checked={useUserCut}
                      onChange={(e) => setUseUserCut(e.target.checked)}
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography sx={{ color: '#666', mb: 1 }}>Agent Cut</Typography>
                      <Typography sx={{ color: useUserCut ? '#666' : '#1976d2', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        {currentCut}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#666', mb: 1 }}>User Cut</Typography>
                      <Typography sx={{ color: useUserCut ? '#1976d2' : '#666', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        {userCut}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ color: '#666', mb: 1 }}>Update User Commission Cut</Typography>
                  <TextField
                    type="number"
                    value={userCut}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 && value <= 100) {
                        setUserCut(value);
                      }
                    }}
                    InputProps={{
                      endAdornment: <Typography sx={{ color: '#666' }}>%</Typography>,
                      inputProps: { min: 0, max: 100 }
                    }}
                    fullWidth
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                    disabled={!useUserCut}
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  disabled={!useUserCut}
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/users/cut-update', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ cut: userCut })
                      });
                      
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Failed to update cut');
                      }
                      
                      setSnackbar({
                        open: true,
                        message: 'User commission cut updated successfully!',
                        severity: 'success'
                      });

                      // Refresh the cut values
                      await fetchCut();
                    } catch (error) {
                      console.error('Error updating cut:', error);
                      setSnackbar({
                        open: true,
                        message: 'Failed to update user commission cut. Please try again.',
                        severity: 'error'
                      });
                    }
                  }}
                  sx={{
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#115293' }
                  }}
                >
                  Update Commission Cut
                </Button>
              </Box>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuItemClick = (index) => {
    setActiveTab(index);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        zIndex: 1200,
        position: 'fixed',
        width: '100%',
        top: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Agent View Report</Typography>
        </Box>
        <IconButton color="inherit" onClick={handleLogout} title="Logout">
          <LogoutIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', mt: '64px' }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? drawerOpen : true}
          onClose={handleDrawerToggle}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              bgcolor: '#1976d2',
              color: 'white',
              borderRight: 'none',
              mt: isMobile ? 0 : '64px'
            },
          }}
          ModalProps={{
            keepMounted: true // Better mobile performance
          }}
        >
          <Box sx={{ overflow: 'auto', mt: isMobile ? 8 : 0 }}>
            <List>
              {[
                { text: 'Sales Report', icon: <AssessmentIcon /> },
                { text: 'Daily Report', icon: <CalendarTodayIcon /> },
                { text: 'User Info', icon: <PersonIcon /> },
                { text: 'Profit Margin', icon: <MonetizationOnIcon /> }
              ].map((item, index) => (
                <ListItem 
                  key={item.text} 
                  button
                  onClick={() => handleMenuItemClick(index)}
                  sx={{
                    backgroundColor: activeTab === index ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    py: 2,
                    borderLeft: activeTab === index ? '4px solid white' : '4px solid transparent'
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', ml: 1 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: activeTab === index ? 'bold' : 'normal',
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 }, 
            bgcolor: '#f5f5f5',
            minHeight: '100vh',
            ml: { xs: 0, sm: isMobile ? 0 : '240px' }
          }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default AgentViewReport;
