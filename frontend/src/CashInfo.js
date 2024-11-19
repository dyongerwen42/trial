import React, { useState, useEffect } from 'react';
import { TextField, Grid, Box, Typography, FormControl, InputLabel, FormHelperText } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Utility function to format numbers
const formatNumber = (value) => {
  if (!value) return value;
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const Kasinformatie = ({ cashInfo, setCashInfo, errors, calculateCurrentCash, getSaldoColor, globalElements }) => {
  const [localErrors, setLocalErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    if (!cashInfo.currentCash) newErrors.currentCash = 'Huidige kas is verplicht';
    if (!cashInfo.monthlyContribution) newErrors.monthlyContribution = 'Maandelijkse bijdrage is verplicht';
    if (!cashInfo.reserveDate) newErrors.reserveDate = 'Reserve datum is verplicht';
    if (!cashInfo.totalWorth) newErrors.totalWorth = 'Totale waarde is verplicht';
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validateFields();
  }, [cashInfo]);

  const handleInputChange = (field, value) => {
    const numericValue = value.replace(/\./g, ''); // Remove formatting dots for the actual value
    setCashInfo((prev) => ({ ...prev, [field]: numericValue }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [field]: null }));
  };

  const handleDateChange = (date) => {
    setCashInfo((prev) => ({ ...prev, reserveDate: date }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, reserveDate: null }));
  };

  useEffect(() => {
    calculateCurrentCash(cashInfo, globalElements);
  }, [cashInfo, globalElements, calculateCurrentCash]);

  return (
    <Box component="section" sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
        Kasinformatie
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="text" // Set to "text" to allow formatting with dots
            label="Huidige kas"
            placeholder="Voer huidige kas in"
            variant="outlined"
            value={formatNumber(cashInfo.currentCash)}
            onChange={(e) => handleInputChange('currentCash', e.target.value)}
            error={!!localErrors.currentCash}
            helperText={localErrors.currentCash}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="text" // Set to "text" to allow formatting with dots
            label="Maandelijkse bijdrage"
            placeholder="Voer maandelijkse bijdrage in"
            variant="outlined"
            value={formatNumber(cashInfo.monthlyContribution)}
            onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
            error={!!localErrors.monthlyContribution}
            helperText={localErrors.monthlyContribution}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel shrink>Reserve datum</InputLabel>
            <DatePicker
              selected={cashInfo.reserveDate ? new Date(cashInfo.reserveDate) : null}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              customInput={<TextField fullWidth variant="outlined" />}
              placeholderText="Selecteer reserve datum"
            />
            {localErrors.reserveDate && <FormHelperText error>{localErrors.reserveDate}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="text" // Set to "text" to allow formatting with dots
            label="Totale waarde"
            placeholder="Voer totale waarde in"
            variant="outlined"
            value={formatNumber(cashInfo.totalWorth)}
            onChange={(e) => handleInputChange('totalWorth', e.target.value)}
            error={!!localErrors.totalWorth}
            helperText={localErrors.totalWorth}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Kasinformatie;
