import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTable, useExpanded } from 'react-table';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Collapse,
  Grid,
  TextField,
} from '@mui/material';
import { Edit, Visibility, ExpandMore, ExpandLess } from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// MJOP List Component
const MJOPList = ({ setMappedMJOPs, setSelectedMJOP, searchTerm, setSearchTerm }) => {
  const [mjops, setMJOPs] = useState([]);
  const navigate = useNavigate();
  const googleMapsApiKey = 'AIzaSyClxfXoeFT3GLzwZs5zgx14vllbqbakZII';

  useEffect(() => {
    const fetchMJOPs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/mjops', { withCredentials: true });
        const mjopsData = response.data;

        // Geocode each address and add lat/lng to mappedMJOPs
        const mappedMJOPs = await Promise.all(
          mjopsData.map(async (mjop) => {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              mjop.generalInfo.address
            )}&key=${googleMapsApiKey}`;

            const geocodeResponse = await axios.get(geocodeUrl);
            const location = geocodeResponse.data.results[0]?.geometry.location;

            return {
              id: mjop._id,
              address: mjop.generalInfo.address,
              projectName: mjop.generalInfo.projectName,
              lat: location?.lat || 0,  // Default to 0 if geocoding fails
              lng: location?.lng || 0,
            };
          })
        );

        setMappedMJOPs(mappedMJOPs);
        setMJOPs(mjopsData);
      } catch (err) {
        console.error('Error fetching MJOPs', err);
      }
    };

    fetchMJOPs();
  }, [setMappedMJOPs]);

  // Filter MJOPs based on the search term
  const filteredMJOPs = useMemo(() => {
    if (!searchTerm) return mjops;

    return mjops.filter((mjop) => {
      const searchFields = Object.values(mjop.generalInfo).join(' ').toLowerCase();
      return searchFields.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, mjops]);

  const columns = useMemo(() => [
    {
      Header: 'Projectnaam',
      accessor: 'generalInfo.projectName',
    },
    {
      Header: 'Adres',
      accessor: 'generalInfo.address',
    },
    {
      Header: 'Acties',
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => {
              navigate(`/view-mjop/${row.original._id}`);
              setSelectedMJOP(row.original); // Set the selected MJOP
            }}
            color="primary"
            sx={{ backgroundColor: '#e3f2fd', borderRadius: 1 }}
          >
            <Visibility />
          </IconButton>
          <IconButton
            onClick={() => navigate(`/edit-mjop/${row.original._id}`)}
            color="secondary"
            sx={{ backgroundColor: '#fce4ec', borderRadius: 1 }}
          >
            <Edit />
          </IconButton>
        </Box>
      ),
    },
    {
      Header: '',
      id: 'expander',  // Expander column
      Cell: ({ row }) => (
        <IconButton {...row.getToggleRowExpandedProps()}>
          {row.isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      )
    }
  ], [navigate, setSelectedMJOP]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: filteredMJOPs }, useExpanded);

  return (
    <Paper elevation={4} sx={{ padding: 4, borderRadius: 4, height: '100%', overflowY: 'auto' }}>

      {/* Search Bar */}
      <TextField
        label="Zoek project"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Set the search term as the user types
        fullWidth
        variant="outlined"
        sx={{ marginBottom: 3 }}
      />
  
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Table {...getTableProps()} aria-label="MJOP tabel">
          <TableHead>
            {headerGroups.map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                {...headerGroup.getHeaderGroupProps()}
                sx={{ backgroundColor: '#f5f5f5' }}
              >
                {headerGroup.headers.map(column => (
                  <TableCell
                    key={column.id}
                    {...column.getHeaderProps()}
                    sx={{ fontWeight: 'bold', color: '#555', padding: '12px 16px' }}
                  >
                    <TableSortLabel>
                      {column.render('Header')}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    {...row.getRowProps()}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                      '&:hover': { backgroundColor: '#f0f0f0' },
                    }}
                    onClick={() => setSelectedMJOP(row.original)}  // Set selected MJOP when a row is clicked
                  >
                    {row.cells.map(cell => (
                      <TableCell key={cell.id} {...cell.getCellProps()} sx={{ padding: '12px 16px' }}>
                        {cell.render('Cell')}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Expanded row with additional details */}
                  {row.isExpanded ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <Collapse in={row.isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, padding: 3, backgroundColor: '#f9f9f9', borderRadius: '12px', boxShadow: 3 }}>
                            <Grid container spacing={4}>
                              {/* Left section for text details */}
                              <Grid item xs={12} md={7}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 2 }}>
                                  Projectinformatie
                                </Typography>
                                <Box sx={{ borderBottom: '1px solid #ddd', paddingBottom: 2, marginBottom: 2 }}>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Projectnummer:</strong> {row.original.generalInfo.projectNumber}
                                  </Typography>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Adres:</strong> {row.original.generalInfo.address}
                                  </Typography>
                                </Box>
                                <Box sx={{ borderBottom: '1px solid #ddd', paddingBottom: 2, marginBottom: 2 }}>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Opdrachtgever Naam:</strong> {row.original.generalInfo.opdrachtgeverNaam || 'Geen informatie'}
                                  </Typography>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Opdrachtgever Telefoon:</strong> {row.original.generalInfo.opdrachtgeverTelefoon || 'Geen informatie'}
                                  </Typography>
                                </Box>
                                <Box sx={{ borderBottom: '1px solid #ddd', paddingBottom: 2, marginBottom: 2 }}>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Inspectiedatum:</strong> {row.original.generalInfo.inspectiedatum || 'Geen informatie'}
                                  </Typography>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Opmerkingen:</strong> {row.original.generalInfo.opmerkingen || 'Geen opmerkingen'}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Contactpersoon:</strong> {row.original.generalInfo.contactPersonName || 'Geen informatie'}
                                  </Typography>
                                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                                    <strong>Email:</strong> <a href={`mailto:${row.original.generalInfo.contactPersonEmail}`} style={{ textDecoration: 'none', color: '#1976d2' }}>{row.original.generalInfo.contactPersonEmail || 'Geen email'}</a>
                                  </Typography>
                                  <Typography variant="body1">
                                    <strong>Telefoon:</strong> <a href={`tel:${row.original.generalInfo.contactPersonPhone}`} style={{ textDecoration: 'none', color: '#1976d2' }}>{row.original.generalInfo.contactPersonPhone || 'Geen telefoon'}</a>
                                  </Typography>
                                </Box>
                              </Grid>
  
                              {/* Right section for image */}
                              <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                {row.original.generalInfo.propertyImage ? (
                                  <Box sx={{ border: '1px solid #ddd', padding: 2, borderRadius: '8px', maxWidth: '100%' }}>
                                    <img
                                      src={`http://localhost:5000/${row.original.generalInfo.propertyImage}`}
                                      alt="Property"
                                      style={{ width: '100%', height: 'auto', borderRadius: '8px', maxWidth: '350px' }}
                                    />
                                  </Box>
                                ) : (
                                  <Typography variant="body1" color="textSecondary">
                                    Geen afbeelding beschikbaar
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
  
  
};

// Map Component (unchanged)
const MapComponent = ({ mjops, selectedMJOP }) => {
  const [locations, setLocations] = useState([]);
  const [center, setCenter] = useState({ lat: 52.1326, lng: 5.2913 }); // Default center
  const [zoom, setZoom] = useState(8); // Default zoom level
  const navigate = useNavigate();
  const googleMapsApiKey = 'AIzaSyClxfXoeFT3GLzwZs5zgx14vllbqbakZII';

  const mapStyles = {
    height: '100vh', // Full viewport height for the map
    width: '100%', // Full width
  };

  const modernMapStyle = [
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: '#0f2644' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry.fill',
      stylers: [{ color: '#ffffff' }], // Change natural landscape color
    },
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'all',
      stylers: [{ visibility: 'off' }],
    },
  ];

  useEffect(() => {
    const geocodeAddresses = async () => {
      const geocodedLocations = [];

      for (let mjop of mjops) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              mjop.address
            )}&key=${googleMapsApiKey}`
          );

          if (response.data.results.length > 0) {
            const { lat, lng } = response.data.results[0].geometry.location;
            geocodedLocations.push({ lat, lng, id: mjop.id, projectName: mjop.projectName });
          } else {
            console.error(`No geocode results for: ${mjop.address}`);
          }
        } catch (error) {
          console.error('Error geocoding address:', mjop.address, error);
        }
      }

      setLocations(geocodedLocations);
    };

    if (mjops.length) {
      geocodeAddresses();
    }
  }, [mjops]);

  // Watch for changes to selectedMJOP and adjust center and zoom
  useEffect(() => {
    if (selectedMJOP) {
      const selectedLocation = locations.find(loc => loc.id === selectedMJOP._id);
      if (selectedLocation) {
        setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng }); // Center on the selected MJOP
        setZoom(15); // Zoom in when an MJOP is selected
      }
    }
  }, [selectedMJOP, locations]);

  // Filter locations to show only the selected MJOP, or all if none is selected
  const filteredLocations = selectedMJOP
    ? locations.filter(loc => loc.id === selectedMJOP._id)
    : locations;

  const handleMarkerClick = (location) => {
    setCenter({ lat: location.lat, lng: location.lng }); // Center the map on the clicked marker
    setZoom(15); // Zoom in to level 15 when a marker is clicked
    navigate(`/view-mjop/${location.id}`);
  };

  return (
    <Box sx={{ height: '100vh', width: '100%' }}> {/* Full viewport height and width */}
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={zoom} // Use the zoom state
          center={center} // Use the center state
          options={{ styles: modernMapStyle }} // Apply modernMapStyle here
        >
          {filteredLocations.map((location, index) => (
            <Marker
              key={index}
              position={{ lat: location.lat, lng: location.lng }}
              title={location.projectName}
              onClick={() => handleMarkerClick(location)} // Handle marker click
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </Box>
  );
};

// Main Component Export (unchanged)
const MainComponent = () => {
  const [mappedMJOPs, setMappedMJOPs] = useState([]);
  const [selectedMJOP, setSelectedMJOP] = useState(null);  // Track selected MJOP
  const [searchTerm, setSearchTerm] = useState(''); // Search term state

  return (
    <Box sx={{ width: '100vw', height: '90vh', overflow: 'hidden' }}> {/* Full viewport width and height */}
      <Grid container spacing={0} sx={{ height: '100%' }}> {/* Set Grid to 100% height */}
        <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}> {/* Full height, scrollable content */}
          <MJOPList
            setMappedMJOPs={setMappedMJOPs}
            setSelectedMJOP={setSelectedMJOP}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ height: '100%' }}> {/* Full height for the map */}
          <MapComponent mjops={mappedMJOPs} selectedMJOP={selectedMJOP} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainComponent;
