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
    maxWidth: 600,
    bgcolor: 'white',
    boxShadow: 24,
    p: 2,
    borderRadius: 1,
    outline: 'none',
    alignItems: 'center',
    minHeight: '60vh',
    opacity: 0.9,
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
       
          <Typography variant="h6" align="left" sx={{ color: 'black', fontWeight: 'light' }}>
            Bingo
          </Typography>
        {/* Title Bar */}
          <Box sx={{ 
          bgcolor: '#0066cc',
          mx: 0,
          mt: 0,
          mb: 2,
          p: 1,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4
        }}>
          <Typography variant="h4" align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
            Card No: {cartellaNumber}
          </Typography>
        </Box>

        {/* BINGO Header */}
        <Box sx={{ 
          display: 'table',
          width: '90%',
          margin: '0 auto',
          borderSpacing: 0,
          borderCollapse: 'collapse',
          mb: 0
        }}>
          <Box sx={{ display: 'table-row' }}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
              <Box
                key={letter}
                sx={{
                  display: 'table-cell',
                  width: '20%',
                  background: i === 0 ? 'linear-gradient(135deg, #000066 0%, #0099ff 100%)' :
                             i === 1 ? '#990000' :
                             i === 2 ? '#009933' :
                             i === 3 ? '#996600' :
                             'linear-gradient(135deg, #666666 0%, #999999 100%)',
                  p: 1,
                  textAlign: 'center',
                  border: '1px solid #e0e0e0'
                }}
              >
                <Typography
                  align="center"
                  sx={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    lineHeight: 1
                  }}
                >
                  {letter}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Numbers Grid */}
        <Box sx={{ 
          display: 'table',
          width: '90%',
          margin: '0 auto',
          borderSpacing: 0,
          borderCollapse: 'collapse',
          minHeight: '55vh',
        }}>
          {cartella.numbers.map((row, i) => (
            <Box key={i} sx={{ display: 'table-row', height: '22px' }}>
              {row.map((number, j) => {
                const isMiddleCell = i === 2 && j === 2;
                const isDrawn = drawnNumbers.includes(number);
                const isWinningLine = isWinningNumber(number, i, j);
                const showBlue = isWinningLine && (isDrawn || isMiddleCell);
                
                return (
                  <Box 
                    key={`${i}-${j}`} 
                    sx={{ 
                      display: 'table-cell',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      width: '20%',
                      position: 'relative',
                      padding: 0,
                      border: '1px solid #bdbdbd',
                      backgroundColor: '#eeeeee	'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMiddleCell ? '0.9rem' : '2.5rem',
                        fontWeight: 'bold',
                        backgroundColor: showBlue ? 'blue' : 
                                      isMiddleCell || isDrawn ? 'red' : 
                                      'transparent',
                        color: showBlue || isDrawn || isMiddleCell ? 'white' : 'black',
                        borderRadius: '50%',
                        zIndex: 1
                      }}
                    >
                      {isMiddleCell ? 'free' : number}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          mt: 0,
          mx: 'auto',
          width: '100%'
        }}>
          <Button
            variant="contained"
            onClick={handleGoodBingo}
            sx={{ 
              bgcolor: '#009933',
              '&:hover': { bgcolor: '#008029' },
              fontSize: '0.9rem',
              textTransform: 'none',
              border: '2px solid #006622',
              borderRadius: 0,
              fontWeight: 'bolder',
            }}
          >
           GOOD BINGO
          </Button>
          <Button
            variant="contained"
            onClick={handleNotBingo}
            sx={{ 
              bgcolor: '#800000',
              '&:hover': { bgcolor: '#660000' },
              fontSize: '0.9rem',
              textTransform: 'none',
              border: '2px solid #4d0000',
              borderRadius: 0,
              fontWeight: 'bolder',
            }}
          >
         NOT BINGO
          </Button>
          <Button
            variant="contained"
            onClick={onAdditional}
            sx={{ 
              bgcolor: '#009933',
              '&:hover': { bgcolor: '#008029' },
              fontSize: '1rem',
              textTransform: 'none',
              border: '2px solid #006622',
              borderRadius: 0,
              fontWeight: 'bolder',
            }}
          >
            Additional
          </Button>
          <Button
            variant="contained"
            onClick={onNewBingo}
            sx={{ 
              bgcolor: '#0000ff',
              '&:hover': { bgcolor: '#0000cc' },
              fontSize: '0.9rem',
              textTransform: 'none',
              border: '2px solid #0000cc',
              borderRadius: 0,
              fontWeight: 'bolder',
            }}
          >
         NEW BINGO
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CartellaCheckModal;
