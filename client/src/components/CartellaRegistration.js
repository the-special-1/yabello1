import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Grid,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Alert,
  IconButton,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestoreIcon from '@mui/icons-material/Restore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import CartellasModal from './CartellasModal';
import CartellaCircleView from './CartellaCircleView';

const PATTERNS = [
  { name: 'Any 1 Line', description: 'Complete any single line' },
  { name: 'Any 2 Lines', description: 'Complete any two lines' },
  { name: 'Any Vertical', description: 'Complete any vertical line' },
  { name: 'Any Horizontal', description: 'Complete any horizontal line' },
  { name: 'T Pattern', description: 'Complete T shape' },
  { name: 'Reverse T', description: 'Complete upside-down T shape' },
  { name: 'X Pattern', description: 'Complete X shape' },
  { name: 'L Pattern', description: 'Complete L shape' },
  { name: 'Reverse L', description: 'Complete reversed L shape' },
  { name: 'Half Above', description: 'Complete top half' },
  { name: 'Half Below', description: 'Complete bottom half' },
  { name: 'Half Left', description: 'Complete left half' },
  { name: 'Half Right', description: 'Complete right half' },
  { name: 'G and O', description: 'Complete G and O columns' },
  { name: 'B and O', description: 'Complete B and O columns' },
  { name: 'Mark', description: 'Complete mark pattern' },
  { name: 'T Cross', description: 'Complete T cross pattern' }
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cartella-tabpanel-${index}`}
      aria-labelledby={`cartella-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CartellaRegistration = ({ open, onSelect }) => {
  const navigate = useNavigate();
  const [selectedCartellas, setSelectedCartellas] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('Any 1 Line');  
  const [betAmount, setBetAmount] = useState('');  
  const [availableCartellas, setAvailableCartellas] = useState([]);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [userCut, setUserCut] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [showNewCartellaModal, setShowNewCartellaModal] = useState(false);
  const [roundCount, setRoundCount] = useState(() => {
    const saved = localStorage.getItem('bingoRoundCount');
    return saved ? parseInt(saved) : 1;
  });
  const { user } = useAuth();

  // Add state for previous game settings and current state backup
  const [previousSettings, setPreviousSettings] = useState(() => {
    const saved = localStorage.getItem('previousGameSettings');
    return saved ? JSON.parse(saved) : null;
  });
  const [stateBeforeContinue, setStateBeforeContinue] = useState(null);
  const [isContinueActive, setIsContinueActive] = useState(false);

  // Toggle between continue and initial state
  const handleContinue = () => {
    if (!isContinueActive && previousSettings) {
      // Save current state before applying continue
      setStateBeforeContinue({
        cartellas: selectedCartellas,
        pattern: selectedPattern,
        betAmount: betAmount
      });
      
      // Apply previous settings
      setSelectedCartellas(previousSettings.cartellas);
      setSelectedPattern(previousSettings.pattern);
      setBetAmount(previousSettings.betAmount);
      setIsContinueActive(true);
    } else if (stateBeforeContinue) {
      // Restore state from before continue was clicked
      setSelectedCartellas(stateBeforeContinue.cartellas);
      setSelectedPattern(stateBeforeContinue.pattern);
      setBetAmount(stateBeforeContinue.betAmount);
      setIsContinueActive(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCartellas();
      fetchUserBalance();
      fetchUserCut();
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchCartellas = async () => {
    try {
      console.log('Fetching cartellas...');
      const response = await fetch('/api/cartellas/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch cartellas');
      }

      const { cartellas } = await response.json();
      console.log('Full cartella object example:', cartellas[0]); // Log first cartella
      
      // Filter and sort cartellas by ID
      const filteredCartellas = cartellas
        .filter(cartella => !['playing', 'won', 'lost'].includes(cartella.status))
        .sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Sort by ID in ascending order
      
      setAvailableCartellas(filteredCartellas || []);
    } catch (err) {
      console.error('Error fetching cartellas:', err);
      setError(err.message);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/users/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch balance');
      }
      const data = await response.json();
      setUserBalance(data.credits || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    }
  };

  const fetchUserCut = async () => {
    try {
      const response = await fetch('/api/users/my-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user cut');
      }
      const data = await response.json();
      console.log('User data received:', data);
      // Use the user's cut value from their profile
      const cutValue = data.cut;
      console.log('Setting user cut to:', cutValue);
      setUserCut(cutValue);
    } catch (err) {
      console.error('Error fetching user cut:', err);
      setError('Failed to fetch user cut');
    }
  };

  const handleCartellaToggle = (cartella) => {
    console.log('Selected cartella:', cartella); // Log selected cartella
    const isSelected = selectedCartellas.some(c => c.id === cartella.id);
    if (isSelected) {
      setSelectedCartellas(selectedCartellas.filter(c => c.id !== cartella.id));
    } else {
      setSelectedCartellas([...selectedCartellas, cartella]);
    }
  };

  const handleSubmit = () => {
    if (selectedCartellas.length === 0) {
      setError('Please select at least one cartella');
      return;
    }
    if (!selectedPattern) {
      setError('Please select a pattern');
      return;
    }
    if (!betAmount) {
      setError('Please select a bet amount');
      return;
    }

    const rawTotalBet = selectedCartellas.length * betAmount;
    const cutAmount = rawTotalBet * (userCut / 100); // Calculate the cut amount
    const adjustedTotalBet = rawTotalBet - cutAmount; // Subtract the cut from total

    console.log('Calculation details:', {
      numberOfCartellas: selectedCartellas.length,
      betPerCartella: betAmount,
      rawTotalBet: rawTotalBet,
      userCutPercentage: userCut,
      cutAmount: cutAmount,
      adjustedTotalBet: adjustedTotalBet
    });
    
    if (adjustedTotalBet > userBalance) {
      setError('Insufficient balance');
      return;
    }
    
    // Increment round count
    const newRoundCount = roundCount + 1;
    setRoundCount(newRoundCount);
    localStorage.setItem('bingoRoundCount', newRoundCount.toString());

    // Save current settings
    const currentSettings = {
      cartellas: selectedCartellas,
      pattern: selectedPattern,
      betAmount: betAmount,
      totalBet: adjustedTotalBet // Pass the adjusted total bet
    };
    localStorage.setItem('previousGameSettings', JSON.stringify(currentSettings));
    setPreviousSettings(currentSettings);

    try {
      console.log('Selected pattern:', selectedPattern);
      onSelect({
        cartellas: selectedCartellas,
        pattern: selectedPattern,
        betAmount: betAmount,
        totalBet: adjustedTotalBet // Pass the adjusted total bet
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePatternChange = (event) => {
    setSelectedPattern(event.target.value);
    setError(''); // Clear any existing errors
  };

  return (
    <>
      <Dialog 
        open={open} 
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#000000',  // pure black
            fontFamily: "'Times New Roman', serif"  // Default font for all text
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#fff', 
          color: '#000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #ddd',
          p: 1,  
          minHeight: '48px',  
          fontFamily: 'inherit'
        }}>
          {/* Left side - Phone image and back button */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/bingogame')}
              sx={{ mr: 1, color: 'black' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <img 
              src="/phoneimage.png" 
              alt="Phone"
              style={{
                height: '36px',
                width: 'auto',
                marginRight: '8px'
              }}
            />
          </Box>

          {/* Right side - Register link */}
          <Typography 
            onClick={() => setShowNewCartellaModal(true)}
            sx={{ 
              color: '#000',
              cursor: 'pointer',
              fontSize: '1.25rem',
              fontFamily: 'inherit',
              textDecoration: 'none',
            }}
          >
            Register New Card
          </Typography>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            pt: 0,
            height: '100%'
          }}
        >
          {/* Round counter and Continue button */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            mb: 0
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#ffffff',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                left:10,
                fontFamily: 'inherit'
              }}
            >
              Round {roundCount}
            </Typography>

            <Button
              variant="contained"
              size="medium"
              onClick={handleContinue}
              disabled={!previousSettings}
              sx={{
                bgcolor: isContinueActive ? '#790918' : '#790918',
                color: 'white',
                fontWeight: 'bold',
                px: 3,
                mt:2,
                ml:30,
                '&:hover': {
                  bgcolor: isContinueActive ? '#b71c1c' : '#d32f2f',
                  transform: 'scale(1.02)'
                },
                '&:disabled': {
                  bgcolor: '#790918',
                  color: '#999'
                }
              }}
            >
              Continue
            </Button>
          </Box>

          {/* Main content */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            gap: 0
          }}>
            {/* Left half - Cartellas */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',  
              width: '100%'  
            }}>
              {/* Section title */}
              <Typography variant="h4" sx={{ mb: 0, color: 'white', pl: 0, fontFamily: 'inherit' }}>
              ካርድ ቁጥሮች
              </Typography>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <CartellaCircleView
                  cartellas={availableCartellas}
                  selectedCartellas={selectedCartellas}
                  onSelect={handleCartellaToggle}
                />
              </Box>
            </Box>

            {/* Right half - Controls */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0
            }}>
              {selectedCartellas.length > 0 && (
                <Box sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0
                }}>
                  {/* Selected cartellas display */}
                  <Typography variant="h4" sx={{ mb: 2, color: 'white', fontFamily: 'inherit' }}>
                    ካርድ ቁጥሮት መመዝገቡን<br/>ይመልከቱ
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0,
                    justifyContent: 'center',
                    width: '100%',
                    pb: 0
                  }}>
                    {selectedCartellas.map((cartella) => (
                      <Box
                        key={cartella.id}
                        sx={{
                       
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundImage: 'linear-gradient(90deg, yellow,orange, red)' ,
                          border: '3px solid #FF8C00',
                          color: '#000',
                          fontWeight: 'bold',
                          fontSize: '2.5rem',
                          fontFamily: "'Times New Roman', serif",
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 0 20px rgba(255, 140, 0, 0.7)'
                          }
                        }}
                      >
                        {cartella.id}
                      </Box>
                    ))}
                  </Box>

                  {/* Dropdowns */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0,
                    width: '30px',
                    justifyContent: 'center',
                    mt: 0,
                    pt: 0
                  }}>
                    {/* Bet amount dropdown */}
                    <FormControl sx={{ flex: 1, minWidth: 170 }}>
                      <Select
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        size="small"
                        displayEmpty
                        IconComponent={KeyboardArrowDownIcon}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: 'white',
                              '& .MuiMenuItem-root': {
                                height: 35,
                                '&:hover, &.Mui-selected, &.Mui-selected:hover': {
                                  bgcolor: 'rgba(0, 0, 0, 0.08)',
                                }
                              }
                            }
                          }
                        }}
                        sx={{
                          height: 35,
                          backgroundColor: 'white',
                          '& .MuiSelect-select': {
                            py: 0,
                            pr: '24px !important',
                            color: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          },
                          '& .MuiSvgIcon-root': {
                            position: 'relative',
                            right: 0,
                            ml: 1
                          }
                        }}
                      >
                        <MenuItem value="" disabled>
                          <Typography sx={{ color: 'black', fontFamily: 'inherit', display: 'flex',
                             alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            የብር መጠን
                          </Typography>
                        </MenuItem>
                        {[10, 20, 50, 100, 200, 500].map((amount) => (
                          <MenuItem key={amount} value={amount}>
                            <Typography sx={{ color: 'black', fontFamily: 'inherit', display: 'flex', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                              {amount} ETB
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Pattern dropdown */}
                    <FormControl sx={{ flex: 2, minWidth: 200 }}>
                      <Select
                        value={selectedPattern}
                        onChange={(e) => setSelectedPattern(e.target.value)}
                        size="small"
                        IconComponent={KeyboardArrowDownIcon}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: 'white',
                              '& .MuiMenuItem-root': {
                                height: 35,
                                '&:hover, &.Mui-selected, &.Mui-selected:hover': {
                                  bgcolor: 'rgba(0, 0, 0, 0.08)',
                                }
                              }
                            }
                          }
                        }}
                        sx={{
                          height: 35,
                          backgroundColor: 'white',
                          '& .MuiSelect-select': {
                            py: 0,
                            color: 'black'
                          }
                        }}
                      >
                        {PATTERNS.map((pattern) => (
                          <MenuItem key={pattern.name} value={pattern.name}>
                            <Typography sx={{ color: 'black', fontFamily: 'inherit', fontSize: '1.5rem', fontWeight: 'bold' }}>
                              {pattern.name}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Play button */}
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    // startIcon={<PlayArrowIcon />}
                    sx={{
                      minWidth: 120,
                      height: 50,
                     fontSize: '1.5rem',
                      backgroundColor: 'blue',
                      boxShadow: 2,
                      mt: 0,
                      opacity: (!selectedPattern || selectedCartellas.length === 0) ? 0.7 : 1,
                      '&:hover': {
                        backgroundColor: '#1565c0',
                        transform: (!selectedPattern || selectedCartellas.length === 0) ? 'none' : 'scale(1.02)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    PLAY
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {showNewCartellaModal && (
        <CartellasModal
          open={showNewCartellaModal}
          onClose={() => {
            setShowNewCartellaModal(false);
            fetchCartellas();
          }}
        />
      )}
    </>
  );
};

export default CartellaRegistration;
