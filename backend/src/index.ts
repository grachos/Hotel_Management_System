import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🌐 Servidor Hotel Gestión corriendo en puerto ${config.port}`);
  console.log(`📡 API disponible en http://localhost:${config.port}/api`);
  console.log(`🔧 Modo: ${config.nodeEnv}`);
});

export default app;
