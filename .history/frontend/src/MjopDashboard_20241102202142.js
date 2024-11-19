import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { fetchMJOPData } from "./dataHandling";

const MJOPDashboard = () => {
  const [activeTab, setActiveTab] = useState("alles");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMJOPData("some-id", setData);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return (
      <Typography color="error" variant="h6">
        Error loading data: {error.message}
      </Typography>
    );
  }

  const sections = {
    alles: [
      { title: "MJOP", items: [{ label: "Planning overzicht", path: "/menu/planning" }] },
      { title: "Inspecties", items: [{ label: "Inspectie overzicht", path: "/menu/inspection-report" }] },
      {
        title: "Financieel",
        items: [
          { label: "Liquiditeitsprognose", path: "/menu/cash-flow" },
          { label: "Facturen", path: "/menu/contracts" },
          { label: "Begroting", path: "/menu/budget" },
          { label: "Contracten", path: "/menu/contracts" },
        ],
      },
      { title: "Onderhoudsmanagement", items: [{ label: "Kalender", path: "/menu/calendar" }] },
      { title: "Condities", items: [{ label: "Ruimtes / Objecten", path: "/menu/spaces" }, { label: "Elementen", path: "/menu/elements" }] },
      { title: "Verduurzaming", items: [{ label: "Verduurzamings overzicht", path: "/menu/sustainability" }] },
      { title: "Documenten", items: [{ label: "Documenten beheer", path: "/menu/documents" }] },
      { title: "Meldingen", items: [{ label: "Meldingen", path: "/menu/complaints-board" }] },
    ],
    overzichten: [
      { title: "MJOP", items: [{ label: "Planning overzicht", path: "/menu/planning" }] },
      { title: "Inspecties", items: [{ label: "Inspectie overzicht", path: "/menu/inspection-report" }] },
      {
        title: "Financieel",
        items: [
          { label: "Liquiditeitsprognose", path: "/menu/cash-flow" },
          { label: "Facturen", path: "/menu/contracts" },
          { label: "Begroting", path: "/menu/budget" },
          { label: "Contracten", path: "/menu/contracts" },
        ],
      },
      { title: "Condities", items: [{ label: "Ruimtes / Objecten", path: "/menu/spaces" }, { label: "Elementen", path: "/menu/elements" }] },
    ],
    beheer: [
      { title: "MJOP", items: [{ label: "Plan taken", path: "/menu/planning" }] },
      {
        title: "Onderhoudsmanagement",
        items: [{ label: "Kanban bord planning", path: "/menu/planning" }, { label: "Planning table", path: "/menu/planning" }],
      },
      {
        title: "Inventarisatie",
        items: [{ label: "Ruimtes / Objecten", path: "/menu/spaces" }, { label: "Elementen", path: "/menu/elements" }, { label: "Levensduur overzicht", path: "/menu/lifespan" }],
      },
      { title: "Inspecties", items: [{ label: "Inspectie planning", path: "/menu/inspection-report" }] },
      { title: "Verduurzaming", items: [{ label: "Verduurzamings management", path: "/menu/sustainability" }] },
      { title: "Financieel", items: [{ label: "Contracten beheer", path: "/menu/contracts" }] },
    ],
  };

  return (
    <Box mx="auto" sx={{ width: "80%", mt: 4 }}>
      {/* Top Menu Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button variant={activeTab === "alles" ? "contained" : "outlined"} onClick={() => setActiveTab("alles")}>
          Alles
        </Button>
        <Button variant={activeTab === "overzichten" ? "contained" : "outlined"} onClick={() => setActiveTab("overzichten")}>
          Overzichten
        </Button>
        <Button variant={activeTab === "beheer" ? "contained" : "outlined"} onClick={() => setActiveTab("beheer")}>
          Beheer
        </Button>
      </Box>

      {/* Cards with Sections */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {sections[activeTab].map((section) => (
          <Card key={section.title} sx={{ width: 200 }}>
            <CardContent>
              <Typography variant="h6">{section.title}</Typography>
              {section.items.map((item) => (
                <Typography key={item.label} variant="body2">
                  <Link
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                    }}
                    sx={{ color: "teal", cursor: "pointer" }}
                  >
                    {item.label}
                  </Link>
                </Typography>
              ))}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Error Dialog */}
      <Dialog open={!!error} onClose={() => setError(null)}>
        <DialogTitle>Fout</DialogTitle>
        <DialogContent>
          <Typography>{error && error.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setError(null)} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MJOPDashboard;
