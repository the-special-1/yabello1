import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const pulseAnimation = keyframes`
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(0.8);
  }
`;

const getBingoLetter = (number) => {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
};

const PatternVisualizer = ({ pattern, gameStarted, lastDrawn }) => {
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
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0
    }}>
      {/* Called Number Display */}
      <Box sx={{
        width: 280,
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1,
        mt: 0
      }}>
        <Box sx={{
          width: 270,
          height: 270,
          borderRadius: '50%',
          bgcolor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <Box sx={{
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, #cc0000 0%, #660000 100%)',
            border: '4px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: gameStarted ? `${pulseAnimation} 2s ease-in-out infinite` : 'none'
            }}>
              {lastDrawn && (
                <Typography sx={{
                  color: '#cc0000',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'Arial'
                }}>
                  {`${getBingoLetter(lastDrawn)}-${lastDrawn}`}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Pattern Display */}
      <Box sx={{ 
        width: '100%',
        maxWidth: 420,
        mt: 0
      }}>
        <Box sx={{ 
          display: 'table',
          width: '100%',
          borderSpacing: 0,
          borderCollapse: 'collapse',
          tableLayout: 'fixed'
        }}>
          {/* BINGO Header */}
          <Box sx={{ display: 'table-row', height: '50px' }}>
            {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
              <Box
                key={letter}
                sx={{
                  display: 'table-cell',
                  width: '20%',
                  background: '#000033',
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid #fff',
                  verticalAlign: 'middle'
                }}
              >
                <Typography
                  align="center"
                  sx={{
                    fontSize: '1.3rem',
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
            <Box key={row} sx={{ display: 'table-row', height: '40px' }}>
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
                      height: 0,
                      verticalAlign: 'middle'
                    }}
                  >
                    {isHighlighted && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '65%',
                          height: '65%',
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
    </Box>
  );
};

export default PatternVisualizer;
