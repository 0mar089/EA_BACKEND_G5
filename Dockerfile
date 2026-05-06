#Imagen base oficial de Node.js
FROM node:18

#Directorio de trabajo dentro del contenedor
WORKDIR /app

#Copia todo el código fuente y archivos de dependencias
COPY . .

#Instala dependencias
RUN npm install

#Compila TypeScript a JavaScript
RUN npm run build

#Expone el puerto (ajusta si usas otro)
EXPOSE 1337

#Comando para iniciar la app
CMD ["node", "build/server.js"]