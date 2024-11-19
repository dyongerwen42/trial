import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Grid, Box, Typography, Button, IconButton, Divider } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import { useMjopContext } from './MjopContext'; // Import the context hook

const AlgemeneInformatie = ({ generalInfo, setGeneralInfo, errors }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const { saveData } = useMjopContext(); // Access saveData from context

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
    <Box overflow="auto" component="section" sx={{ mt: 4, p: 3, borderRadius: '8px', position: 'relative' }}>
      {/* Save IconButton in the Top-Right Corner */}
      <IconButton
        onClick={saveData}
        color="primary"
        sx={{ position: 'absolute', top: 16, right: 16 }}
      >
        <SaveIcon />
      </IconButton>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
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
          <Typography variant="h6" gutterBottom>
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
          <Typography variant="h6" gutterBottom>
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
          <Typography variant="h6" gutterBottom>
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
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" component="label" sx={{ display: 'block', mb: 1 }}>
          Afbeelding van het pand
        </Typography>
        <Button variant="contained" component="label" sx={{ mb: 2 }}>
          Uploaden
          <input
            type="file"
            hidden
            onChange={handleImageUpload}
          />
        </Button>
        {imagePreview && (
          <Box sx={{ mt: 2, position: 'relative', display: 'inline-block' }}>
            <Box display="flex"  mt={1}>
              <IconButton
                size="small"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imagePreview;
                  link.download = `pand-afbeelding`;
                  link.click();
                }}
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleClearImage}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
            <img
              src={imagePreview}
              alt="Pand"
              style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }}
            />
            
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AlgemeneInformatie;
