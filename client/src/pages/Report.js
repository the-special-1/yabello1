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
  TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FaRegCalendar } from "react-icons/fa";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const Report = () => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [reportType, setReportType] = useState('Daily');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
const [userBalance, setUserBalance] = useState(0);


  const columns = [
    { id: 'name', label: 'Name:', width: '20%' },
    { id: 'city', label: 'City:', width: '15%' },
    { id: 'address', label: 'Address:', width: '20%' },
    // { id: 'phoneNo', label: 'Phone No:', width: '15%' },
    { id: 'income', label: 'Income', width: '10%' },
    { id: 'percent', label: 'Percent', width: '10%' },
    { id: 'totalCommission', label: 'Total Commission', width: '10%' },
  ];

  // Format number as currency
  const formatNumber = (number) => {
    return parseFloat(number || 0).toFixed(2);
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fromDate: format(fromDate, 'yyyy-MM-dd'),
          toDate: format(toDate, 'yyyy-MM-dd'),
          reportType: reportType.toLowerCase(),
          branchId: user.role === 'agent' ? user.branchId : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
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
          setUserBalance(data.credits || 0); // Changed from data.balance to data.credits
        } catch (error) {
          console.error('Error fetching balance:', error);
          setUserBalance(0); // Set to 0 on error
        }
      };
      fetchBalance();
    }, []); // Run once on mount

  const handleSearch = () => {
    fetchReportData();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#2D2D2D', minHeight: '100vh' }}>
      {/* Header with logo and back button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 2,
        bgcolor: 'white',
        color: '#333',
        boxShadow: 1,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        height: 100
      }}>
        <Typography 
          onClick={() => navigate('/')}
          sx={{ 
            color: '#333',
            fontSize: '1.25rem',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            },
            mr: 2
          }}
        >
          Play Bingo
        </Typography>
        <img 
          src="/logob.png" 
          alt="Bingo Logo"
          style={{ height: '100px', width: '600px' }}
        />
      </Box>

      {/* Content wrapper */}
      <Box sx={{ display: 'flex', mt: '100px' }}> {/* Match header height */}
        <Sidebar />

        {/* Main content */}
        <Box sx={{ flexGrow: 1, marginLeft: '240px', p: 4 }}>
          <Paper sx={{ p: 3, bgcolor: 'white' }}>
            {/* Search filters */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              alignItems: 'center'
            }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={fromDate}
                  label="From"
                  onChange={(newValue) => setFromDate(newValue)}
                  slots={{
                    OpenPickerButton: CalendarTodayIcon
                  }}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      bgcolor: 'white'
                    },
                    '& .MuiInputBase-input': {
                      color: 'black'
                    },
                    '& .MuiInputLabel-root': {
                      color: 'black'
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'black'
                    }
                  }}
                />
                <DatePicker
                  value={toDate}
                  label="To"
                  onChange={(newValue) => setToDate(newValue)}
                  slots={{
                    OpenPickerButton: CalendarTodayIcon
                  }}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      bgcolor: 'white'
                    },
                    '& .MuiInputBase-input': {
                      color: 'black'
                    },
                    '& .MuiInputLabel-root': {
                      color: 'black'
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'black'
                    }
                  }}
                />
              </LocalizationProvider>
              
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                size="small"
                IconComponent={KeyboardArrowDownIcon}
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

            {/* Results table */}
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
                <Typography sx={{ color: 'green',fontSize: 24,fontWeight: 'bold' }}>Balance: {userBalance?.toLocaleString() || '0'} </Typography>
              </Table>
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
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Report;
