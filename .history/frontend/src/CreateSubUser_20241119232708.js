import React, { useState } from 'react';
import axios from 'axios';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';

const CreateSubUser = ({ mainAccountId, groupId }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post('http://34.34.100.96:5000/create-subuser', { username, password, name, address, phoneNumber, email, mainAccountId, groupId });
      setSuccess('Subuser created and email sent');
      setUsername('');
      setPassword('');
      setName('');
      setAddress('');
      setPhoneNumber('');
      setEmail('');
    } catch (err) {
      setError('Error creating subuser');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mt: 1, bgcolor: 'background.paper', p: 3, borderRadius: 1, boxShadow: 3 }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Create Subuser
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="address"
          label="Address"
          name="address"
          autoComplete="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="phoneNumber"
          label="Phone Number"
          name="phoneNumber"
          autoComplete="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 3, mb: 2 }}
        >
          Create Subuser
        </Button>
      </Box>
    </Container>
  );
};

export default CreateSubUser;
