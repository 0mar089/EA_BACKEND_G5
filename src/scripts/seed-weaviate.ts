import { getWeaviateClient } from '../config/weaviate';
import Logging from '../library/Logging';

const academicData = [
    {
        title: 'Grado en Ingeniería de Satélites',
        category: 'Grado',
        content: 'El Grado en Ingeniería de Satélites de la EETAC ofrece formación en el diseño, desarrollo y operación de satélites y sistemas espaciales. Cubre tecnologías de telecomunicación espacial, cargas útiles, guiado y navegación. Las asignaturas clave incluyen Comunicaciones por Satélite, Órbitas y Dinámica Espacial, Sistemas de Energía y Propulsión, y Sensores de Teledetección.'
    },
    {
        title: 'Grado en Ingeniería de Sistemas Aeroespaciales (Menciones: Aeronavegación / Aeropuertos)',
        category: 'Grado',
        content: 'El Grado en Ingeniería de Sistemas Aeroespaciales de la EETAC se centra en el sector aeroespacial. La mención de Aeronavegación profundiza en sistemas de navegación aérea, aviónica y control de tráfico aéreo. La mención de Aeropuertos se centra en el diseño, gestión y explotación de infraestructuras aeroportuarias. Asignaturas comunes y de mención incluyen: Navegación Aérea, Aviónica, Infraestructuras Aeroportuarias, y Gestión de Tráfico Aéreo.'
    },
    {
        title: 'Grado en Ingeniería de Sistemas de Telecomunicación',
        category: 'Grado',
        content: 'El Grado en Ingeniería de Sistemas de Telecomunicación de la EETAC forma a profesionales en sistemas de comunicación por radio, fibra óptica, televisión e instrumentación electrónica. Asignaturas destacadas: Teoría de la Comunicación, Electrónica de Comunicaciones, Sistemas de Radiocomunicación, Antenas y Propagación de Ondas.'
    },
    {
        title: 'Grado en Ingeniería Telemática',
        category: 'Grado',
        content: 'El Grado en Ingeniería Telemática de la EETAC se especializa en redes de computadores, internet, seguridad informática y desarrollo de servicios en la red (web/móvil). Las asignaturas clave son Redes de Computadores, Protocolos de Comunicación, Seguridad en Redes, Sistemas Distribuidos, y Desarrollo de Aplicaciones en Red.'
    },
    // Asignaturas y cursos ejemplo para Ingeniería de Satélites
    {
        title: 'Asignaturas de Primer Curso - Ingeniería de Satélites',
        category: 'Asignaturas',
        content: 'El primer curso del Grado en Ingeniería de Satélites contiene asignaturas fundamentales: Matemáticas I, Física I, Introducción a la Programación, Química, y Sistemas Digitales en el primer semestre; y Matemáticas II, Física II, Teoría de Circuitos y Fundamentos de Satélites en el segundo semestre.'
    },
    {
        title: 'Asignaturas de Segundo Curso - Ingeniería de Satélites',
        category: 'Asignaturas',
        content: 'El segundo curso de Ingeniería de Satélites incluye: Matemáticas III, Electrónica de Señal, Señales y Sistemas, y Mecánica Orbital en el tercer semestre; y Electromagnetismo, Transmisión de Datos, y Propulsión Espacial en el cuarto semestre.'
    },
    // Asignaturas Aeroespaciales
    {
        title: 'Asignaturas de Mención Aeronavegación - Sistemas Aeroespaciales',
        category: 'Asignaturas',
        content: 'Las asignaturas específicas de la mención de Aeronavegación (Sistemas Aeroespaciales) incluyen: Sistemas de Guiado y Navegación, Instrumentación de Vuelo (Aviónica), Control del Tráfico Aéreo (ATC), Comunicaciones Aeronáuticas y Sistemas de Radar.'
    },
    {
        title: 'Asignaturas de Mención Aeropuertos - Sistemas Aeroespaciales',
        category: 'Asignaturas',
        content: 'Las asignaturas específicas de la mención de Aeropuertos (Sistemas Aeroespaciales) incluyen: Diseño de Campos de Vuelo, Terminales de Pasajeros, Seguridad Aeroportuaria, Impacto Ambiental en Aeropuertos y Planificación Aeroportuaria.'
    },
    // Bloque común (Fase Inicial y Obligatoria compartida entre Ingeniería Telemática e Ingeniería de Sistemas de Telecomunicación)
    {
        title: 'Asignaturas del Cuatrimestre 1A (Primer Semestre - 1º Curso) - Bloque Común (Ingeniería Telemática e Ingeniería de Sistemas de Telecomunicación)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 1A (primer semestre del primer curso, Fase Inicial del Bloque Común para Telemática y Telecos) se cursan las siguientes asignaturas:\n- **Cálculo** (6 ECTS)\n- **Física** (6 ECTS)\n- **Introducción a los Ordenadores** (6 ECTS)\n- **Electrónica en las Telecomunicaciones** (6 ECTS)\n- **Empresa, Telecomunicaciones y Sostenibilidad** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 1B (Segundo Semestre - 1º Curso) - Bloque Común (Ingeniería Telemática e Ingeniería de Sistemas de Telecomunicación)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 1B (segundo semestre del primer curso, Fase Inicial del Bloque Común para Telemática y Telecos) se cursan las siguientes asignaturas:\n- **Matemáticas de la Telecomunicación** (6 ECTS)\n- **Álgebra Lineal y Aplicaciones** (6 ECTS)\n- **Proyecto de Programación** (6 ECTS)\n- **Circuitos y Sistemas Lineales** (6 ECTS)\n- **Fundamentos de Telemática** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 2A (Tercer Semestre - 2º Curso) - Bloque Común (Ingeniería Telemática e Ingeniería de Sistemas de Telecomunicación)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 2A (tercer semestre del segundo curso, Fase Obligatoria del Bloque Común para Telemática y Telecos) se cursan las siguientes asignaturas:\n- **Probabilidad y Estadística** (6 ECTS)\n- **Procesamiento Digital de la Señal** (6 ECTS)\n- **Fundamentos de Comunicaciones** (6 ECTS)\n- **Circuitos y Sistemas Digitales** (6 ECTS)\n- **Interconexión de Redes** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 2B (Cuarto Semestre - 2º Curso) - Bloque Común (Ingeniería Telemática e Ingeniería de Sistemas de Telecomunicación)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 2B (cuarto semestre del segundo curso, Fase Obligatoria del Bloque Común para Telemática y Telecos) se cursan las siguientes asignaturas:\n- **Sistemas Operativos** (6 ECTS)\n- **Ondas Electromagnéticas en Sistemas de Comunicación** (7.5 ECTS)\n- **Emisores y Receptores** (4.5 ECTS)\n- **Circuitos Electrónicos y Sistemas de Alimentación** (6 ECTS)\n- **Arquitectura y Protocolos de Internet** (6 ECTS)'
    },
    // Asignaturas y cursos específicos para Ingeniería Telemática
    {
        title: 'Asignaturas del Cuatrimestre 3A (Quinto Semestre - 3º Curso) - Ingeniería Telemática',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 3A (primer semestre del tercer curso, Fase Obligatoria específica) de Ingeniería Telemática se cursan las siguientes asignaturas:\n- **Movilidad, Redes y Servicios** (6 ECTS)\n- **Redes Locales, de Acceso y Metropolitanas** (6 ECTS)\n- **Diseño de Servicios y Aplicaciones** (10 ECTS)\n- **Análisis y Dimensionamiento de Redes** (4 ECTS)\n- **Servicios Audiovisuales sobre Internet** (4 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 3B (Sexto Semestre - 3º Curso) - Ingeniería Telemática',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 3B (segundo semestre del tercer curso, Fase Obligatoria específica) de Ingeniería Telemática se cursan las siguientes asignaturas:\n- **Planificación de Redes** (4 ECTS)\n- **Redes de Transporte** (4 ECTS)\n- **Seguridad en Redes** (4 ECTS)\n- **Ingeniería de Aplicaciones** (12 ECTS)\n- **Infraestructuras y Operación de Telecomunicaciones** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 4A (Séptimo Semestre - 4º Curso) - Ingeniería Telemática',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 4A (primer semestre del cuarto curso) de Ingeniería Telemática se cursan las siguientes asignaturas:\n- **Optativas** (12 ECTS)\n- **Prácticas externas** (12 ECTS)\n- **Tecnologías de Información Cuántica** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 4B (Octavo Semestre - 4º Curso) - Ingeniería Telemática',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 4B (segundo semestre del cuarto curso) de Ingeniería Telemática se cursan las siguientes asignaturas:\n- **Optativas / Extensión Universitaria** (6 ECTS)\n- **Trabajo de Fin de Grado (TFG)** (24 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 3A (Quinto Semestre - 3º Curso) - Ingeniería de Sistemas de Telecomunicación (Telecos)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 3A (quinto semestre, Fase Obligatoria específica) de Ingeniería de Sistemas de Telecomunicación se cursan:\n- **Comunicaciones Ópticas** (6 ECTS)\n- **Circuitos Electrónicos para las Telecomunicaciones** (4.5 ECTS)\n- **Proyecto de Ingeniería del Software** (3 ECTS)\n- **Ingeniería de RF (Radiofrecuencia)** (10.5 ECTS)\n- **Comunicaciones Inalámbricas** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 3B (Sexto Semestre - 3º Curso) - Ingeniería de Sistemas de Telecomunicación (Telecos)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 3B (sexto semestre, Fase Obligatoria específica) de Ingeniería de Sistemas de Telecomunicación se cursan:\n- **Sistemas de RF (Radiofrecuencia)** (6 ECTS)\n- **Comunicaciones Audiovisuales** (6 ECTS)\n- **Laboratorio de Comunicaciones Inalámbricas** (6 ECTS)\n- **Ingeniería de Software Radio** (6 ECTS)\n- **Infraestructuras y Operación de Telecomunicaciones** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 4A (Séptimo Semestre - 4º Curso) - Ingeniería de Sistemas de Telecomunicación (Telecos)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 4A (séptimo semestre, Fase Obligatoria y Especialización) de Ingeniería de Sistemas de Telecomunicación se cursan:\n- **Optativas** (12 ECTS)\n- **Prácticas externas** (12 ECTS)\n- **Tecnologías de Información Cuántica** (6 ECTS)'
    },
    {
        title: 'Asignaturas del Cuatrimestre 4B (Octavo Semestre - 4º Curso) - Ingeniería de Sistemas de Telecomunicación (Telecos)',
        category: 'Asignaturas',
        content: 'En el cuatrimestre 4B (octavo semestre) de Ingeniería de Sistemas de Telecomunicación se cursan:\n- **Optativas / Extensión Universitaria** (6 ECTS)\n- **Trabajo de Fin de Grado (TFG)** (24 ECTS)'
    }
];

const seedWeaviate = async () => {
    try {
        Logging.info('Conectando a Weaviate...');
        const client = await getWeaviateClient();
        const collectionName = 'AcademicInfo';

        Logging.info(`Comprobando si la colección "${collectionName}" ya existe...`);
        const exists = await client.collections.exists(collectionName);

        if (exists) {
            Logging.warning(`Eliminando colección previa "${collectionName}" para re-ingestar...`);
            await client.collections.delete(collectionName);
        }

        Logging.info(`Creando colección "${collectionName}"...`);
        // Creamos la colección sin vectorizador para que soporte búsquedas BM25/keyword out-of-the-box sin depender de APIs de terceros
        await client.collections.create({
            name: collectionName,
            properties: [
                { name: 'title', dataType: 'text' as const },
                { name: 'category', dataType: 'text' as const },
                { name: 'content', dataType: 'text' as const }
            ]
        });

        const collection = client.collections.get(collectionName);

        Logging.info('Insertando datos académicos en Weaviate...');
        for (const data of academicData) {
            await collection.data.insert({
                properties: {
                    title: data.title,
                    category: data.category,
                    content: data.content
                }
            });
            Logging.info(`Insertado: ${data.title}`);
        }

        Logging.info('¡Ingesta en Weaviate finalizada con éxito!');
        process.exit(0);
    } catch (error) {
        Logging.error('Error durante la ingesta en Weaviate:');
        console.error(error);
        process.exit(1);
    }
};

seedWeaviate();
