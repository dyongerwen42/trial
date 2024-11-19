import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expanded, setExpanded] = useState('taskCreation'); // Default to Task Creation expanded

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ width: '100%', backgroundColor: 'secondary.light', minHeight: '100vh', p: 4 }}>
      {/* Header Section */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
        Maintenance & Planning Dashboard
      </Typography>
      <Typography variant="body1" color="primary.main" sx={{ mb: 4, textAlign: 'center' }}>
        Efficiently manage tasks and view planning schedules with ease.
      </Typography>

      <Card
        sx={{
          boxShadow: 6,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          minWidth: { xs: '100%', sm: '80%', md: '70%' },
          mx: 'auto',
          p: 2,
        }}
      >
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
            expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.main' }} />}
            sx={{
              backgroundColor: 'primary.main',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Task Creation</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: 'secondary.light', p: 3, borderRadius: 2 }}>
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>

        {/* Planning Section (always open) */}
        <Accordion expanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              backgroundColor: 'secondary.main',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              '& .MuiAccordionSummary-content': { my: 1 },
            }}
          >
            <Typography>Planning Overview</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: 'primary.light', p: 3, borderRadius: 2 }}>
            <Planning />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
