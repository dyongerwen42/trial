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
      { title: "MJOP", items: [{ label: "Plan taken", path: "/create-task" }, { label: "Planning overzicht", path: "/planning" }] },
      { title: "Onderhoudsmanagement", items: [{ label: "Kalender", path: "/calendar" }] },
      { title: "Inventarisatie", items: [{ label: "Ruimtes / Objecten", path: "/spaces" }, { label: "Elementen", path: "/elements" }, { label: "Levensduur overzicht", path: "/lifespan" }] },
      { title: "Condities", items: [{ label: "Ruimtes / Objecten", path: "/spaces" }, { label: "Elementen", path: "/elements" }] },
      { title: "Inspecties", items: [{ label: "Inspectie overzicht", path: "/inspection-report" }, { label: "Inspectie planning", path: "/inspection-planning" }, { label: "Inspecties uitvoeren", path: "/inspection-execution" }] },
      {
        title: "Financieel",
        items: [
          { label: "Liquiditeitsprognose", path: "/cash-flow" },
          { label: "Facturen", path: "/invoices" },
          { label: "Begroting", path: "/budget" },
          { label: "Contracten", path: "/contracts" },
          { label: "Contract beheer", path: "/contracts-management" },
        ],
      },
      { title: "Verduurzaming", items: [{ label: "Verduurzamings overzicht", path: "/sustainability-overview" }, { label: "Verduurzamings management", path: "/sustainability-management" }] },
      { title: "Documenten", items: [{ label: "Documenten beheer", path: "/documents" }] },
      { title: "Meldingen", items: [{ label: "Meldingen", path: "/complaints-board" }, { label: "Melding doen", path: "/complaint-form" }] },
    ],
    overzichten: [
      { title: "MJOP", items: [{ label: "Planning overzicht", path: "/planning" }] },
      { title: "Inspecties", items: [{ label: "Inspectie overzicht", path: "/inspection-report" }] },
      {
        title: "Financieel",
        items: [
          { label: "Liquiditeitsprognose", path: "/cash-flow" },
          { label: "Facturen", path: "/invoices" },
          { label: "Begroting", path: "/budget" },
          { label: "Contracten", path: "/contracts" },
        ],
      },
      { title: "Condities", items: [{ label: "Ruimtes / Objecten", path: "/spaces" }, { label: "Elementen", path: "/elements" }] },
    ],
    beheer: [
      { title: "MJOP", items: [{ label: "Plan taken", path: "/create-task" }, { label: "Planning table", path: "/planning-table" }] },
      {
        title: "Onderhoudsmanagement",
        items: [{ label: "Kanban bord planning", path: "/kanban-planning" }, { label: "Planning table", path: "/planning-table" }],
      },
      {
        title: "Inventarisatie",
        items: [{ label: "Ruimtes / Objecten", path: "/spaces" }, { label: "Elementen", path: "/elements" }, { label: "Levensduur overzicht", path: "/lifespan" }],
      },
      { title: "Inspecties", items: [{ label: "Inspectie planning", path: "/inspection-planning" }, { label: "Inspecties uitvoeren", path: "/inspection-execution" }] },
      { title: "Verduurzaming", items: [{ label: "Verduurzamings management", path: "/sustainability-management" }] },
      { title: "Financieel", items: [{ label: "Contract beheer", path: "/contracts-management" }] },
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
