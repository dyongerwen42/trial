import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, Button, Stack, Card, DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { green, red, blueGrey } from '@mui/material/colors';

// Fake poll data
const pollData = [
  {
    id: 1,
    question: 'Bent u het eens met deze offerte voor het schilderwerk van de buitenkant?',
    yesPercentage: 85,
    noReasons: ['Te hoge kosten', 'Verwacht langere wachttijd', 'Te weinig details in de offerte'],
  },
  {
    id: 2,
    question: 'Moet het onderhoud vaker worden ingepland?',
    yesPercentage: 75,
    noReasons: ['Geen noodzaak', 'Te vaak onderhoud', 'Kosten zijn te hoog'],
  },
  {
    id: 3,
    question: 'Bent u tevreden met de communicatie van de beheerders?',
    yesPercentage: 92,
    noReasons: [],
  },
];

const PollResultsTable = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);

  const handleOpenDialog = (reasons) => {
    setSelectedReasons(reasons);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReasons([]);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: blueGrey[700] }}>
        Poll Resultaten
      </Typography>

      {/* Poll Results Table */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.2)',
          backgroundColor: blueGrey[50],
        }}
      >
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.1)' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: blueGrey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: blueGrey[900], fontSize: '1.1rem', p: 2 }}>Vraag</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: blueGrey[900], fontSize: '1.1rem', p: 2 }}>Percentage goedgekeurd</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: blueGrey[900], fontSize: '1.1rem', p: 2 }}>Nee Reacties</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pollData.map((poll) => (
                <TableRow key={poll.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: blueGrey[50] }, '&:hover': { backgroundColor: blueGrey[100] } }}>
                  <TableCell sx={{ p: 2 }}>{poll.question}</TableCell>
                  <TableCell
                    sx={{
                      p: 2,
                      color: poll.yesPercentage >= 80 ? green[500] : red[500],
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                    }}
                  >
                    {poll.yesPercentage}%
                  </TableCell>
                  <TableCell sx={{ p: 2 }}>
                    {poll.noReasons.length > 0 ? (
                      <IconButton onClick={() => handleOpenDialog(poll.noReasons)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                    ) : (
                      <Typography sx={{ fontStyle: 'italic', color: blueGrey[600] }}>Geen Nee reacties</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog for viewing "Nee" reasons */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'primary.main' }}>
          Redenen voor "Nee" stem
          <IconButton onClick={handleCloseDialog} color="primary">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {selectedReasons.length > 0 ? (
              selectedReasons.map((reason, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                  <ReportProblemIcon color="error" sx={{ mr: 1 }} />
                  <Typography>{reason}</Typography>
                </Box>
              ))
            ) : (
              <Typography>Geen Nee reacties beschikbaar</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained" color="primary" sx={{ mx: 'auto' }}>
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PollResultsTable;
