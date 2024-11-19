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
          borderRadius: 2,
          width: '100%',
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
            boxShadow: 1,
            borderRadius: 1,
            mb: 2,
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.contrastText' }} />}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 'medium',
              fontSize: '1rem',
              py: 1,
              px: 2,
              minHeight: '40px',
              '& .MuiAccordionSummary-content': {
                margin: 0,
              },
            }}
          >
            <Typography variant="subtitle1" sx={{ color: 'primary.contrastText' }}>
              Taak Creatie
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.05)',
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
            boxShadow: 1,
            borderRadius: 1,
            mb: 2,
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.contrastText' }} />}
            sx={{
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              fontWeight: 'medium',
              fontSize: '1rem',
              py: 1,
              px: 2,
              minHeight: '40px',
              '& .MuiAccordionSummary-content': {
                margin: 0,
              },
            }}
          >
            <Typography variant="subtitle1" sx={{ color: 'secondary.contrastText' }}>
              Planning Overzicht
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              boxShadow: 'inset 0px 0px 5px rgba(0, 0, 0, 0.05)',
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
