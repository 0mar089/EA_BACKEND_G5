import axios from 'axios';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmQ5MTM4ZmYwYmU0ZWI5OTVlYWNjZCIsIm5vbWJyZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20iLCJyb2wiOiJhZG1pbiIsImlhdCI6MTc3ODMyMzM5NCwiZXhwIjoxNzc4MzMwNTk0fQ.R5rMJt69tUda3YE1OR15Lk3bJJWzxFnToASVqnWpP04';

async function checkApi() {
    try {
        const response = await axios.get('http://localhost:1337/usuarios?limit=1', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('--- ESTRUCTURA DE USUARIO RECIBIDA ---');
        console.log(JSON.stringify(response.data.docs[0], null, 2));
        
        if (response.data.docs[0].rol) {
            console.log('\n✅ El campo "rol" SI está presente en la respuesta.');
        } else {
            console.log('\n❌ El campo "rol" NO está presente en la respuesta.');
        }
    } catch (error: any) {
        console.error('Error en la petición:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

checkApi();
