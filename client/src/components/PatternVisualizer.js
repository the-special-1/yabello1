import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';

const PatternVisualizer = ({ pattern, gameStarted }) => {
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  
  // Define patterns based on the selected pattern
  const getPatternDots = (patternName) => {
    switch (patternName) {
      case 'Any 1 Line':
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
      case 'Any 2 Lines':
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

  // Animation effect
  useEffect(() => {
    if (pattern) {
      const patterns = getPatternDots(pattern);
      const interval = setInterval(() => {
        setCurrentPatternIndex((prevIndex) => (prevIndex + 1) % patterns.length);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentPatternIndex(0);
    }
  }, [pattern]);

  if (!pattern) return null;

  const patterns = getPatternDots(pattern);
  const currentPattern = patterns[currentPatternIndex];

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 300,
      margin: '0 auto',
      mt: 2 
    }}>
      <Box sx={{ 
        display: 'table',
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
      }}>
        {/* BINGO Header */}
        <Box sx={{ display: 'table-row' }}>
          {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
            <Box
              key={letter}
              sx={{
                display: 'table-cell',
                width: '20%',
                background: '#000033',
                p: 1,
                textAlign: 'center',
                border: '1px solid #fff',
              }}
            >
              <Typography
                align="center"
                sx={{
                  fontSize: '1.2rem',
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

        {/* Pattern Grid */}
        {Array(5).fill(null).map((_, row) => (
          <Box key={row} sx={{ display: 'table-row' }}>
            {Array(5).fill(null).map((_, col) => {
              const index = row * 5 + col;
              const isHighlighted = currentPattern && currentPattern[index];
              
              return (
                <Box
                  key={col}
                  sx={{
                    display: 'table-cell',
                    position: 'relative',
                    width: '20%',
                    border: '1px solid #ccc',
                    backgroundColor: 'white',
                    p: 0,
                    '&::after': {
                      content: '""',
                      display: 'block',
                      paddingBottom: '100%'
                    }
                  }}
                >
                  {isHighlighted && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '80%',
                        backgroundColor: 'blue',
                        borderRadius: '50%'
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
  );
};

export default PatternVisualizer;
