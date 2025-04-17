import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';

const PatternVisualizer = ({ pattern, gameStarted }) => {
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  
  // Define patterns based on the selected pattern
  const getPatternDots = (patternName) => {
    switch (patternName) {
      case 'Any one Line':
        return [
          Array(25).fill(false).map((_, i) => i < 5), // Top row
          Array(25).fill(false).map((_, i) => i >= 5 && i < 10), // Second row
          Array(25).fill(false).map((_, i) => i >= 10 && i < 15), // Middle row
          Array(25).fill(false).map((_, i) => i >= 15 && i < 20), // Fourth row
          Array(25).fill(false).map((_, i) => i >= 20), // Bottom row
          Array(25).fill(false).map((_, i) => i % 5 === 0), // First column
          Array(25).fill(false).map((_, i) => i % 5 === 1), // Second column
          Array(25).fill(false).map((_, i) => i % 5 === 2), // Middle column
          Array(25).fill(false).map((_, i) => i % 5 === 3), // Fourth column
          Array(25).fill(false).map((_, i) => i % 5 === 4), // Last column
          Array(25).fill(false).map((_, i) => i % 6 === 0), // Diagonal from top-left
          Array(25).fill(false).map((_, i) => i % 4 === 0 && i > 0 && i < 24) // Diagonal from top-right
        ];
      case 'Any two Lines':
        return [
          Array(25).fill(false).map((_, i) => i < 10), // Top two rows
          Array(25).fill(false).map((_, i) => i >= 5 && i < 15), // Middle two rows
          Array(25).fill(false).map((_, i) => i >= 15), // Bottom two rows
          Array(25).fill(false).map((_, i) => i % 5 === 0 || i % 5 === 1), // First two columns
          Array(25).fill(false).map((_, i) => i % 5 === 1 || i % 5 === 2), // Second and third columns
          Array(25).fill(false).map((_, i) => i % 5 === 3 || i % 5 === 4) // Last two columns
        ];
      case 'Any Vertical':
        return [
          Array(25).fill(false).map((_, i) => i % 5 === 0), // B column
          Array(25).fill(false).map((_, i) => i % 5 === 1), // I column
          Array(25).fill(false).map((_, i) => i % 5 === 2), // N column
          Array(25).fill(false).map((_, i) => i % 5 === 3), // G column
          Array(25).fill(false).map((_, i) => i % 5 === 4) // O column
        ];
      case 'Any Horizontal':
        return [
          Array(25).fill(false).map((_, i) => i < 5), // First row
          Array(25).fill(false).map((_, i) => i >= 5 && i < 10), // Second row
          Array(25).fill(false).map((_, i) => i >= 10 && i < 15), // Third row
          Array(25).fill(false).map((_, i) => i >= 15 && i < 20), // Fourth row
          Array(25).fill(false).map((_, i) => i >= 20) // Fifth row
        ];
      case 'T Pattern':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return row === 0 || col === 2;
        })];
      case 'Reverse T':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return row === 4 || col === 2;
        })];
      case 'X Pattern':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return row === col || row + col === 4;
        })];
      case 'L Pattern':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return row === 4 || col === 0;
        })];
      case 'Reverse L':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return row === 4 || col === 4;
        })];
      case 'Half Above':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          return row < 3;
        })];
      case 'Half Below':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          return row > 1;
        })];
      case 'Half Left':
        return [Array(25).fill(false).map((_, i) => {
          const col = i % 5;
          return col < 3;
        })];
      case 'Half Right':
        return [Array(25).fill(false).map((_, i) => {
          const col = i % 5;
          return col > 1;
        })];
      case 'G and O':
        return [Array(25).fill(false).map((_, i) => i % 5 === 3 || i % 5 === 4)];
      case 'B and O':
        return [Array(25).fill(false).map((_, i) => i % 5 === 0 || i % 5 === 4)];
      case 'Mark':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return (row === 0 || row === 4) || (col === 0 || col === 4);
        })];
      case 'T Cross':
        return [Array(25).fill(false).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return row === 2 || col === 2;
        })];
      default:
        return [Array(25).fill(false)];
    }
  };

  useEffect(() => {
    let intervalId;
    if (gameStarted && pattern) {
      intervalId = setInterval(() => {
        setCurrentPatternIndex((prevIndex) => {
          const patterns = getPatternDots(pattern);
          return (prevIndex + 1) % patterns.length;
        });
      }, 1000);
    } else {
      setCurrentPatternIndex(0);
    }
    return () => clearInterval(intervalId);
  }, [pattern, gameStarted]);

  if (!pattern) return null;

  const patterns = getPatternDots(pattern);
  const currentPattern = patterns[currentPatternIndex];

  return (
    <Box
      sx={{
        margin: '0 auto',
        overflow: 'visible',
        display: 'flex',
        backgroundColor: 'transparent',
      }}
    >
      <Box
        sx={{
          width: '460px',
          height: '250px',
          mb: 10,
          borderSpacing: 0,
          borderCollapse: 'collapse',
          backgroundColor: 'transparent',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* BINGO Header */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          height: '90px',  
          borderTop: '1px solid #000',
          borderLeft: '1px solid #000',
          borderRight: '1px solid #000',
        }}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(90deg, #16293D, #294D73)',
                borderRight: i < 4 ? '1px solid #000' : 'none', 
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '1.8rem',  
                  fontWeight: 'bold',
                }}
              >
                {letter}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Pattern Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateRows: 'repeat(5, 1fr)',
          height: '210px',
          width: '100%',
          border: '1px solid #000',
          borderTop: 'none',
        }}>
          {Array(5).fill(null).map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                borderBottom: rowIndex < 4 ? '1px solid #000' : 'none',
              }}
            >
              {Array(5).fill(null).map((_, colIndex) => {
                const index = rowIndex * 5 + colIndex;
                const isHighlighted = currentPattern && currentPattern[index];
                const isEvenCell = (rowIndex ) % 2 === 0;
                
                return (
                  <Box
                    key={colIndex}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isEvenCell ? '#ffffff' : '#f0efe7', 
                      borderRight: colIndex < 4 ? '1px solid #000' : 'none',
                      height: '50px',
                    }}
                  >
                    {(gameStarted || !isHighlighted) && (
                      <Box
                        sx={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'blue', 
                          border: '2px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: isHighlighted ? 0.9 : 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PatternVisualizer;
