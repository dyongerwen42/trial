// TaskSelectionDrawer.jsx

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';

const TaskSelectionDrawer = ({
  isDrawerOpen,
  setIsDrawerOpen,
  taskSearchQuery,
  handleTaskSearch,
  filteredTasks,
  selectedTasks,
  handleTaskSelect,
}) => (
  <Drawer anchor="right" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
    <Box sx={{ width: 400, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Beschikbare Taken
        </Typography>
        <IconButton onClick={() => setIsDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Zoek taken..."
        value={taskSearchQuery}
        onChange={handleTaskSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      {filteredTasks.length > 0 ? (
        <List>
          {filteredTasks.map((task, index) => {
            const isSelected = selectedTasks.some(
              (t) => t.beschrijving === task.beschrijving && t.category === task.category
            );
            return (
              <ListItem
                button
                key={index}
                onClick={() => handleTaskSelect(task)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  backgroundColor: isSelected ? '#e0f7fa' : 'inherit',
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleTaskSelect(task)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText
                  primary={task.beschrijving}
                  secondary={`Categorie: ${task.category}`}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
              </ListItem>
            );
          })}
        </List>
      ) : (
        <Typography variant="body1">Geen taken gevonden.</Typography>
      )}
    </Box>
  </Drawer>
);

export default TaskSelectionDrawer;
