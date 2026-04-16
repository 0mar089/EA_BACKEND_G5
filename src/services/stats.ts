import Comment from '../models/Comment';
import Post from '../models/Post';
import Universidad from '../models/Universidad';
import Usuario from '../models/Usuario';

const getGlobalStats = async () => {
    const userCount = await Usuario.countDocuments();
    const universityCount = await Universidad.countDocuments();
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();

    return {
        users: userCount,
        universities: universityCount,
        posts: postCount,
        comments: commentCount
    };
};

const getUserCount = async () => await Usuario.countDocuments();
const getUniversityCount = async () => await Universidad.countDocuments();
const getPostCount = async () => await Post.countDocuments();
const getCommentCount = async () => await Comment.countDocuments();

export default {
    getGlobalStats,
    getUserCount,
    getUniversityCount,
    getPostCount,
    getCommentCount
};
