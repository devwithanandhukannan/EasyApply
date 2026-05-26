import express from 'express';
import type { Request, Response } from 'express';
import {prisma} from '../utils/prisma.ts';
import Groq from 'groq-sdk';
import { generateJobDescription } from '../services/groq.service.ts';

export const createJob = async (req: Request, res: Response) => {
  try {
    const { 
      title, department, jobType, locationType, location, 
      experienceRequired, skills, description, salaryRange, deadline, openings, status 
    } = req.body;

    // BUG FIX: Pull from req.company, not req.user
    const companyId = req.company?.companyId; 
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Company profile context missing.' });
    }

    const databaseStatus = status === 'draft' ? 'paused' : 'active';

    const newJob = await prisma.jobPosting.create({
      data: {
        companyId,
        title,
        department: department || null,
        jobType,
        locationType: locationType || 'Remote',
        location: location || null,
        experienceRequired: experienceRequired || null,
        requiredSkills: skills || [],
        description,
        salaryRange: salaryRange || null,
        deadline: deadline ? new Date(deadline) : null,
        openings: parseInt(openings, 10) || 1,
        status: databaseStatus,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Job posting published successfully',
      job: {
        ...newJob,
        status: newJob.status === 'paused' ? 'draft' : 'active'
      }
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    return res.status(500).json({ success: false, message: 'Internal server processing failure' });
  }
};

export const getAllCompanyJobs = async (req: Request, res: Response) => {
  try {
    // BUG FIX: Pull from req.company, not req.user
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized context.' });
    }

    const postings = await prisma.jobPosting.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedJobs = postings.map(job => ({
      ...job,
      status: job.status === 'paused' ? 'draft' : 'active'
    }));

    return res.status(200).json({
      success: true,
      jobs: formattedJobs
    });
  } catch (error) {
    console.error('Fetch company jobs failure:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch job records' });
  }
};

export const generateAIDescription = async (req: Request, res: Response) => {
  try {
    const { roughDescription, title, skills } = req.body;

    if (!roughDescription) {
      return res.status(400).json({ success: false, message: 'Initial writing summary text payload required.' });
    }

    // ✅ USE THE SERVICE FUNCTION
    const cleanPolishedTemplate = await generateJobDescription(roughDescription, title, skills);

    return res.status(200).json({
      success: true,
      description: cleanPolishedTemplate
    });
  } catch (error) {
    console.error('AI Description polish error processing:', error);
    return res.status(500).json({ success: false, message: 'AI enhancement module processing timeout' });
  }
};

export const getJobDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await prisma.jobPosting.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting context record missing.' });
    }

    return res.status(200).json({
      success: true,
      job: {
        ...job,
        status: job.status === 'paused' ? 'draft' : 'active'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Fetch process failure' });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Extract properties we explicitly format, isolating the rest into 'restOfUpdates'
    const { status, deadline, openings, skills, ...restOfUpdates } = req.body;

    // Build a safe data object for Prisma
    const dataToUpdate: any = {
      ...restOfUpdates
    };

    // Safely transform and assign values if they exist in the payload
    if (status) {
      dataToUpdate.status = status === 'draft' ? 'paused' : status;
    }

    if (deadline) {
      dataToUpdate.deadline = new Date(deadline);
    }

    if (openings !== undefined) {
      dataToUpdate.openings = parseInt(openings, 10);
    }

    if (skills) {
      dataToUpdate.requiredSkills = skills;
    }

    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: dataToUpdate
    });

    return res.status(200).json({
      success: true,
      job: {
        ...updatedJob,
        status: updatedJob.status === 'paused' ? 'draft' : 'active'
      }
    });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ success: false, message: 'Update modification sequence rejected' });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.jobPosting.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Record cleared from index matrix successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Deletion execution drop failure' });
  }
};