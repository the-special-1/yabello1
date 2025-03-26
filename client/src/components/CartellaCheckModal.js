import React from 'react';
import { Modal, Box, Typography, Grid, Paper, Button } from '@mui/material';

const CartellaCheckModal = ({ 
  open, 
  onClose, 
  cartella, 
  cartellaNumber, 
  drawnNumbers, 
  winningPattern, 
  isWinner,
  onAdditional,
  onNewBingo 
}) => {
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

  const handleGoodBingo = () => {
    console.log('Good Bingo clicked - Sound will be added later');
  };

  const handleNotBingo = () => {
    console.log('Not Bingo clicked - Sound will be added later');
  };

  // Function to check if a number is part of the winning pattern
  const isWinningNumber = (number, rowIndex, colIndex) => {
    if (!isWinner || !winningPattern) return false;
    
    const isMiddleCell = rowIndex === 2 && colIndex === 2;
    
    // For Any 1 Line and Any 2 Lines, we need to find the first winning line(s)
    switch (winningPattern) {
      case 'Any 1 Line': {
        let firstWinningLine = null;
        
        // Check rows first
        for (let row = 0; row < 5; row++) {
          if (cartella.numbers[row].every(num => (num === 'free' || drawnNumbers.includes(num)))) {
            firstWinningLine = { type: 'row', index: row };
            break;
          }
        }
        
        // If no winning row, check columns
        if (!firstWinningLine) {
          for (let col = 0; col < 5; col++) {
            if (cartella.numbers.every(row => row[col] === 'free' || drawnNumbers.includes(row[col]))) {
              firstWinningLine = { type: 'col', index: col };
              break;
            }
          }
        }
        
        // If still no winner, check main diagonal
        if (!firstWinningLine) {
          if (cartella.numbers.every((row, i) => row[i] === 'free' || drawnNumbers.includes(row[i]))) {
            firstWinningLine = { type: 'diag', index: 0 };
          }
        }
        
        // If still no winner, check other diagonal
        if (!firstWinningLine) {
          if (cartella.numbers.every((row, i) => row[4-i] === 'free' || drawnNumbers.includes(row[4-i]))) {
            firstWinningLine = { type: 'diag', index: 1 };
          }
        }

        // Check if current cell is in the first winning line
        if (firstWinningLine) {
          if (firstWinningLine.type === 'row') return rowIndex === firstWinningLine.index;
          if (firstWinningLine.type === 'col') return colIndex === firstWinningLine.index;
          if (firstWinningLine.type === 'diag') {
            return firstWinningLine.index === 0 ? rowIndex === colIndex : rowIndex + colIndex === 4;
          }
        }
        return false;
      }

      case 'Any 2 Lines': {
        let foundLines = [];
        
        // Check rows first
        for (let row = 0; row < 5 && foundLines.length < 2; row++) {
          if (cartella.numbers[row].every(num => num === 'free' || drawnNumbers.includes(num))) {
            foundLines.push({type: 'row', index: row});
          }
        }
        
        // Check columns only if we need more lines
        if (foundLines.length < 2) {
          for (let col = 0; col < 5 && foundLines.length < 2; col++) {
            if (cartella.numbers.every(row => row[col] === 'free' || drawnNumbers.includes(row[col]))) {
              foundLines.push({type: 'col', index: col});
            }
          }
        }
        
        // Check diagonals only if we still need more lines
        if (foundLines.length < 2) {
          if (cartella.numbers.every((row, i) => row[i] === 'free' || drawnNumbers.includes(row[i]))) {
            foundLines.push({type: 'diag', index: 0});
          }
        }
        if (foundLines.length < 2) {
          if (cartella.numbers.every((row, i) => row[4-i] === 'free' || drawnNumbers.includes(row[4-i]))) {
            foundLines.push({type: 'diag', index: 1});
          }
        }

        // Check if current cell is in one of the first two winning lines
        return foundLines.slice(0, 2).some(line => {
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
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Card No. {cartellaNumber}
        </Typography>

        {/* BINGO Header */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 0,
          mb: 0.5,
          bgcolor: '#f5f5f5',
          border: 1,
          borderColor: '#ccc'
        }}>
          {['B', 'I', 'N', 'G', 'O'].map((letter) => (
            <Box
              key={letter}
              sx={{
                p: 0.5,
                textAlign: 'center',
                borderRight: letter !== 'O' ? 1 : 0,
                borderColor: '#ccc'
              }}
            >
              <Typography
                sx={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  lineHeight: 1
                }}
              >
                {letter}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Grid */}
        <Grid container spacing={1}>
          {cartella.numbers.map((row, i) => (
            <Grid item xs={12} key={i}>
              <Grid container spacing={1}>
                {row.map((number, j) => {
                  const isMiddleCell = i === 2 && j === 2;
                  const isDrawn = drawnNumbers.includes(number);
                  const isWinningLine = isWinningNumber(number, i, j);
                  const showBlue = isWinningLine && (isDrawn || isMiddleCell);
                  
                  return (
                    <Grid item xs={2.4} key={`${i}-${j}`}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          fontSize: '1.2rem',
                          fontWeight: isDrawn || isMiddleCell ? 900 : 'normal',
                          backgroundColor: showBlue ? '#1976d2' : 
                                        isMiddleCell || isDrawn ? '#ff4444' : 
                                        'background.paper',
                          color: showBlue || isDrawn || isMiddleCell ? 'white' : 'text.primary',
                          transition: 'all 0.3s'
                        }}
                      >
                        {isMiddleCell ? 'free' : number}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          ))}
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          mt: 3 
        }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleGoodBingo}
            sx={{ 
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              padding: '6px 8px'
            }}
          >
            Good Bingo
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleNotBingo}
            sx={{ 
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              padding: '6px 8px'
            }}
          >
            Not Bingo
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onAdditional}
            sx={{ 
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              padding: '6px 8px'
            }}
          >
            Additional
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={onNewBingo}
            sx={{ 
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              padding: '6px 8px'
            }}
          >
            New Bingo
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CartellaCheckModal;
