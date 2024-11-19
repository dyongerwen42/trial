import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Typography,
  Link,
  Snackbar,
  IconButton,
  Divider,
} from "@mui/material";
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

  const handleTabChange = (tab) => setActiveTab(tab);

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
    // Define overzichten and beheer tabs similarly...
  };

  const handleCloseSnackbar = () => {
    dispatch({ type: "SET_ERROR_MESSAGE", payload: "" });
  };

  return (
    <Box sx={{ width: "100vw", minHeight: "100vh", mt: 4, px: 3, backgroundColor: "#f5f5f5" }}>
      {/* Top Menu Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        {["alles", "overzichten", "beheer"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "contained" : "outlined"}
            onClick={() => handleTabChange(tab)}
            sx={{
              borderRadius: "20px",
              px: 3,
              py: 1,
              fontWeight: "bold",
              mx: 1,
              transition: "background-color 0.3s",
              "&.MuiButton-contained": { backgroundColor: "#1976d2", color: "#fff" },
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </Box>
  
      <Grid container spacing={3}>
        {/* Left side: General Information (50%) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 4, p: 2, height: "100%" }}>
            <GeneralInfo generalInfo={generalInfo} />
          </Card>
        </Grid>
  
        {/* Right side: Sections Grid (50%) with Masonry Layout */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 2,
            }}
          >
            {sections[activeTab].map((section) => (
              <Card
                key={section.title}
                sx={{
                  boxShadow: 4,
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {section.icon}
                    <Typography variant="h6" sx={{ ml: 1, fontWeight: "bold", color: "#333" }}>
                      {section.title}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  {section.items.map((item) => (
                    <Typography key={item.label} variant="body2" sx={{ my: 0.5 }}>
                      <Link
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.path);
                        }}
                        sx={{
                          color: "primary.main",
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {item.label}
                      </Link>
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>
      </Grid>
  
      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={errorMessage}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "error.main",
            color: "#fff",
          },
        }}
      />
    </Box>
  );
  
  
};

export default MJOPDashboard;
