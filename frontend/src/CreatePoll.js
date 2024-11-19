import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Card, Avatar
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PollIcon from '@mui/icons-material/Poll';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.15)',
  maxWidth: '700px',
  margin: 'auto',
  backgroundColor: theme.palette.background.default,
}));

const CreatePoll = () => {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollFile, setPollFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const handlePollFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPollFile(file);
      setFileName(file.name);
    }
  };

  const handlePollCreation = () => {
    if (pollQuestion && pollFile) {
      setOpenDialog(true);
    } else {
      alert('Vul alstublieft een vraag in en upload een bijlage.');
    }
  };

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      {/* Header Section */}
      <Avatar
        sx={{
          bgcolor: 'primary.main',
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 3,
        }}
      >
        <PollIcon sx={{ fontSize: 48 }} />
      </Avatar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Nieuwe Poll Aanmaken
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Voeg een nieuwe vraag toe en upload een bijlage om aan te geven waarover gestemd moet worden.
      </Typography>

      <StyledCard>
        <Stack spacing={4}>
          {/* Poll Question TextArea */}
          <TextField
            label="Poll Vraag"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Bijvoorbeeld: Bent u het eens met het voorstel voor het schilderen van de buitenkant?"
            sx={{
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* File Upload */}
          <Button
            variant="contained"
            component="label"
            color="primary"
            startIcon={<UploadFileIcon />}
            sx={{
              py: 2,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: 'primary.main',
            }}
          >
            Upload Bijlage
            <input type="file" hidden onChange={handlePollFileUpload} />
          </Button>

          {fileName && (
            <Typography variant="body2" color="textSecondary">
              Geüpload bestand: {fileName}
            </Typography>
          )}

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            sx={{ py: 2, fontSize: '1rem', fontWeight: 'bold' }}
            onClick={handlePollCreation}
          >
            Poll Aanmaken
          </Button>
        </Stack>
      </StyledCard>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Poll Succesvol Aangemaakt</Typography>
          <IconButton onClick={() => setOpenDialog(false)} color="primary">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="body1">
            Uw poll met de vraag: <strong>{pollQuestion}</strong> is succesvol aangemaakt en de bijlage is toegevoegd.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} variant="contained" color="primary">
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreatePoll;
