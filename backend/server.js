require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/shelves', require('./routes/shelfRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'TwinWare — Digital Twin Warehouse Management API',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TwinWare Backend running on http://localhost:${PORT}`);
});
