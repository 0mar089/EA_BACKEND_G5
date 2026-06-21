import weaviate, { WeaviateClient } from 'weaviate-client';
import { config } from './config';
import Logging from '../library/Logging';

let weaviateClient: WeaviateClient | null = null;

export const getWeaviateClient = async (): Promise<WeaviateClient> => {
  if (!weaviateClient) {
    if (!config.weaviate.url || !config.weaviate.apiKey) {
      throw new Error('Faltan WEAVIATE_URL o WEAVIATE_API_KEY en la configuración del backend.');
    }

    try {
      weaviateClient = await weaviate.connectToWeaviateCloud(config.weaviate.url, {
        authCredentials: new weaviate.ApiKey(config.weaviate.apiKey),
      });
      Logging.info('Conexión a Weaviate establecida correctamente.');
    } catch (error) {
      Logging.error('Error al conectar a Weaviate: ' + error);
      throw error;
    }
  }
  return weaviateClient;
};
