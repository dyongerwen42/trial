import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/system';

const SidebarContainer = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: 360,
  minWidth: 280,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
  padding: theme.spacing(2),
  boxSizing: 'border-box',
}));

const StyledList = styled(List)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  transition: 'background-color 0.3s',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
}));

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: theme.typography.fontWeightMedium,
  color: theme.palette.text.primary,
}));

const Sidebar = ({ sections, onSelect, selectedSection }) => (
  <SidebarContainer>
    <StyledList>
      {sections.map((section) => (
        <StyledListItem
          button
          key={section}
          onClick={() => onSelect(section)}
          selected={selectedSection === section}
        >
          <StyledListItemText primary={section} />
        </StyledListItem>
      ))}
    </StyledList>
  </SidebarContainer>
);

export default Sidebar;
