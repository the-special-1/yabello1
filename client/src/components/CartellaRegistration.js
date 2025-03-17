import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Typography,
  Button,
  Box,
  DialogActions,
  Checkbox,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider
} from '@mui/material';

const GAME_PATTERNS = {
  FULL_HOUSE: 'Full House',
  TOP_LINE: 'Top Line',
  MIDDLE_LINE: 'Middle Line',
  BOTTOM_LINE: 'Bottom Line',
  FOUR_CORNERS: 'Four Corners',
  T_PATTERN: 'T Pattern',
  X_PATTERN: 'X Pattern',
  L_PATTERN: 'L Pattern'
};

const CartellaRegistration = ({ open, onClose, onSelect, cartellas }) => {
  const [selectedCartellas, setSelectedCartellas] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(GAME_PATTERNS.FULL_HOUSE);

  const handleToggleCartella = (index) => {
    setSelectedCartellas(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleSelect = () => {
    if (selectedCartellas.length > 0) {
      onSelect({
        cartellas: selectedCartellas.map(index => cartellas[index]),
        pattern: selectedPattern
      });
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen
    >
      <DialogTitle>
        <Typography variant="h4" align="center" color="primary">
          Select Your Cartellas
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Available Cartellas: {cartellas.length}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {cartellas.map((_, index) => (
                <Grid item xs={3} sm={2} key={index}>
                  <Box
                    onClick={() => handleToggleCartella(index)}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: selectedCartellas.includes(index) ? 'primary.main' : 'background.paper',
                      color: selectedCartellas.includes(index) ? 'white' : 'text.primary',
                      border: 2,
                      borderColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      position: 'relative',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <Typography variant="h5">
                      #{index + 1}
                    </Typography>
                    <Checkbox
                      checked={selectedCartellas.includes(index)}
                      sx={{
                        position: 'absolute',
                        right: -10,
                        top: -10,
                        '& .MuiSvgIcon-root': {
                          fontSize: 20,
                        }
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  <Typography variant="h6" gutterBottom>
                    Game Pattern
                  </Typography>
                </FormLabel>
                <RadioGroup
                  value={selectedPattern}
                  onChange={(e) => setSelectedPattern(e.target.value)}
                >
                  {Object.entries(GAME_PATTERNS).map(([key, value]) => (
                    <FormControlLabel
                      key={key}
                      value={value}
                      control={<Radio />}
                      label={value}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mr: 'auto' }}>
          Selected: {selectedCartellas.length} cartella(s)
        </Typography>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="large"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          size="large"
          disabled={selectedCartellas.length === 0}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartellaRegistration;
