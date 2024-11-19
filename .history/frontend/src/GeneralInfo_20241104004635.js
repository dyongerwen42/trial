import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Grid, Box, Typography, Button, IconButton, Divider, Paper } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useMjopContext } from './MjopContext';

const AlgemeneInformatie = ({ generalInfo, setGeneralInfo, errors }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const { saveData } = useMjopContext();

  useEffect(() => {
    if (generalInfo.propertyImage) {
      setImagePreview(`http://localhost:5000/${generalInfo.propertyImage}`);
    } else {
      setImagePreview(null);
    }
  }, [generalInfo.propertyImage]);

  const handleClearImage = () => {
    setGeneralInfo({ propertyImage: null });
    setImagePreview(null);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('http://localhost:5000/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const filePath = response.data.filePath;
        setGeneralInfo({ propertyImage: filePath });
        setImagePreview(`http://localhost:5000/${filePath}`);
      } catch (error) {
        console.error('Fout bij het uploaden van bestand:', error);
      }
    }
  };

  return (
    <Box component="section" sx={{ mt: 4, p: 3, borderRadius: '8px', position: 'relative' }}>
      {/* Save IconButton in the Top-Right Corner */}
      <IconButton
        onClick={saveData}
        color="primary"
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'primary.main',
          color: '#fff',
          boxShadow: 2,
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <SaveIcon fontSize="medium" />
      </IconButton>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Projectdetails
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { key: 'projectNumber', label: 'Projectnummer' },
              { key: 'projectName', label: 'Projectnaam' },
              { key: 'address', label: 'Adres' },
            ].map(({ key, label }) => (
              <TextField
                key={key}
                fullWidth
                label={label}
                variant="outlined"
                value={generalInfo[key]}
                onChange={(e) => setGeneralInfo({ [key]: e.target.value })}
                error={!!errors[key]}
                helperText={errors[key]}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              VvE Contactpersoon
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { key: 'contactPersonName', label: 'Naam contactpersoon' },
              { key: 'contactPersonEmail', label: 'E-mail contactpersoon' },
              { key: 'contactPersonPhone', label: 'Telefoonnummer contactpersoon' },
            ].map(({ key, label }) => (
              <TextField
                key={key}
                fullWidth
                label={label}
                variant="outlined"
                value={generalInfo[key]}
                onChange={(e) => setGeneralInfo({ [key]: e.target.value })}
                error={!!errors[key]}
                helperText={errors[key]}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              VvE Beheerder
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { key: 'beheerderNaam', label: 'Naam beheerder' },
              { key: 'beheerderAdres', label: 'Adres beheerder' },
              { key: 'beheerderPostcode', label: 'Postcode beheerder' },
              { key: 'beheerderPlaats', label: 'Plaats beheerder' },
              { key: 'beheerderTelefoon', label: 'Telefoonnummer beheerder' },
              { key: 'beheerderEmail', label: 'E-mail beheerder' },
            ].map(({ key, label }) => (
              <TextField
                key={key}
                fullWidth
                label={label}
                variant="outlined"
                value={generalInfo[key]}
                onChange={(e) => setGeneralInfo({ [key]: e.target.value })}
                error={!!errors[key]}
                helperText={errors[key]}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            ))}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Opmerkingen
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              label="Opmerkingen"
              variant="outlined"
              value={generalInfo.opmerkingen}
              onChange={(e) => setGeneralInfo({ opmerkingen: e.target.value })}
              multiline
              minRows={3}
              error={!!errors.opmerkingen}
              helperText={errors.opmerkingen}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" component="label" sx={{ display: 'block', mb: 1 }}>
          Afbeelding van het pand
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
          sx={{
            mb: 2,
            bgcolor: 'secondary.main',
            color: '#fff',
            '&:hover': { bgcolor: 'secondary.dark' },
          }}
        >
          Uploaden
          <input type="file" hidden onChange={handleImageUpload} />
        </Button>
        {imagePreview && (
          <Box
            sx={{
              mt: 2,
              position: 'relative',
              display: 'inline-block',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 3,
              maxWidth: '100%',
            }}
          >
            <img
              src={imagePreview}
              alt="Pand"
              style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }}
            />
            <Box display="flex" justifyContent="center" mt={1}>
              <IconButton
                size="small"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imagePreview;
                  link.download = `pand-afbeelding`;
                  link.click();
                }}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                  ml: 1,
                }}
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleClearImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  color: 'error.main',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AlgemeneInformatie;
