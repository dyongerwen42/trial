import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Typography variant="body1" sx={{ marginRight: '0.5rem' }}>
        Powered by 
      </Typography>
      <Link href="https://tha-diensten.nl/vve" target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ marginRight: '0.5rem' }}>
          THA-Diensten
        </Typography>
        <Box
          component="img"
          src="noroot.png"
          alt="Logo"
          sx={{
            height: '40px', // Increased the height of the logo
          }}
        />
      </Link>
    </Box>
  );
};

export default Footer;
