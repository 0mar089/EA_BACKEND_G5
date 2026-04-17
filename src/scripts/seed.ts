import mongoose from 'mongoose';
import { config } from '../config/config';
import Usuario from '../models/Usuario';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Report from '../models/Report';

const seed = async () => {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(config.mongo.url);
        console.log('Conectado con éxito.');

        // Opcional: Limpiar colecciones anteriores para empezar de cero
        // console.log('Limpiando base de datos...');
        // await Usuario.deleteMany({});
        // await Post.deleteMany({});
        // await Comment.deleteMany({});
        // await Report.deleteMany({});

        console.log('Creando usuarios...');
        const usersData = [
            { nombre: 'Juan Perez', email: 'juan@univy.com', password: 'password123', rol: 'user' as const },
            { nombre: 'Maria Garcia', email: 'maria@univy.com', password: 'password123', rol: 'user' as const },
            { nombre: 'Admin User', email: 'admin@univy.com', password: 'adminpassword', rol: 'admin' as const },
            { nombre: 'Carlos Ruiz', email: 'carlos@univy.com', password: 'password123', rol: 'user' as const },
            { nombre: 'Ana Lopez', email: 'ana@univy.com', password: 'password123', rol: 'user' as const }
        ];

        const createdUsers = await Usuario.insertMany(usersData);
        console.log(`${createdUsers.length} usuarios creados.`);

        console.log('Creando posts...');
        const postsData = [];
        for (let i = 0; i < 10; i++) {
            const author = createdUsers[i % createdUsers.length];
            postsData.push({
                usuario: author._id,
                caption: `Este es mi post número ${i + 1}. #univy #college`,
                imageUrl: `https://picsum.photos/seed/${i}/800/600`,
                likes: [],
                comments: []
            });
        }
        const createdPosts = await Post.insertMany(postsData);
        console.log(`${createdPosts.length} posts creados.`);

        // Actualizar referencia de posts en usuarios
        for (const post of createdPosts) {
            await Usuario.findByIdAndUpdate(post.usuario, { $push: { posts: post._id } });
        }

        console.log('Creando comentarios...');
        const commentsData = [];
        for (let i = 0; i < 20; i++) {
            const author = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const post = createdPosts[Math.floor(Math.random() * createdPosts.length)];
            commentsData.push({
                usuario: author._id,
                post: post._id,
                texto: `Me gusta mucho este contenido! (${i + 1})`
            });
        }
        const createdComments = await Comment.insertMany(commentsData);
        console.log(`${createdComments.length} comentarios creados.`);

        // Actualizar referencia de comentarios en posts y usuarios
        for (const comment of createdComments) {
            await Post.findByIdAndUpdate(comment.post, { $push: { comments: comment._id } });
            await Usuario.findByIdAndUpdate(comment.usuario, { $push: { comments: comment._id } });
        }

        console.log('Creando reportes...');
        const reportsData = [];
        
        // Reportes de usuarios
        for (let i = 0; i < 3; i++) {
            const reporter = createdUsers[0];
            const target = createdUsers[i + 1];
            reportsData.push({
                usuarioReporta: reporter._id,
                tipo: 'user' as const,
                objetivoId: target._id,
                descripcion: 'Comportamiento inadecuado en el perfil.',
                estado: 'pendiente' as const
            });
        }

        // Reportes de posts
        for (let i = 0; i < 4; i++) {
            const reporter = createdUsers[1];
            const target = createdPosts[i];
            reportsData.push({
                usuarioReporta: reporter._id,
                tipo: 'post' as const,
                objetivoId: target._id,
                descripcion: 'Contenido inapropiado o spam.',
                estado: 'pendiente' as const
            });
        }

        // Reportes de comentarios
        for (let i = 0; i < 3; i++) {
            const reporter = createdUsers[2];
            const target = createdComments[i];
            reportsData.push({
                usuarioReporta: reporter._id,
                tipo: 'comment' as const,
                objetivoId: target._id,
                descripcion: 'Lenguaje ofensivo en el comentario.',
                estado: 'pendiente' as const
            });
        }

        const createdReports = await Report.insertMany(reportsData);
        console.log(`${createdReports.length} reportes creados.`);

        console.log('Seeding completado con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante el seeding:', error);
        process.exit(1);
    }
};

seed();
