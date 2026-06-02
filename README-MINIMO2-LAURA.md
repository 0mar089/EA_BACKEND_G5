# Backend - Mòdul de Gestió d'Esdeveniments (Mapa Interactiu)

Aquest repositori conté la lògica del backend per donar suport a la història d'usuari: 
> **"Com a usuari, vull veure un mapa interactiu a la web i a l'app per a visualitzar els esdeveniments disponibles al meu voltant."**

S'han realitzat modificacions recents per estabilitzar els serveis de la plataforma WEB i l'API.

## 📋 Estat de l'Exercici

L'arquitectura base i els principals punts d'accés (endpoints) per a la gestió d'esdeveniments individuals es troben implementats i estables. Actualment, el backend permet la interacció de l'usuari amb els esdeveniments (crear, eliminar, unir-se i abandonar). No obstant això, el sistema de filtratge geogràfic necessari per al mapa interactiu es troba parcialment programat i requereix correccions.

---

## ✅ Parts Operatives (Funciona correctament)

* **Crear un esdeveniment (`POST`):** Permet registrar un nou esdeveniment aportant les dades necessàries (coordenades, títol, descripció, etc.).
* **Obtenir un esdeveniment (`GET /:id`):** Retorna de manera correcta la informació detallada d'un esdeveniment concret a partir del seu identificador.
* **Eliminar un esdeveniment (`DELETE`):** Permet esborrar correctament un esdeveniment del sistema.
* **Unir-se / Abandonar un esdeveniment:** Lògica operativa que gestiona correctament la llista d'assistents a cada esdeveniment quan un usuari decideix apuntar-s'hi o donar-se de baixa.

---

## ⏳ Parts Pendents i/o a Corregir

* **Arreglar el filtratge a `Get all eventos` (Llistat general per proximitat):**
    * **Problema actual:** Tot i que el backend rep correctament el paràmetre de **distància** enviat des de la WEB/App, el sistema ignora aquest límit i respon mostrant **tots els esdeveniments registrats a la base de dades**, sense aplicar el filtre geogràfic al voltant de l'usuari.
    * **Tasca pendent:** Corregir la consulta (query) a la base de dades (ex. revisar l'operador `$near` o `$geoWithin` de MongoDB/Mongoose) perquè utilitzi correctament el radi de distància aportat i així alimentar correctament el mapa interactiu.

---

## 🛠️ Tecnologies Utilitzades
* Node.js
* Express
* Mongoose / MongoDB Atlas