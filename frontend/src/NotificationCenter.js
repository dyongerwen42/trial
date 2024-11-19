import React, { useState } from 'react';
import { Box, Typography, Card, Avatar, IconButton, Collapse, Button } from '@mui/material';
import { Error, Warning, Info, CheckCircle, Close } from '@mui/icons-material';
import { styled } from '@mui/system';

const initialNotifications = [
    {
      id: 1,
      type: 'error',
      message: 'Luchtbehandeling inspectie is verlopen!',
      date: '2024-09-10',
      timestamp: '10 min geleden',
    },
    {
      id: 2,
      type: 'warning',
      message: 'De inspectie van het dak komt binnenkort, gepland op 2024-09-25.',
      date: '2024-09-18',
      timestamp: '1 uur geleden',
    },
    {
      id: 3,
      type: 'info',
      message: 'Nieuwe inspectie rapporten zijn beschikbaar voor uw beoordeling.',
      date: '2024-09-15',
      timestamp: '2 dagen geleden',
    },
    {
      id: 4,
      type: 'error',
      message: 'Er is een probleem met de elektrische installatie in gebouw A.',
      date: '2024-09-14',
      timestamp: '3 dagen geleden',
    },
    {
      id: 5,
      type: 'warning',
      message: 'De keuring van de nooduitgangen moet binnenkort worden ingepland.',
      date: '2024-09-13',
      timestamp: '4 dagen geleden',
    },
    {
      id: 6,
      type: 'info',
      message: 'Het MJOP-plan is bijgewerkt met nieuwe onderhoudsdetails.',
      date: '2024-09-12',
      timestamp: '5 dagen geleden',
    },
    {
      id: 7,
      type: 'info',
      message: 'Een nieuwe offerte voor dakonderhoud is beschikbaar voor review.',
      date: '2024-09-11',
      timestamp: '6 dagen geleden',
    },
    {
      id: 8,
      type: 'error',
      message: 'Waterlekkage gemeld op de derde verdieping, actie vereist.',
      date: '2024-09-10',
      timestamp: '7 dagen geleden',
    },
    {
      id: 9,
      type: 'warning',
      message: 'De brandblusserinspectie moet worden ingepland.',
      date: '2024-09-09',
      timestamp: '1 week geleden',
    },
    {
      id: 10,
      type: 'info',
      message: 'Er is een nieuwe serviceaanvraag ingediend voor de lift.',
      date: '2024-09-08',
      timestamp: '1 week geleden',
    },
    {
      id: 11,
      type: 'error',
      message: 'Storingsmelding ontvangen voor verwarming in gebouw B.',
      date: '2024-09-07',
      timestamp: '1 week geleden',
    },
    {
      id: 12,
      type: 'info',
      message: 'Gebruiker heeft een verzoek ingediend om een nieuwe inspectie uit te voeren.',
      date: '2024-09-06',
      timestamp: '2 weken geleden',
    },
    {
      id: 13,
      type: 'warning',
      message: 'De inspectie van het beveiligingssysteem moet binnenkort worden ingepland.',
      date: '2024-09-05',
      timestamp: '2 weken geleden',
    },
    {
      id: 14,
      type: 'error',
      message: 'Oververhitting gemeld in technische ruimte, dringend onderzoek vereist.',
      date: '2024-09-04',
      timestamp: '2 weken geleden',
    },
    {
      id: 15,
      type: 'info',
      message: 'Het jaarlijkse onderhoudsrapport is voltooid en kan worden bekeken.',
      date: '2024-09-03',
      timestamp: '2 weken geleden',
    },
  ];
  

// Styled component for icon container
const IconContainer = styled(Avatar)(({ theme, type }) => ({
  background: type === 'error' ? 'linear-gradient(135deg, #ff1744, #d50000)' :
              type === 'warning' ? 'linear-gradient(135deg, #ff9100, #ff6d00)' :
              'linear-gradient(135deg, #2979ff, #2962ff)',
  color: '#fff',
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
}));

const glassEffect = {
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleDismiss = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleDismissAll = () => {
    setNotifications([]);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Meldingen
      </Typography>
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <Collapse key={notification.id} in={true} timeout="auto">
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                p: 2,
                ...glassEffect,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                '&:hover': { boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)' },
              }}
            >
              <IconContainer
                type={notification.type}
                sx={{ height: 48, width: 48, mr: 2 }}
              >
                {notification.type === 'error' && <Error />}
                {notification.type === 'warning' && <Warning />}
                {notification.type === 'info' && <Info />}
              </IconContainer>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                  {notification.message}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                  {notification.timestamp} - Datum: {notification.date}
                </Typography>
              </Box>
              <IconButton
                color="primary"
                onClick={() => handleDismiss(notification.id)}
                sx={{ ml: 1 }}
              >
                <CheckCircle fontSize="small" />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => handleDismiss(notification.id)}
                sx={{ ml: 1 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Card>
          </Collapse>
        ))
      ) : (
        <Typography variant="body2" color="textSecondary">
          Geen nieuwe meldingen.
        </Typography>
      )}
      {notifications.length > 0 && (
        <Button
          variant="outlined"
          color="primary"
          onClick={handleDismissAll}
          sx={{ mt: 2, display: 'block', mx: 'auto', fontSize: '0.85rem' }}
        >
          Verwijder Alle Meldingen
        </Button>
      )}
    </Box>
  );
};

export default NotificationCenter;
