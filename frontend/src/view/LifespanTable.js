import React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, Chip, IconButton, Tooltip
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import { red, orange, yellow, green } from '@mui/material/colors';

// Fake data for the lifespan of various building elements
const lifespanData = [
  { id: 1, item: 'Gemeenschappelijke CV-installatie', lifespan: '20 jaar', currentAge: 18, lastCheck: '2020', status: 'In gebruik' },
  { id: 2, item: 'Brandalarm', lifespan: '10 jaar', currentAge: 9, lastCheck: '2021', status: 'Vervangen nodig' },
  { id: 3, item: 'Rookmelder', lifespan: '5 jaar', currentAge: 3, lastCheck: '2022', status: 'In gebruik' },
  { id: 4, item: 'Brandblusser', lifespan: '15 jaar', currentAge: 12, lastCheck: '2023', status: 'Controle nodig' },
  { id: 5, item: 'Noodverlichting', lifespan: '7 jaar', currentAge: 6, lastCheck: '2022', status: 'Bijna verlopen' },
  { id: 6, item: 'Beveiligingscamera’s', lifespan: '10 jaar', currentAge: 5, lastCheck: '2023', status: 'In gebruik' },
  { id: 7, item: 'Elektrische installaties', lifespan: '30 jaar', currentAge: 29, lastCheck: '2019', status: 'Vervangen nodig' },
];

// Function to determine the status based on lifespan
const getStatusIndicator = (currentAge, lifespan) => {
  const percentage = (currentAge / parseInt(lifespan)) * 100;

  if (percentage >= 90) {
    return { color: red[500], icon: <ErrorOutlineIcon />, label: 'Vervangen nodig' };
  } else if (percentage >= 75) {
    return { color: orange[500], icon: <WarningAmberIcon />, label: 'Bijna verlopen' };
  } else if (percentage >= 50) {
    return { color: yellow[700], icon: <WarningAmberIcon />, label: 'Controle nodig' };
  } else {
    return { color: green[500], icon: <CheckCircleOutlineIcon />, label: 'In gebruik' };
  }
};

const LifespanTable = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f7fa' }}>
      <Card
        sx={{
          p: 5,
          mb: 4,
          borderRadius: 4,
          boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.12)',
          maxWidth: '1200px',
          mx: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, color: 'primary.main' }}>
          Levensduur van Gebouwonderdelen
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Een overzicht van de geschatte levensduur en huidige status van de belangrijkste gebouwonderdelen.
        </Typography>
        <TableContainer component={Paper} sx={{ boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'primary.light' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', padding: '20px', color: 'primary.dark' }}>Apparaat / Onderdeel</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '20px', color: 'primary.dark' }}>Levensduur</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '20px', color: 'primary.dark' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '20px', color: 'primary.dark' }}>Laatst Gecontroleerd</TableCell>
                <TableCell sx={{ fontWeight: 'bold', padding: '20px', color: 'primary.dark' }}>Acties</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lifespanData.map((item) => {
                const { color, icon, label } = getStatusIndicator(item.currentAge, item.lifespan);

                return (
                  <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: '#f0f4f8' } }}>
                    <TableCell sx={{ padding: '20px', fontWeight: '500' }}>{item.item}</TableCell>
                    <TableCell sx={{ padding: '20px', fontWeight: '500' }}>{item.lifespan}</TableCell>
                    <TableCell sx={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        icon={icon}
                        label={label}
                        sx={{
                          backgroundColor: color,
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          padding: '5px 10px',
                          fontSize: '0.875rem',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '20px', fontWeight: '500' }}>{item.lastCheck}</TableCell>
                    <TableCell sx={{ padding: '20px', textAlign: 'center' }}>
                      <Tooltip title="Bekijk details">
                        <IconButton color="primary">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default LifespanTable;
