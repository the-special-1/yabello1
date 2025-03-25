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
  Select,
  MenuItem,
  IconButton,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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

  const columns = [
    { id: 'name', label: 'Name:', width: '20%' },
    { id: 'city', label: 'City:', width: '15%' },
    { id: 'address', label: 'Address:', width: '20%' },
    { id: 'phoneNo', label: 'Phone No:', width: '15%' },
    { id: 'income', label: 'Income', width: '10%' },
    { id: 'percent', label: 'Percent', width: '10%' },
    { id: 'totalCommission', label: 'Total Commission', width: '10%' },
  ];

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
      // TODO: Add error notification
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchReportData();
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
        height: 64 // Match sidebar top offset
      }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ mr: 2, color: '#333' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
          Play Bingo
        </Typography>
      </Box>

      {/* Content wrapper */}
      <Box sx={{ display: 'flex', mt: '64px' }}> {/* Match header height */}
        <Sidebar />
        {/* Main content */}
        <Box sx={{ flexGrow: 1, marginLeft: '240px', p: 4 }}>
          <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            {/* Search filters */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              alignItems: 'center'
            }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
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
                <DatePicker
                  label="To"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
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
            <TableContainer component={Paper}>
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
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.city}</TableCell>
                      <TableCell>{row.address}</TableCell>
                      <TableCell>{row.phoneNo}</TableCell>
                      <TableCell>{row.income}</TableCell>
                      <TableCell>{row.percent}%</TableCell>
                      <TableCell>{row.totalCommission}</TableCell>
                    </TableRow>
                  ))}
                  {reportData.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
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

export default Report;
