import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../../services/auditLog.service';

const prisma = new PrismaClient();

export const createTenant = async (req: Request, res: Response) => {
    try {
        const { name, domain } = req.body;

        const tenant = await prisma.tenant.create({
            data: { name, domain }
        });

        // Cast req to any to read user safely or use AuthRequest interface
        const user = (req as any).user;

        await createAuditLog({
            userId: user?.userId,
            action: 'CREATE_TENANT',
            ipAddress: req.ip,
            newValue: { id: tenant.id, name: tenant.name }
        });

        res.status(201).json({ message: 'Tenant created successfully', data: tenant });
    } catch (error) {
        res.status(500).json({ error: 'Server error while creating tenant' });
    }
};

export const getTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await prisma.tenant.findMany();
        res.status(200).json({ data: tenants });
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching tenants' });
    }
};

export const suspendTenant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const tenant = await prisma.tenant.update({
            where: { id },
            data: { status: 'SUSPENDED' }
        });

        const user = (req as any).user;
        await createAuditLog({
            userId: user?.userId,
            tenantId: id,
            action: 'SUSPEND_TENANT',
            ipAddress: req.ip,
            oldValue: { status: 'ACTIVE' },
            newValue: { status: 'SUSPENDED' }
        });

        res.status(200).json({ message: 'Tenant suspended successfully', data: tenant });
    } catch (error) {
        res.status(500).json({ error: 'Server error while suspending tenant' });
    }
};
