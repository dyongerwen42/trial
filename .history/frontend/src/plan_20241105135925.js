import React, { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography, Card } from '@mui/material';
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
          borderRadius: 3,
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          bgcolor: 'background.paper',
          p: 2,
        }}
      >
        {/* Task Creation Accordion */}
        <Accordion
          expanded={expandedPanels.includes('taskCreation')}
          onChange={handleChange('taskCreation')}
          sx={{
            boxShadow: 2,
            borderRadius: 1,
            mb: 2,
            transition: 'all 0.3s ease-in-out',
            '&:before': { display: 'none' }, // Remove default MuiAccordion background line
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.contrastText' }} />}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              py: 1.5,
              '& .MuiAccordionSummary-content': {
                my: 1,
              },
            }}
          >
            <Typography variant="h6" sx={{ color: 'primary.contrastText' }}>Taak Creatie</Typography>
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
            boxShadow: 2,
            borderRadius: 1,
            mb: 2,
            transition: 'all 0.3s ease-in-out',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.contrastText' }} />}
            sx={{
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              py: 1.5,
              '& .MuiAccordionSummary-content': {
                my: 1,
              },
            }}
          >
            <Typography variant="h6" sx={{ color: 'secondary.contrastText' }}>Planning Overzicht</Typography>
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
