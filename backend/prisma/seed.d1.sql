
INSERT OR IGNORE INTO PlatformAdmin (id, email, passwordHash, name, createdAt, updatedAt)
VALUES ("admin-singleton", "admin@easyapply.com", "$2b$10$bplLbVNWo8rzDi1O4PacLe6QbnYNa4QAhsbNpbAgKJE8WnT0jUf7q", "Platform Admin", "2026-08-21T08:06:43.468Z", "2026-08-21T08:06:43.468Z");

INSERT OR IGNORE INTO PlatformSettings (id, smtpHost, smtpPort, platformName, maintenanceMode, allowNewCompanyReg, allowNewSeekerReg, walkInQueueMaxGlobal, updatedAt)
VALUES ("singleton", "smtp.gmail.com", 587, "EasyApply", 0, 1, 1, 200, "2026-08-21T08:06:43.468Z");

INSERT OR IGNORE INTO SubscriptionPlan (id, name, description, features, maxJobPostings, maxTeamMembers, isActive, isPublic, isCustom, createdAt, updatedAt)
VALUES 
("plan-free", "Free", "Get started with essential hiring tools", '{"jobPostings":true,"atsScoring":true,"aiResumeScan":true,"aiResumeBuilder":true,"walkinInterview":false,"seekerDiscovery":false,"crmTalentPool":false,"spotJobs":false,"offerLetters":true,"interviewScheduling":true,"kanban":true}', 3, 2, 1, 1, 0, "2026-08-21T08:06:43.468Z", "2026-08-21T08:06:43.468Z"),
("plan-pro", "Pro", "Full platform access for growing teams", '{"jobPostings":true,"atsScoring":true,"aiResumeScan":true,"aiResumeBuilder":true,"walkinInterview":true,"seekerDiscovery":true,"crmTalentPool":true,"spotJobs":true,"offerLetters":true,"interviewScheduling":true,"kanban":true}', 50, 15, 1, 1, 0, "2026-08-21T08:06:43.468Z", "2026-08-21T08:06:43.468Z"),
("plan-enterprise", "Enterprise", "Unlimited access with priority support", '{"jobPostings":true,"atsScoring":true,"aiResumeScan":true,"aiResumeBuilder":true,"walkinInterview":true,"seekerDiscovery":true,"crmTalentPool":true,"spotJobs":true,"offerLetters":true,"interviewScheduling":true,"kanban":true}', 9999, 9999, 1, 1, 0, "2026-08-21T08:06:43.468Z", "2026-08-21T08:06:43.468Z");
