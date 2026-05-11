import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest } from '../../middlewares/tenantScope';
import { createAuditLog } from '../../services/auditLog.service';

const prisma = new PrismaClient();

export const createCampaign = async (req: TenantRequest, res: Response) => {
    try {
        const { name, attackType } = req.body;
        const tenantId = req.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        const campaign = await prisma.phishingCampaign.create({
            data: {
                tenantId,
                name,
                attackType,
                status: 'DRAFT' // Simulating Step 1 of the 6-step wizard
            }
        });

        const actor = (req as any).user;

        await createAuditLog({
            tenantId,
            userId: actor?.userId,
            action: 'CREATE_PHISHING_CAMPAIGN',
            ipAddress: req.ip,
            newValue: { id: campaign.id, name: campaign.name, type: attackType }
        });

        res.status(201).json({ message: 'Phishing campaign drafted successfully', data: campaign });
    } catch (error) {
        res.status(500).json({ error: 'Server error while creating campaign' });
    }
};

export const fetchCampaigns = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        const campaigns = await prisma.phishingCampaign.findMany({
            where: {
                tenantId
            }
        });

        res.status(200).json({ data: campaigns });
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching campaigns' });
    }
};
