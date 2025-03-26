import React from 'react';
import { Modal, Box, Typography, Grid, Paper } from '@mui/material';

const CartellaCheckModal = ({ open, onClose, cartella, cartellaNumber, drawnNumbers, winningPattern, isWinner }) => {
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

  // Function to check if a number is part of the winning pattern
  const isWinningNumber = (number, rowIndex, colIndex) => {
    if (!isWinner || !winningPattern) return false;
    
    // Free cell is always a winner
    if (number === 'free') return true;

    // For Any 1 Line and Any 2 Lines, we need to find the first winning line(s)
    switch (winningPattern) {
      case 'Any 1 Line': {
        // Check rows
        for (let row = 0; row < 5; row++) {
          if (cartella.numbers[row].every(num => num === 'free' || drawnNumbers.includes(num))) {
            if (row === rowIndex) return true;
            break;
          }
        }
        // Check columns
        for (let col = 0; col < 5; col++) {
          if (cartella.numbers.every(row => row[col] === 'free' || drawnNumbers.includes(row[col]))) {
            if (col === colIndex) return true;
            break;
          }
        }
        // Check diagonal
        if (cartella.numbers.every((row, i) => row[i] === 'free' || drawnNumbers.includes(row[i]))) {
          if (rowIndex === colIndex) return true;
        }
        // Check other diagonal
        if (cartella.numbers.every((row, i) => row[4-i] === 'free' || drawnNumbers.includes(row[4-i]))) {
          if (rowIndex + colIndex === 4) return true;
        }
        return false;
      }

      case 'Any 2 Lines': {
        let foundLines = [];
        // Check rows
        for (let row = 0; row < 5 && foundLines.length < 2; row++) {
          if (cartella.numbers[row].every(num => num === 'free' || drawnNumbers.includes(num))) {
            foundLines.push({type: 'row', index: row});
          }
        }
        // Check columns if needed
        for (let col = 0; col < 5 && foundLines.length < 2; col++) {
          if (cartella.numbers.every(row => row[col] === 'free' || drawnNumbers.includes(row[col]))) {
            foundLines.push({type: 'col', index: col});
          }
        }
        // Check diagonals if needed
        if (foundLines.length < 2 && cartella.numbers.every((row, i) => row[i] === 'free' || drawnNumbers.includes(row[i]))) {
          foundLines.push({type: 'diag', index: 0});
        }
        if (foundLines.length < 2 && cartella.numbers.every((row, i) => row[4-i] === 'free' || drawnNumbers.includes(row[4-i]))) {
          foundLines.push({type: 'diag', index: 1});
        }

        // Check if current cell is in any of the first two winning lines
        return foundLines.some(line => {
          if (line.type === 'row') return line.index === rowIndex;
          if (line.type === 'col') return line.index === colIndex;
          if (line.type === 'diag') {
            return line.index === 0 ? rowIndex === colIndex : rowIndex + colIndex === 4;
          }
          return false;
        });
      }

      case 'T Pattern':
        return rowIndex === 0 || colIndex === 2;

      case 'Reverse T':
        return rowIndex === 4 || colIndex === 2;

      case 'X Pattern':
        return rowIndex === colIndex || rowIndex + colIndex === 4;

      case 'L Pattern':
        return rowIndex === 4 || colIndex === 0;

      case 'Reverse L':
        return rowIndex === 4 || colIndex === 4;

      case 'Half Above':
        return rowIndex < 3;

      case 'Half Below':
        return rowIndex > 1;

      case 'Half Left':
        return colIndex < 3;

      case 'Half Right':
        return colIndex > 1;

      case 'G and O':
        return colIndex === 3 || colIndex === 4;

      case 'B and O':
        return colIndex === 0 || colIndex === 4;

      case 'Mark':
        return rowIndex === 0 || rowIndex === 4 || colIndex === 0 || colIndex === 4;

      case 'T Cross':
        return rowIndex === 2 || colIndex === 2;

      default:
        return false;
    }
  };

  if (!cartella || !cartella.numbers) return null;

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
          {cartella.numbers.map((row, i) => (
            <Grid item xs={12} key={i}>
              <Grid container spacing={1}>
                {row.map((number, j) => {
                  const isWinning = number === 'free' || isWinningNumber(number, i, j);
                  const isDrawn = number === 'free' || drawnNumbers.includes(number);
                  
                  return (
                    <Grid item xs={2.4} key={`${i}-${j}`}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          fontSize: '1.2rem',
                          fontWeight: isDrawn ? 900 : 'normal',
                          backgroundColor: isWinning ? '#1976d2' : 
                                        isDrawn ? '#ff4444' : 
                                        'background.paper',
                          color: isDrawn ? 'white' : 'text.primary',
                          transition: 'all 0.3s'
                        }}
                      >
                        {number}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Modal>
  );
};

export default CartellaCheckModal;
