import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expanded, setExpanded] = useState('planning'); // Planning open by default, Task Creation closed

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 6,
        px: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600, color: '#2e2e2e', textAlign: 'center', mb: 4 }}>
        Onderhoud & Planning Dashboard
      </Typography>

      <Card
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          width: '100vw',
          maxWidth: 1200,
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Planning Overzicht (Always Open by Default) */}
        <Accordion expanded={expanded === 'planning'}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#666' }} />}
            sx={{
              bgcolor: '#f7f7f8',
              color: '#333',
              fontWeight: 500,
              borderBottom: '1px solid #e0e0e0',
              '&.Mui-expanded': { minHeight: 48 },
              px: 3,
            }}
          >
            <Typography>Planning Overzicht</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#f9fafb', p: 3 }}>
            <Planning />
          </AccordionDetails>
        </Accordion>

        <Divider />

        {/* Task Creation (Initially Closed) */}
        <Accordion
          expanded={expanded === 'taakcreatie'}
          onChange={handleChange('taakcreatie')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 0 },
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#666' }} />}
            sx={{
              bgcolor: '#f7f7f8',
              color: '#333',
              fontWeight: 500,
              borderTop: '1px solid #e0e0e0',
              '&.Mui-expanded': { minHeight: 48 },
              px: 3,
            }}
          >
            <Typography>Taak Creatie</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#f9fafb', p: 3 }}>
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
