import React, { useState } from 'react';
import {
  Box, Typography, Card, Chip, ListItemText, IconButton, Tooltip, Grid, Avatar, Badge, Button, TextField, FormControl, InputLabel, MenuItem, Select, Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DoneIcon from '@mui/icons-material/Done';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { red, orange, green, grey } from '@mui/material/colors';

// Initial data for observations (constateringen)
const complaintsData = [
    {
      id: 1,
      title: 'Schimmel in trappenhuis',
      description: 'Er is een grote schimmelplek op het plafond van het trappenhuis.',
      status: 'Open',
      category: 'Onderhoud',
      priority: 'Hoog',
      avatar: 'S',
      responses: ['We hebben een schoonmaakbedrijf ingeschakeld.', 'Inspectie wordt deze week uitgevoerd.'],
      response: ''
    },
    {
      id: 2,
      title: 'Kapotte lift',
      description: 'De lift in het gebouw werkt sinds gisteren niet meer.',
      status: 'In behandeling',
      category: 'Veiligheid',
      priority: 'Middel',
      avatar: 'L',
      responses: ['Monteur komt morgen langs.', 'Onderdeel is besteld.'],
      response: ''
    },
    {
      id: 3,
      title: 'Waterlekkage in parkeergarage',
      description: 'Er is waterlekkage in de parkeergarage, nabij de ingang.',
      status: 'Open',
      category: 'Wateroverlast',
      priority: 'Hoog',
      avatar: 'W',
      responses: ['We wachten op goedkeuring voor reparatie.'],
      response: ''
    },
];

// Function for priority colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Hoog':
      return red[500];
    case 'Middel':
      return orange[500];
    case 'Laag':
      return grey[500];
    default:
      return 'default';
  }
};

// Function for status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'Open':
      return red[500];
    case 'In behandeling':
      return orange[500];
    case 'Afgehandeld':
      return green[500];
    default:
      return grey[500];
  }
};

const ComplaintsBoard = () => {
  const [observations, setObservations] = useState(complaintsData);
  const [newObservation, setNewObservation] = useState({
    title: '',
    description: '',
    priority: '',
    category: '',
    status: 'Open',
    avatar: '',
    response: '',
  });

  // Handle form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewObservation({ ...newObservation, [name]: value });
  };

  // Handle response change
  const handleResponseChange = (e, id) => {
    const { value } = e.target;
    setObservations(observations.map(observation => observation.id === id ? { ...observation, response: value } : observation));
  };

  // Add a new observation
  const handleSubmit = (e) => {
    e.preventDefault();
    const newObservationWithId = {
      ...newObservation,
      id: observations.length + 1,
      avatar: newObservation.title.charAt(0).toUpperCase(), // Auto-generate avatar
      responses: [],
    };
    setObservations([...observations, newObservationWithId]);
    setNewObservation({
      title: '',
      description: '',
      priority: '',
      category: '',
      status: 'Open',
      avatar: '',
      response: '',
    });
  };

  // Handle response submit
  const handleResponseSubmit = (id) => {
    setObservations(observations.map(observation => {
      if (observation.id === id) {
        return {
          ...observation,
          responses: [...observation.responses, observation.response],
          response: '', // Clear the input after submission
        };
      }
      return observation;
    }));
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Card
        sx={{
          p: 5,
          borderRadius: 3,
          boxShadow: '0px 12px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '1200px',
          mx: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center', color: 'primary.main' }}>
          Bewonersconstateringen & Ideeën Bord
        </Typography>

        {/* Observation Submission Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, p: 4, borderRadius: 3, bgcolor: '#f9fafb' }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Nieuwe constatering toevoegen:</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Titel"
                name="title"
                value={newObservation.title}
                onChange={handleInputChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prioriteit</InputLabel>
                <Select
                  name="priority"
                  value={newObservation.priority}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="Hoog">Hoog</MenuItem>
                  <MenuItem value="Middel">Middel</MenuItem>
                  <MenuItem value="Laag">Laag</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschrijving"
                name="description"
                value={newObservation.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categorie</InputLabel>
                <Select
                  name="category"
                  value={newObservation.category}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="Onderhoud">Onderhoud</MenuItem>
                  <MenuItem value="Veiligheid">Veiligheid</MenuItem>
                  <MenuItem value="Wateroverlast">Wateroverlast</MenuItem>
                  <MenuItem value="Schoonmaak">Schoonmaak</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 4, fontWeight: 'bold', display: 'block', mx: 'auto' }}>
            Constatering Toevoegen
          </Button>
        </Box>

        {/* Observations List */}
        <Grid container spacing={3}>
          {observations.map((observation) => (
            <Grid item xs={12} key={observation.id}>
              <Card
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': { transform: 'scale(1.03)' },
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={<PriorityHighIcon sx={{ color: getPriorityColor(observation.priority), fontSize: 16 }} />}
                    >
                      <Avatar
                        sx={{ bgcolor: getPriorityColor(observation.priority), width: 60, height: 60, fontSize: 24, fontWeight: 'bold' }}
                      >
                        {observation.avatar}
                      </Avatar>
                    </Badge>
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', mb: 0.5 }}>
                          {observation.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {observation.description}
                          </Typography>
                          <Chip label={observation.category} sx={{ mr: 1, backgroundColor: '#e0f7fa' }} />
                          <Chip label={`Prioriteit: ${observation.priority}`} sx={{ color: getPriorityColor(observation.priority) }} />
                        </>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                    <Chip
                      icon={<ReportProblemIcon />}
                      label={observation.status}
                      sx={{
                        backgroundColor: getStatusColor(observation.status),
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        mb: 1,
                      }}
                    />
                    <Tooltip title="Bekijk details">
                      <IconButton color="primary" sx={{ ml: 1 }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>

                {/* Divider */}
                <Divider sx={{ mt: 2, mb: 2 }} />

                {/* Existing Responses */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Antwoorden:</Typography>
                  {observation.responses.length > 0 ? (
                    observation.responses.map((response, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2, borderLeft: '4px solid #e0f7fa' }}>
                        {response}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Nog geen antwoorden.
                    </Typography>
                  )}
                </Box>

                {/* Response Input */}
                {observation.status !== 'Afgehandeld' && (
                  <>
                    <TextField
                      label="Antwoord"
                      value={observation.response}
                      onChange={(e) => handleResponseChange(e, observation.id)}
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleResponseSubmit(observation.id)}
                      sx={{ mb: 2 }}
                    >
                      Antwoord Verzenden
                    </Button>
                  </>
                )}

                {observation.status === 'Afgehandeld' && (
                  <IconButton color="success" sx={{ mt: 1 }}>
                    <DoneIcon />
                  </IconButton>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default ComplaintsBoard;
