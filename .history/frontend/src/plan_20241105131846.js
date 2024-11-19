import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expanded, setExpanded] = useState('planning'); // Planning standaard open

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: 'primary.light', minHeight: '100vh', p: 4 }}>
      {/* Header Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark', textAlign: 'center' }}>
        Onderhoud & Planning Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4, textAlign: 'center' }}>
        Beheer taken en bekijk planningsschema's in een overzichtelijke indeling.
      </Typography>

      <Card
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: 'secondary.light',
          width: '100%',
          mx: 'auto',
          maxWidth: { xs: '100%', sm: '90%', md: '80%' },
        }}
      >
        {/* Taak Creatie Accordion (Standaard gesloten) */}
        <Accordion
          expanded={expanded === 'taskCreation'}
          onChange={handleChange('taskCreation')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 2, mb: 2 },
            '&.Mui-expanded': { mt: 1 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              backgroundColor: 'primary.main',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Taak Creatie</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: 'secondary.light', p: 3, borderRadius: 1 }}>
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>

        {/* Planning Overzicht Accordion (Altijd open bij default) */}
        <Accordion
          expanded={expanded === 'planning'}
          onChange={handleChange('planning')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 2, mb: 2 },
            '&.Mui-expanded': { mt: 1 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              backgroundColor: 'primary.main',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Planning Overzicht</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: 'secondary.light', p: 3, borderRadius: 1 }}>
            <Planning />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
