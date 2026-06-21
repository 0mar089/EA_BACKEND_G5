# Integración de Matomo Analytics - Backend

Este documento detalla la implementación y el flujo de trabajo de la integración de **Matomo** en el backend del proyecto.

## 1. Configuración Inicial (`config.ts`)

Se encarga de leer y gestionar las variables de entorno definidas en el archivo `.env` necesarias para la conexión con el servidor de Matomo (URL, Token, habilitación, etc.).

## 2. Servicio de Matomo (`services/matomo.ts`)

Este archivo es el núcleo de la integración. Se encarga de construir los parámetros requeridos por la API de Matomo y enviar las peticiones HTTP de forma asíncrona.

- **Interfaz de Peticiones:** Se ha creado una estructura de datos (interfaz) para enviar las peticiones formateadas correctamente a Matomo, definiendo campos como la acción realizada, la IP del cliente, identificadores, etc.
- **Inicialización:** Si Matomo está habilitado (variable en `true` en el `.env`), el constructor se activa y registra un mensaje informativo de inicialización en la consola.
- **Envío de Datos (`sendToMatomo`):**
  - Comprueba si la integración está activa mediante las variables de entorno. Si es `false`, aborta el envío.
  - Recopila y añade los parámetros estructurados en la interfaz.
  - Procesa la dirección IP utilizando la función `isLocalOrLoopbackIP` para evitar el rastreo de IPs locales o de pruebas.
  - Firma la petición inyectando el **Token de Autenticación** (`token_auth`).
  - Finalmente, define la URL de _tracking_ y envía la petición de forma asíncrona (en segundo plano) para no bloquear ni ralentizar la respuesta de la API al cliente.
- **Extracción de Datos del Cliente (`getClientDetails`):** Se utiliza esta función para procesar la petición HTTP (`req`) y extraer automáticamente todos los detalles relevantes del cliente (User-Agent, idioma, IP, etc.) para enviarlos a Matomo.

## 3. Middleware de Seguimiento (`middleware/matomo.ts`)

Actúa como interceptor global para registrar todas las interacciones con la API.

- **Cronometraje:** Al recibir una petición, el middleware inicia un cronómetro y usa `next()` para dejar pasar la petición al controlador. Al finalizar, captura el tiempo total de respuesta.
- **Gestión de Autenticación:** Depende del middleware de autenticación previo. Si la petición no lleva token, `req.user` es `undefined`. Al enviar esta información a Matomo, el usuario queda registrado correctamente como visitante **anónimo**.

## Estado de la funcionalidad

En el proyecto actualmente no hay errores y funciona el matomo a la perfección capturando todas las peticiones. Falta aplicar el tracking de eventos a unos cuandos endoints, porque solo estan en 3.

## AI Log (Registro de Prompts)

IA usada --> Gemini 3.5 Flash para codigo + ChatGPT para conceptos y teoria

| Prompt                                                                                                                                                                                                                                                                      | Output de la IA                                                                                                                                                                                                                                                                                             |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.** Hazme el readme bonito y utilizando los apuntes de matomo mios que te voy a pasar                                                                                                                                                                                    | _(La IA generó el documento README_MINIMO2.md inicial formateando los apuntes en Markdown)_                                                                                                                                                                                                                 |
| **2.** Hazme la tabla del ai log para que el profesor tenga constancia de los prompts que he puesto a la ia                                                                                                                                                                 | _(La IA generó esta misma tabla registrando todas las interacciones solicitadas)_                                                                                                                                                                                                                           |
| **3.** Explicame que es matomo de manera sencilla como si fuera un niño de la eso para entenderlo a la perfección, ten en cuenta que nunca hbai escuchado este software y tambien ten en cuenta que no entienco tecnicismos y que si usas uno me tienes que explicar que es | Matomo es como un "detective" para tu página web. Sirve para saber cuánta gente entra, desde dónde, qué hacen y cuánto tiempo se quedan, pero protegiendo su privacidad. Es como Google Analytics pero tú eres el dueño absoluto de los datos...                                                            |
| **4.** Cual es el mejor acercamiento en mi proyecto para utilizar matomo, en el backoffice?? usando web de matomo normal??                                                                                                                                                  | Te recomiendo usar la web de Matomo normal. Crear un backoffice propio para integrar todos los gráficos y métricas desde cero es mucho más difícil y laborioso que usar el panel web completo que Matomo ya trae integrado. Aqui tambien el toni me ha dicho lo mismo que use el panel web de Matomo        |
| **5.** Que archivos deberia de tocar a parte del .env, configts y el service para implementar el matomo?                                                                                                                                                                    | Aparte de esos archivos, también deberías tocar el `middleware` (para interceptar el tiempo de las peticiones globales) y los `controllers` (para trackear las acciones específicas de los usuarios).                                                                                                       |
| **6.** Como puedo hacer que tambien se traqueen eventos en la web (como eventos de auth, eventos de subir una imagen, de comentar en un post...)                                                                                                                            | Para ello, debes añadir una línea de código específica en los controladores correspondientes (usando `matomoService.trackEvent()`) para enviar esos eventos puntuales justo cuando ocurren en la base de datos...                                                                                           |
| **7.** Porque nome salen eventos cuando tecnicamente se estan enviando sin ningun error?                                                                                                                                                                                    | Porque Matomo no siempre procesa los datos en tiempo real exacto. A veces recopila la información y tarda un poco en procesarla y mostrarla en los gráficos del panel de control.                                                                                                                           |
| **8.** No entiendo que he de poner en el middleware, hazme el codigo y explicamelo porfa.                                                                                                                                                                                   | _(Se proporcionó el código)_. El concepto es guardar el tiempo exacto al entrar la petición (`Date.now()`). Cuando la petición termina (`res.on('finish')`), se vuelve a coger el tiempo actual y se le resta el inicial (`Date.now() - start`). Así sabemos cuántos milisegundos ha tardado en procesarse. |
| **9.** Dame la linea de codigo de logger info para ver la url a la full urls de matomo porfa                                                                                                                                                                                | _(Se proporcionó el código)_. Se sugirió añadir la línea `Logging.info('[Matomo] FULL URL: ' + fullTrackUrl);` para depurar y visualizar exactamente qué URL se estaba construyendo antes de hacer el _fetch_ a Matomo.                                                                                     |
| **10.** Dame la funcion que deberia de poner para que se filtreen ips y no se envie la mia de loopback ni nada de eso                                                                                                                                                       | _(Se proporcionó el código)_. Se proporcionó la función `isLocalOrLoopbackIp` que comprueba si la IP entrante es local (como `127.0.0.1`, `localhost` o rangos de red privada) para evitar enviar datos de desarrollo o tráfico interno al panel de Matomo.                                                 |
