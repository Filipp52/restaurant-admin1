const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;

// Разрешаем все CORS запросы
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept']
}));

// Раздаем статические файлы
app.use(express.static('.'));

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`📍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`📍 Headers:`, {
    authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
    'content-type': req.headers['content-type'] || 'none'
  });
  next();
});

// Создаем прокси middleware
const apiProxy = createProxyMiddleware({
  target: 'http://tastyworld-pos.ru:1212',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/v1' // Преобразует /api в /api/v1
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying: ${req.method} ${req.path} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`📥 Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Используем прокси для всех запросов к /api
app.use('/api', apiProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

// Запускаем сервер
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ==========================================');
  console.log('🚀 TastyWorld Proxy Server запущен!');
  console.log('🚀 ==========================================');
  console.log(`🚀 Локальный URL: http://localhost:${PORT}`);
  console.log(`🚀 Проксируем к: http://tastyworld-pos.ru:1212`);
  console.log(`🚀 Пример запроса: http://localhost:${PORT}/api/client_points/me`);
  console.log('🚀 ==========================================');
});