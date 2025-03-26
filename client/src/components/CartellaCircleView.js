import React from 'react';
import { Box, Typography } from '@mui/material';

const CartellaCircleView = ({ cartellas, selectedCartellas, onSelect }) => {
  const isSelected = (cartella) => {
    return selectedCartellas.some(selected => selected.id === cartella.id);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', p: 1 }}>
      {cartellas.map((cartella) => (
        <Box
          key={cartella.id}
          onClick={() => onSelect(cartella)}
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: isSelected(cartella) ? '#ffbd0a' : '#39080b',
            border: `3px solid ${isSelected(cartella) ? '#FF8C00' : '#FFD700'}`,
            color: isSelected(cartella) ? '#000' : '#fff',
            fontWeight: 'bold',
            fontSize: '2rem',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: isSelected(cartella) ?
                '0 0 20px rgba(255, 140, 0, 0.7)' :
                '0 4px 8px rgba(0,0,0,0.3)'
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: isSelected(cartella) ? '#000' : '#fff',
              fontWeight: 'bold',
              fontSize: '2.5rem',
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
