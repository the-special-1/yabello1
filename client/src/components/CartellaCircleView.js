import React from 'react';
import { Box, Typography, Grid } from '@mui/material';

const CartellaCircleView = ({ cartellas, selectedCartella, onSelect }) => {
  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {cartellas.map((cartella) => (
        <Grid item key={cartella.id}>
          <Box
            onClick={() => onSelect(cartella)}
            sx={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: selectedCartella?.id === cartella.id ? 'primary.dark' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedCartella?.id === cartella.id ? '2px solid #fff' : 'none',
              boxShadow: selectedCartella?.id === cartella.id ? 3 : 1,
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: 3
              }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.8rem'
              }}
            >
              {cartella.id}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default CartellaCircleView;
