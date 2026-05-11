import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest } from '../../middlewares/tenantScope';
import { createAuditLog } from '../../services/auditLog.service';

const prisma = new PrismaClient();

export const createCourse = async (req: TenantRequest, res: Response) => {
    try {
        const { title, description } = req.body;
        const tenantId = req.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        const course = await prisma.course.create({
            data: {
                tenantId,
                title,
                description
            }
        });

        const actor = (req as any).user;

        await createAuditLog({
            tenantId,
            userId: actor?.userId,
            action: 'CREATE_COURSE',
            ipAddress: req.ip,
            newValue: { id: course.id, title: course.title }
        });

        res.status(201).json({ message: 'Course created successfully', data: course });
    } catch (error) {
        res.status(500).json({ error: 'Server error while creating course' });
    }
};

export const fetchCourses = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        const courses = await prisma.course.findMany({
            where: {
                tenantId,
                // Employees should only see published ones, but Admins see all. Let's return all.
            }
        });

        res.status(200).json({ data: courses });
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching courses' });
    }
};
