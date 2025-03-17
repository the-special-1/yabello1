import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  Typography,
  Button,
  DialogActions,
  TextField,
  Box
} from '@mui/material';

const CartellaCheckDisplay = ({ open, onClose, cartellas, drawnNumbers }) => {
  const [cartellaNumber, setCartellaNumber] = React.useState('');
  const selectedCartella = cartellaNumber ? cartellas[parseInt(cartellaNumber) - 1] : null;

  const handleCheck = () => {
    const num = parseInt(cartellaNumber);
    if (num && num > 0 && num <= cartellas.length) {
      setCartellaNumber(num.toString());
    } else {
      setCartellaNumber('');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4" align="center" color="primary">
          Check Cartella
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <TextField
            label="Cartella Number"
            variant="outlined"
            size="small"
            value={cartellaNumber}
            onChange={(e) => setCartellaNumber(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCheck();
              }
            }}
            type="number"
            inputProps={{ 
              min: 1, 
              max: cartellas.length,
              style: { textAlign: 'center' }
            }}
            sx={{ width: 150 }}
          />
          <Button
            variant="contained"
            onClick={handleCheck}
            disabled={!cartellaNumber}
          >
            Check
          </Button>
        </Box>

        {selectedCartella && (
          <>
            <Typography variant="h6" gutterBottom align="center">
              Cartella #{cartellaNumber}
            </Typography>
            <Grid container spacing={1}>
              {selectedCartella.map((row, i) => (
                <Grid item xs={12} key={i}>
                  <Grid container spacing={1}>
                    {row.map((number, j) => (
                      <Grid item xs={2.4} key={`${i}-${j}`}>
                        <Paper
                          elevation={3}
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            fontWeight: drawnNumbers.includes(number) ? 900 : 'normal',
                            backgroundColor: drawnNumbers.includes(number) ? 'primary.light' : 'background.paper',
                            color: drawnNumbers.includes(number) ? 'primary.dark' : 'text.primary',
                            transition: 'all 0.3s'
                          }}
                        >
                          {number}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          size="large"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartellaCheckDisplay;
