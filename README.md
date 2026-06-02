# EETAC Virtual Assistant - Backend (EA_BACKEND_G5)

Aquest és el directori del backend per a la implementació de l'assistent virtual acadèmic **"Toni"** de la EETAC.

## Descripció de l'Estat de l'Exercici
L'exercici s'ha completat al **100%** i es troba plenament operatiu, complint amb tots els requeriments de la pràctica de RAG (Retrieval-Augmented Generation).

---

## Parts Operatives

1. **Configuració i Connexió de Weaviate (`src/config/weaviate.ts`)**:
   - Connexió configurada i validada amb la instància de Weaviate Cloud.
   - Verificació del cluster de Weaviate durant l'arrencada del servidor en `server.ts`.

2. **Servei de l'Assistent (`src/services/assistant.ts`)**:
   - Recuperació d'informació acadèmica rellevant mitjançant cerques vectorials/paraules clau (BM25) a Weaviate.
   - **Expansió de consultes integrada**: Gestió automàtica de sinònims per a abreviatures de cursos en català i castellà (ex: `1er`/`1ro` $\rightarrow$ `1º`, `2ndo`/`2nd` $\rightarrow$ `2º`, `3er`/`3ro` $\rightarrow$ `3º`, `4rto` $\rightarrow$ `4º`).
   - Límits de cerca ampliats (`limit: 10`) per garantir la recuperació de tots els cuatrimestres.
   - Integració i petició directa a l'API de l'LLM de la UPC (`http://10.4.119.50:8080/api/generate`) amb el model `qwen2.5:14b` i streaming desactivat per processar respostes completes.
   - **Filtres de seguretat (Prompt Injection & Masters)**: Prompt del sistema blindat per evitar al·lucinacions, respondre preguntes fora de context (com codi de programació) o temes no permesos (com Màsters).

3. **Controlador i Rutes (`src/controllers/assistant.ts` i `src/routes/Assistant.ts`)**:
   - Endpoint `/api/assistant/chat` (o `/chat`) exposat correctament per rebre les preguntes del frontend.

4. **Script de Població de Dades (`src/scripts/seed-weaviate.ts`)**:
   - Ingesta de la base de dades amb tota la informació acadèmica dels graus.
   - Unificació del bloc comú dels dos primers anys de Telemàtica i Telecomunicacions, i càrrega estructurada dels cursos següents.

---

## Parts Pendents de Codificar
- **Cap**: Totes les funcionalitats demanades en el backend estan totalment implementades, provades i en funcionament.
