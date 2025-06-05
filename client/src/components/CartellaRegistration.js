import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../utils/apiService';
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
import { getRoundNumber } from '../utils/roundManager';

const PATTERNS = [
  { name: 'Any one Line', description: 'Complete any single line' },
  { name: 'Any two Lines', description: 'Complete any two lines' },
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

const CartellaRegistration = ({ open, onSelect, currentRound, onCartellaUpdate }) => {
  const navigate = useNavigate();
  const [selectedCartellas, setSelectedCartellas] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('Any one Line');  
  const [betAmount, setBetAmount] = useState('');  
  const [availableCartellas, setAvailableCartellas] = useState([]);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [userCut, setUserCut] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [showNewCartellaModal, setShowNewCartellaModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Add state for previous game settings and current state backup
  const [previousSettings, setPreviousSettings] = useState(() => {
    const saved = localStorage.getItem('previousGameSettings');
    return saved ? JSON.parse(saved) : null;
  });
  const [stateBeforeContinue, setStateBeforeContinue] = useState(null);
  const [isContinueActive, setIsContinueActive] = useState(false);
  const [isLoadingContinue, setIsLoadingContinue] = useState(false);

  // Toggle between continue and initial state
  const handleContinue = async () => {
    if (!previousSettings) return;
    
    try {
      // Apply previous settings
      setSelectedCartellas(previousSettings.cartellas);
      setSelectedPattern(previousSettings.pattern);
      setBetAmount(previousSettings.betAmount);
    } catch (error) {
      console.error('Error in handleContinue:', error);
    }
  };

  // Add effect to ensure state is properly updated
  useEffect(() => {
    if (isContinueActive && previousSettings) {
      // Verify state matches previous settings
      const stateMatches = 
        JSON.stringify(selectedCartellas) === JSON.stringify(previousSettings.cartellas) &&
        selectedPattern === previousSettings.pattern &&
        betAmount === previousSettings.betAmount;
      
      if (!stateMatches) {
        // Re-apply settings if they don't match
        setSelectedCartellas(previousSettings.cartellas);
        setSelectedPattern(previousSettings.pattern);
        setBetAmount(previousSettings.betAmount);
      }
    }
  }, [isContinueActive, previousSettings]);

  useEffect(() => {
    if (open) {
      fetchCartellas();
      fetchUserBalance();
      fetchUserCut();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      // Reset states when modal opens
      setError('');
      setSelectedCartellas([]);
      setSelectedPattern('Any one Line');
      setBetAmount('');
      setTabValue(0);
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchCartellas = async () => {
    try {
      console.log('Fetching cartellas...');
      const response = await apiService.get('cartellas/available');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch cartellas');
      }

      const { cartellas } = await response.json();
      console.log('Full cartella object example:', cartellas[0]);
      
      // Filter and sort cartellas by ID
      const filteredCartellas = (cartellas || [])
        .filter(cartella => cartella && !['playing', 'won', 'lost'].includes(cartella.status))
        .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
      
      setAvailableCartellas(filteredCartellas);
    } catch (err) {
      console.error('Error fetching cartellas:', err);
      setError(err.message);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await apiService.get('users/balance', {
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
      const response = await apiService.get('users/my-data', {
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

  const handleSubmit = async (event) => {
    if (isSubmitting) return;
    
    try {
      event?.preventDefault(); // Prevent any form submission
      setIsSubmitting(true);
      setError('');

      // Validate inputs
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

      // Calculate values
      const parsedBetAmount = parseFloat(betAmount);
      const rawTotalBet = selectedCartellas.length * parsedBetAmount;
      const cutAmount = Math.ceil(rawTotalBet * (userCut / 100)); // Round up cut amount
      const adjustedTotalBet = Math.floor(rawTotalBet - cutAmount); // Round down total bet
      
      // Prepare data
      const calculationDetails = {
        numberOfCartellas: selectedCartellas.length,
        betPerCartella: parsedBetAmount,
        rawTotalBet: rawTotalBet,
        userCutPercentage: userCut,
        cutAmount: cutAmount,
        adjustedTotalBet: adjustedTotalBet
      };

      // Save settings before making API call
      const currentSettings = {
        cartellas: selectedCartellas,
        pattern: selectedPattern,
        betAmount: betAmount,
        totalBet: adjustedTotalBet
      };
      localStorage.setItem('previousGameSettings', JSON.stringify(currentSettings));
      setPreviousSettings(currentSettings);

      // Make the API call
      await onSelect({
        cartellas: selectedCartellas,
        pattern: selectedPattern,
        betAmount: parsedBetAmount,
        totalBet: adjustedTotalBet,
        calculationDetails
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
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
          minHeight: '60px',  
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
                marginRight: '8px',
                marginBottom:'0px'
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
              Round {currentRound}
            </Typography>

            {previousSettings && (
              <Button
                variant="contained"
                size="medium"
                onClick={handleContinue}
                disabled={!previousSettings}
                sx={{
                  bgcolor: '#790918',
                  color: 'white',
                  fontWeight: 'bold',
                  px: 3,
                  mt: 2,
                  ml: 30,
                  '&:hover': {
                    bgcolor: '#d32f2f',
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
            )}
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
              <Box sx={{ width: '100%', display: 'flex',ml:0 }}>
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
                          width: 70,
                          height: 70,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `url(/selected.png)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '2px solid #FFD700',
                          color: '#444444',
                          fontWeight: 'bold',
                          fontSize: '2.5rem',
                          fontFamily: "'Times New Roman', serif",
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                          '&:hover': {
                            transform: 'scale(1.05)'
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
                        {[10, 20, 30,40,50, 100, 200,300,400, 500].map((amount) => (
                          <MenuItem key={amount} value={amount}>
                            <Typography sx={{ color: 'black', fontFamily: 'inherit', display: 'flex', alignItems: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            በ {amount}ብር
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
                    disabled={!selectedPattern || selectedCartellas.length === 0}
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
          onClose={() => setShowNewCartellaModal(false)}
          onCartellaUpdate={onCartellaUpdate}
        />
      )}
    </>
  );
};

export default CartellaRegistration;
