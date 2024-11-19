import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expanded, setExpanded] = useState('planning'); // Planning by default open

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f4f6f9', minHeight: '100vh', p: 4 }}>
      {/* Header Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Onderhoud & Planning Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4, textAlign: 'center' }}>
        Beheer taken en bekijk planningsschema's in een overzichtelijke indeling.
      </Typography>

      <Card
        sx={{
          boxShadow: 5,
          borderRadius: 2,
          backgroundColor: '#ffffff',
          width: { xs: '100%', sm: '80%', md: '70%' },
          mx: 'auto',
        }}
      >
        {/* Task Creation Accordion (Initially Closed) */}
        <Accordion
          expanded={expanded === 'taskCreation'}
          onChange={handleChange('taskCreation')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 2, mb: 2 },
            '&.Mui-expanded': { mt: 1 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#005bb5' }} />}
            sx={{
              backgroundColor: '#005bb5',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Taak Creatie</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: '#f0f3f7', p: 3, borderRadius: 1 }}>
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>

        {/* Planning Accordion (Always Open by Default) */}
        <Accordion
          expanded={expanded === 'planning'}
          onChange={handleChange('planning')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 2, mb: 2 },
            '&.Mui-expanded': { mt: 1 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#005bb5' }} />}
            sx={{
              backgroundColor: '#0073e6',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Planning Overzicht</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: '#f0f3f7', p: 3, borderRadius: 1 }}>
            <Planning />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
