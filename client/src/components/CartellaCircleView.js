import React from 'react';
import { Box, Typography } from '@mui/material';

const CartellaCircleView = ({ cartellas, selectedCartellas, onSelect }) => {
  const isSelected = (cartella) => {
    return selectedCartellas.some(selected => selected.id === cartella.id);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, justifyContent: 'flex-start', pl: 0 }}>
      {cartellas.map((cartella) => (
        <Box
          key={cartella.id}
          onClick={() => onSelect(cartella)}
          sx={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: isSelected(cartella) ? `url(/selected.png)` : 'linear-gradient(90deg, #160220, #75090E)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid #FFD700',
            color: isSelected(cartella) ? '#444444' : '#fff',
            fontWeight: 'bolder',
            fontSize: '4.5rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            mr: 0.3,
            mb: 0.3
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: isSelected(cartella) ? '#444444' : '#fff',
              fontWeight: 'bold',
              fontSize: '2.2rem',
              fontFamily: "'Times New Roman', serif"
            }}
          >
            {cartella.id}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default CartellaCircleView;
