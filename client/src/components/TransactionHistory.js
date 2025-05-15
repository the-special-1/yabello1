import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  TablePagination,
  Chip
} from '@mui/material';
import { formatISO9075 } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const endpoint = user.role === 'superadmin' ? 'api/transactions/all' : 'api/transactions/history';
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        // Filter out game-related transactions
        const filteredTransactions = data.filter(t => 
          !['game_stake', 'game_win'].includes(t.type)
        );
        setTransactions(filteredTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [user.role]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'credit_creation':
        return 'success';
      case 'credit_transfer':
        return 'primary';
      case 'commission':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTransactionLabel = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Credit Transactions
        </Typography>
      </Box>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    {formatISO9075(new Date(transaction.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTransactionLabel(transaction.type)}
                      color={getTransactionTypeColor(transaction.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {transaction.sender?.username || 'System'}
                    <Typography variant="caption" display="block" color="textSecondary">
                      {transaction.sender?.role || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.receiver?.username || 'System'}
                    <Typography variant="caption" display="block" color="textSecondary">
                      {transaction.receiver?.role || ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {parseFloat(transaction.amount).toFixed(2)} Birr
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      color={transaction.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={transactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default TransactionHistory;
