import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Card
} from '@mui/material';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import DoneIcon from '@mui/icons-material/Done';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download'; // Added Download Icon

const Poll = () => {
  const [vote, setVote] = useState('');
  const [openReasonDialog, setOpenReasonDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Handle the vote selection
  const handleVoteChange = (event) => {
    setVote(event.target.value);

    if (event.target.value === 'Nee') {
      setOpenReasonDialog(true);
    }
  };

  // Handle submission of the reason when "Nee" is selected
  const handleReasonSubmit = () => {
    setOpenReasonDialog(false);
    setSubmitted(true);
  };

  // Handle the final vote submission
  const handleSubmitVote = () => {
    if (vote === 'Nee' && !reason) {
      setOpenReasonDialog(true);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Card
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
          maxWidth: '800px', // Adjusted for longer context questions
          mx: 'auto',
          bgcolor: 'background.default',
          textAlign: 'left', // Improved text alignment for long-form context
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Bent u het eens met deze offerte voor het schilderwerk van de buitenkant van het pand? Gelieve het bijgevoegde document te downloaden voor meer details.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Context: De offerte betreft de volledige schilderwerkzaamheden aan de buitenkant van het gebouw, inclusief ramen, deuren, en de gevel. U kunt het document downloaden om de details van de werkzaamheden, de kosten, en de planning te bekijken voordat u uw stem uitbrengt.
        </Typography>

        {/* Download Offer Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          sx={{ mb: 3, fontWeight: 'bold', py: 1.5 }}
          href="/path/to/your/offer.pdf" // Replace with the actual path to the PDF
          download="offerte.pdf"
        >
          Download de Offerte
        </Button>

        {/* Voting Options */}
        <Stack direction="row" justifyContent="center" spacing={4} sx={{ mb: 3 }}>
          <Button
            variant={vote === 'Ja' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => handleVoteChange({ target: { value: 'Ja' } })}
            startIcon={<ThumbUpAltIcon />}
            sx={{ width: '150px', height: '50px', fontSize: '1.2rem' }}
          >
            Ja
          </Button>

          <Button
            variant={vote === 'Nee' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => handleVoteChange({ target: { value: 'Nee' } })}
            startIcon={<ThumbDownAltIcon />}
            sx={{ width: '150px', height: '50px', fontSize: '1.2rem' }}
          >
            Nee
          </Button>
        </Stack>

        {/* Submit Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmitVote}
          startIcon={<DoneIcon />}
          disabled={submitted}
          sx={{ px: 4, py: 2, fontSize: '1rem', fontWeight: 'bold' }}
        >
          {submitted ? 'Ingediend' : 'Stem versturen'}
        </Button>

        {/* Thank You Message */}
        {submitted && (
          <Typography variant="body1" sx={{ mt: 3, color: 'success.main', fontWeight: 'bold' }}>
            Bedankt voor uw stem!
          </Typography>
        )}
      </Card>

      {/* Reason Dialog for "Nee" Vote */}
      <Dialog open={openReasonDialog} onClose={() => setOpenReasonDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Reden voor "Nee" stem</Typography>
          <IconButton onClick={() => setOpenReasonDialog(false)} color="primary">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Waarom bent u het niet eens met de offerte?"
            multiline
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
            placeholder="Geef alstublieft gedetailleerd uw reden..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleReasonSubmit}
            variant="contained"
            color="error"
            startIcon={<ReportProblemIcon />}
            sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            Reden versturen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Poll;
