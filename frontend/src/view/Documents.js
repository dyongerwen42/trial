import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const Documents = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Documents
      </Typography>
      <List>
        {/* Example list items */}
        <ListItem>
          <ListItemText primary="Document 1" secondary="Description 1" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Document 2" secondary="Description 2" />
        </ListItem>
      </List>
    </Box>
  );
};

export default Documents;
