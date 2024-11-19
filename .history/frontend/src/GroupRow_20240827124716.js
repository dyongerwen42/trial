import React, { useEffect, useState } from "react";
import {
  TableRow,
  TableCell,
  Box,
  IconButton,
  Typography,
  Tooltip,
  Collapse,
  TextField,
  Divider,
  FormControlLabel,
  Table,
  TableBody,
  Checkbox,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  ErrorOutline as ErrorOutlineIcon,
  Download as DownloadIcon,
  RequestPage as RequestPageIcon,
} from "@mui/icons-material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TaskRow from "./TaskRow";
import { getUrgencyColor } from "./utils";

const GroupRow = ({
  groupId,
  group,
  groupName,
  totalRemainingCash = 0,
  groupUrgency,
  groupWorkDate,
  groupData = {},
  toggleItem,
  openItems,
  handleSelectTask,
  selectedTasks,
  handleGroupWorkDateChange,
  handleTaskDelete,
  handleChange,
  requestOffer,
  handleOpenImageAnnotationModal,
  offerGroups,
  handleFileChange,
  handleFileDelete,
  handleGroupSelectionChange,
  setGlobalElements,
}) => {
  const [totalEstimatedPrice, setTotalEstimatedPrice] = useState(0);

  const calculateTotalEstimatedPrice = (tasks) => {
    return tasks.reduce((total, task) => {
      const price = parseFloat(task?.estimatedPrice) || 0;
      return total + price;
    }, 0);
  };

  useEffect(() => {
    if (openItems[`group-${groupId}`]) {
      if (group.tasks && group.tasks.length > 0) {
        const calculatedTotal = calculateTotalEstimatedPrice(group.tasks);
        setTotalEstimatedPrice(calculatedTotal);
      } else {
        setTotalEstimatedPrice(0);
      }
    }
  }, [openItems, groupId, group.tasks]);

  const handleFieldChange = (
    taskIdOrGroupId,
    elementId,
    value,
    field,
    isGroup = false
  ) => {
    setGlobalElements((prevElements) => {
      if (!isGroup) {
        return prevElements.map((element) => {
          if (element.id === elementId) {
            const updatedTasks = element.tasks.map((task) => {
              if (task.id === taskIdOrGroupId) {
                return {
                  ...task,
                  planned: {
                    ...task.planned,
                    [field]: value,
                  },
                };
              }
              return task;
            });

            return {
              ...element,
              tasks: updatedTasks,
            };
          }
          return element;
        });
      }

      return prevElements.map((element) => {
        return element;
      });
    });
  };

  return (
    <>
      <TableRow>
        <TableCell colSpan={8} sx={{ padding: 0 }}>
          <Box
            sx={{ border: "2px solid #1976d2", borderRadius: 2, marginBottom: 0 }}
          >
            <TableRow
              hover
              sx={{
                backgroundColor: "#e0e0e0",
                "&:hover": { backgroundColor: "#d6d6d6" },
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              <TableCell
                sx={{ padding: "8px", verticalAlign: "middle", width: "5%" }}
              >
                <Box display="flex" alignItems="center" sx={{ width: "100%" }}>
                  <IconButton
                    aria-label="expand group"
                    size="small"
                    onClick={() => toggleItem(`group-${groupId}`)}
                  >
                    {openItems[`group-${groupId}`] ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                  <Checkbox
                    checked={selectedTasks.includes(groupId)}
                    onChange={() => handleSelectTask(groupId)}
                    sx={{ visibility: "hidden" }}
                  />
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  verticalAlign: "center",
                  fontWeight: "bold",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {groupName}
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  verticalAlign: "middle",
                  width: "15%",
                }}
              >
                <DatePicker
                  selected={groupWorkDate ? new Date(groupWorkDate) : null}
                  onChange={(date) => handleGroupWorkDateChange(groupId, date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  customInput={
                    <Typography variant="body2">
                      {groupWorkDate
                        ? new Date(groupWorkDate).toLocaleDateString()
                        : "Niet ingesteld"}
                    </Typography>
                  }
                />
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  textAlign: "center",
                  verticalAlign: "middle",
                  width: "5%",
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: getUrgencyColor(groupUrgency),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {groupUrgency}
                </Box>
              </TableCell>
              <TableCell sx={{ padding: "8px", verticalAlign: "middle", width: "15%" }} />
              <TableCell
                sx={{
                  padding: "8px",
                  textAlign: "center",
                  verticalAlign: "middle",
                  width: "5%",
                }}
              >
                {groupUrgency >= 4 && (
                  <Tooltip title="Er is een hoge urgentietaak in deze groep" arrow>
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 24 }} />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell
                sx={{
                  padding: "8px",
                  fontWeight: "bold",
                  verticalAlign: "middle",
                  width: "20%",
                }}
              >
                Resterend: €
                {(totalRemainingCash || 0).toFixed(2)}
              </TableCell>
              <TableCell
                sx={{ padding: "8px", verticalAlign: "middle", width: "10%" }}
              >
                <Box display="flex" alignItems="center">
                  <IconButton
                    onClick={requestOffer}
                    sx={{
                      color: "#1976d2",
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                      },
                      marginRight: 1,
                    }}
                  >
                    <RequestPageIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleTaskDelete(groupId, null, null, true)}
                    sx={{
                      color: "#d32f2f",
                      "&:hover": {
                        backgroundColor: "#ffebee",
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                <Collapse in={openItems[`group-${groupId}`]} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      margin: 2,
                      padding: 2,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 2,
                      boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      Groep Details
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        fontWeight: "bold",
                        color: "#424242",
                      }}
                    >
                      Totale geschatte prijs: €{totalEstimatedPrice.toFixed(2)}
                    </Typography>

                    {/* Group Details */}
                    <TextField
                      fullWidth
                      type="number"
                      label="Offerteprijs"
                      value={groupData.offerPrice || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          groupId,
                          null,
                          e.target.value,
                          "offerPrice",
                          true
                        )
                      }
                      variant="outlined"
                      sx={{
                        mb: 2,
                        backgroundColor: "#fff",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{ style: { color: "#3f51b5" } }}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Factuurprijs"
                      value={groupData.invoicePrice || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          groupId,
                          null,
                          e.target.value,
                          "invoicePrice",
                          true
                        )
                      }
                      variant="outlined"
                      sx={{
                        mb: 2,
                        backgroundColor: "#fff",
                        borderRadius: 2,
                      }}
                      InputLabelProps={{ style: { color: "#3f51b5" } }}
                    />

                    {/* Group Files */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Upload offerte
                      </Typography>
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          handleFileChange(groupId, null, e.target.files, "offerFiles")
                        }
                        style={{ marginBottom: "12px", display: "block" }}
                      />
                      {groupData.offerFiles &&
                        groupData.offerFiles.map((file, fileIndex) => (
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                              mb: 1,
                              backgroundColor: "#e3f2fd",
                              borderRadius: 2,
                              p: 1,
                              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                            }}
                            key={fileIndex}
                          >
                            <a
                              href={`http://localhost:5000/${file}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginRight: "8px",
                                textDecoration: "none",
                                flex: 1,
                              }}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </a>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `http://localhost:5000/${file}`;
                                link.download = file;
                                link.click();
                              }}
                            >
                              <DownloadIcon sx={{ color: "#3f51b5" }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFileDelete(groupId, null, file, "offerFiles")
                              }
                            >
                              <DeleteIcon sx={{ color: "#d32f2f" }} />
                            </IconButton>
                          </Box>
                        ))}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Upload factuur
                      </Typography>
                      <input
                        type="file"
                        multiple
                        onChange={(e) =>
                          handleFileChange(groupId, null, e.target.files, "invoiceFiles")
                        }
                        style={{ marginBottom: "12px", display: "block" }}
                      />
                      {groupData.invoiceFiles &&
                        groupData.invoiceFiles.map((file, fileIndex) => (
                          <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                              mb: 1,
                              backgroundColor: "#fce4ec",
                              borderRadius: 2,
                              p: 1,
                              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
                            }}
                            key={fileIndex}
                          >
                            <a
                              href={`http://localhost:5000/${file}`}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginRight: "8px",
                                textDecoration: "none",
                                flex: 1,
                              }}
                            >
                              <Typography variant="body2">
                                {file.split("/").pop()}
                              </Typography>
                            </a>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `http://localhost:5000/${file}`;
                                link.download = file;
                                link.click();
                              }}
                            >
                              <DownloadIcon sx={{ color: "#3f51b5" }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFileDelete(groupId, null, file, "invoiceFiles")
                              }
                            >
                              <DeleteIcon sx={{ color: "#d32f2f" }} />
                            </IconButton>
                          </Box>
                        ))}
                    </Box>

                    {/* Start and End Date */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Startdatum
                      </Typography>
                      <DatePicker
                        selected={groupData.startDate ? new Date(groupData.startDate) : null}
                        onChange={(date) =>
                          handleFieldChange(groupId, null, date, "startDate", true)
                        }
                        dateFormat="dd/MM/yyyy"
                        customInput={
                          <TextField
                            variant="outlined"
                            fullWidth
                            value={
                              groupData.startDate
                                ? new Date(groupData.startDate).toLocaleDateString()
                                : "Niet ingesteld"
                            }
                            sx={{
                              backgroundColor: "#fff",
                              borderRadius: 2,
                            }}
                            InputLabelProps={{
                              style: { color: "#3f51b5" },
                            }}
                          />
                        }
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          color: "#424242",
                        }}
                      >
                        Einddatum
                      </Typography>
                      <DatePicker
                        selected={groupData.endDate ? new Date(groupData.endDate) : null}
                        onChange={(date) =>
                          handleFieldChange(groupId, null, date, "endDate", true)
                        }
                        dateFormat="dd/MM/yyyy"
                        customInput={
                          <TextField
                            variant="outlined"
                            fullWidth
                            value={
                              groupData.endDate
                                ? new Date(groupData.endDate).toLocaleDateString()
                                : "Niet ingesteld"
                            }
                            sx={{
                              backgroundColor: "#fff",
                              borderRadius: 2,
                            }}
                            InputLabelProps={{
                              style: { color: "#3f51b5" },
                            }}
                          />
                        }
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={groupData.offerAccepted || false}
                          onChange={(e) =>
                            handleFieldChange(
                              groupId,
                              null,
                              e.target.checked,
                              "offerAccepted",
                              true
                            )
                          }
                          sx={{ color: "#1976d2" }}
                        />
                      }
                      label="Offerte geaccepteerd"
                      sx={{
                        mb: 2,
                        "& .MuiFormControlLabel-label": { fontSize: 14 },
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={groupData.isDone || false}
                          onChange={(e) =>
                            handleFieldChange(
                              groupId,
                              null,
                              e.target.checked,
                              "isDone",
                              true
                            )
                          }
                          sx={{ color: "#1976d2" }}
                        />
                      }
                      label="Voltooid"
                      sx={{
                        mb: 2,
                        "& .MuiFormControlLabel-label": { fontSize: 14 },
                      }}
                    />
                  </Box>

                  {/* Group's Tasks */}
                  <Divider sx={{ mb: 2 }} />
                  <Table>
                    <TableBody>
                      {group.tasks.map((task, index) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          index={index}
                          remainingCash={group.remainingCash[index] || 0}
                          toggleItem={toggleItem}
                          openItems={openItems}
                          handleSelectTask={handleSelectTask}
                          selectedTasks={selectedTasks}
                          handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
                          handleChange={handleChange}
                          handleTaskDelete={handleTaskDelete}
                          offerGroups={offerGroups}
                          handleFileChange={handleFileChange}
                          handleFileDelete={handleFileDelete}
                          setGlobalElements={setGlobalElements}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </Collapse>
              </TableCell>
            </TableRow>
          </Box>
        </TableCell>
      </TableRow>
    </>
  );
};

export default GroupRow;
