import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';

const PatternVisualizer = ({ pattern }) => {
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

  const shouldAnimate = ['Any 1 Line', 'Any 2 Lines', 'Any Vertical', 'Any Horizontal'].includes(pattern);
  const patternArray = getPatternDots(pattern);

  useEffect(() => {
    if (shouldAnimate && patternArray.length > 1) {
      const interval = setInterval(() => {
        setCurrentPatternIndex((prev) => (prev + 1) % patternArray.length);
      }, 1500);

      return () => clearInterval(interval);
    } else {
      setCurrentPatternIndex(0);
    }
  }, [patternArray, shouldAnimate, pattern]);

  const dots = patternArray[currentPatternIndex] || Array(25).fill(false);

  return (
    <Box sx={{ width: 180, mx: 'auto' }}>
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
                fontSize: '1rem',
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
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 0,
        border: 1,
        borderColor: '#ccc'
      }}>
        {Array(25).fill(null).map((_, i) => (
          <Box
            key={i}
            sx={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: (i + 1) % 5 !== 0 ? 1 : 0,
              borderBottom: i < 20 ? 1 : 0,
              borderColor: '#ccc',
              bgcolor: '#fff',
              p: 0.5
            }}
          >
            {dots[i] && (
              <Box
                sx={{
                  width: '90%',
                  height: '90%',
                  borderRadius: '50%',
                  bgcolor: 'blue',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PatternVisualizer;
