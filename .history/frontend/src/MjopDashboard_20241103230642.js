import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Link,
  Snackbar,
  IconButton,
  Divider,
  CssBaseline,
  Tabs,
  Tab,
} from "@mui/material";
import { Masonry } from "@mui/lab"; // Masonry component for advanced layout
import GeneralInfo from "./view/GeneralInfo";
import { useMjopContext } from "./MjopContext";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import FolderIcon from "@mui/icons-material/Folder";
import NoteIcon from "@mui/icons-material/Note";
import CloseIcon from "@mui/icons-material/Close";

const MJOPDashboard = () => {
  const [activeTab, setActiveTab] = useState("alles");
  const { state, dispatch } = useMjopContext();
  const navigate = useNavigate();

  const { generalInfo, errorMessage } = state;

  const handleTabChange = (event, newTab) => setActiveTab(newTab);

  const sections = {
    alles: [
      {
        title: "MJOP",
        icon: <AssignmentIcon />,
        items: [
          { label: "Plan taken", path: "/create-task" },
          { label: "Planning overzicht", path: "/planning" },
        ],
      },
      {
        title: "Onderhoudsmanagement",
        icon: <CalendarTodayIcon />,
        items: [{ label: "Kalender", path: "/calendar" }],
      },
      {
        title: "Inventarisatie",
        icon: <FolderIcon />,
        items: [
          { label: "Ruimtes / Objecten", path: "/spaces" },
          { label: "Elementen", path: "/elements" },
          { label: "Levensduur overzicht", path: "/lifespan" },
        ],
      },
      {
        title: "Financieel",
        icon: <NoteIcon />,
        items: [
          { label: "Liquiditeitsprognose", path: "/cash-flow" },
          { label: "Facturen", path: "/invoices" },
          { label: "Begroting", path: "/budget" },
        ],
      },
      {
        title: "Verduurzaming",
        icon: <HomeRepairServiceIcon />,
        items: [
          { label: "Verduurzamings overzicht", path: "/sustainability-overview" },
          { label: "Verduurzamings management", path: "/sustainability-management" },
        ],
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
          {/* Left side: General Information (50%) */}
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
              <GeneralInfo generalInfo={generalInfo} />
            </Card>
          </Grid>
  
          {/* Right side: Sections Grid (50%) with Tabs for Filters */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3, width: "100%" }}>
              <Tabs
                value={activeTab}
                onChange={(event, newValue) => setActiveTab(newValue)}
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
