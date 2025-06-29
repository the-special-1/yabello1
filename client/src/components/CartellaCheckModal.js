import React, { useEffect, useState } from 'react';
import { Modal, Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, Divider, Checkbox, FormControlLabel } from '@mui/material';

const CartellaCheckModal = ({ 
  open, 
  onClose, 
  cartella, 
  cartellaNumber, 
  drawnNumbers, 
  winningPattern, 
  isWinner,
  onAdditional,
  onNewBingo,
  setShowConfetti,
  cheersNumbers
}) => {
  const [selectedBonus, setSelectedBonus] = useState('');
  const [bonusResult, setBonusResult] = useState(null);
  const [showBonusSection, setShowBonusSection] = useState(false);
  const [testMode, setTestMode] = useState(false);
  
  // Reset bonus result when modal opens/closes or cartella changes
  useEffect(() => {
    setSelectedBonus('');
    setBonusResult(null);
  }, [open, cartella]);
  
  // Add keyboard shortcut for test mode (Alt+B)
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e) => {
      // Alt+B to toggle test mode (B for Bonus)
      if (e.altKey && e.key === 'b') {
        setTestMode(prev => !prev);
        console.log('Test mode ' + (!testMode ? 'enabled' : 'disabled'));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, testMode]);
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
    maxHeight: '95vh',
    overflowY: showBonusSection ? 'auto' : 'hidden',
    overflowX: 'hidden',
    opacity: 0.9,
    tabIndex: -1
  };

  useEffect(() => {
    // Debug logging when props change
    console.log('CartellCheckModal Props:', {
      cartellaNumber,
      drawnNumbers,
      winningPattern,
      isWinner,
      cartella
    });
  }, [cartellaNumber, drawnNumbers, winningPattern, isWinner, cartella]);

  const handleGoodBingo = () => {
    const audio = new Audio('/sounds/effects/good.wav');
    audio.play().catch(error => console.error('Error playing sound:', error));
    setShowConfetti(true);
  };

  const handleNotBingo = () => {
    const audio = new Audio('/sounds/effects/notgood.wav');
    audio.play().catch(error => console.error('Error playing sound:', error));
  };
  
  // Check for bonus
  const checkBonus = () => {
    if (!selectedBonus || !cartella || !cartella.numbers) {
      setBonusResult(null);
      return;
    }
    
    // If test mode is enabled, we'll simulate a winning condition
    if (testMode) {
      console.log('🧪 Test mode active - simulating winning condition for:', selectedBonus);
      
      // Simulate different bonus types
      switch (selectedBonus) {
        case 'anyOneLine':
          setBonusResult({
            success: true,
            message: 'አንድ ዝግ ተሸላሚ ነዎት! (TEST MODE)',
            details: `Row 1 is complete within ${drawnNumbers.length} calls. (TEST MODE)`,
            prize: 2000
          });
          return;
          
        case 'anyTwoLines':
          setBonusResult({
            success: true,
            message: 'ሁለት ዝግ ተሸላሚ ነዎት! (TEST MODE)',
            details: `Two lines completed within ${drawnNumbers.length} calls. (TEST MODE)`,
            prize: 5000
          });
          return;
          
        case 'cheers':
          setBonusResult({
            success: true,
            message: 'ቺርስ ተሸላሚ ነዎት! (TEST MODE)',
            details: `All CHEERS numbers found! (TEST MODE)`,
            prize: 1000
          });
          return;
      }
    }
    
    switch (selectedBonus) {
      case 'anyOneLine': {
        // Check for any one line (row, column, or diagonal)
        // Check rows
        for (let i = 0; i < 5; i++) {
          const row = cartella.numbers[i];
          if (row.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
            setBonusResult({
              success: true,
              message: 'አንድ ዝግ ተሸላሚ ነዎት!',
              details: `Row ${i+1} is complete within ${drawnNumbers.length} calls.`,
              prize: drawnNumbers.length <= 4 ? 2000 : 
                     drawnNumbers.length <= 5 ? 200 : 
                     drawnNumbers.length <= 6 ? 100 : 0
            });
            return;
          }
        }
        
        // Check columns
        for (let j = 0; j < 5; j++) {
          const column = cartella.numbers.map(row => row[j]);
          if (column.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
            setBonusResult({
              success: true,
              message: 'አንድ ዝግ ተሸላሚ ነዎት!',
              details: `Column ${j+1} is complete within ${drawnNumbers.length} calls.`,
              prize: drawnNumbers.length <= 4 ? 2000 : 
                     drawnNumbers.length <= 5 ? 200 : 
                     drawnNumbers.length <= 6 ? 100 : 0
            });
            return;
          }
        }
        
        // Check diagonals
        const mainDiagonal = cartella.numbers.map((row, i) => row[i]);
        if (mainDiagonal.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
          setBonusResult({
            success: true,
            message: 'አንድ ዝግ ተሸላሚ ነዎት!',
            details: `Main diagonal is complete within ${drawnNumbers.length} calls.`,
            prize: drawnNumbers.length <= 4 ? 2000 : 
                   drawnNumbers.length <= 5 ? 200 : 
                   drawnNumbers.length <= 6 ? 100 : 0
          });
          return;
        }
        
        const antiDiagonal = cartella.numbers.map((row, i) => row[4 - i]);
        if (antiDiagonal.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
          setBonusResult({
            success: true,
            message: 'አንድ ዝግ ተሸላሚ ነዎት!',
            details: `Anti-diagonal is complete within ${drawnNumbers.length} calls.`,
            prize: drawnNumbers.length <= 4 ? 2000 : 
                   drawnNumbers.length <= 5 ? 200 : 
                   drawnNumbers.length <= 6 ? 100 : 0
          });
          return;
        }
        
        // No line found
        setBonusResult({
          success: false,
          message: 'ይቅርታ፣ አንድ ዝግ አላገኙም።',
          details: 'No complete line found.',
          prize: 0
        });
        break;
      }
      
      case 'anyTwoLines': {
        // Check for any two lines (rows, columns, or diagonals)
        let completedLines = [];
        
        // Check rows
        for (let i = 0; i < 5; i++) {
          const row = cartella.numbers[i];
          if (row.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
            completedLines.push(`Row ${i+1}`);
          }
        }
        
        // Check columns
        for (let j = 0; j < 5; j++) {
          const column = cartella.numbers.map(row => row[j]);
          if (column.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
            completedLines.push(`Column ${j+1}`);
          }
        }
        
        // Check diagonals
        const mainDiagonal = cartella.numbers.map((row, i) => row[i]);
        if (mainDiagonal.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
          completedLines.push('Main diagonal');
        }
        
        const antiDiagonal = cartella.numbers.map((row, i) => row[4 - i]);
        if (antiDiagonal.every(num => num === 'free' || drawnNumbers.includes(parseInt(num)))) {
          completedLines.push('Anti-diagonal');
        }
        
        if (completedLines.length >= 2) {
          setBonusResult({
            success: true,
            message: 'ሁለት ዝግ ተሸላሚ ነዎት!',
            details: `${completedLines.slice(0, 2).join(' and ')} are complete within ${drawnNumbers.length} calls.`,
            prize: drawnNumbers.length <= 11 ? 1000 : 
                   drawnNumbers.length <= 12 ? 500 : 
                   drawnNumbers.length <= 13 ? 300 : 
                   drawnNumbers.length <= 14 ? 200 : 
                   drawnNumbers.length <= 15 ? 100 : 0
          });
        } else {
          setBonusResult({
            success: false,
            message: 'ይቅርታ፣ ሁለት ዝግ አላገኙም።',
            details: `Only ${completedLines.length} line(s) found: ${completedLines.join(', ') || 'None'}.`,
            prize: 0
          });
        }
        break;
      }
      
      case 'cheers': {
        // Check if cartella contains all 5 specific CHEERS numbers
        if (!cheersNumbers || cheersNumbers.length !== 5) {
          setBonusResult({
            success: false,
            message: 'ይቅርታ፣ የቺርስ ቁጥሮች አልተገኙም።',
            details: 'CHEERS numbers not available.',
            prize: 0
          });
          return;
        }
        
        // Extract the actual numbers from the cheersNumbers objects
        const targetNumbers = cheersNumbers.map(item => item.number);
        
        // Check if all target numbers are in the cartella and have been drawn
        let foundNumbers = [];
        let notFoundNumbers = [];
        
        for (const targetNum of targetNumbers) {
          let found = false;
          
          // Check if number is in cartella and has been drawn
          for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
              const num = cartella.numbers[i][j];
              if (num !== 'free' && parseInt(num) === targetNum && drawnNumbers.includes(targetNum)) {
                found = true;
                foundNumbers.push(targetNum);
                break;
              }
            }
            if (found) break;
          }
          
          if (!found) {
            notFoundNumbers.push(targetNum);
          }
        }
        
        if (foundNumbers.length === 5) {
          setBonusResult({
            success: true,
            message: 'ቺርስ ተሸላሚ ነዎት!',
            details: 'All 5 CHEERS numbers found in your cartella!',
            prize: 100
          });
        } else {
          setBonusResult({
            success: false,
            message: 'ይቅርታ፣ ቺርስ አላገኙም።',
            details: `Found ${foundNumbers.length}/5 CHEERS numbers. Missing: ${notFoundNumbers.join(', ')}.`,
            prize: 0
          });
        }
        break;
      }
      
      default:
        setBonusResult(null);
    }
  };

  // Helper function to check if a number is drawn
  const isNumberDrawn = (num) => {
    // Make the free check case-insensitive
    if (String(num).toLowerCase() === 'free' || num === '0' || num === 0) return true;
    
    // Convert both the number and drawn numbers to numbers for comparison
    const numValue = parseInt(num);
    if (isNaN(numValue)) return false;
    
    const result = drawnNumbers.includes(numValue);
    console.log(`Checking if ${num} is drawn:`, result, {num, numValue, drawnNumbers: drawnNumbers.slice(0, 5) + '...'});
    return result;
  };

  // Helper function to check if a line is complete
  const isLineComplete = (numbers) => {
    const result = numbers.every(isNumberDrawn);
    console.log('Checking line completion:', { numbers, result });
    return result;
  };

  // Function to check if a number is part of the winning pattern
  const isWinningNumber = (number, rowIndex, colIndex) => {
    // Remove the isWinner check - we want to show the pattern even if isWinner is false
    if (!winningPattern) return false;
    
    const isMiddleCell = rowIndex === 2 && colIndex === 2;
    console.log('Checking winning number:', {
      number,
      rowIndex,
      colIndex,
      isMiddleCell,
      winningPattern,
      isFree: String(number).toLowerCase() === 'free'
    });

    switch (winningPattern) {
      case 'Any one Line': {
        // Debug current cell
        console.log('Checking Any 1 Line pattern:', {
          rowIndex,
          colIndex,
          number
        });

        // Find the first winning line in priority order: rows, columns, diagonals
        let firstWinningLine = null;

        // 1. Check all rows first
        for (let i = 0; i < 5; i++) {
          const row = cartella.numbers[i];
          if (row.every(isNumberDrawn)) {
            firstWinningLine = { type: 'row', index: i };
            break;
          }
        }

        // 2. If no winning row, check all columns
        if (!firstWinningLine) {
          for (let j = 0; j < 5; j++) {
            const column = cartella.numbers.map(row => row[j]);
            if (column.every(isNumberDrawn)) {
              firstWinningLine = { type: 'column', index: j };
              break;
            }
          }
        }

        // 3. If still no winner, check main diagonal
        if (!firstWinningLine) {
          const mainDiagonal = cartella.numbers.map((row, i) => row[i]);
          if (mainDiagonal.every(isNumberDrawn)) {
            firstWinningLine = { type: 'mainDiagonal' };
          }
        }

        // 4. Finally, check anti-diagonal
        if (!firstWinningLine) {
          const antiDiagonal = cartella.numbers.map((row, i) => row[4 - i]);
          if (antiDiagonal.every(isNumberDrawn)) {
            firstWinningLine = { type: 'antiDiagonal' };
          }
        }

        console.log('Any 1 Line completion:', {
          firstWinningLine,
          currentCell: [rowIndex, colIndex]
        });

        // If no winning line found, return false
        if (!firstWinningLine) {
          return false;
        }

        // Check if current cell is in the winning line
        switch (firstWinningLine.type) {
          case 'row':
            return rowIndex === firstWinningLine.index;
          case 'column':
            return colIndex === firstWinningLine.index;
          case 'mainDiagonal':
            return rowIndex === colIndex;
          case 'antiDiagonal':
            return rowIndex === 4 - colIndex;
          default:
            return false;
        }
      }

      case 'Any two Lines': {
        // Debug current cell
        console.log('Checking Any 2 Lines pattern:', {
          rowIndex,
          colIndex,
          number
        });

        // Find the first two winning lines in priority order: rows, columns, diagonals
        let winningLines = [];

        // 1. Check all rows first
        for (let i = 0; i < 5 && winningLines.length < 2; i++) {
          const row = cartella.numbers[i];
          if (row.every(isNumberDrawn)) {
            winningLines.push({ type: 'row', index: i });
          }
        }

        // 2. Check columns if we need more lines
        if (winningLines.length < 2) {
          for (let j = 0; j < 5 && winningLines.length < 2; j++) {
            const column = cartella.numbers.map(row => row[j]);
            if (column.every(isNumberDrawn)) {
              winningLines.push({ type: 'column', index: j });
            }
          }
        }

        // 3. Check main diagonal if we still need more lines
        if (winningLines.length < 2) {
          const mainDiagonal = cartella.numbers.map((row, i) => row[i]);
          if (mainDiagonal.every(isNumberDrawn)) {
            winningLines.push({ type: 'mainDiagonal' });
          }
        }

        // 4. Finally, check anti-diagonal if we still need one more line
        if (winningLines.length < 2) {
          const antiDiagonal = cartella.numbers.map((row, i) => row[4 - i]);
          if (antiDiagonal.every(isNumberDrawn)) {
            winningLines.push({ type: 'antiDiagonal' });
          }
        }

        console.log('Any 2 Lines completion:', {
          winningLines,
          currentCell: [rowIndex, colIndex]
        });

        // If we don't have at least 2 winning lines, return false
        if (winningLines.length < 2) {
          return false;
        }

        // Check if current cell is in either of the first two winning lines
        return winningLines.slice(0, 2).some(line => {
          switch (line.type) {
            case 'row':
              return rowIndex === line.index;
            case 'column':
              return colIndex === line.index;
            case 'mainDiagonal':
              return rowIndex === colIndex;
            case 'antiDiagonal':
              return rowIndex === 4 - colIndex;
            default:
              return false;
          }
        });
      }

      case 'Any Horizontal': {
        // Debug current cell
        console.log('Checking Any Horizontal pattern:', {
          rowIndex,
          colIndex,
          number
        });

        // Find the first complete horizontal line (row)
        let winningRow = null;
        for (let i = 0; i < 5; i++) {
          const row = cartella.numbers[i];
          if (row.every(isNumberDrawn)) {
            winningRow = i;
            break;
          }
        }

        console.log('Any Horizontal completion:', {
          winningRow,
          currentCell: [rowIndex, colIndex]
        });

        // Return true only if current cell is in the first winning row
        return winningRow !== null && rowIndex === winningRow;
      }

      case 'Any Vertical': {
        // Debug current cell
        console.log('Checking Any Vertical pattern:', {
          rowIndex,
          colIndex,
          number
        });

        // Find the first complete vertical line (column)
        let winningColumn = null;
        for (let j = 0; j < 5; j++) {
          const column = cartella.numbers.map(row => row[j]);
          if (column.every(isNumberDrawn)) {
            winningColumn = j;
            break;
          }
        }

        console.log('Any Vertical completion:', {
          winningColumn,
          currentCell: [rowIndex, colIndex]
        });

        // Return true only if current cell is in the first winning column
        return winningColumn !== null && colIndex === winningColumn;
      }

      case 'T Pattern': {
        // Debug the pattern check
        console.log('Checking T pattern:', {
          rowIndex,
          colIndex,
          number,
          isMiddleRow: rowIndex === 2,
          isMiddleColumn: colIndex === 2
        });

        // First check if cell is in middle row or column
        const isInPattern = rowIndex === 0 || colIndex === 2;
        if (!isInPattern) {
          console.log('Cell not in T pattern');
          return false;
        }

        // Get all numbers in middle row and column
        const topRow = cartella.numbers[0];
        const middleColumn = cartella.numbers.map(row => row[2]);
        
        const topRowComplete = topRow.every(isNumberDrawn);
        const middleColumnComplete = middleColumn.every(isNumberDrawn);

        console.log('T Pattern completion:', {
          topRow,
          middleColumn,
          topRowComplete,
          middleColumnComplete,
          isInPattern
        });

        return topRowComplete && middleColumnComplete && isInPattern;
      }

      case 'Reverse T': {
        // Debug the pattern check
        console.log('Checking Reverse T pattern:', {
          rowIndex,
          colIndex,
          number,
          isBottomRow: rowIndex === 4,
          isMiddleColumn: colIndex === 2
        });

        // First check if cell is in bottom row or middle column
        const isInPattern = rowIndex === 4 || colIndex === 2;
        if (!isInPattern) {
          console.log('Cell not in Reverse T pattern');
          return false;
        }

        // Get all numbers in bottom row and middle column
        const bottomRow = cartella.numbers[4];
        const middleColumn = cartella.numbers.map(row => row[2]);
        
        const bottomRowComplete = bottomRow.every(isNumberDrawn);
        const middleColumnComplete = middleColumn.every(isNumberDrawn);

        console.log('Reverse T completion:', {
          bottomRow,
          middleColumn,
          bottomRowComplete,
          middleColumnComplete,
          isInPattern
        });

        return bottomRowComplete && middleColumnComplete && isInPattern;
      }

      case 'X Pattern': {
        // Debug the pattern check
        console.log('Checking X pattern:', {
          rowIndex,
          colIndex,
          number,
          isMainDiagonal: rowIndex === colIndex,
          isAntiDiagonal: rowIndex + colIndex === 4
        });

        // First check if cell is in either diagonal
        const isInMainDiagonal = rowIndex === colIndex;
        const isInAntiDiagonal = rowIndex + colIndex === 4;
        const isInPattern = isInMainDiagonal || isInAntiDiagonal;

        if (!isInPattern) {
          console.log('Cell not in X pattern');
          return false;
        }

        // Get all numbers in both diagonals
        const mainDiagonal = cartella.numbers.map((row, i) => row[i]);
        const antiDiagonal = cartella.numbers.map((row, i) => row[4 - i]);

        // Check if both diagonals are complete
        const mainDiagonalComplete = mainDiagonal.every(isNumberDrawn);
        const antiDiagonalComplete = antiDiagonal.every(isNumberDrawn);

        console.log('X Pattern completion:', {
          mainDiagonal,
          antiDiagonal,
          mainDiagonalComplete,
          antiDiagonalComplete,
          isInPattern
        });

        // Both diagonals must be complete and cell must be in pattern
        return mainDiagonalComplete && antiDiagonalComplete && isInPattern;
      }

      case 'L Pattern': {
        // Debug the pattern check
        console.log('Checking L pattern:', {
          rowIndex,
          colIndex,
          number,
          isBottomRow: rowIndex === 4,
          isLeftColumn: colIndex === 0
        });

        // First check if cell is in bottom row or left column
        const isInPattern = rowIndex === 4 || colIndex === 0;
        if (!isInPattern) {
          console.log('Cell not in L pattern');
          return false;
        }

        // Get all numbers in bottom row and left column
        const bottomRow = cartella.numbers[4];
        const leftColumn = cartella.numbers.map(row => row[0]);

        // Check if both parts are complete
        const bottomRowComplete = bottomRow.every(isNumberDrawn);
        const leftColumnComplete = leftColumn.every(isNumberDrawn);

        console.log('L Pattern completion:', {
          bottomRow,
          leftColumn,
          bottomRowComplete,
          leftColumnComplete,
          isInPattern
        });

        // Both parts must be complete and cell must be in pattern
        return bottomRowComplete && leftColumnComplete && isInPattern;
      }

      case 'Reverse L': {
        // Debug the pattern check
        console.log('Checking Reverse L pattern:', {
          rowIndex,
          colIndex,
          number,
          isBottomRow: rowIndex === 4,
          isRightColumn: colIndex === 4
        });

        // First check if cell is in bottom row or right column
        const isInPattern = rowIndex === 4 || colIndex === 4;
        if (!isInPattern) {
          console.log('Cell not in Reverse L pattern');
          return false;
        }

        // Get all numbers in bottom row and right column
        const bottomRow = cartella.numbers[4];
        const rightColumn = cartella.numbers.map(row => row[4]);

        // Check if both parts are complete
        const bottomRowComplete = bottomRow.every(isNumberDrawn);
        const rightColumnComplete = rightColumn.every(isNumberDrawn);

        console.log('Reverse L Pattern completion:', {
          bottomRow,
          rightColumn,
          bottomRowComplete,
          rightColumnComplete,
          isInPattern
        });

        // Both parts must be complete and cell must be in pattern
        return bottomRowComplete && rightColumnComplete && isInPattern;
      }

      case 'Half Above': {
        // Debug the pattern check
        console.log('Checking Half Above pattern:', {
          rowIndex,
          colIndex,
          number,
          isInTopHalf: rowIndex < 3
        });

        // First check if cell is in top half
        const isInPattern = rowIndex < 3;
        if (!isInPattern) {
          console.log('Cell not in top half');
          return false;
        }

        // Get all numbers in top half
        const topHalf = cartella.numbers.slice(0, 3);

        // Check if all cells in top half are drawn
        const topHalfComplete = topHalf.every(row => row.every(isNumberDrawn));

        console.log('Half Above Pattern completion:', {
          topHalf,
          topHalfComplete,
          isInPattern
        });

        // Top half must be complete and cell must be in pattern
        return topHalfComplete && isInPattern;
      }

      case 'Half Below': {
        // Debug the pattern check
        console.log('Checking Half Below pattern:', {
          rowIndex,
          colIndex,
          number,
          isInBottomHalf: rowIndex >= 2
        });

        // First check if cell is in bottom half
        const isInPattern = rowIndex >= 2;
        if (!isInPattern) {
          console.log('Cell not in bottom half');
          return false;
        }

        // Get all numbers in bottom half
        const bottomHalf = cartella.numbers.slice(2);

        // Check if all cells in bottom half are drawn
        const bottomHalfComplete = bottomHalf.every(row => row.every(isNumberDrawn));

        console.log('Half Below Pattern completion:', {
          bottomHalf,
          bottomHalfComplete,
          isInPattern
        });

        // Bottom half must be complete and cell must be in pattern
        return bottomHalfComplete && isInPattern;
      }

      case 'Half Left': {
        // Debug the pattern check
        console.log('Checking Half Left pattern:', {
          rowIndex,
          colIndex,
          number,
          isInLeftHalf: colIndex < 3
        });

        // First check if cell is in left half
        const isInPattern = colIndex < 3;
        if (!isInPattern) {
          console.log('Cell not in left half');
          return false;
        }

        // Get all numbers in left half (first 3 columns)
        const leftHalf = cartella.numbers.map(row => row.slice(0, 3));

        // Check if all cells in left half are drawn
        const leftHalfComplete = leftHalf.every(row => row.every(isNumberDrawn));

        console.log('Half Left Pattern completion:', {
          leftHalf,
          leftHalfComplete,
          isInPattern
        });

        // Left half must be complete and cell must be in pattern
        return leftHalfComplete && isInPattern;
      }

      case 'Half Right': {
        // Debug the pattern check
        console.log('Checking Half Right pattern:', {
          rowIndex,
          colIndex,
          number,
          isInRightHalf: colIndex >= 2
        });

        // First check if cell is in right half
        const isInPattern = colIndex >= 2;
        if (!isInPattern) {
          console.log('Cell not in right half');
          return false;
        }

        // Get all numbers in right half (last 3 columns)
        const rightHalf = cartella.numbers.map(row => row.slice(2));

        // Check if all cells in right half are drawn
        const rightHalfComplete = rightHalf.every(row => row.every(isNumberDrawn));

        console.log('Half Right Pattern completion:', {
          rightHalf,
          rightHalfComplete,
          isInPattern
        });

        // Right half must be complete and cell must be in pattern
        return rightHalfComplete && isInPattern;
      }

      case 'G and O': {
        // Check if current cell is in G or O column
        if (colIndex !== 3 && colIndex !== 4) return false;
        
        // Check if all numbers in G and O columns are drawn
        return cartella.numbers.every(row => 
          (row[3] === 'free' || drawnNumbers.includes(row[3])) &&
          (row[4] === 'free' || drawnNumbers.includes(row[4]))
        );
      }

      case 'B and O': {
        // Check if current cell is in B or O column
        if (colIndex !== 0 && colIndex !== 4) return false;
        
        // Check if all numbers in B and O columns are drawn
        return cartella.numbers.every(row => 
          (row[0] === 'free' || drawnNumbers.includes(row[0])) &&
          (row[4] === 'free' || drawnNumbers.includes(row[4]))
        );
      }

      case 'Mark': {
        // Check if current cell is on the border
        if (rowIndex !== 0 && rowIndex !== 4 && colIndex !== 0 && colIndex !== 4) return false;
        
        // Check if all border numbers are drawn
        const topRow = cartella.numbers[0];
        const bottomRow = cartella.numbers[4];
        const leftColumn = cartella.numbers.map(row => row[0]);
        const rightColumn = cartella.numbers.map(row => row[4]);
        
        return topRow.every(num => num === 'free' || drawnNumbers.includes(num)) &&
               bottomRow.every(num => num === 'free' || drawnNumbers.includes(num)) &&
               leftColumn.every(num => num === 'free' || drawnNumbers.includes(num)) &&
               rightColumn.every(num => num === 'free' || drawnNumbers.includes(num));
      }

      case 'T Cross': {
        // Debug the pattern check
        console.log('Checking T Cross pattern:', {
          rowIndex,
          colIndex,
          number,
          isMiddleRow: rowIndex === 2,
          isMiddleColumn: colIndex === 2
        });

        // First check if cell is in middle row or column
        const isInPattern = rowIndex === 2 || colIndex === 2;
        if (!isInPattern) {
          console.log('Cell not in T Cross pattern');
          return false;
        }

        // Get all numbers in middle row and column
        const middleRow = cartella.numbers[2];
        const middleColumn = cartella.numbers.map(row => row[2]);

        // Check if both parts are complete
        const middleRowComplete = middleRow.every(isNumberDrawn);
        const middleColumnComplete = middleColumn.every(isNumberDrawn);

        console.log('T Cross Pattern completion:', {
          middleRow,
          middleColumn,
          middleRowComplete,
          middleColumnComplete,
          isInPattern
        });

        // Both parts must be complete and cell must be in pattern
        return middleRowComplete && middleColumnComplete && isInPattern;
      }
      default:
        console.log('Unknown pattern:', winningPattern);
        return false;
    }
  };

  if (!cartella || !cartella.numbers) {
    console.log('No cartella data');
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
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
          borderTopRightRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {testMode && (
            <Box sx={{
              position: 'absolute',
              top: 5,
              right: 10,
              bgcolor: '#ffeb3b',
              color: '#000',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.7 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.7 }
              }
            }}>
              TEST MODE
            </Box>
          )}
          
          <Typography variant="h4" align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
           Card No: {cartellaNumber}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showBonusSection}
                  onChange={(e) => setShowBonusSection(e.target.checked)}
                  sx={{ 
                    color: 'white',
                    '&.Mui-checked': {
                      color: 'white',
                    },
                  }}
                />
              }
              label="Show Bonus Options"
              sx={{ 
                color: 'white',
                '.MuiFormControlLabel-label': {
                  fontSize: '0.9rem',
                  fontWeight: 'medium'
                }
              }}
            />
          </Box>
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
                const isDrawn = isNumberDrawn(number);
                const isWinningLine = isWinningNumber(number, i, j);

                // Debug cell state
                console.log(`=== Rendering Cell [${i},${j}] ===`);
                console.log('Cell number:', number);
                console.log('Cell position:', { row: i, col: j });
                console.log('drawnNumbers:', drawnNumbers);
                console.log('Is number drawn?', isDrawn);
                console.log('Is middle cell?', isMiddleCell);
                console.log('Is winning line?', isWinningLine);

                // Show blue for winning pattern cells regardless of isWinner flag
                const showBlue = isMiddleCell || isWinningLine;
                
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
                      backgroundColor: '#eeeeee'
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
                                      isDrawn ? 'red' : 
                                      'transparent',
                        color: showBlue || isDrawn ? 'white' : 'black',
                        borderRadius: '50%',
                        zIndex: 1,
                        // boxShadow: showBlue ? '0 0 10px #0066cc' : 'none'
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

        {/* Bonus Check Section */}
        {showBonusSection && (
          <Box sx={{ 
            mt: 2, 
            mb: 3,
            mx: 'auto',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            position: 'relative'
          }}>
            <Divider sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                color: '#790918'
              }}>
                Check for Bonus
              </Typography>
            </Divider>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="bonus-type-label" sx={{ 
                  fontSize: '1rem',
                  fontWeight: 'medium',
                  backgroundColor: 'white',
                  px: 0.5,
                  color: '#000000'
                }}>
                  Bonus Type
                </InputLabel>
                <Select
                  labelId="bonus-type-label"
                  value={selectedBonus}
                  label="Bonus Type"
                  onChange={(e) => setSelectedBonus(e.target.value)}
                  sx={{ 
                    minWidth: 150,
                    height: 45,
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#790918',
                      borderWidth: 2
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#790918',
                      borderWidth: 2
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#790918',
                      borderWidth: 2
                    },
                    '& .MuiSelect-select': {
                      fontSize: '1rem',
                      fontWeight: 'medium',
                      color: '#000000'
                    }
                  }}
                >
                  <MenuItem value="" sx={{ color: 'white' }}><em>None</em></MenuItem>
                  <MenuItem value="anyOneLine" sx={{ color: 'white' }}>አንድ ዝግ (One Line)</MenuItem>
                  <MenuItem value="anyTwoLines" sx={{ color: 'white' }}>ሁለት ዝግ (Two Lines)</MenuItem>
                  <MenuItem value="cheers" sx={{ color: 'white' }}>ቺርስ (CHEERS)</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                variant="contained" 
                disabled={!selectedBonus}
                onClick={checkBonus}
                sx={{ 
                  minWidth: 120,
                  height: 45,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#790918',
                  '&:hover': {
                    backgroundColor: '#5d0713'
                  }
                }}
              >
                Check Bonus
              </Button>
            </Box>
            
            {bonusResult && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                borderRadius: 1,
                bgcolor: bonusResult.success ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                border: `1px solid ${bonusResult.success ? 'rgba(46, 125, 50, 0.5)' : 'rgba(211, 47, 47, 0.5)'}`,
                position: 'relative',
                mb: 1
              }}>
                <Button 
                  onClick={() => setBonusResult(null)}
                  sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    minWidth: 'auto',
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    p: 0,
                    color: bonusResult.success ? '#2e7d32' : '#d32f2f',
                    '&:hover': {
                      backgroundColor: bonusResult.success ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)'
                    }
                  }}
                >
                  ✕
                </Button>
                
                <Typography variant="h6" sx={{ 
                  color: bonusResult.success ? '#2e7d32' : '#d32f2f',
                  fontWeight: 'bold',
                  mb: 1,
                  pr: 4 // Make room for the close button
                }}>
                  {bonusResult.message}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                  {bonusResult.details}
                </Typography>
                
                {bonusResult.success && (
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    Prize: {bonusResult.prize.toLocaleString()} ETB
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
        
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
