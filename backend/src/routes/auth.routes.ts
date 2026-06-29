import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/guest-login', authController.guestLogin.bind(authController));
router.get('/verify', authController.verifyToken.bind(authController));
router.get('/profile', authenticate, authController.profile.bind(authController));
router.put('/password', authenticate, authController.changePassword.bind(authController));

export default router;
