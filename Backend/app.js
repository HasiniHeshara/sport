require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./Routes/userRoutes')

connectDB();

const app = express();

app.use(express.json());
app.use('api/users/',userRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});