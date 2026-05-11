import mongoose from 'mongoose';
import UsuarioService from './src/services/usuario';
import { config } from './src/config/config';

async function testResponse() {
    try {
        await mongoose.connect(config.mongo.url);
        console.log('--- TEST: getAllUsuariosAdmin ---');
        
        const result = await UsuarioService.getAllUsuariosAdmin(
            undefined, // search
            undefined, // universidades
            undefined, // grados
            undefined, // asignaturas
            1,         // page
            1          // limit (solo uno para ver la estructura)
        );

        console.log('Respuesta del servicio:');
        console.log(JSON.stringify(result.docs[0], null, 2));
        
        console.log('\nCampos presentes en el primer documento:');
        console.log(Object.keys(result.docs[0].toObject ? result.docs[0].toObject() : result.docs[0]));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

testResponse();
