import Comment from '../models/Comment';
import Post from '../models/Post';
import Universidad from '../models/Universidad';
import Usuario from '../models/Usuario';
import Report from '../models/Report';

const getGlobalStats = async () => {
    const userCount = await Usuario.countDocuments();
    const universityCount = await Universidad.countDocuments();
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();
    const reportCount = await Report.countDocuments({ estado: { $ne: 'resuelto' } }); // Reportes activos

    return {
        users: userCount,
        universities: universityCount,
        posts: postCount,
        comments: commentCount,
        reports: reportCount
    };
};

const getUserCount = async () => await Usuario.countDocuments();
const getUniversityCount = async () => await Universidad.countDocuments();
const getPostCount = async () => await Post.countDocuments();
const getCommentCount = async () => await Comment.countDocuments();

const getReportStats = async () => {
    const totalActive = await Report.countDocuments({ estado: { $ne: 'resuelto' } });
    const userReports = await Report.countDocuments({ tipo: 'user', estado: { $ne: 'resuelto' } });
    const postReports = await Report.countDocuments({ tipo: 'post', estado: { $ne: 'resuelto' } });
    const commentReports = await Report.countDocuments({ tipo: 'comment', estado: { $ne: 'resuelto' } });

    return {
        total: totalActive,
        user: userReports,
        post: postReports,
        comment: commentReports
    };
};

export default {
    getGlobalStats,
    getUserCount,
    getUniversityCount,
    getPostCount,
    getCommentCount,
    getReportStats
};
