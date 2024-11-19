import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Snackbar,
  IconButton,
  Divider,
  CssBaseline,
  Tabs,
  Tab,
} from "@mui/material";
import { Masonry } from "@mui/lab"; // Masonry component for advanced layout
import GeneralInfo from "./view/GeneralInfo";
import AlgemeneInformatie from "./GeneralInfo"; // Import the edit component
import { useMjopContext } from "./MjopContext";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import FolderIcon from "@mui/icons-material/Folder";
import NoteIcon from "@mui/icons-material/Note";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DescriptionIcon from "@mui/icons-material/Description";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TimelineIcon from "@mui/icons-material/Timeline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PolicyIcon from "@mui/icons-material/Policy";
import NatureIcon from "@mui/icons-material/Nature";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';


const MJOPDashboard = () => {
  const [activeTab, setActiveTab] = useState("alles");
  const [editMode, setEditMode] = useState(false); // State for edit mode toggle
  const { state, dispatch, saveData, setGeneralInfo } = useMjopContext(); // Use setGeneralInfo from context
  const navigate = useNavigate();

  const { generalInfo, errors, errorMessage } = state;
  console.log(generalInfo)
  const handleTabChange = (event, newTab) => setActiveTab(newTab);
  const toggleEditMode = () => setEditMode((prevMode) => !prevMode); // Toggle function for edit mode

  const sections = {
    alles: [
      {
        title: "MJOP",
        icon: <TimelineIcon />,
        items: [
          { label: "Plan taken", path: "/create-task" },
          { label: "Planning overzicht", path: "/planning" },
        ],
      },
      {
        title: "Onderhoudsmanagement",
        icon: <HomeRepairServiceIcon />,
        items: [{ label: "Kalender", path: "/calendar" }],
      },
      {
        title: "Inventarisatie",
        icon: <ListAltIcon />,
        items: [
          { label: "Ruimtes / Objecten", path: "/spaces" },
          { label: "Elementen", path: "/elements" },
          { label: "Levensduur overzicht", path: "/lifespan" },
        ],
      },
      {
        title: "Financieel",
        icon: <ReceiptLongIcon />,
        items: [
          { label: "Liquiditeitsprognose", path: "/cash-flow" },
          { label: "Facturen", path: "/invoices" },
          { label: "Begroting", path: "/budget" },
          { label: "Contracten", path: "/contracts" },
        ],
      },
      {
        title: "Verduurzaming",
        icon: <NatureIcon />,
        items: [
          { label: "Verduurzamings overzicht", path: "/sustainability-overview" },
          { label: "Verduurzamings management", path: "/sustainability-management" },
        ],
      },
      {
        title: "Inspecties",
        icon: <FactCheckIcon />,
        items: [
          { label: "Inspectie overzicht", path: "/inspection-overview" },
          { label: "Inspecties uitvoeren", path: "/perform-inspections" },
        ],
      },
      {
        title: "Condities",
        icon: <AssignmentIcon />,
        items: [
          { label: "Ruimtes / Objecten", path: "/condition-spaces" },
          { label: "Elementen", path: "/condition-elements" },
        ],
      },
      {
        title: "Meldingen",
        icon: <NotificationsIcon />,
        items: [
          { label: "Meldingen", path: "/notifications" },
          { label: "Melding doen", path: "/create-notification" },
        ],
      },
      {
        title: "Documenten",
        icon: <DescriptionIcon />,
        items: [{ label: "Documenten beheer", path: "/document-management" }],
      },
    ],
    overzichten: [
      {
        title: "MJOP",
        icon: <TimelineIcon />,
        items: [{ label: "Planning overzicht", path: "/planning" }],
      },
      {
        title: "Inspecties",
        icon: <FactCheckIcon />,
        items: [{ label: "Inspectie overzicht", path: "/inspection-overview" }],
      },
      {
        title: "Condities",
        icon: <AssignmentIcon />,
        items: [
          { label: "Ruimtes / Objecten", path: "/condition-spaces" },
          { label: "Elementen", path: "/condition-elements" },
        ],
      },
      {
        title: "Financieel",
        icon: <ReceiptLongIcon />,
        items: [
          { label: "Liquiditeitsprognose", path: "/cash-flow" },
          { label: "Facturen", path: "/invoices" },
          { label: "Begroting", path: "/budget" },
        ],
      },
      {
        title: "Verduurzaming",
        icon: <NatureIcon />,
        items: [{ label: "Verduurzamings overzicht", path: "/sustainability-overview" }],
      },
      {
        title: "Documenten",
        icon: <DescriptionIcon />,
        items: [{ label: "Documenten beheer", path: "/document-management" }],
      },
    ],
    beheer: [
      {
        title: "MJOP",
        icon: <TimelineIcon />,
        items: [
          { label: "Plan taken", path: "/create-task" },
          { label: "Planning table", path: "/planning-table" },
        ],
      },
      {
        title: "Inventarisatie",
        icon: <ListAltIcon />,
        items: [
          { label: "Ruimtes / Objecten", path: "/spaces" },
          { label: "Elementen", path: "/elements" },
          { label: "Levensduur overzicht", path: "/lifespan" },
        ],
      },
      {
        title: "Onderhoudsmanagement",
        icon: <HomeRepairServiceIcon />,
        items: [
          { label: "Kanban bord planning", path: "/kanban-board" },
          { label: "Planning table", path: "/planning-table" },
        ],
      },
      {
        title: "Verduurzaming",
        icon: <NatureIcon />,
        items: [{ label: "Verduurzamings management", path: "/sustainability-management" }],
      },
      {
        title: "Financieel",
        icon: <PolicyIcon />,
        items: [{ label: "Contracten beheer", path: "/contract-management" }],
      },
    ],
  };

  const handleCloseSnackbar = () => {
    dispatch({ type: "SET_ERROR_MESSAGE", payload: "" });
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          width: "95vw",
          minHeight: "100vh",
          overflowX: "hidden",
          backgroundColor: "#f3f6fa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 4,
        }}
      >
        <Grid container spacing={3} sx={{ width: "100%", m: 0, p: 0 }}>
          {/* Left side: General Information or Edit Mode */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                boxShadow: 3,
                p: 3,
                height: "100%",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
              }}
            >
   <div>
      <IconButton
        onClick={toggleEditMode}
        sx={{
          mb: 2,
          bgcolor: 'transparent', // No background
          color: 'primary.main', // Icon color
          '&:hover': {
            bgcolor: 'transparent', // Maintain transparent background on hover
            color: 'secondary.main', // Optional: Change color on hover
          },
        }}
        aria-label={editMode ? "Switch to view mode" : "Switch to edit mode"}
      >
        {editMode ? <VisibilityIcon /> : <EditIcon />}
      </IconButton>
    </div>


              {editMode ? (
                <AlgemeneInformatie
                  generalInfo={generalInfo}
                  setGeneralInfo={setGeneralInfo} // Use setGeneralInfo from context directly
                  errors={errors}
                />
              ) : (
                <GeneralInfo generalInfo={generalInfo} />
              )}
            </Card>
          </Grid>
  
          {/* Right side: Sections Grid (50%) with Tabs for Filters */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3, width: "100%" }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                centered
                variant="fullWidth"
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "capitalize",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    color: "primary.main",
                    transition: "color 0.3s",
                  },
                  "& .Mui-selected": {
                    color: "#1976d2",
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#1976d2",
                    height: 3,
                  },
                }}
              >
                <Tab label="Alles" value="alles" />
                <Tab label="Overzichten" value="overzichten" />
                <Tab label="Beheer" value="beheer" />
              </Tabs>
            </Box>
  
            <Masonry columns={{ xs: 1, sm: 2 }} spacing={2} sx={{ width: "100%" }}>
              {sections[activeTab].map((section) => (
                <Card
                  key={section.title}
                  sx={{
                    boxShadow: 4,
                    borderRadius: "12px",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                    backgroundColor: "#ffffff",
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      {section.icon}
                      <Typography
                        variant="h6"
                        sx={{
                          ml: 1,
                          fontWeight: "bold",
                          color: "#333",
                          fontSize: "1.1rem",
                        }}
                      >
                        {section.title}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    {section.items.map((item) => (
                      <Typography
                        key={item.label}
                        variant="body2"
                        sx={{
                          my: 0.5,
                          display: "block",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          color: "primary.main",
                          cursor: "pointer",
                          transition: "background-color 0.3s, color 0.3s",
                          "&:hover": {
                            backgroundColor: "#f0f4ff",
                            color: "#1976d2",
                          },
                        }}
                        onClick={() => navigate(item.path)}
                      >
                        {item.label}
                      </Typography>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Masonry>
          </Grid>
        </Grid>
  
        {/* Error Snackbar */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={errorMessage}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            "& .MuiSnackbarContent-root": {
              backgroundColor: "error.main",
              color: "#fff",
              fontSize: "1rem",
              boxShadow: 3,
            },
          }}
        />
      </Box>
    </>
  );
};

export default MJOPDashboard;
