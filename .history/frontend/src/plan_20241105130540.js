import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expanded, setExpanded] = useState('planning'); // Default to Planning expanded

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: '#f4f6f9', minHeight: '100vh', p: 4 }}>
      {/* Header Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Maintenance & Planning Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Manage tasks and view planning schedules in a convenient accordion layout.
      </Typography>

      <Card
        sx={{
          boxShadow: 5,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          minWidth: { xs: '100%', sm: '80%', md: '70%' },
          mx: 'auto',
        }}
      >
        {/* Planning Accordion */}
        <Accordion
          expanded={expanded === 'planning'}
          onChange={handleChange('planning')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 3, mb: 2 },
            '&.Mui-expanded': { mt: 2 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#0073e6' }} />}
            sx={{
              backgroundColor: '#0073e6',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Planning Overview</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: '#f3f6fb', p: 3, borderRadius: 2 }}>
            <Planning />
          </AccordionDetails>
        </Accordion>

        {/* Task Creation Accordion */}
        <Accordion
          expanded={expanded === 'taskCreation'}
          onChange={handleChange('taskCreation')}
          sx={{
            '&.MuiAccordion-root': { boxShadow: 3, mb: 2 },
            '&.Mui-expanded': { mt: 2 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#0073e6' }} />}
            sx={{
              backgroundColor: '#555',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Task Creation</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: '#f3f6fb', p: 3, borderRadius: 2 }}>
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
