import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeGames, setActiveGames] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'user') {
      navigate('/login');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchActiveGames(), fetchTransactions()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveGames = async () => {
    try {
      const response = await axios.get('/api/games/active');
      setActiveGames(response.data);
    } catch (error) {
      setError('Failed to fetch active games');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions/history');
      setTransactions(response.data);
    } catch (error) {
      setError('Failed to fetch transactions');
    }
  };

  const handleCreateGame = async () => {
    try {
      const response = await axios.post('/api/games/create', { stake: 10 });
      setSuccess('Game created successfully');
      navigate('/game', { state: { gameId: response.data.id } });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create game');
    }
  };

  const handleJoinGame = async (gameId) => {
    try {
      await axios.post(`/api/games/${gameId}/join`);
      navigate('/game', { state: { gameId } });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join game');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={logout}
            startIcon={<LogoutIcon />}
          >
            Sign Out
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" color="primary">
                  Account Information
                </Typography>
                <Typography variant="h4" color="text.primary" sx={{ mt: 1 }}>
                  Credits: {user?.credits || 0} ETB
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateGame}
                disabled={user?.credits < 10}
              >
                Create New Game
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Active Games
            </Typography>
            <Grid container spacing={2}>
              {activeGames.map((game) => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Bingo Game #{game.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stake: {game.stake} ETB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Players: {game.totalPlayers}/{game.maxPlayers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prize Pool: {game.totalPrizePool} ETB
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleJoinGame(game.id)}
                        disabled={user?.credits < game.stake}
                      >
                        Join Game
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Recent Transactions
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.type}</TableCell>
                      <TableCell>
                        {transaction.senderId === user?.id ? 
                          `-${transaction.amount}` : 
                          `+${transaction.amount}`} ETB
                      </TableCell>
                      <TableCell>{transaction.status}</TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard;
