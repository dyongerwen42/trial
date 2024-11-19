import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Typography,
  Link,
  Tooltip,
  Snackbar,
  IconButton,
  Divider,
} from "@mui/material";
import { useMjopContext } from "./MjopContext";
import GeneralInfo from "./GeneralInfo";
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import NoteIcon from '@mui/icons-material/Note';

const MJOPDashboard = () => {
  const [activeTab, setActiveTab] = useState("alles");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { state } = useMjopContext();
  const { generalInfo } = state;

  const sections = {
    alles: [
      { title: "MJOP", icon: <AssignmentIcon />, items: [{ label: "Plan taken", path: "/create-task" }, { label: "Planning table", path: "/planning" }] },
      { title: "Onderhoudsmanagement", icon: <HomeRepairServiceIcon />, items: [{ label: "Kanban bord planning", path: "/kanban-planning" }, { label: "Kalender", path: "/calendar" }] },
      { title: "Inventarisatie", icon: <NoteIcon />, items: [{ label: "Ruimtes / Objecten", path: "/spaces" }, { label: "Elementen", path: "/elements" }, { label: "Levensduur overzicht", path: "/lifespan" }] },
      { title: "Financieel", icon: <AccountBalanceIcon />, items: [{ label: "Liquiditeitsprognose", path: "/cash-flow" }, { label: "Facturen", path: "/invoices" }, { label: "Begroting", path: "/budget" }] },
    ],
    // other tabs (overzichten, beheer) would go here
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  return (
    <Box sx={{ mx: "auto", maxWidth: "1200px", mt: 4, px: 2 }}>
      <Grid container spacing={4}>
        {/* Left Column - General Information */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 3, backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <GeneralInfo generalInfo={generalInfo} />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Navigation and Sections */}
        <Grid item xs={12} md={8}>
          {/* Top Menu Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
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
                  "&.MuiButton-contained": { backgroundColor: "#1976d2", color: "#fff" },
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </Box>

          {/* Sections Grid */}
          <Grid container spacing={2}>
            {sections[activeTab]?.map((section) => (
              <Grid item xs={12} sm={6} md={4} key={section.title}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: 4,
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
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
                      <Tooltip key={item.label} title={`Go to ${item.label}`} arrow>
                        <Typography variant="body2" sx={{ my: 0.5 }}>
                          <Link
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(item.path);
                            }}
                            sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                          >
                            {item.label}
                          </Link>
                        </Typography>
                      </Tooltip>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error?.message || "An error occurred"}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={() => setError(null)}>
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
