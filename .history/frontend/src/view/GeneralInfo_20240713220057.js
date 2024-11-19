import React from 'react';
import { Typography, Grid, Divider } from '@mui/material';

const GeneralInfo = ({ generalInfo }) => {
  if (!generalInfo) return null;

  const {
    projectNumber,
    projectName,
    address,
    contactPersonName,
    contactPersonEmail,
    contactPersonPhone,
    beheerderNaam,
    beheerderAdres,
    beheerderPostcode,
    beheerderPlaats,
    beheerderTelefoon,
    beheerderEmail,
    opmerkingen,
    propertyImage
  } = generalInfo;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: 'auto', backgroundColor: 'inherit', borderRadius: '8px' }}>
      <Typography variant="h4" gutterBottom style={{ textAlign: 'center', marginBottom: '32px', color: 'inherit', fontWeight: 'bold' }}>
        Algemene Informatie
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <div>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' }}>
              Project Details
            </Typography>
            <Divider style={{ marginBottom: '16px' }} />
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Projectnummer:</strong> {projectNumber}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Projectnaam:</strong> {projectName}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Adres:</strong> {address}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12} sm={6}>
          <div>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' }}>
              VVE Contactpersoon
            </Typography>
            <Divider style={{ marginBottom: '16px' }} />
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Naam:</strong> {contactPersonName}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Email:</strong> {contactPersonEmail}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Telefoon:</strong> {contactPersonPhone}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12} sm={6}>
          <div>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' }}>
              VVE Beheerder
            </Typography>
            <Divider style={{ marginBottom: '16px' }} />
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Naam:</strong> {beheerderNaam}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Adres:</strong> {beheerderAdres}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Postcode:</strong> {beheerderPostcode}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Plaats:</strong> {beheerderPlaats}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Telefoon:</strong> {beheerderTelefoon}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              <strong>Email:</strong> {beheerderEmail}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' }}>
              Opmerkingen
            </Typography>
            <Divider style={{ marginBottom: '16px' }} />
            <Typography variant="body1">{opmerkingen}</Typography>
          </div>
        </Grid>
      </Grid>
      {propertyImage && (
        <>
          <Divider style={{ margin: '24px 0' }} />
          <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' }}>
            Eigendomsfoto
          </Typography>
          <img
            src={`http://localhost:5000/${propertyImage}`}
            alt="Eigendom"
            style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginTop: '16px' }}
          />
        </>
      )}
    </div>
  );
};

export default GeneralInfo;
