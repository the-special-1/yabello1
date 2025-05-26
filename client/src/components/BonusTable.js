import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Fade, Grid } from '@mui/material';

const BonusTable = ({ cheersNumbers }) => {
  // Define the three different bonus types with their data
  const [bonusTypes, setBonusTypes] = useState([
    {
      title: 'አንድ ዝግ',
      type: 'table',
      data: [
        { calls: 4, prize: 2000 },
        { calls: 5, prize: 200 },
        { calls: 6, prize: 100 },
      ]
    },
    {
      title: 'ሁለት ዝግ',
      type: 'table',
      data: [
        { calls: 11, prize: 1000 },
        { calls: 12, prize: 500 },
        { calls: 13, prize: 300 },
        { calls: 14, prize: 200 },
        { calls: 15, prize: 100 },
      ]
    },
    {
      title: 'ቺርስ',
      type: 'numbers',
      prize: 100,
      numbers: [
        { prefix: 'B', number: 5 },
        { prefix: 'I', number: 20 },
        { prefix: 'N', number: 40 },
        { prefix: 'G', number: 47 },
        { prefix: 'O', number: 74 },
      ]
    }
  ]);

  // Update CHEERS numbers when they change
  useEffect(() => {
    if (cheersNumbers && cheersNumbers.length === 5) {
      setBonusTypes(prev => {
        const updated = [...prev];
        updated[2] = {
          ...updated[2],
          numbers: cheersNumbers
        };
        return updated;
      });
    }
  }, [cheersNumbers]);

  // State to track which bonus type is currently displayed
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Cycle through the bonus types every few seconds
  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setFadeIn(false);
    }, 4000); // Start fade out after 4 seconds

    const changeTypeTimer = setTimeout(() => {
      setCurrentTypeIndex((prevIndex) => (prevIndex + 1) % bonusTypes.length);
      setFadeIn(true);
    }, 4500); // Change type after 4.5 seconds (allowing 0.5s for fade out)

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(changeTypeTimer);
    };
  }, [currentTypeIndex, bonusTypes.length]);

  const currentType = bonusTypes[currentTypeIndex];

  // Render table for regular bonus types
  const renderTable = () => (
    <TableContainer sx={{ height: '100%' }}>
      <Table size="small" aria-label="bonus table">
        <TableHead sx={{ 
          backgroundColor: '#710819',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <TableRow>
            <TableCell colSpan={2} sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              py: 1,
              textAlign: 'center'
            }}>
              {currentType.title}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
              py: 0.5
            }}>
             ጥሪ
            </TableCell>
            <TableCell align="right" sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
              py: 0.5
            }}>
              ሽልማት (ETB)
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentType.data.map((row, index) => (
            <TableRow
              key={index}
              sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                backgroundColor: index % 2 === 0 ? 'rgba(113, 8, 25, 0.05)' : 'transparent',
              }}
            >
              <TableCell component="th" scope="row" sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                py: 0.5,
                fontWeight: 'medium',
                color:'black'
              }}>
                {row.calls}
              </TableCell>
              <TableCell align="right" sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                py: 0.5,
                fontWeight: 'bold',
                color: '#710819'
              }}>
                {row.prize.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render CHEERS bonus with 5 specific numbers
  const renderCheersBonus = () => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      p: 1
    }}>
      <Box sx={{ 
        backgroundColor: '#710819',
        color: 'white',
        py: 1,
        textAlign: 'center',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
      }}>
        <Typography sx={{ 
          fontWeight: 'bold',
          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
        }}>
          {currentType.title}
        </Typography>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}>
        <Typography sx={{ 
          textAlign: 'center', 
          fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
          fontWeight: 'medium',
          mb: 1
        }}>
          ይህን 5 ቁጥሮች በትክክል ካገኙ
        </Typography>
        
        <Grid container spacing={1} justifyContent="center" sx={{ mb: 2 }}>
          {currentType.numbers.map((item, index) => (
            <Grid item key={index}>
              <Box sx={{
                width: { xs: 35, sm: 40, md: 45 },
                height: { xs: 35, sm: 40, md: 45 },
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: `url(/selected.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}>
                <Typography sx={{
                  fontSize: { xs: '0.5rem', sm: '0.6rem', md: '0.7rem' },
                  fontWeight: 'bold',
                  color: '#444444',
                  mb: -0.5,
                  lineHeight: 1
                }}>
                  {item.prefix}
                </Typography>
                <Typography sx={{
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  fontWeight: 'bolder',
                  color: '#444444',
                  lineHeight: 1,
                  mt:1
                }}>
                  {item.number}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ 
          backgroundColor: 'rgba(113, 8, 25, 0.1)', 
          p: 1, 
          borderRadius: '4px',
          textAlign: 'center',
          mb:5
        }}>
          <Typography sx={{ 
            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
            fontWeight: 'bold',
            color: '#710819'
          }}>
            {currentType.prize.toLocaleString()} ETB
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      width: '100%',
    }}>
      <Typography variant="h6" sx={{ 
        color: 'white', 
        textAlign: 'center',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        mb: 1
      }}>
        Bonus Prizes
      </Typography>
      
      <Fade in={fadeIn} timeout={{ enter: 500, exit: 500 }}>
        <Paper sx={{ 
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {currentType.type === 'table' ? renderTable() : renderCheersBonus()}
        </Paper>
      </Fade>
    </Box>
  );
};

export default BonusTable;
