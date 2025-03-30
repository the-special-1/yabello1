import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress
} from '@mui/material';
import {
  AdapterDateFns
} from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const DailyReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load today's sales when component mounts
  useEffect(() => {
    fetchReportData();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch user balance
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

  const columns = [
    { id: 'round', label: 'Round', width: '16%' },
    { id: 'price', label: 'Price', width: '26%' },
    { id: 'noPlayer', label: 'No. Player', width: '26%' },
    { id: 'winnerPrice', label: 'Winner price', width: '26%' },
    { id: 'income', label: 'Income', width: '35%' },
    // { id: 'user', label: 'User', width: '20%' },
  ];

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
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

  const handleSearch = () => {
    fetchReportData();
  };

  const formatNumber = (number) => {
    return parseFloat(number).toFixed(2);
  };

  const calculateTotal = (field) => {
    const total = reportData.reduce((sum, row) => sum + parseFloat(row[field] || 0), 0);
    return formatNumber(total);
  };

  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // Fixed at 10 rows per page

  // Get current items
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reportData.slice(indexOfFirstItem, indexOfLastItem);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: '#2D2D2D', minHeight: '100vh' }}>
      {/* Header */}
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
        height: 100,
        justifyContent: 'space-between' // Added to position balance on right
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
        
        {/* Balance display */}
        {/* <Box sx={{
          backgroundColor: '#1a1a1a',
          p: 2,
          borderRadius: 1,
          minWidth: 200,
          mr: 2
        }}> */}
          <Typography variant="h6" sx={{ 
            color: 'black',
            
            textAlign: 'center'
          }}>
            ቀሪ ሒሳብ: {userBalance?.toLocaleString() || '0'} 
          </Typography>
        {/* </Box> */}
      </Box>

      {/* Content wrapper */}
      <Box sx={{ display: 'flex', mt: '100px' }}>
        <Sidebar />
        {/* Main content */}
        <Box sx={{ flexGrow: 1, marginLeft: '350px', p: 2 }}>
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
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      bgcolor: 'white'
                    },
                    '& .MuiInputBase-input': {
                      color: '#333'
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666'
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#333'
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
                Select
              </Button>
            </Box>

            {/* Results table */}
            <TableContainer component={Paper} sx={{ bgcolor: 'white' }}>
              <Table sx={{ minWidth: 700 }}>
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
                  {currentItems.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ color: 'black' }}>{row.round}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.price)}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{row.noPlayer}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.winnerPrice)}</TableCell>
                      <TableCell sx={{ color: 'black' }}>{formatNumber(row.income)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold', color: 'black' }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>
                      {formatNumber(calculateTotal('income'))}
                    </TableCell>
                  </TableRow>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mt: 2,
              gap: 1
            }}>
              <Button
                variant="text"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                sx={{
                  color: page === 1 ? 'grey' : '#1976d2',
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                Previous
              </Button>

              <Button
                variant="contained"
                sx={{
                  minWidth: '40px',
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1976d2'
                  }
                }}
              >
                {page}
              </Button>

              <Button
                variant="text"
                disabled={indexOfLastItem >= reportData.length}
                onClick={() => setPage(page + 1)}
                sx={{
                  color: indexOfLastItem >= reportData.length ? 'grey' : '#1976d2',
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                Next
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default DailyReport;
