import weaviate, { WeaviateClient } from 'weaviate-client';
import { config } from './config';

let weaviateClient: WeaviateClient | null = null;

export const getWeaviateClient = async (): Promise<WeaviateClient> => {
    if (!weaviateClient) {
        if (!config.weaviate.url || !config.weaviate.apiKey) {
            throw new Error('Faltan WEAVIATE_URL o WEAVIATE_API_KEY en la configuración del backend.');
        }

        try {
            weaviateClient = await weaviate.connectToWeaviateCloud(
                config.weaviate.url,
                {
                    authCredentials: new weaviate.ApiKey(config.weaviate.apiKey)
                }
            );

        } catch (error) {
            console.error('Error al conectar a Weaviate:', error);
            throw error;
        }
    }
    return weaviateClient;
};
