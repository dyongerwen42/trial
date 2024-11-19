import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const TaskAndPlanningAccordion = () => {
  const [expandedPanels, setExpandedPanels] = useState(['planning']); // Planning is open by default

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedPanels((prev) =>
      isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
    );
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 4, bgcolor: 'background.default' }}>
      

      <Card
        sx={{
          boxShadow: 4,
          borderRadius: 2,
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        {/* Task Creation Accordion */}
        <Accordion
          expanded={expandedPanels.includes('taskCreation')}
          onChange={handleChange('taskCreation')}
          sx={{
            boxShadow: 3,
            borderRadius: 1,
            mb: 2,
            transition: 'all 0.3s ease-in-out',
            '&:before': { display: 'none' }, // Remove default MuiAccordion background line
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              bgcolor: 'primary.main',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              py: 1.5,
              '& .MuiAccordionSummary-content': {
                my: 1,
                color: '#ffffff', // White text for readability
              },
            }}
          >
            <Typography variant="subtitle1">Taak Creatie</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <TaskCreationForm />
          </AccordionDetails>
        </Accordion>



        {/* Planning Overview Accordion */}
        <Accordion
          expanded={expandedPanels.includes('planning')}
          onChange={handleChange('planning')}
          sx={{
            boxShadow: 3,
            borderRadius: 1,
            mb: 2,
            transition: 'all 0.3s ease-in-out',
            '&:before': { display: 'none' }, // Remove default MuiAccordion background line
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
            sx={{
              bgcolor: 'secondary.main',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              py: 1.5,
              '& .MuiAccordionSummary-content': {
                my: 1,
                color: '#ffffff', // White text for readability
              },
            }}
          >
            <Typography variant="subtitle1">Planning Overzicht</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 3,
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Planning />
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default TaskAndPlanningAccordion;