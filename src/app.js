import express from 'express';

const app = express();

// ==========================================
// Application Settings
// ==========================================

app.disable('x-powered-by');

// ==========================================
// Global Middlewares
// ==========================================

app.use(
  express.json({
    limit: '1mb',
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
  }),
);

// ==========================================
// 404 - Not Found
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ==========================================
// Global Error Handler
// ==========================================

const errorHandler = (error, _req, res, _next) => {
  console.error(error);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

  res.status(500).json({
    success: false,
    message,
  });
};

app.use(errorHandler);

export default app;
