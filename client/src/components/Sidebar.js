import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Report', icon: <PersonIcon />, path: '/report' },
    { text: 'Daily Report', icon: <PersonIcon />, path: '/daily-report' },
  ];

  return (
    <Box
      sx={{
        width: 240,
        bgcolor: '#2D2D2D',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 150, // Height of header
        bottom: 0,
        zIndex: 1
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            button
            onClick={() => navigate(item.path)}
            sx={{
              py: 2,
              color: 'white',
              bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.12)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
