// TaskAndPlanningAccordion.jsx
import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  useTheme,
  styled,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCreationForm from './TaskCreationForm';
import Planning from './Planning';

const StyledAccordion = styled(Accordion)(({ theme, bgcolor }) => ({
  boxShadow: theme.shadows[2],
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  '&:before': { display: 'none' },
  '& .MuiAccordionSummary-root': {
    backgroundColor: bgcolor,
    color: theme.palette.getContrastText(bgcolor),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.pxToRem(18),
    minHeight: 56,
    '& .MuiAccordionSummary-content': {
      margin: 0,
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.getContrastText(bgcolor),
    },
  },
  '& .MuiAccordionDetails-root': {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
}));

const TaskAndPlanningAccordion = () => {
  const theme = useTheme();
  const [expandedPanels, setExpandedPanels] = useState(['planning']); // Planning is open by default

  const handleChange = (panel) => (event, isExpanded) => {
    setExpandedPanels((prev) =>
      isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
    );
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        p: { xs: 2, md: 4 },
        bgcolor: 'background.default',
        overflowX: 'hidden', // Prevent horizontal scrolling
      }}
    >
      {/* Task Creation Accordion */}
      <StyledAccordion
        expanded={expandedPanels.includes('taskCreation')}
        onChange={handleChange('taskCreation')}
        bgcolor={theme.palette.primary.main}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="taskCreation-content"
          id="taskCreation-header"
        >
          <Typography variant="h6">
            Taak Creatie
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TaskCreationForm />
        </AccordionDetails>
      </StyledAccordion>

      {/* Planning Overview Accordion */}
      <StyledAccordion
        expanded={expandedPanels.includes('planning')}
        onChange={handleChange('planning')}
        bgcolor={theme.palette.secondary.main}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="planning-content"
          id="planning-header"
        >
          <Typography variant="h6">
            Planning Overzicht
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Planning />
        </AccordionDetails>
      </StyledAccordion>
    </Box>
  );
};

export default TaskAndPlanningAccordion;
