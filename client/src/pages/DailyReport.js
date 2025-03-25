import React, { useState } from 'react';
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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
  const navigate = useNavigate();
  const { user } = useAuth();

  const columns = [
    { id: 'round', label: 'Round', width: '20%' },
    { id: 'price', label: 'price', width: '20%' },
    { id: 'noPlayer', label: 'No. Player', width: '20%' },
    { id: 'winnerPrice', label: 'Winner price', width: '20%' },
    { id: 'income', label: 'Income', width: '20%' },
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

  const calculateTotal = (field) => {
    return reportData.reduce((sum, row) => sum + (row[field] || 0), 0);
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
          style={{ height: '100px',width: '600px' }}
        />
      </Box>

      {/* Content wrapper */}
      <Box sx={{ display: 'flex', mt: '100px' }}>
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
                  {reportData.map((row, index) => (
                    <TableRow 
                      key={index}
                      sx={{ '&:nth-of-type(odd)': { bgcolor: '#f5f5f5' } }}
                    >
                      <TableCell>{row.round}</TableCell>
                      <TableCell>{row.price}</TableCell>
                      <TableCell>{row.noPlayer}</TableCell>
                      <TableCell>{row.winnerPrice}</TableCell>
                      <TableCell>{row.income}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {calculateTotal('income')}
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
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default DailyReport;
