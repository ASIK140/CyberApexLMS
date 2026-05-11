/**
 * Seeding script for NGO Applications
 * Usage: node scripts/seed-ngo-data.js
 */
require('dotenv').config();
const { connectDB } = require('../src/config/database');
const { NgoProgram } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

const ngoApplications = [
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Global Literacy Initiative',
        ngo_type: 'Education',
        country: 'Kenya',
        members_count: 1250,
        funding_source: 'International Grants',
        funding_amount: 45000000, 
        proposed_plan: 'Enterprise',
        subsidy_percentage: 90,
        registration_status: 'Verified',
        status: 'Pending'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Water for All South Asia',
        ngo_type: 'Sanitation',
        country: 'India',
        members_count: 8400,
        funding_source: 'Private Donations',
        funding_amount: 120000000,
        proposed_plan: 'Premium',
        subsidy_percentage: 75,
        registration_status: 'Verified',
        status: 'Under Review'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Tech for Refugees',
        ngo_type: 'Humanitarian',
        country: 'Germany',
        members_count: 320,
        funding_source: 'Corporate CSR',
        funding_amount: 15000000,
        proposed_plan: 'Starter',
        subsidy_percentage: 100,
        registration_status: 'Pending Review',
        status: 'Pending'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Amazon Rainforest Protectors',
        ngo_type: 'Environmental',
        country: 'Brazil',
        members_count: 450,
        funding_source: 'Public Crowdfunding',
        funding_amount: 8000000,
        proposed_plan: 'Professional',
        subsidy_percentage: 50,
        registration_status: 'Verified',
        status: 'Pending'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Safe Haven Animal Rescue',
        ngo_type: 'Animal Welfare',
        country: 'United Kingdom',
        members_count: 120,
        funding_source: 'Local Fundraisers',
        funding_amount: 2500000,
        proposed_plan: 'Starter',
        subsidy_percentage: 100,
        registration_status: 'Verified',
        status: 'More Info Required'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Red Cross Youth (UK)',
        ngo_type: 'Humanitarian',
        country: 'United Kingdom',
        members_count: 500,
        funding_source: 'Government Grants',
        funding_amount: 25000000, 
        proposed_plan: 'Starter',
        subsidy_percentage: 100,
        registration_status: 'Verified',
        status: 'Pending'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Doctors Without Borders (SEA)',
        ngo_type: 'Healthcare',
        country: 'Thailand',
        members_count: 1500,
        funding_source: 'Public Support',
        funding_amount: 80000000,
        proposed_plan: 'Professional',
        subsidy_percentage: 50,
        registration_status: 'Verified',
        status: 'Under Review'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Amnesty International (Global South)',
        ngo_type: 'Human Rights',
        country: 'Indonesia',
        members_count: 800,
        funding_source: 'Foundation Grants',
        funding_amount: 35000000,
        proposed_plan: 'Enterprise',
        subsidy_percentage: 90,
        registration_status: 'Verified',
        status: 'Pending'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Save the Children (MENA)',
        ngo_type: 'Child Welfare',
        country: 'Jordan',
        members_count: 2500,
        funding_source: 'NGO Trust',
        funding_amount: 60000000,
        proposed_plan: 'Premium',
        subsidy_percentage: 75,
        registration_status: 'Verified',
        status: 'Pending'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Global Hope Network',
        ngo_type: 'Development',
        country: 'Kenya',
        members_count: 1250,
        member_limit: 5000,
        proposed_plan: 'Enterprise',
        subsidy_percentage: 90,
        completion_rate: 85,
        certificates_issued: 450,
        status: 'Approved'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Clean Water Initiative',
        ngo_type: 'Sanitation',
        country: 'India',
        members_count: 8400,
        member_limit: 10000,
        proposed_plan: 'Premium',
        subsidy_percentage: 75,
        completion_rate: 42,
        certificates_issued: 1200,
        status: 'Approved'
    },
    {
        ngo_program_id: uuidv4(),
        organization_name: 'Emergency Relief Corp',
        ngo_type: 'Humanitarian',
        country: 'Thailand',
        members_count: 320,
        member_limit: 1000,
        proposed_plan: 'Starter',
        subsidy_percentage: 100,
        completion_rate: 95,
        certificates_issued: 150,
        status: 'Approved'
    }
];

async function seedNGOs() {
    try {
        console.log('🌱 Connecting to database and synchronizing...');
        await connectDB();
        
        console.log('🌱 Force synchronizing NgoProgram table...');
        await NgoProgram.sync({ force: true });
        
        console.log('🌱 Seeding NGO Applications...');
        
        for (const ngo of ngoApplications) {
            await NgoProgram.create(ngo);
            console.log(`✅ Created: ${ngo.organization_name}`);
        }

        console.log('✨ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedNGOs();
