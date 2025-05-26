import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import ReactCanvasConfetti from 'react-canvas-confetti';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 999
};

const LotteryDrum = ({ 
  lastDrawn, 
  isDrawing,
  isShuffling,
  shuffleDisplay,
  getPrefix,
  recentNumbers = [],
  bingoLetters = ['B', 'I', 'N', 'G', 'O']
}) => {
  const [animationState, setAnimationState] = useState({
    spinning: false,
    showBall: false,
    ballNumber: null,
    ballLetter: null
  });
  const [balls, setBalls] = useState([]);
  const drumRef = useRef(null);
  const animationRef = useRef(null);
  const confettiRef = useRef(null);

  // Generate random balls inside the drum
  useEffect(() => {
    const newBalls = [];
    const colors = [
      '#E9AD01', // Yellow
      '#cb2400', // Red
      '#1976d2', // Blue
      '#2e7d32', // Green
      '#9c27b0'  // Purple
    ];
    
    // Create 50 balls for a more crowded effect
    for (let i = 0; i < 50; i++) {
      // Create a more realistic distribution of balls
      newBalls.push({
        id: i,
        number: Math.floor(Math.random() * 75) + 1,
        x: Math.random() * 80 + 10, // Spread throughout the drum
        y: Math.random() * 80 + 10,
        size: Math.random() * 8 + 18, // Bigger balls (18-26px)
        // Colored balls with slight transparency
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 1.2 + 0.5, // Much faster movement
        isDrawn: false
      });
    }
    setBalls(newBalls);
  }, []);

  // Animation loop for moving balls with physics-based animation - always active
  useEffect(() => {
    const moveBalls = () => {
      setBalls(prevBalls => 
        prevBalls.map(ball => {
          // Skip drawn or moving-to-center balls
          if (ball.isDrawn || ball.movingToCenter) return ball;
          
          // Physics-based movement with velocity
          let newX = ball.x;
          let newY = ball.y;
          let newVelocityX = ball.velocityX || (Math.random() * 4 - 2);
          let newVelocityY = ball.velocityY || (Math.random() * 4 - 2);
          
          // Apply velocity - always fast
          const speedFactor = animationState.spinning ? 2.0 : 1.2;
          newX += newVelocityX * speedFactor;
          newY += newVelocityY * speedFactor;
          
          // Add gravity - always strong
          newVelocityY += animationState.spinning ? 0.3 : 0.2;
          
          // Boundary collisions with realistic bounce
          if (newX < 10) {
            newX = 10;
            newVelocityX = Math.abs(newVelocityX) * 0.85; // Bounce with energy loss
          }
          if (newX > 90) {
            newX = 90;
            newVelocityX = -Math.abs(newVelocityX) * 0.85;
          }
          if (newY < 10) {
            newY = 10;
            newVelocityY = Math.abs(newVelocityY) * 0.85;
          }
          if (newY > 90) {
            newY = 90;
            newVelocityY = -Math.abs(newVelocityY) * 0.85;
          }
          
          // Add very little friction to maintain high speed
          newVelocityX *= animationState.spinning ? 0.99 : 0.995;
          newVelocityY *= animationState.spinning ? 0.99 : 0.995;
          
          // Frequently add random force for more chaotic movement
          const randomFactor = animationState.spinning ? 0.1 : 0.05;
          if (Math.random() < randomFactor) {
            const forceMagnitude = animationState.spinning ? 5 : 3;
            newVelocityX += (Math.random() * forceMagnitude - forceMagnitude/2);
            newVelocityY += (Math.random() * forceMagnitude - forceMagnitude/2);
          }
          
          return { 
            ...ball, 
            x: newX, 
            y: newY,
            velocityX: newVelocityX,
            velocityY: newVelocityY
          };
        })
      );
      animationRef.current = requestAnimationFrame(moveBalls);
    };

    animationRef.current = requestAnimationFrame(moveBalls);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Empty dependency array so it always runs

  // Handle new number drawn
  useEffect(() => {
    if (lastDrawn !== null) {
      // Get the BINGO letter for this number
      const letterIndex = Math.floor((lastDrawn - 1) / 15);
      const letter = bingoLetters[letterIndex];
      
      // Start animation sequence immediately
      setAnimationState({
        spinning: true,
        showBall: false,
        ballNumber: lastDrawn,
        ballLetter: letter
      });
      
      // Skip most of the shuffling and go straight to showing the drawn ball
      setBalls(prevBalls => {
        // Create minimal initial state - just enough for visual effect
        return prevBalls.map(ball => ({
          ...ball,
          isDrawn: false,
          // Randomize positions with minimal movement
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          size: Math.random() * 10 + 22, // Even bigger balls (22-32px)
          speed: Math.random() * 3 + 2, // Ultra fast animation
          direction: Math.random() * Math.PI * 2, // Random initial direction
          velocityX: Math.random() * 8 - 4, // Higher velocity for faster movement
          velocityY: Math.random() * 8 - 4
        }));
      });
      
      // Immediately start showing the drawn ball for fastest sync
      if (lastDrawn !== null) {
        setTimeout(() => showDrawnBall(), 50);
      }
      
      // Dramatically increase the energy of the balls when a number is drawn
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          if (!ball.isDrawn && !ball.movingToCenter) {
            // Add extreme energy to existing balls
            return {
              ...ball,
              velocityX: (ball.velocityX || 0) + (Math.random() * 12 - 6),
              velocityY: (ball.velocityY || 0) + (Math.random() * 12 - 6),
              speed: Math.random() * 5 + 3 // Ultra fast animation
            };
          }
          return ball;
        });
      });
      
      // Show the drawn ball after a very short delay
      setTimeout(() => {
        showDrawnBall();
      }, 50); // Almost immediate
      
      // Function to show the drawn ball
      const showDrawnBall = () => {
        setBalls(prevBalls => {
          // First, reset any previously drawn balls
          const resetBalls = prevBalls.map(ball => ({
            ...ball,
            isDrawn: false
          }));
          
          // Find a ball with the same number or create a new one
          const ballIndex = resetBalls.findIndex(ball => ball.number === lastDrawn);
          const ballColor = [
            '#E9AD01', // B - Yellow
            '#cb2400', // I - Red
            '#1976d2', // N - Blue
            '#2e7d32', // G - Green
            '#9c27b0'  // O - Purple
          ][letterIndex];
          
          if (ballIndex >= 0) {
            // Highlight existing ball and move it to center
            resetBalls[ballIndex] = {
              ...resetBalls[ballIndex],
              isDrawn: false,
              movingToCenter: true,
              x: 50, // Center X
              y: 50, // Center Y
              size: 140, // Even larger size
              color: ballColor
            };
          } else {
            // Add a new ball in the center
            resetBalls.push({
              id: 'drawn-' + lastDrawn,
              number: lastDrawn,
              x: 50, // Center X
              y: 50, // Center Y
              size: 140, // Even larger size
              color: ballColor,
              speed: 0,
              isDrawn: false,
              movingToCenter: true
            });
          }
          
          // After a short animation, mark as drawn
          setTimeout(() => {
            setBalls(currentBalls => {
              return currentBalls.map(ball => {
                if (ball.number === lastDrawn && ball.movingToCenter) {
                  return {
                    ...ball,
                    movingToCenter: false,
                    isDrawn: true
                  };
                }
                return ball;
              });
            });
            
            // Trigger confetti right after the ball is shown
            if (confettiRef.current) {
              confettiRef.current({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.4 }
              });
            }
          }, 100); // Extremely fast animation
          
          return resetBalls;
        });
      };
      
      // Reduce energy after a short time but keep shuffling
      const spinTimer = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          spinning: false, // This will reduce the energy but not stop the movement
          showBall: true
        }));
      }, 200); // Ultra short spinning time for immediate sync 
      
      // After showing the drawn ball for a while, reset it but keep shuffling
      setTimeout(() => {
        setBalls(prevBalls => {
          return prevBalls.map(ball => ({
            ...ball,
            isDrawn: false,
            size: ball.isDrawn ? Math.random() * 8 + 18 : ball.size, // Reset only the drawn ball size
            // Add some new energy to keep the movement interesting
            velocityX: ball.isDrawn ? Math.random() * 8 - 4 : ball.velocityX,
            velocityY: ball.isDrawn ? Math.random() * 8 - 4 : ball.velocityY
          }));
        });
      }, 1000);
      
      return () => clearTimeout(spinTimer);
    }
  }, [lastDrawn, bingoLetters]);

  const getInstance = useCallback((instance) => {
    confettiRef.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio, opts) => {
    confettiRef.current && confettiRef.current({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio)
    });
  }, []);

  const fireConfetti = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    makeShot(0.2, {
      spread: 60,
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [makeShot]);

  // Determine which letter column this number belongs to
  const getLetter = (number) => {
    const index = Math.floor((number - 1) / 15);
    return bingoLetters[index] || '';
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Lottery Drum */}
      <Box
        ref={drumRef}
        sx={{
          width: { xs: 200, sm: 240, md: 280 },
          height: { xs: 200, sm: 240, md: 280 },
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
          border: '10px solid rgba(255,255,255,0.3)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isDrawing || animationState.spinning ? 'rotate(5deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease-in-out',
          animation: isDrawing || animationState.spinning ? 'shake 0.5s infinite' : 'none',
          '@keyframes shake': {
            '0%': { transform: 'rotate(-5deg)' },
            '50%': { transform: 'rotate(5deg)' },
            '100%': { transform: 'rotate(-5deg)' }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
            borderRadius: '50%',
            zIndex: 1
          }
        }}
      >
        {/* Moving balls inside drum */}
        {balls.map(ball => (
          <Box
            key={ball.id}
            sx={{
              position: 'absolute',
              left: `${ball.x}%`,
              top: `${ball.y}%`,
              width: ball.size,
              height: ball.size,
              borderRadius: '50%',
              bgcolor: ball.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: ball.isDrawn ? ball.size * 0.4 : ball.size * 0.4,
              fontWeight: 'bold',
              color: '#fff',
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 2px 4px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.5)`,
              opacity: ball.isDrawn || ball.movingToCenter ? 1 : (animationState.spinning ? 0.9 : 0.7),
              transition: ball.isDrawn ? 'all 0.8s ease-in-out' : 'opacity 0.5s',
              animation: ball.isDrawn 
                ? 'drawnBallAnimation 0.6s ease-in-out infinite'
                : (ball.movingToCenter 
                  ? 'moveToCenter 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' 
                  : `bounce-${ball.id} ${0.2 + ball.speed * 0.2}s infinite`),
              zIndex: ball.isDrawn || ball.movingToCenter ? 100 : 1, // Much higher z-index to ensure it's on top
              '@keyframes drawnBallAnimation': {
                '0%': { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 0 25px rgba(255,255,255,0.8), inset 0 1px 10px rgba(255,255,255,0.8)' },
                '50%': { transform: 'translate(-50%, -50%) scale(1.4)', boxShadow: '0 0 50px rgba(255,255,255,1), inset 0 1px 15px rgba(255,255,255,1)' },
                '100%': { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 0 25px rgba(255,255,255,0.8), inset 0 1px 10px rgba(255,255,255,0.8)' }
              },
              '@keyframes moveToCenter': {
                '0%': { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0.7, boxShadow: '0 0 5px rgba(255,255,255,0.3), inset 0 1px 3px rgba(255,255,255,0.3)' },
                '40%': { transform: 'translate(-50%, -50%) scale(1.8)', opacity: 0.9, boxShadow: '0 0 30px rgba(255,255,255,0.8), inset 0 1px 10px rgba(255,255,255,0.8)' },
                '70%': { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 1, boxShadow: '0 0 40px rgba(255,255,255,1), inset 0 1px 15px rgba(255,255,255,1)' },
                '85%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, boxShadow: '0 0 35px rgba(255,255,255,0.9), inset 0 1px 12px rgba(255,255,255,0.9)' },
                '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, boxShadow: '0 0 30px rgba(255,255,255,0.8), inset 0 1px 10px rgba(255,255,255,0.8)' }
              },
              [`@keyframes bounce-${ball.id}`]: {
                '0%': { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
                '25%': { transform: 'translate(-50%, -50%) scale(1.1) rotate(5deg)' },
                '50%': { transform: 'translate(-50%, -50%) scale(1.15) rotate(0deg)' },
                '75%': { transform: 'translate(-50%, -50%) scale(1.1) rotate(-5deg)' },
                '100%': { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' }
              }
            }}
          >
            {/* Show letter prefix for drawn ball */}
            {ball.isDrawn ? (
              <>
                <Typography sx={{
                  fontSize: ball.size * 0.18,
                  fontWeight: 'bold',
                  color: '#fff',
                  mb: -0.5,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {getPrefix(ball.number)}
                </Typography>
                <Typography sx={{
                  fontSize: ball.size * 0.35,
                  fontWeight: 'bold',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {ball.number}
                </Typography>
              </>
            ) : (
              ball.number
            )}
          </Box>
        ))}

        {/* Tube opening at the bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 50,
            height: 30,
            borderRadius: '50% 50% 0 0',
            background: 'rgba(255,255,255,0.2)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 2
          }}
        />
        
        {/* Glass reflection effects */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '30%',
            height: '20%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 3,
            transform: 'rotate(-45deg)'
          }}
        />
        
        {/* Second glass reflection for more realism */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '15%',
            right: '20%',
            width: '15%',
            height: '10%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 3,
            transform: 'rotate(30deg)'
          }}
        />
      </Box>





      {/* Confetti effect */}
      <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles} />
    </Box>
  );
};

export default LotteryDrum;
