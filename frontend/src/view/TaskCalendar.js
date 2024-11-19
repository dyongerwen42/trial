import React, { useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/nl"; // Import Dutch locale
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMjopContext } from '../MjopContext'; // Adjust the import path as necessary

const localizer = momentLocalizer(moment);

// Set Moment.js locale to Dutch
moment.locale("nl");

const TaskCalendar = () => {
  const { state } = useMjopContext(); // Access the context

  // Extract and flatten tasks from globalElements
  const tasks = useMemo(() => {
    return state.globalElements.flatMap((element) => element.tasks || []);
  }, [state.globalElements]);

  // Format the tasks to the calendar's event format
  const events = useMemo(() => {
    return tasks.map((task) => ({
      title: task.name,
      start: new Date(task.planned.startDate),
      end: new Date(task.planned.endDate),
      allDay: true,
      resource: task,
    }));
  }, [tasks]);

  return (
    <div
      style={{
        height: "80vh",
        padding: "20px",
        backgroundColor: "#f0f4f8",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{
          height: "100%",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          padding: "10px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: "#1e88e5",
            borderRadius: "8px",
            color: "white",
            border: "none",
            display: "block",
            padding: "12px",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
          },
        })}
        views={["month", "week", "day"]}
        defaultView="month"
        popup
        components={{
          toolbar: (props) => (
            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 10px",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => props.onNavigate("PREV")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#e0e0e0",
                    color: "#333",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.3s, color 0.3s",
                  }}
                >
                  Vorige
                </button>
                <button
                  type="button"
                  onClick={() => props.onNavigate("NEXT")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#e0e0e0",
                    color: "#333",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.3s, color 0.3s",
                  }}
                >
                  Volgende
                </button>
              </div>
              <h2
                style={{
                  margin: "0",
                  fontSize: "28px",
                  color: "#1e88e5",
                  fontWeight: "700",
                }}
              >
                {props.label}
              </h2>
              <div style={{ display: "flex", gap: "10px" }}>
                {props.views.map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => props.onView(view)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: props.view === view ? "#1e88e5" : "#e0e0e0",
                      color: props.view === view ? "white" : "#333",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: props.view === view ? "700" : "500",
                      cursor: "pointer",
                      transition: "background-color 0.3s, color 0.3s",
                    }}
                  >
                    {view === "month" ? "Maand" : view === "week" ? "Week" : "Dag"}
                  </button>
                ))}
              </div>
            </div>
          ),
        }}
        messages={{
          month: "Maand",
          week: "Week",
          day: "Dag",
          today: "Vandaag",
          previous: "Vorige",
          next: "Volgende",
        }}
      />
    </div>
  );
};

export default TaskCalendar;
