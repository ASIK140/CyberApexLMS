import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middlewares/rateLimiter';
import { AppError, ErrorCodes } from '../lib/app-error';

const router = Router();

function getCookieOptions(req: Request): { secure: boolean; sameSite: 'none' | 'lax' | 'strict' } {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = req.protocol === 'https' || req.get('X-Forwarded-Proto') === 'https';

  // In production, require HTTPS for secure cookies
  const secure = isProduction && isHttps;
  const sameSite: 'none' | 'lax' | 'strict' = isProduction ? 'none' : 'lax';

  return { secure, sameSite };
}

const LoginSchema = z.object({
  email:    z.string().min(1).max(255), // Allow login ID or email
  password: z.string().min(8),
});

const RegisterSchema = z.object({
  email:      z.string().email(),
  password:   z.string().min(8).max(128),
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().min(1).max(100),
  tenantSlug: z.string().max(100).optional(),
});

const MFAVerifySchema = z.object({
  mfaTempToken: z.string(),
  code:         z.string().length(6),
});

router.post('/login', authLimiter, async (req: Request, res: Response, next) => {
  try {
    // Debug: show incoming email (no password)
    console.debug('[AUTH] /login request body keys:', Object.keys(req.body));
    const { email, password } = LoginSchema.parse(req.body);
    console.debug('[AUTH] Attempting login for email:', (email ?? '').toLowerCase().trim());
    const result = await authService.login(email, password, req.ip ?? '');

    if ('mfaRequired' in result && result.mfaRequired) {
      return res.json({ data: { mfaRequired: true, mfaTempToken: result.mfaTempToken } });
    }

    const r = result as any;
    const cookieOpts = getCookieOptions(req);
    res.cookie('refreshToken', r.refreshToken, {
      httpOnly: true,
      secure:   cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge:   7 * 24 * 3600 * 1000,
    });

    return res.json({ data: { accessToken: r.accessToken, user: r.user } });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req: Request, res: Response, next) => {
  try {
    const { email, password, firstName, lastName, tenantSlug } = RegisterSchema.parse(req.body);
    const result = await authService.register(email, password, firstName, lastName, tenantSlug, req.ip ?? '');

    const cookieOpts = getCookieOptions(req);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge:   7 * 24 * 3600 * 1000,
    });

    return res.status(201).json({ data: { accessToken: result.accessToken, user: result.user } });
  } catch (err) {
    next(err);
  }
});

router.get('/sso/saml/init', async (req: Request, res: Response, next) => {
  try {
    const tenantSlug = req.query.tenant as string;
    if (!tenantSlug) return res.status(400).json({ error: { message: 'Tenant slug is required' } });
    // This is a placeholder for actual passport-saml initialization which redirects to the IdP
    // For now, redirecting to frontend with a dummy setup or to the IdP URL if available.
    res.redirect(`${process.env.FRONTEND_URL}/login?sso=initiated`);
  } catch (err) {
    next(err);
  }
});

router.post('/sso/saml/callback', async (req: Request, res: Response, next) => {
  try {
    // In a real SAML integration, req.user would contain the parsed profile from Passport
    // Mocking the profile parsing here for completion of the task 3.2 logic path
    const tenantSlug = req.query.tenant as string || req.body.RelayState;
    if (!tenantSlug) throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Tenant slug missing in state', 400);

    const mockProfile = {
      email: req.body.email || 'sso-user@example.com',
      firstName: req.body.firstName || 'SSO',
      lastName: req.body.lastName || 'User',
      nameID: req.body.nameID || req.body.email
    };

    const result = await authService.handleSSOCallback(tenantSlug, mockProfile, req.ip ?? '');

    const cookieOpts = getCookieOptions(req);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge:   7 * 24 * 3600 * 1000,
    });

    // Typically you redirect to the frontend dashboard after successful SSO
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${result.accessToken}`);
  } catch (err) {
    next(err);
  }
});

router.post('/mfa/verify', async (req: Request, res: Response, next) => {
  try {
    const { mfaTempToken, code } = MFAVerifySchema.parse(req.body);
    const result = await authService.verifyMFA(mfaTempToken, code);

    const cookieOpts = getCookieOptions(req);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge:   7 * 24 * 3600 * 1000,
    });

    return res.json({ data: { accessToken: result.accessToken, user: result.user } });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next) => {
  try {
    // Accept refresh token from cookie or body or Authorization header for robustness in dev
    console.debug('[AUTH] /refresh cookies:', req.cookies);
    let refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken && req.body && req.body.refreshToken) {
      refreshToken = req.body.refreshToken as string;
      console.debug('[AUTH] Using refresh token from body');
    }
    if (!refreshToken && req.headers?.authorization) {
      const parts = (req.headers.authorization as string).split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        refreshToken = parts[1];
        console.debug('[AUTH] Using refresh token from Authorization header');
      }
    }

    if (!refreshToken) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });

    const result = await authService.refresh(refreshToken);

    const cookieOpts = getCookieOptions(req);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure:   cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge:   7 * 24 * 3600 * 1000,
    });

    return res.json({ data: { accessToken: result.accessToken } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken ?? '';
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken');
    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

router.post('/mfa/setup', authenticate, async (req: Request, res: Response, next) => {
  try {
    const result = await authService.setupMFA(req.user!.id);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/mfa/confirm', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { code } = z.object({ code: z.string().length(6) }).parse(req.body);
    const result   = await authService.confirmMFA(req.user!.id, code);
    return res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/password/reset-request', async (req: Request, res: Response, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    await authService.requestPasswordReset(email);
    return res.json({ data: { message: 'If the email exists, a reset link has been sent.' } });
  } catch (err) {
    next(err);
  }
});

router.post('/password/reset', async (req: Request, res: Response, next) => {
  try {
    const { token, password } = z.object({
      token:    z.string(),
      password: z.string().min(8),
    }).parse(req.body);
    await authService.resetPassword(token, password);
    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
