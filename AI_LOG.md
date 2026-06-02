# Registro de Uso de IA - Backend

**Herramienta:** Antigravity (Google DeepMind)  
**Modelo:** Gemini 3.5 Flash / Pro

---

### 1. Generación del System Prompt del Asistente
*   **Prompt:** "Créame un prompt para añadir de contexto en un llm para que actué como un asesor en una app para estudiantes donde pueden preguntar sobre las carreras que se hacen en la EETAC (masters no) (Grado en Ingeniería de Satélites, Grado en Ingeniería de Sistemas Aeroespaciales (menciones en Aeronavegación/Aeropuertos), Grado en Ingeniería de Sistemas de Telecomunicación, Grado en Ingeniería Telemática), información sobre cada curso (desglose de asignaturas) de una de las carreras que se hacen en ese campus y informacion sobre una asignatura en concreto que se pueden sacar de la propia pagina de la eetac. Ten en cuenta cual seria la mejor estructuracion para el prompt de manera que sea lo mas eficiente posible."
*   **Incoherencias:** El LLM inicialmente generaba respuestas demasiado extensas, incluyendo saludos de bienvenida repetitivos y explicaciones genéricas redundantes que hacían perder concisión a la interfaz del chat.
*   **Solución:** Se depuró el prompt del sistema añadiendo una regla estricta de "Máxima Concisión" y delimitando el filtro exclusivo a los 4 grados oficiales para rechazar explícitamente cualquier mención a Masters.

---

### 2. Configuración de Weaviate y Servicio RAG
*   **Prompt:** "Arreglame la conexion actual con weaviate, que me da el error (menciona respuestas en la consola)"
*   **Incoherencias:** Surgieron errores de compilación TypeScript (`TS5011`) debido a diferencias en los tipos del SDK v3 de Weaviate y la falta del parámetro `"rootDir"` en el compilador.
*   **Solución:** Se actualizó la versión del paquete `typescript` en las dependencias del backend y se añadió `"rootDir": "./src"` en el `tsconfig.json`.

---

### 3. Ingesta de Datos Académicos (Seeding)
*   **Prompt:** "Crear un script para poblar Weaviate unificando los dos primeros años comunes de Telecos y Telemática. Y teniendo en cuenta las imagenes proporcionadas de las asignaturas de telematica y telecos."
*   **Incoherencias:** Ninguna relevante. Los datos comunes y los bloques diferenciados de 3º y 4º curso se estructuraron correctamente en cuatrimestres.
*   **Solución:** Se programó y ejecutó `seed-weaviate.ts` que elimina la colección anterior si existe y realiza la ingesta limpia de los 16 bloques académicos.

---

### 4. Ajuste de Búsqueda y Expansión de Consultas
*   **Prompt:** "Solucionar que a veces solo devuelva la mitad de las asignaturas o falle al buscar abreviaturas como '2ndo'."
*   **Incoherencias:** La búsqueda por palabras clave de Weaviate (BM25) no emparejaba correctamente la abreviatura "2ndo" con "2º" y el límite original de 4 elementos truncaba la respuesta impidiendo retornar ambos cuatrimestres (A y B).
*   **Solución:** Se modificó `assistant.ts` para aumentar el límite de búsqueda a 10 y se añadió expansión de consultas por expresiones regulares para normalizar términos (`1ro`, `2ndo`, `3ro`, `4rto` $\rightarrow$ `1º`, `2º`, `3º`, `4º`).

---

### 5. Blindaje contra Inyecciones de Prompt
*   **Prompt:** "Prevenir inyecciones de prompt como cuando el usuario pide código de Bubble Sort en C++."
*   **Incoherencias:** El LLM se disculpaba por no tener la información en el contexto pero acto seguido respondía la inyección mostrando el código general de C++.
*   **Solución:** Se reforzó el prompt del sistema en `assistant.ts` prohibiendo estrictamente usar conocimiento general o añadir explicaciones/comentarios adicionales tras la frase de rechazo obligatoria.

---

### 6. Creación del Registro de IA
*   **Prompt:** "Creame el ailog del backend"
*   **Incoherencias:** Ninguna relevante.
*   **Solución:** Se generó el archivo `AI_LOG.md` estructurado y detallado para el repositorio de backend con todos los prompts y soluciones documentadas de la sesión.
