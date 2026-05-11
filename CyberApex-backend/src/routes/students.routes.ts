import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/v1/admin/students - Unified student list for Super Admin
router.get('/',
  authenticate,
  authorize(['super_admin'], { sameTenantOnly: false }),
  async (req: Request, res: Response, next) => {
    try {
      const search = req.query.search as string | undefined;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 50);
      const skip = (page - 1) * limit;

      // 1. Get Prisma Users with role=student
      const prismaWhere: any = {
        role: 'student',
        deletedAt: null,
      };
      if (search) {
        prismaWhere.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [prismaStudents, prismaCount] = await Promise.all([
        prisma.user.findMany({
          where: prismaWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            tenantId: true,
          },
        }),
        prisma.user.count({ where: prismaWhere }),
      ]);

      // 2. Get Sequelize IndividualStudents
      let legacyStudents: any[] = [];
      let legacyCount = 0;
      try {
        // Try to load models - they may not exist in all setups
        let IndividualStudent: any = null;
        let Op: any = null;

        try {
          const models = require('../models');
          IndividualStudent = models.IndividualStudent;
          Op = require('sequelize').Op;
        } catch (modelErr) {
          logger.warn({ err: modelErr }, 'Could not load Sequelize models');
        }

        if (IndividualStudent) {
          const legacyWhere: any = {};
          if (search && Op) {
            legacyWhere[Op.or] = [
              { name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
              { login_id: { [Op.like]: `%${search}%` } },
            ];
          }

          const legacyResult = await IndividualStudent.findAndCountAll({
            where: legacyWhere,
            attributes: { exclude: ['password_hash'] },
            offset: skip,
            limit,
            order: [['created_at', 'DESC']],
          });
          legacyStudents = legacyResult.rows;
          legacyCount = legacyResult.count;
        }
      } catch (e: any) {
        logger.warn({ err: e.message }, 'Legacy student lookup failed - continuing without legacy data');
      }

      // 3. Convert Prisma users to same format as legacy
      const prismaFormatted = prismaStudents.map(u => ({
        student_id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        login_id: u.employeeId || null,
        department: u.department || null,
        service_status: u.status === 'active' ? 'active' : 'stopped',
        created_at: u.createdAt,
        last_login: u.lastLoginAt,
        source: 'prisma',
      }));

      // 4. Convert legacy to same format
      const legacyFormatted = legacyStudents.map(s => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        login_id: s.login_id || null,
        department: s.department || null,
        service_status: s.service_status,
        created_at: s.created_at,
        last_login: s.last_login,
        source: 'legacy',
      }));

      // 5. Combine and sort by created_at
      const allStudents = [...prismaFormatted, ...legacyFormatted]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      const total = prismaCount + legacyCount;

      res.json({
        success: true,
        data: allStudents,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;