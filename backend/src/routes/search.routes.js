import express from 'express';
import auth from '../middleware/auth.js';
import searchController from '../controllers/searchController.js';

const router = express.Router();

router.post('/search/rooms', auth, searchController.searchRooms);

export default router;
