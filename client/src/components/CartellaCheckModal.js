import React from 'react';
import { Modal, Box, Typography, Grid, Paper } from '@mui/material';

const CartellaCheckModal = ({ open, onClose, cartella, cartellaNumber, drawnNumbers }) => {
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2
  };

  if (!cartella) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="cartella-check-modal"
    >
      <Box sx={modalStyle}>
        <Typography variant="h5" gutterBottom align="center">
          Cartella #{cartellaNumber}
        </Typography>
        <Grid container spacing={1}>
          {cartella.map((row, i) => (
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
      </Box>
    </Modal>
  );
};

export default CartellaCheckModal;
