import { getWeaviateClient } from '../config/weaviate';
import Logging from '../library/Logging';

const testConnection = async () => {
  try {
    Logging.info('Intentando conectar con Weaviate...');
    const client = await getWeaviateClient();

    Logging.info('¡Conexión establecida con Weaviate!');

    // Verificar si la conexión responde obteniendo metadatos
    // En weaviate-client v3: client.isConnected() o recuperar metadatos
    const isReady = await client.isReady();
    Logging.info(`¿El cluster está listo?: ${isReady}`);

    process.exit(0);
  } catch (error) {
    Logging.error('Error al probar la conexión con Weaviate: ' + error);
    process.exit(1);
  }
};

testConnection();
