import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/guest-login', authController.guestLogin.bind(authController));
router.get('/verify', authController.verifyToken.bind(authController));
router.get('/profile', authenticate, authController.profile.bind(authController));
router.put('/password', authenticate, authController.changePassword.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.get('/usuarios', authenticate, authorize('admin.usuarios'), authController.listarUsuarios.bind(authController));
router.post('/usuarios', authenticate, authorize('admin.usuarios'), authController.crearUsuario.bind(authController));
router.put('/usuarios/:id', authenticate, authorize('admin.usuarios'), authController.actualizarUsuario.bind(authController));

export default router;
