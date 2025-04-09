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
  TextField
} from '@mui/material';
import BarChart from '@mui/icons-material/BarChart';
import CalendarToday from '@mui/icons-material/CalendarToday';
import Person from '@mui/icons-material/Person';
import AttachMoney from '@mui/icons-material/AttachMoney';
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
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [toDate, setToDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [reportType, setReportType] = useState('Daily');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userBalance, setUserBalance] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [currentCut, setCurrentCut] = useState(0);

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
      const response = await fetch('/api/users/cut', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch cut');
      const data = await response.json();
      setCurrentCut(data.cut || 0);
    } catch (error) {
      console.error('Error fetching cut:', error);
      setCurrentCut(0);
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
                      sx: { bgcolor: 'white', borderRadius: 1 }
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
                      sx: { bgcolor: 'white', borderRadius: 1 }
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
                      sx: { bgcolor: 'white', borderRadius: 1 }
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
                  Total Income: {formatNumber(reportData.reduce((sum, row) => sum + (row.income || 0), 0))}
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
      case 2: // User Info
        return (
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, bgcolor: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>User Information</Typography>
              <Typography sx={{ color: 'black', mb: 1 }}>Username: {user?.username}</Typography>
              <Typography sx={{ color: 'black', mb: 1 }}>Balance: {userBalance?.toLocaleString() || '0'}</Typography>
            </Paper>
          </Box>
        );
      case 3: // Profit Margin
        return (
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, bgcolor: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>Profit Margin Settings</Typography>
              <Typography sx={{ color: 'black', mb: 1 }}>Current Cut: {currentCut}%</Typography>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: '#1976d2',
            color: 'white',
            borderRight: 'none'
          },
        }}
      >
        <Box sx={{ overflow: 'auto', mt: 8 }}>
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
                onClick={() => setActiveTab(index)}
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
                      fontSize: '1rem'
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
          p: 3, 
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
          ml: '240px' 
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AgentViewReport;
