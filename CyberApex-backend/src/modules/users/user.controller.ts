import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createAuditLog } from '../../services/auditLog.service';
import { TenantRequest } from '../../middlewares/tenantScope';

const prisma = new PrismaClient();

export const createUser = async (req: TenantRequest, res: Response) => {
    try {
        const { email, password, role, firstName, lastName, department } = req.body;
        const tenantId = req.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                tenantId,
                email,
                passwordHash,
                role,
                firstName,
                lastName,
                department
            }
        });

        const actor = (req as any).user;

        await createAuditLog({
            tenantId,
            userId: actor?.userId,
            action: 'CREATE_USER',
            ipAddress: req.ip,
            newValue: { id: user.id, email: user.email, role: user.role }
        });

        // Remove passwordHash before sending response
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.status(201).json({ message: 'User created successfully', data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error while creating user' });
    }
};

export const fetchUsers = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        const users = await prisma.user.findMany({
            where: {
                tenantId
            },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                department: true,
                createdAt: true
            }
        });

        res.status(200).json({ data: users });
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching users' });
    }
};
