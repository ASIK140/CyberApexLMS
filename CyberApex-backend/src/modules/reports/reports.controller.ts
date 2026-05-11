import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TenantRequest } from '../../middlewares/tenantScope';

const prisma = new PrismaClient();

export const getCisoDashboardData = async (req: TenantRequest, res: Response) => {
    try {
        const tenantId = req.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant context required' });
        }

        // 1. Fetch total users
        const totalUsers = await prisma.user.count({ where: { tenantId } });

        // 2. Fetch phishing campaigns stats
        const totalCampaigns = await prisma.phishingCampaign.count({ where: { tenantId } });

        // 3. Mock logic for Human Risk Score (e.g., heavily reliant on past phishing click data)
        const humanRiskScore = 65; // Example: 65/100

        // 4. Mock Department heatmap
        const departmentHeatmap = [
            { department: 'Engineering', riskScore: 30 },
            { department: 'Sales', riskScore: 85 },
            { department: 'HR', riskScore: 50 },
        ];

        res.status(200).json({
            data: {
                totalUsers,
                totalCampaigns,
                humanRiskScore,
                departmentHeatmap,
                phishingClickRate: '12%',
                trainingCompletionRate: '78%'
            }
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching CISO dashboard data' });
    }
};
