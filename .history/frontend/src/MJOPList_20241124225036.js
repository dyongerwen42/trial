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
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// MJOP List Component
const MJOPList = ({ setMappedMJOPs, setSelectedMJOP, searchTerm, setSearchTerm }) => {
  const [mjops, setMJOPs] = useState([]);
  const navigate = useNavigate();
  const googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';

  useEffect(() => {
    const fetchMJOPs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/mjops', { withCredentials: true });
        const mjopsData = response.data;

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
      Header: '',
      id: 'expander',
      Cell: ({ row }) => (
        <IconButton {...row.getToggleRowExpandedProps()}>
          {row.isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      )
    }
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: filteredMJOPs }, useExpanded);

  return (
    <Paper elevation={4} sx={{ padding: 4, borderRadius: 4, height: '100%', overflowY: 'auto' }}>
      <TextField
        label="Zoek project"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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
                      '&:hover': { backgroundColor: '#f0f0f0', cursor: 'pointer' },
                    }}
                    onClick={() => navigate(`/dashboard?mjop-id=${row.original._id}`)}  // Navigate with query parameter
                  >
                    {row.cells.map(cell => (
                      <TableCell key={cell.id} {...cell.getCellProps()} sx={{ padding: '12px 16px' }}>
                        {cell.render('Cell')}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.isExpanded ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <Collapse in={row.isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, padding: 3, backgroundColor: '#f9f9f9', borderRadius: '12px', boxShadow: 3 }}>
                            <Grid container spacing={4}>
                              {/* Additional Project Details */}
                              <Grid item xs={12} md={7}>
                                {/* Add project information here */}
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
    height: '100vh',
    width: '100%',
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
      stylers: [{ color: '#ffffff' }],
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

  useEffect(() => {
    if (selectedMJOP) {
      const selectedLocation = locations.find(loc => loc.id === selectedMJOP._id);
      if (selectedLocation) {
        setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        setZoom(15);
      }
    }
  }, [selectedMJOP, locations]);

  const handleMarkerClick = (location) => {
    setCenter({ lat: location.lat, lng: location.lng });
    setZoom(15);
    navigate(`/dashboard?mjop-id=${location.id}`);  // Navigate with query parameter
  };

  return (
    <Box sx={{ height: '100vh', width: '100%' }}>
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={zoom}
          center={center}
          options={{ styles: modernMapStyle }}
        >
          {locations.map((location, index) => (
            <Marker
              key={index}
              position={{ lat: location.lat, lng: location.lng }}
              title={location.projectName}
              onClick={() => handleMarkerClick(location)}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </Box>
  );
};

// Main Component Export
const MainComponent = () => {
  const [mappedMJOPs, setMappedMJOPs] = useState([]);
  const [selectedMJOP, setSelectedMJOP] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Box sx={{ width: '100vw', height: '90vh', overflow: 'hidden' }}>
      <Grid container spacing={0} sx={{ height: '100%' }}>
        <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}>
          <MJOPList
            setMappedMJOPs={setMappedMJOPs}
            setSelectedMJOP={setSelectedMJOP}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <MapComponent mjops={mappedMJOPs} selectedMJOP={selectedMJOP} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainComponent;
