import express from 'express';
import cors from 'cors';
import { getDb } from './database.js';
import settingsRoutes from './routes/settings.js';
import clientsRoutes from './routes/clients.js';
import invoicesRoutes from './routes/invoices.js';
import statsRoutes from './routes/stats.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import receiptsRoutes from './routes/receipts.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/stats', statsRoutes);

// Initialize DB
getDb().then(() => {
    console.log('Database initialized');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
