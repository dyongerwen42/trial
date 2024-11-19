import React, { useState, useEffect } from "react";
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
import GeneralInfo from "./view/GeneralInfo";
import Spaces from "./view/Spaces";
import Elements from "./view/Elements";
import Documents from "./view/Documents";
import InspectionReportView from "./view/InspectionReportView";
import PlanningView from "./view/PlanningView";
import CashFlowChart from "./view/CashFlowChart";
import TaskCalendar from "./view/TaskCalendar";
import SustainabilityWidget from "./view/SustainabilityWidget";
import ContractsTable from "./view/ContractsTable";
import BudgetOverzicht from "./view/BudgetOverzicht";
import LifespanTable from "./view/LifespanTable";
import ComplaintsBoard from "./view/ComplaintsBoard";
import { fetchMJOPData } from "../dataHandling";

const MJOPDashboard = () => {
  const [activeTab, setActiveTab] = useState("alles");
  const [activeSection, setActiveSection] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const renderActiveSection = () => {
    switch (activeSection) {
      case "Algemene Informatie":
        return <GeneralInfo generalInfo={data.generalInfo} />;
      case "Ruimtes":
        return <Spaces globalSpaces={data.globalSpaces} />;
      case "Elementen":
        return <Elements globalElements={data.globalElements} />;
      case "Documenten":
        return <Documents globalDocuments={data.globalDocuments} />;
      case "Inspectierapport":
        return <InspectionReportView globalElements={data.globalElements} />;
      case "Planning":
        return <PlanningView globalElements={data.globalElements} />;
      case "Cash Flow":
        return <CashFlowChart cashInfo={data.cashInfo} />;
      case "Kalender":
        return <TaskCalendar tasks={data.globalElements.flatMap(el => el.tasks || [])} />;
      case "Verduurzaming":
        return <SustainabilityWidget />;
      case "Contracten":
        return <ContractsTable />;
      case "Begroting":
        return <BudgetOverzicht />;
      case "Levensduur Overzicht":
        return <LifespanTable />;
      case "Klachten & Ideeën Bord":
        return <ComplaintsBoard />;
      default:
        return <Typography>Selecteer een sectie om te bekijken</Typography>;
    }
  };

  const sections = {
    alles: [
      { title: "MJOP", items: ["Planning overzicht"] },
      { title: "Inspecties", items: ["Inspectie overzicht"] },
      { title: "Financieel", items: ["Liquiditeitsprognose", "Facturen", "Begroting", "Contracten"] },
      { title: "Onderhoudsmanagement", items: ["Kalender"] },
      { title: "Condities", items: ["Ruimtes / Objecten", "Elementen"] },
      { title: "Verduurzaming", items: ["Verduurzamings overzicht"] },
      { title: "Documenten", items: ["Documenten beheer"] },
      { title: "Meldingen", items: ["Meldingen", "Melding doen"] },
    ],
    overzichten: [
      { title: "MJOP", items: ["Planning overzicht"] },
      { title: "Inspecties", items: ["Inspectie overzicht"] },
      { title: "Financieel", items: ["Liquiditeitsprognose", "Facturen", "Begroting", "Contracten"] },
      { title: "Condities", items: ["Ruimtes / Objecten", "Elementen"] },
    ],
    beheer: [
      { title: "MJOP", items: ["Plan taken", "Plan table"] },
      { title: "Onderhoudsmanagement", items: ["Kanban bord planning", "Planning table"] },
      { title: "Inventarisatie", items: ["Ruimtes / Objecten", "Elementen", "Levensduur overzicht"] },
      { title: "Inspecties", items: ["Inspectie planning", "Inspecties uitvoeren"] },
      { title: "Verduurzaming", items: ["Verduurzamings management"] },
      { title: "Financieel", items: ["Contracten beheer"] },
    ],
  };

  return (
    <Box mx="auto" sx={{ width: "80%", mt: 4 }}>
      {/* Top Menu Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button
          variant={activeTab === "alles" ? "contained" : "outlined"}
          onClick={() => setActiveTab("alles")}
        >
          Alles
        </Button>
        <Button
          variant={activeTab === "overzichten" ? "contained" : "outlined"}
          onClick={() => setActiveTab("overzichten")}
        >
          Overzichten
        </Button>
        <Button
          variant={activeTab === "beheer" ? "contained" : "outlined"}
          onClick={() => setActiveTab("beheer")}
        >
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
                <Typography key={item} variant="body2">
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(section.title);
                    }}
                    sx={{ color: "teal", cursor: "pointer" }}
                  >
                    {item}
                  </Link>
                </Typography>
              ))}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Rendered Section */}
      <Box sx={{ mt: 4, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
        {renderActiveSection()}
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
