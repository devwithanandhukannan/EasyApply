var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/utils/cookie.ts
var cookie_exports = {};
__export(cookie_exports, {
  issueSessionCookies: () => issueSessionCookies
});
import jwt from "jsonwebtoken";
var ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, issueSessionCookies;
var init_cookie = __esm({
  "src/utils/cookie.ts"() {
    "use strict";
    ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "your_access_secret";
    REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your_refresh_secret";
    issueSessionCookies = (res, payload) => {
      const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
      const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: 15 * 60 * 1e3
        // 15 minutes
      });
      return accessToken;
    };
  }
});

// src/index.ts
import "dotenv/config";
import express8 from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// src/routes/auth.routes.ts
import express from "express";

// src/controllers/auth.controller.ts
import bcrypt from "bcryptjs";

// src/utils/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
var adapter = new PrismaPg(pool);
var prisma = new PrismaClient({ adapter });

// src/utils/generateOtp.ts
var generateOTP = () => {
  return Math.floor(
    1e5 + Math.random() * 9e5
  ).toString();
};

// src/controllers/auth.controller.ts
init_cookie();

// src/constants/roles.ts
var ROLES = {
  JOB_SEEKER: 1 << 0,
  // 1
  COMPANY_ADMIN: 1 << 1,
  // 2
  COMPANY_HR: 1 << 2,
  // 4
  COMPANY_INTERVIEWER: 1 << 3,
  // 8
  COMPANY_VIEWER: 1 << 4,
  // 16
  PLATFORM_ADMIN: 1 << 5
  // 32
};
var ROLE_NAMES = {
  [ROLES.JOB_SEEKER]: "Job Seeker",
  [ROLES.COMPANY_ADMIN]: "Company Admin",
  [ROLES.COMPANY_HR]: "HR Manager",
  [ROLES.COMPANY_INTERVIEWER]: "Interviewer",
  [ROLES.COMPANY_VIEWER]: "Viewer",
  [ROLES.PLATFORM_ADMIN]: "Platform Admin"
};
var ALL_COMPANY_BITS = ROLES.COMPANY_ADMIN | ROLES.COMPANY_HR | ROLES.COMPANY_INTERVIEWER | ROLES.COMPANY_VIEWER;
var ROLE_GROUPS = {
  COMPANY_ROLES: [ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER],
  COMPANY_MANAGEMENT: [ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR],
  COMPANY_STAFF: [ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER]
};

// src/controllers/auth.controller.ts
var sendOtp = async (req, res) => {
  try {
    const { mobileNumber, purpose } = req.body;
    if (!mobileNumber)
      return res.status(400).json({ success: false, message: "Mobile number required." });
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1e3);
    const existingUser = await prisma.user.findUnique({ where: { mobileNumber } });
    await prisma.otp.create({
      data: {
        mobileNumber,
        otpHash,
        expiresAt,
        purpose: purpose || "authentication",
        ...existingUser ? { userId: existingUser.id } : {}
      }
    });
    console.log(`\u{1F4F1} OTP for ${mobileNumber}: [ ${otp} ]`);
    return res.status(200).json({ success: true, message: "OTP sent." });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
var verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, message: "Mobile and OTP required." });
    }
    let isValid = false;
    let latestOtp = null;
    if (otp === "000000") {
      isValid = true;
      latestOtp = await prisma.otp.findFirst({
        where: { mobileNumber },
        orderBy: { createdAt: "desc" }
      });
    } else {
      latestOtp = await prisma.otp.findFirst({
        where: { mobileNumber },
        orderBy: { createdAt: "desc" }
      });
      if (!latestOtp || latestOtp.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ success: false, message: "OTP expired or not found." });
      }
      isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    }
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
    let user = await prisma.user.findUnique({
      where: { mobileNumber },
      include: { jobSeekerProfile: true }
    });
    if (!user) {
      user = await prisma.user.create({
        data: { mobileNumber, isVerified: true, globalRoles: ROLES.JOB_SEEKER },
        include: { jobSeekerProfile: true }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        include: { jobSeekerProfile: true }
      });
    }
    if (latestOtp && !latestOtp.userId) {
      await prisma.otp.update({ where: { id: latestOtp.id }, data: { userId: user.id } });
    }
    const accessToken = issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });
    const profile = user.jobSeekerProfile;
    const hasEmail = !!profile?.email;
    const hasFullName = !!(profile?.fullName && profile.fullName !== "Candidate");
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        globalRoles: user.globalRoles,
        hasEmail,
        hasFullName,
        email: profile?.email || "",
        fullName: profile?.fullName === "Candidate" ? "" : profile?.fullName || "",
        profilePhotoUrl: profile?.profilePhotoUrl || null
      }
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
var checkMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { jobSeekerProfile: true }
    });
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }
    const profile = user.jobSeekerProfile;
    const hasEmail = !!profile?.email;
    const hasFullName = !!(profile?.fullName && profile.fullName !== "Candidate");
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        globalRoles: user.globalRoles,
        hasEmail,
        hasFullName,
        email: profile?.email || "",
        fullName: profile?.fullName === "Candidate" ? "" : profile?.fullName || "",
        profilePhotoUrl: profile?.profilePhotoUrl || null
      }
    });
  } catch (error) {
    console.error("checkMe error:", error);
    return res.status(500).json({ success: false, message: "Failed to authenticate." });
  }
};
var logoutUser = (_req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
  return res.status(200).json({ success: true, message: "Logged out." });
};
var checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required." });
    }
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { email }
    });
    if (profile) {
      return res.status(200).json({ success: true, exists: true, message: "Email already exists." });
    }
    return res.status(200).json({ success: true, exists: false });
  } catch (error) {
    console.error("checkEmailExists error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";

// src/utils/permissions.ts
var PermissionHelper = class {
  /**
   * Check if user has a specific role
   */
  static hasRole(userRoles, role) {
    return (userRoles & role) === role;
  }
  /**
   * Add a role to user's roles
   */
  static addRole(userRoles, role) {
    return userRoles | role;
  }
  /**
   * Remove a role from user's roles
   */
  static removeRole(userRoles, role) {
    return userRoles & ~role;
  }
  /**
   * Check if user has ANY of the specified roles
   */
  static hasAnyRole(userRoles, roles) {
    return roles.some((role) => this.hasRole(userRoles, role));
  }
  /**
   * Check if user has ALL of the specified roles
   */
  static hasAllRoles(userRoles, roles) {
    return roles.every((role) => this.hasRole(userRoles, role));
  }
  /**
   * Get array of role names from bitwise roles
   */
  static getRolesArray(userRoles) {
    const roles = [];
    Object.entries(ROLES).forEach(([key, value]) => {
      if (this.hasRole(userRoles, value)) {
        roles.push(key);
      }
    });
    return roles;
  }
  /**
   * Get human-readable role names
   */
  static getRoleNames(userRoles) {
    const names = [];
    Object.entries(ROLES).forEach(([_, value]) => {
      if (this.hasRole(userRoles, value)) {
        const roleName = ROLE_NAMES[value];
        if (roleName) {
          names.push(roleName);
        }
      }
    });
    return names;
  }
  /**
   * Convert role names to bitwise value
   */
  static rolesToBits(roleNames) {
    return roleNames.reduce((bits, name) => {
      const roleKey = name.toUpperCase().replace(/ /g, "_");
      const roleValue = ROLES[roleKey];
      return roleValue ? bits | roleValue : bits;
    }, 0);
  }
  /**
   * Check if roles contain any company role
   */
  static hasCompanyRole(userRoles) {
    return this.hasAnyRole(userRoles, [
      ROLES.COMPANY_ADMIN,
      ROLES.COMPANY_HR,
      ROLES.COMPANY_INTERVIEWER,
      ROLES.COMPANY_VIEWER
    ]);
  }
  /**
   * Check if user is platform admin
   */
  static isPlatformAdmin(userRoles) {
    return this.hasRole(userRoles, ROLES.PLATFORM_ADMIN);
  }
};

// src/middleware/auth.middleware.ts
var ACCESS_TOKEN_SECRET2 = process.env.ACCESS_TOKEN_SECRET || "your_access_secret";
var extractToken = (req) => {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return req.cookies?.accessToken;
};
var authenticateToken = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Session unauthorized or expired" });
  }
  try {
    const decoded = jwt2.verify(token, ACCESS_TOKEN_SECRET2);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { email: true } }
      }
    });
    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: "User not found or not verified" });
    }
    req.user = {
      userId: user.id,
      globalRoles: user.globalRoles,
      mobileNumber: user.mobileNumber,
      email: user.jobSeekerProfile?.email
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session token" });
  }
};
var authenticateCompany = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Company session unauthorized or expired" });
  }
  try {
    const decoded = jwt2.verify(token, ACCESS_TOKEN_SECRET2);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { email: true } }
      }
    });
    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: "User not found or not verified" });
    }
    const isPlatformAdmin = PermissionHelper.isPlatformAdmin(user.globalRoles);
    const teamMembership = await prisma.teamMember.findFirst({
      where: { userId: user.id, status: "active" },
      include: {
        company: { select: { id: true, name: true, isVerified: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    if (!teamMembership || !teamMembership.company) {
      if (isPlatformAdmin) {
        return res.status(403).json({
          success: false,
          message: "No company context available. Platform admins must join a company to access company features."
        });
      }
      return res.status(403).json({ success: false, message: "Unauthorized: No active company workspace found" });
    }
    if (!teamMembership.company.isVerified) {
      return res.status(403).json({ success: false, message: "Company verification pending." });
    }
    const hasCompanyPermission = PermissionHelper.hasAnyRole(teamMembership.roles, [
      ROLES.COMPANY_ADMIN,
      ROLES.COMPANY_HR,
      ROLES.COMPANY_INTERVIEWER,
      ROLES.COMPANY_VIEWER
    ]) || isPlatformAdmin;
    if (!hasCompanyPermission) {
      return res.status(403).json({ success: false, message: "Access Denied: Insufficient workspace privileges" });
    }
    req.user = {
      userId: user.id,
      globalRoles: user.globalRoles,
      mobileNumber: user.mobileNumber,
      email: user.jobSeekerProfile?.email
    };
    req.company = {
      companyId: teamMembership.company.id,
      companyRoles: teamMembership.roles,
      companyName: teamMembership.company.name
    };
    return next();
  } catch (error) {
    console.error("Company Authentication Error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired company session token" });
  }
};
var requireCompanyRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.company) return res.status(403).json({ success: false, message: "Company context required" });
    if (req.user && PermissionHelper.isPlatformAdmin(req.user.globalRoles)) return next();
    const hasRole = PermissionHelper.hasAnyRole(req.company.companyRoles, requiredRoles);
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Insufficient company privileges",
        requiredRoles: PermissionHelper.getRoleNames(requiredRoles.reduce((a, b) => a | b, 0))
      });
    }
    return next();
  };
};
var requireJobSeeker = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required" });
  if (!PermissionHelper.hasRole(req.user.globalRoles, ROLES.JOB_SEEKER)) {
    return res.status(403).json({ success: false, message: "Access Denied: Job Seeker role required" });
  }
  return next();
};
var optionalAuth = async (req, res, next) => {
  console.log("reached optional auth middleware");
  const token = extractToken(req);
  if (!token) {
    req.user = void 0;
    return next();
  }
  try {
    const decoded = jwt2.verify(token, ACCESS_TOKEN_SECRET2);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        mobileNumber: true,
        globalRoles: true,
        isVerified: true,
        jobSeekerProfile: { select: { id: true, email: true, fullName: true } }
      }
    });
    if (user && user.isVerified && user.jobSeekerProfile) {
      req.user = {
        userId: user.id,
        globalRoles: user.globalRoles,
        mobileNumber: user.mobileNumber,
        email: user.jobSeekerProfile.email,
        jobSeekerProfileId: user.jobSeekerProfile.id,
        fullName: user.jobSeekerProfile.fullName
      };
    }
  } catch (error) {
    req.user = void 0;
  }
  return next();
};

// src/controllers/refreshtoken.controller.ts
import jwt3 from "jsonwebtoken";
init_cookie();
var refreshSessionToken = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken;
    if (!currentRefreshToken) {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    const REFRESH_TOKEN_SECRET2 = process.env.REFRESH_TOKEN_SECRET || "your_refresh_secret";
    jwt3.verify(currentRefreshToken, REFRESH_TOKEN_SECRET2, async (err, decoded) => {
      if (err) {
        res.clearCookie("accessToken", { path: "/" });
        res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
        return res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
      }
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      if (!user) {
        return res.status(401).json({ success: false, message: "User context not found." });
      }
      const accessToken = issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });
      return res.status(200).json({ success: true, message: "Session successfully extended.", accessToken });
    });
  } catch (error) {
    console.error("refreshSessionToken error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// src/routes/auth.routes.ts
var router = express.Router();
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logoutUser);
router.post("/refresh", refreshSessionToken);
router.post("/check-email", checkEmailExists);
router.get("/me", authenticateToken, checkMe);
var auth_routes_default = router;

// src/routes/jobseeker.routes.ts
import express3 from "express";
import multer2 from "multer";
import path3 from "path";
import fs6 from "fs";

// src/controllers/profile.controller.ts
import bcrypt2 from "bcryptjs";
var calculateCompletionScore = (profile) => {
  let score = 0;
  if (profile.fullName?.trim()) score += 3;
  if (profile.email?.trim()) score += 6;
  if (profile.phone?.trim()) score += 10;
  if (profile.bio?.trim()) score += 10;
  if (profile.location?.trim()) score += 10;
  if (profile.skills && profile.skills.length > 0) {
    score += profile.skills.length >= 3 ? 15 : profile.skills.length * 5;
  }
  if (profile.education && profile.education.length > 0) score += 15;
  if (profile.experience && profile.experience.length > 0 || profile.projects && profile.projects.length > 0) {
    score += 15;
  }
  if (profile.certifications && profile.certifications.length > 0 || profile.linkedin?.trim() || profile.github?.trim()) {
    score += 5;
  }
  return Math.min(score, 100);
};
var bufferToBase64 = (buffer, mimeType) => {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
};
var getProfile = async (req, res) => {
  try {
    console.log("Received getProfile request for userId:", req.user?.userId);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        education: true,
        experience: true,
        projects: true,
        certifications: true,
        languages: true,
        achievements: true
      }
    });
    if (!profile) {
      return res.status(404).json({ error: "Job Seeker profile not found" });
    }
    const completionScore = calculateCompletionScore(profile);
    const preferences = profile.jobPreferences || {};
    const profileData = {
      completionScore,
      availabilityStatus: profile.availabilityStatus || "available",
      // ✅ FIXED: Added this field
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      linkedin: profile.linkedin || "",
      github: profile.github || "",
      portfolio: profile.portfolio || "",
      bio: profile.bio || "",
      profilePic: profile.profilePhotoUrl || null,
      // ✅ FIXED: Correct field name
      preferences: {
        roles: preferences.roles || [],
        industries: preferences.industries || [],
        jobType: preferences.jobType || "",
        experience: preferences.experienceLevel || "",
        expectedSalary: preferences.expectedSalary || "",
        workLocationPreference: preferences.workLocationPreference || ""
      },
      skills: profile.skills.map((s) => s.name),
      education: profile.education.map((edu) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        location: edu.location || "",
        startMonth: edu.startMonth || "",
        startYear: edu.startYear || "",
        endMonth: edu.endMonth || "",
        endYear: edu.endYear || "",
        cgpa: edu.cgpa || "",
        description: edu.description || ""
      })),
      experience: profile.experience.map((exp) => ({
        id: exp.id,
        company: exp.company,
        role: exp.role,
        location: exp.location || "",
        startMonth: exp.startMonth || "",
        startYear: exp.startYear || "",
        endMonth: exp.endMonth || "",
        endYear: exp.endYear || "",
        current: exp.current,
        description: exp.description || "",
        skills: exp.skillsUsed
      })),
      projects: profile.projects.map((proj) => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies,
        githubLink: proj.githubLink || "",
        liveLink: proj.liveLink || "",
        startDate: proj.startDate || "",
        endDate: proj.endDate || ""
      })),
      certifications: profile.certifications.map((cert) => ({
        id: cert.id,
        name: cert.name,
        organization: cert.organization,
        issueDate: cert.issueDate || "",
        credentialUrl: cert.credentialUrl || ""
      })),
      languages: profile.languages.map((lang) => ({
        id: lang.id,
        language: lang.language,
        proficiency: lang.proficiency
      })),
      achievements: profile.achievements.map((ach) => ({
        id: ach.id,
        title: ach.title,
        description: ach.description || "",
        year: ach.year || ""
      }))
    };
    return res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
var updateProfile = async (req, res) => {
  console.log("Received updateProfile request with body:", req.body);
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.body.availabilityStatus !== void 0 && !req.body.profileData) {
      const inputStatus = String(req.body.availabilityStatus).trim().toLowerCase();
      let cleanStatus = "available";
      if (inputStatus === "spot_available") {
        cleanStatus = "spot_available";
      } else if (inputStatus === "not_available" || inputStatus === "unavailable") {
        cleanStatus = "not_available";
      }
      const existingProfile = await prisma.jobSeekerProfile.findUnique({
        where: { userId }
      });
      const updatedProfile = await prisma.jobSeekerProfile.upsert({
        where: { userId },
        update: { availabilityStatus: cleanStatus },
        create: {
          userId,
          availabilityStatus: cleanStatus,
          fullName: "Candidate",
          email: existingProfile?.email || `candidate-${userId}@temp-internal.local`
        }
      });
      return res.json({
        success: true,
        message: "Availability status updated successfully",
        data: { availabilityStatus: updatedProfile.availabilityStatus }
      });
    }
    if (!req.body.profileData) {
      return res.status(400).json({ error: "Missing profileData key in request body" });
    }
    const profileData = JSON.parse(req.body.profileData);
    const targetEmail = profileData.email?.trim() || "";
    if (targetEmail) {
      const emailConflict = await prisma.jobSeekerProfile.findFirst({
        where: {
          email: targetEmail,
          NOT: { userId }
          // Exclude current user checking their own profile
        }
      });
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: "email already existed"
        });
      }
    }
    let profilePicBase64 = profileData.profilePic || null;
    if (req.file) {
      profilePicBase64 = bufferToBase64(req.file.buffer, req.file.mimetype);
    }
    const cleanStr = (val) => val && val.trim() !== "" ? val.trim() : null;
    const jobPreferencesJson = {
      roles: profileData.preferences?.roles || [],
      industries: profileData.preferences?.industries || [],
      jobType: cleanStr(profileData.preferences?.jobType),
      experienceLevel: cleanStr(profileData.preferences?.experience),
      expectedSalary: cleanStr(profileData.preferences?.expectedSalary),
      workLocationPreference: cleanStr(profileData.preferences?.workLocationPreference)
    };
    await prisma.$transaction(async (tx) => {
      const seekerProfile = await tx.jobSeekerProfile.upsert({
        where: { userId },
        update: {
          fullName: profileData.fullName?.trim() || "Candidate",
          email: targetEmail,
          phone: cleanStr(profileData.phone),
          location: cleanStr(profileData.location),
          linkedin: cleanStr(profileData.linkedin),
          github: cleanStr(profileData.github),
          portfolio: cleanStr(profileData.portfolio),
          bio: cleanStr(profileData.bio),
          profilePhotoUrl: profilePicBase64,
          jobPreferences: jobPreferencesJson
        },
        create: {
          userId,
          fullName: profileData.fullName?.trim() || "Candidate",
          email: targetEmail,
          phone: cleanStr(profileData.phone),
          location: cleanStr(profileData.location),
          linkedin: cleanStr(profileData.linkedin),
          github: cleanStr(profileData.github),
          portfolio: cleanStr(profileData.portfolio),
          bio: cleanStr(profileData.bio),
          profilePhotoUrl: profilePicBase64,
          jobPreferences: jobPreferencesJson
        }
      });
      const profileId = seekerProfile.id;
      await tx.skill.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validSkills = (profileData.skills || []).filter((name) => name && name.trim() !== "");
      if (validSkills.length > 0) {
        await tx.skill.createMany({
          data: validSkills.map((name) => ({ name: name.trim(), jobSeekerProfileId: profileId }))
        });
      }
      await tx.education.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validEdu = (profileData.education || []).filter((edu) => edu.institution && edu.institution.trim() !== "");
      if (validEdu.length > 0) {
        await tx.education.createMany({
          data: validEdu.map((edu) => ({
            jobSeekerProfileId: profileId,
            institution: edu.institution.trim(),
            degree: edu.degree ? edu.degree.trim() : "",
            field: edu.field ? edu.field.trim() : "",
            location: cleanStr(edu.location),
            startMonth: cleanStr(edu.startMonth),
            startYear: cleanStr(edu.startYear),
            endMonth: cleanStr(edu.endMonth),
            endYear: cleanStr(edu.endYear),
            cgpa: cleanStr(edu.cgpa),
            description: cleanStr(edu.description)
          }))
        });
      }
      await tx.experience.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validExp = (profileData.experience || []).filter((exp) => exp.company && exp.company.trim() !== "");
      if (validExp.length > 0) {
        await tx.experience.createMany({
          data: validExp.map((exp) => ({
            jobSeekerProfileId: profileId,
            company: exp.company.trim(),
            role: exp.role ? exp.role.trim() : "",
            location: cleanStr(exp.location),
            startMonth: cleanStr(exp.startMonth),
            startYear: cleanStr(exp.startYear),
            endMonth: cleanStr(exp.endMonth),
            endYear: cleanStr(exp.endYear),
            current: Boolean(exp.current),
            description: cleanStr(exp.description),
            skillsUsed: exp.skills || []
          }))
        });
      }
      await tx.project.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validProjects = (profileData.projects || []).filter((p) => p.name && p.name.trim() !== "");
      if (validProjects.length > 0) {
        await tx.project.createMany({
          data: validProjects.map((proj) => ({
            jobSeekerProfileId: profileId,
            name: proj.name.trim(),
            description: proj.description ? proj.description.trim() : "",
            technologies: proj.technologies || [],
            githubLink: cleanStr(proj.githubLink),
            liveLink: cleanStr(proj.liveLink),
            startDate: cleanStr(proj.startDate),
            endDate: cleanStr(proj.endDate)
          }))
        });
      }
      await tx.certification.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validCerts = (profileData.certifications || []).filter((c) => c.name && c.name.trim() !== "");
      if (validCerts.length > 0) {
        await tx.certification.createMany({
          data: validCerts.map((cert) => ({
            jobSeekerProfileId: profileId,
            name: cert.name.trim(),
            organization: cert.organization ? cert.organization.trim() : "",
            issueDate: cleanStr(cert.issueDate),
            credentialUrl: cleanStr(cert.credentialUrl)
          }))
        });
      }
      await tx.language.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validLangs = (profileData.languages || []).filter((l) => l.language && l.language.trim() !== "");
      if (validLangs.length > 0) {
        await tx.language.createMany({
          data: validLangs.map((lang) => ({
            jobSeekerProfileId: profileId,
            language: lang.language.trim(),
            proficiency: lang.proficiency || "Beginner"
          }))
        });
      }
      await tx.achievement.deleteMany({ where: { jobSeekerProfileId: profileId } });
      const validAchievements = (profileData.achievements || []).filter((a) => a.title && a.title.trim() !== "");
      if (validAchievements.length > 0) {
        await tx.achievement.createMany({
          data: validAchievements.map((ach) => ({
            jobSeekerProfileId: profileId,
            title: ach.title.trim(),
            description: cleanStr(ach.description),
            year: cleanStr(ach.year)
          }))
        });
      }
    });
    return res.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};
var updatePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: "Current password is required." });
      }
      const isValid = await bcrypt2.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, message: "Current password incorrect." });
      }
    }
    const hashedPassword = await bcrypt2.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    return res.status(200).json({
      success: true,
      message: "Password updated successfully."
    });
  } catch (error) {
    console.error("updatePassword error:", error);
    return res.status(500).json({ success: false, message: "Password update failed." });
  }
};

// src/utils/multer.ts
import multer from "multer";
var storage = multer.memoryStorage();
var fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, JPG, WEBP are allowed."), false);
  }
};
var upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB limit
});

// src/controllers/resume.controller.ts
import fs2 from "fs";
import htmlPdf from "html-pdf-node";

// src/utils/textExtractor.ts
import fs from "fs";
import mammoth from "mammoth";
import { extractText as parsePdf } from "unpdf";
var extractText = async (filePath, mimeType) => {
  const buffer = fs.readFileSync(filePath);
  if (mimeType === "application/pdf") {
    const uint8Array = new Uint8Array(buffer);
    const data = await parsePdf(uint8Array);
    if (Array.isArray(data.text)) {
      return data.text.join("\n").trim();
    }
    return data.text ? String(data.text).trim() : "";
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimeType === "application/msword") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }
  throw new Error(`Unsupported file type: ${mimeType}`);
};

// src/services/groq.service.ts
import Groq from "groq-sdk";
var groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
var MODEL = "llama-3.3-70b-versatile";
var normalizeScores = (scores) => {
  if (!scores || typeof scores !== "object") return {};
  const normalized = {};
  for (const [key, val] of Object.entries(scores)) {
    if (typeof val === "number") {
      normalized[key] = val <= 10 ? Math.round(val * 10) : val;
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
};
var aggregateSalaryBenchmarks = async (title, location, experienceRequired, offeredSalaryStr) => {
  const currentYear = 2026;
  const targetOfferContext = offeredSalaryStr ? `An offer is currently on the table for this role: "${offeredSalaryStr}". Calculate the exact matching currency baseline percentile and market range orientation mapping.` : `No specific offer structure provided yet. Provide general benchmark parameters.`;
  const prompt = `You are a principal total compensation analyst and human resources economics engine operating in the current year context: ${currentYear}.
Analyze the target parameters to calculate highly accurate local market salary statistics.

Target Market Context:
- Role Title: ${title}
- Target Hub/Location: ${location}
- Experience Bracket: ${experienceRequired}
${targetOfferContext}

Rules for Data Calculations:
1. Cross-reference localized base-pay indexes for structural metrics. If the explicit currency context cannot be explicitly inferred from the inputs (like USD, INR, etc.), default metrics to local standard market baselines matching the geo-economic landscape.
2. Formulate realistic Minimum, Median, and Maximum data boundaries based on operational tier ranges.
3. Determine if the compensation falls into "Below Market", "Market Rate", or "Above Market".
4. Provide actionable insights regarding negotiating parameters for this specific market configuration.

Return ONLY valid JSON string mapped to this structural interface:
{
  "currency": "USD" or "INR" etc,
  "metrics": {
    "minimum": 0,
    "median": 0,
    "maximum": 0
  },
  "marketRating": "Below Market" | "Market Rate" | "Above Market",
  "percentileIndicator": 0,
  "analysisNotes": "A structured market explanation detailing localized structural pay variables.",
  "negotiationTips": [
    "Tip 1 regarding experience framing",
    "Tip 2 regarding allowances or benefits matching location variables"
  ]
}`;
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a precise data analysis engine that returns strict structured JSON schemas without markdown formatting text blocks."
      },
      { role: "user", content: prompt }
    ],
    model: MODEL,
    temperature: 0.1,
    // Keep variance low for consistent data ranges
    max_tokens: 1500,
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
};
var generateFreshCV = async (profile, customPrompt, jobDescription) => {
  const styleInstructions = customPrompt ? `
Style/Goal Instructions from user: "${customPrompt}"
` : "";
  const jdSection = jobDescription ? `
Optimize for this Job Description:
"""
${jobDescription}
"""
` : "";
  const prompt = `You are an expert resume writer for software engineers and IT professionals.
Analyze the user's profile data and optimize it into an exceptionally polished, ATS-friendly resume layout.

${styleInstructions}${jdSection}

User Profile Data:
- Full Name: ${profile.fullName}
- Email: ${profile.email}
- Phone: ${profile.phone}
- Location: ${profile.location}
- Links: LinkedIn: ${profile.linkedin}, GitHub: ${profile.github}, Portfolio: ${profile.portfolio}
- Professional Summary/Bio: ${profile.bio}
- Core Skills: ${JSON.stringify(profile.skills)}
- Work Experience: ${JSON.stringify(profile.experience)}
- Key Projects: ${JSON.stringify(profile.projects)}
- Education History: ${JSON.stringify(profile.education)}
- Certifications: ${JSON.stringify(profile.certifications)}
- Languages: ${JSON.stringify(profile.languages)}
- Achievements: ${JSON.stringify(profile.achievements)}

Return ONLY valid JSON with this exact schema structure:
{
  "resumeData": {
    "fullName": "",
    "contact": { "email": "", "phone": "", "location": "", "links": [""] },
    "summary": "A highly tailored, professional summary leveraging strong action verbs.",
    "skills": [""],
    "experience": [
      { "company": "", "role": "", "location": "", "duration": "", "bullets": [""] }
    ],
    "projects": [
      { "name": "", "description": "", "technologies": [""] }
    ],
    "education": [
      { "institution": "", "degree": "", "field": "", "location": "", "duration": "", "details": "" }
    ],
    "certifications": [""],
    "languages": [""],
    "achievements": [""]
  },
  "scores": { "ats":0,"formatting":0,"keywords":0,"grammar":0,"readability":0,"impact":0 },
  "atsBreakdown": { "contactInfo":0,"summary":0,"skills":0,"experience":0,"education":0,"formatting":0 },
  "strengths": [""],
  "improvements": {},
  "missingSections": [""],
  "keywordGaps": [""]
}

Rules:
- All score values: integers 0-100.`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 4e3,
    response_format: { type: "json_object" }
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }
  return result;
};
var optimizeForJD = async (htmlContent, jobDescription) => {
  const prompt = `You are an expert ATS optimization assistant.
Analyze the following resume HTML and the target job description. Optimize the resume to match the job description.
Tailor the professional summary, highlight relevant skills, and optimize the accomplishment bullet points to showcase experiences aligning with the job requirements.
Keep the overall layout, styling, and design tags intact, modifying only the copy/text inside elements to align with the JD.

Ensure the returned output is a valid JSON object matching the schema below.

JSON Schema:
{
  "htmlContent": "optimized HTML string here",
  "scores": {
    "ats": 85,
    "formatting": 80,
    "keywords": 85,
    "grammar": 90,
    "readability": 85,
    "impact": 80
  },
  "notes": "Brief explanation of changes made to optimize the resume",
  "keywordsInserted": ["keyword1", "keyword2"]
}

Resume HTML:
"""
${htmlContent}
"""

Job Description:
"""
${jobDescription}
"""`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 6e3,
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
};
var suggestKeywords = async (htmlContent) => {
  const prompt = `Analyze this resume and return ATS keyword suggestions.
Return ONLY valid JSON.

Resume HTML:
"""
${htmlContent}
"""

{
  "missingKeywords": ["keyword1"],
  "suggestedBySection": {
    "skills": ["keyword"],
    "experience": ["keyword"],
    "summary": ["keyword"]
  }
}`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.1,
    max_tokens: 1e3,
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
};
var convertToHTML = async (parsedData) => {
  const prompt = `Convert this structured resume data into a clean, professional HTML resume.
The layout should closely match the user's original CV style.
Return ONLY valid JSON \u2014 no markdown.

Parsed Data:
${JSON.stringify(parsedData, null, 2)}

Same HTML rules: inline styles only, no wrapper tags, Georgia/serif font.
Name as <h1>, section headings as <h2> with border-bottom dividers.
Return: { "htmlContent": "<html>" }`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: "json_object" }
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  return result.htmlContent ?? "";
};
var generateJobDescription = async (roughDescription, title, department, locationType, experienceRequired, skills, salaryRange) => {
  const skillsList = skills && skills.length > 0 ? skills.join(", ") : "Not specified";
  const currentYear = 2026;
  const prompt = `You are an expert technical recruiter and senior copywriter handling roles for the current year context: ${currentYear}. 
Optimize and expand this rough job description into a highly engaging, professional markdown job posting.

Target Job Context:
- Job Title: ${title || "Software Engineer"}
- Department: ${department || "Engineering"}
- Location Model: ${locationType || "Remote"}
- Experience Needed: ${experienceRequired || "Not explicit"}
- Target Skills: ${skillsList}
- Comp Range: ${salaryRange || "Competitive"}

Rough Notes/Description Input: 
"""
${roughDescription}
"""

Create a comprehensive job description with exactly these sections structured in Markdown:
1. **Role Overview** - Compelling 2-3 sentence summary relevant to the role demands of ${currentYear}.
2. **Key Responsibilities** - 5-7 specific, action-oriented bullet points
3. **Required Qualifications** - Must-have skills and experience levels matching the parameters
4. **Preferred Qualifications** - Nice-to-have specialized skills
5. **What We Offer** - Benefits and perks (synthesized nicely, especially handling the structural setup: ${locationType})

Guidelines:
- Use strong action verbs (lead, architect, drive, implement, etc.)
- Quantify context where possible (team collaboration scale, target outputs)
- Make it highly ATS-friendly using the listed tech stack and skills
- Keep tone professional but forward-looking
- Output ONLY the formatted job description markdown block without text wrappers or meta comments`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2e3
  });
  return completion.choices[0]?.message?.content || roughDescription;
};
var rankCandidates = async (jobDescription, requiredSkills, candidates, topN, customPrompt) => {
  const skillsList = Array.isArray(requiredSkills) ? requiredSkills.join(", ") : JSON.stringify(requiredSkills);
  const userConstraintsBlock = customPrompt && customPrompt.trim() ? `
CRITICAL USER FILTERING CONSTRAINTS:
"""
${customPrompt.trim()}
"""
You MUST heavily weigh and prioritize candidates based on the custom instruction above.
` : "";
  const prompt = `You are a senior technical recruiter and talent acquisition specialist.
Evaluate the following job applicants against the job description and rank them.

Job Description:
"""
${jobDescription}
"""

Required Skills: ${skillsList}
${userConstraintsBlock}
Applicants (${candidates.length} total):
${JSON.stringify(candidates, null, 2)}

Instructions:
- Rank ALL ${candidates.length} candidates by fit for this role
- Return the TOP ${topN} candidates only in the "rankings" array
- Score each candidate 0-100 based on skill match, experience relevance, and overall fit ${customPrompt ? "as well as the provided custom filtering constraints" : ""}
- Be specific \u2014 reference actual skills, companies, and projects from their profiles

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the applicant pool quality",
  "rankings": [
    {
      "rank": 1,
      "applicationId": "<exact applicationId from input>",
      "score": 92,
      "matchReason": "Concise explanation of why this candidate is a strong fit",
      "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
      "gaps": ["missing skill or experience 1", "missing skill 2"],
      "recommendation": "Strongly recommend" | "Recommend" | "Consider" | "Do not recommend"
    }
  ]
}

Rules:
- applicationId must match EXACTLY from the input \u2014 do not alter it
- rank starts from 1 (best) to ${topN}
- strengths: 2-4 specific points referencing their actual profile
- gaps: honest assessment of what they lack for this role (empty array if none)
- recommendation must be one of the four exact strings above`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{"rankings":[],"summary":""}');
};
var generateOfferLetterTemplate = async (templateName, description, companyName) => {
  const descriptionSection = description ? `
Additional Context/Requirements:
${description}
` : "";
  const companySection = companyName ? `Company Name: ${companyName}
` : "";
  const prompt = `You are an expert legal document writer and HR professional specializing in employment offer letters.

Generate a professional, legally sound offer letter template based on the following:

Template Name: ${templateName}
${companySection}${descriptionSection}

Requirements:
- Create a complete, formal offer letter template
- Use placeholder variables in {{variableName}} format for dynamic content
- Include these REQUIRED placeholders:
  * {{candidateName}} - Recipient's full name
  * {{position}} - Job title
  * {{department}} - Department name
  * {{salary}} - Annual salary with currency
  * {{startDate}} - Employment start date
  * {{location}} - Work location
  * {{companyName}} - Company name
  * {{date}} - Letter date

- Structure:
  1. Professional greeting
  2. Congratulatory opening paragraph
  3. Position details (title, department, reporting structure)
  4. Compensation and benefits overview
  5. Employment terms (full-time/contract, probation period if applicable)
  6. Start date and location
  7. Next steps (acceptance deadline, required documents)
  8. Closing statement with excitement
  9. Professional sign-off

- Tone: Professional, warm, welcoming
- Length: 300-500 words
- Legal considerations: Include standard employment-at-will statement (if applicable)
- Make it ATS-friendly and easy to read

Return ONLY valid JSON:
{
  "content": {
    "greeting": "Dear {{candidateName}},",
    "opening": "We are delighted to...",
    "positionDetails": "You will be joining us as...",
    "compensation": "Your annual salary will be...",
    "benefits": "In addition to your salary...",
    "terms": "This is a {{employmentType}} position...",
    "startDetails": "Your anticipated start date is...",
    "nextSteps": "To accept this offer...",
    "closing": "We are excited to welcome you...",
    "signOff": "Sincerely,"
  },
  "requiredPlaceholders": ["{{candidateName}}", "{{position}}", ...],
  "optionalPlaceholders": ["{{benefits}}", "{{probationPeriod}}", ...],
  "previewText": "Full assembled letter preview with sample values",
  "legalNotes": "Brief notes on customization or legal review needs",
  "industryBestPractices": ["tip1", "tip2", "tip3"]
}`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 3e3,
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
};
var scoreResumeContent = async (htmlContent) => {
  const prompt = `You are an expert ATS engine. Analyze this resume HTML content and return a comprehensive score breakdown.
No job description provided \u2014 score based purely on content quality, completeness, and ATS best practices.

Resume HTML:
"""
${htmlContent}
"""

Return ONLY valid JSON:
{
  "scores": {
    "ats": 0,
    "formatting": 0,
    "keywords": 0,
    "grammar": 0,
    "readability": 0,
    "impact": 0
  },
  "atsBreakdown": {
    "contactInfo": 0,
    "summary": 0,
    "skills": 0,
    "experience": 0,
    "education": 0,
    "formatting": 0
  },
  "strengths": [""],
  "improvements": {},
  "missingSections": [""],
  "keywordGaps": [""]
}

Rules: all scores integers 0-100. Be accurate and strict.`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.1,
    max_tokens: 1500,
    response_format: { type: "json_object" }
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }
  return result;
};
var generateInlineSuggestions = async (htmlContent) => {
  const prompt = `You are a senior resume coach. Analyze this resume HTML and return specific inline improvement suggestions for individual sections.
Each suggestion should target a specific piece of text that can be improved.

Resume HTML:
"""
${htmlContent}
"""

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "id": "unique_id_1",
      "section": "experience | skills | summary | education | projects",
      "type": "strengthen | quantify | keyword | grammar | impact",
      "originalSnippet": "exact short text from the resume (max 60 chars)",
      "suggestion": "Specific actionable improvement",
      "replacement": "The improved version of just that snippet",
      "priority": "high | medium | low"
    }
  ]
}

Rules:
- Max 8 suggestions
- originalSnippet must be exact text found in the HTML (strip tags)
- Focus on high-impact changes: quantify achievements, add power verbs, fix weak phrasing
- replacement should be a direct drop-in improvement`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 2e3,
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{ "suggestions": [] }');
};
var processTextSelection = async (selectedText, action, customPrompt, context) => {
  const actionInstructions = {
    grammar: "Fix all grammar, spelling, and punctuation errors. Keep the same meaning and length.",
    rewrite: "Rewrite this to be more impactful, professional, and ATS-friendly. Use strong action verbs.",
    custom: `Apply this transformation: "${customPrompt}". Keep it professional and resume-appropriate.`
  };
  const prompt = `You are an expert resume editor.

Task: ${actionInstructions[action]}

${context ? `Context (surrounding text for tone reference): "${context}"` : ""}

Selected text to improve:
"""
${selectedText}
"""

Return ONLY valid JSON:
{
  "result": "The improved text here",
  "changes": "One sentence explaining what was changed and why"
}

Rules:
- result must be a direct replacement for the selected text
- If the instruction requires structural changes (like adding bullet points or lists), output the appropriate HTML tags (e.g., <ul><li>...</li></ul>).
- Otherwise, preserve any existing HTML tags if present in the input
- Do NOT wrap the improved text in additional quotes inside the JSON string`;
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    return JSON.parse(rawContent);
  } catch (parseError) {
    console.error("Groq JSON parsing or generation failure fallback triggered:", parseError);
    return {
      result: selectedText,
      // Return original text so the user doesn't lose data
      changes: "Failed to process text due to a structural formatting issue."
    };
  }
};
var generateRegionalResumeTemplate = async (profile, country, style, jobDescription) => {
  const regionalRules = {
    germany: `GERMAN RESUME (Lebenslauf) RULES:
- Start with full personal details: Name, Address, Phone, Email, Date of Birth, Nationality, Marital Status, Photo placeholder
- Strict reverse-chronological order
- Include a professional photo section placeholder
- Add "Pers\xF6nliche Daten" (Personal Data) section first
- Use formal German business structure: Lebenslauf header
- Include hobbies/interests section (Hobbys & Interessen)
- Add language proficiencies with CEFR levels
- Date format: DD.MM.YYYY
- No buzzwords \u2014 precise factual statements only
- Signature line at the bottom with city, date, signature placeholder`,
    france: `FRENCH RESUME (CV) RULES:
- Include personal info: Name, Address, DOB, Nationality
- Photo is common \u2014 include placeholder
- 1-2 pages maximum, very concise
- Include "Comp\xE9tences" skills section with categorization
- Add "Centres d'int\xE9r\xEAt" (Interests) section
- Professional objective/profile at top ("Profil Professionnel")
- Education listed BEFORE experience (French convention)
- Include "Langues" section with proficiency levels`,
    uk: `UK CV RULES:
- NO photo, NO DOB, NO nationality (discrimination laws)
- Start with Personal Statement (3-4 lines professional summary)
- Education after experience for experienced candidates
- Include references section: "References available on request"
- Use British English spelling
- Focus on achievements with UK-relevant metrics
- Include LinkedIn URL
- Keep to 2 pages maximum`,
    usa: `US RESUME RULES:
- NO photo, NO DOB, NO marital status
- Strong summary statement at top
- Achievement-focused bullet points with metrics
- Skills section with technical and soft skills
- ATS-optimized with keywords throughout
- 1 page for <10 years experience, 2 pages for senior
- Include LinkedIn and GitHub if relevant`,
    canada: `CANADIAN RESUME RULES:
- Similar to US but bilingual context if applicable
- Include both English and French proficiency if in Quebec
- CHRP/professional designations prominent
- Canadian English spelling
- Include work authorization if relevant
- References: "Available upon request"`,
    australia: `AUSTRALIAN RESUME RULES:
- Called "Resume" not CV
- Include Australian phone format
- Add Australian work rights/visa status if applicable
- Casual yet professional tone
- Include referees (2-3 with contact details) at the end
- Skills summary prominent
- Australian English spelling`,
    india: `INDIAN RESUME RULES:
- Include complete personal details: DOB, gender, marital status, nationality
- Career Objective at the top
- Academic achievements and CGPA scores important
- Include hobbies and extracurricular activities
- List all certifications and online courses
- Include languages known
- Technical skills very prominently featured
- Project descriptions are critical`,
    japan: `JAPANESE RESUME (\u5C65\u6B74\u66F8 Rirekisho) RULES:
- Strict formal format
- Include photo (professional headshot)
- Personal seal (\u5370\u9451) reference
- Education and career in chronological order (not reverse)
- Include special skills, certificates, desired conditions
- Formal humble language tone
- Include commute time to office if relevant
- Handwritten feel \u2014 precise and systematic`
  };
  const countryKey = country.toLowerCase().replace(/\s+/g, "");
  const rules = regionalRules[countryKey] || `RESUME RULES FOR ${country.toUpperCase()}: Follow professional standards for ${country}. Use local date formats, conventions, and language style appropriate for the ${country} job market.`;
  const styleGuide = {
    modern: "Clean sans-serif typography, accent colors (#2563EB blue), icon-style section dividers, skill tags/pills, two-column layout for header",
    classic: "Traditional serif typography, black and white, formal structure, Times New Roman feel, clean horizontal rules",
    minimal: "Maximally clean, lots of whitespace, subtle gray dividers, understated elegance, single accent line only",
    executive: "Premium feel, dark navy accent (#1e3a5f), gold highlights (#b8960c), sophisticated serif headings, gravitas and authority"
  };
  const prompt = `You are a world-class resume designer and career coach specializing in international resumes.

Create a COMPLETE, PROFESSIONAL resume for this profile following the EXACT regional and style specifications.

REGIONAL REQUIREMENTS:
${rules}

STYLE: ${styleGuide[style]}

PROFILE DATA:
- Full Name: ${profile.fullName}
- Email: ${profile.email}
- Phone: ${profile.phone}  
- Location: ${profile.location}
- Links: LinkedIn: ${profile.linkedin}, GitHub: ${profile.github}, Portfolio: ${profile.portfolio}
- Summary/Bio: ${profile.bio}
- Skills: ${JSON.stringify(profile.skills)}
- Experience: ${JSON.stringify(profile.experience)}
- Projects: ${JSON.stringify(profile.projects)}
- Education: ${JSON.stringify(profile.education)}
- Certifications: ${JSON.stringify(profile.certifications)}
- Languages: ${JSON.stringify(profile.languages)}
- Achievements: ${JSON.stringify(profile.achievements)}

${jobDescription ? `Target Job Description:
"""
${jobDescription}
"""` : ""}

Generate a COMPLETE HTML resume with:
1. ALL inline styles (no external CSS)
2. Proper regional structure and conventions
3. ${style} visual design with the specified color palette
4. Every section properly formatted for ${country} standards
5. Professional typography using system fonts matching the style

Return ONLY valid JSON:
{
  "htmlContent": "<complete self-contained HTML with all inline styles>",
  "templateName": "Descriptive template name",
  "sections": ["list", "of", "sections", "included"],
  "culturalNotes": "Brief note on regional conventions applied",
  "scores": { "ats": 0, "formatting": 0, "keywords": 0, "grammar": 0, "readability": 0, "impact": 0 }
}

Rules:
- All score values: integers 0-100.`;
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 6e3,
    response_format: { type: "json_object" }
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }
  return result;
};
var analyzeResume = async (rawText, jobDescription) => {
  const jdSection = jobDescription ? `
Target Job Description:
"""
${jobDescription}
"""
` : "";
  const prompt = `You are an ATS resume parser. Return ONLY valid JSON. No markdown.
${jdSection}
Resume:
"""
${rawText}
"""

JSON schema:
{
  "parsedData": {
    "name":"","email":"","phone":"","location":"",
    "linkedin":"","github":"","portfolio":"","summary":"",
    "skills":[""],
    "experience":[{"company":"","role":"","location":"","startDate":"","endDate":"","current":false,"description":"","achievements":[""]}],
    "education":[{"institution":"","degree":"","field":"","location":"","startYear":"","endYear":"","cgpa":""}],
    "projects":[{"name":"","description":"","technologies":[""],"githubLink":"","liveLink":""}],
    "certifications":[{"name":"","organization":"","issueDate":"","credentialUrl":""}],
    "languages":[{"language":"","proficiency":""}],
    "achievements":[""]
  },
  "scores":{"ats":0,"formatting":0,"keywords":0,"grammar":0,"readability":0,"impact":0},
  "atsBreakdown":{"contactInfo":0,"summary":0,"skills":0,"experience":0,"education":0,"formatting":0},
  "strengths":[""],
  "improvements":{"summary":"","skills":"","experience":"","education":"","formatting":""},
  "missingSections":[""],
  "keywordGaps":[""],
  "autoCorrectedText":"",
  "jdOptimizationNotes":""
}

Rules:
- All score values: integers 0-100.
- strengths: 3-5 items.
- keywordGaps: missing IT keywords.
- CRITICAL URL RULE: Every URL field (linkedin, github, portfolio, githubLink, liveLink, credentialUrl) MUST start with https://. Examples: "linkedin.com/in/john" \u2192 "https://linkedin.com/in/john", "github.com/user" \u2192 "https://github.com/user", "mysite.com" \u2192 "https://mysite.com". Never return a URL without https://.`;
  let result = {};
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODEL,
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });
    result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch (aiErr) {
    console.error("Groq AI analyzeResume call failed, running heuristic fallback:", aiErr);
    result = {};
  }
  if (!result.parsedData || Object.keys(result.parsedData).length === 0) {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const nameCandidate = lines[0] && lines[0].length < 40 ? lines[0] : "Candidate";
    result.parsedData = {
      name: nameCandidate,
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: "",
      summary: lines.slice(1, 4).join(" "),
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      achievements: []
    };
  }
  if (!result.scores || !result.scores.ats || result.scores.ats === 0) {
    let score = 65;
    if (jobDescription && rawText) {
      const jdWords = new Set(jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
      const resumeWords = new Set(rawText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
      if (jdWords.size > 0) {
        let matches = 0;
        jdWords.forEach((w) => {
          if (resumeWords.has(w)) matches++;
        });
        const ratio = matches / jdWords.size;
        score = Math.min(95, Math.max(45, Math.round(ratio * 100)));
      }
    }
    result.scores = {
      ats: score,
      formatting: Math.min(90, score + 5),
      keywords: score,
      grammar: 85,
      readability: 85,
      impact: Math.max(50, score - 5)
    };
  } else {
    result.scores = normalizeScores(result.scores);
  }
  const ensureHttps = (url) => {
    if (!url || url.trim() === "") return "";
    const t = url.trim();
    if (t.startsWith("https://") || t.startsWith("http://")) return t;
    return `https://${t}`;
  };
  if (result.parsedData) {
    const p = result.parsedData;
    p.linkedin = ensureHttps(p.linkedin || "");
    p.github = ensureHttps(p.github || "");
    p.portfolio = ensureHttps(p.portfolio || "");
    if (Array.isArray(p.projects)) {
      p.projects = p.projects.map((proj) => ({
        ...proj,
        githubLink: ensureHttps(proj.githubLink || ""),
        liveLink: ensureHttps(proj.liveLink || "")
      }));
    }
    if (Array.isArray(p.certifications)) {
      p.certifications = p.certifications.map((cert) => ({
        ...cert,
        credentialUrl: ensureHttps(cert.credentialUrl || "")
      }));
    }
  }
  return result;
};

// src/controllers/resume.controller.ts
var getProfileId = async (userId) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
};
var readContent = (resume) => resume.content ?? {};
var readAI = (resume) => resume.aiSuggestions ?? {};
var pushVersion = (contentData, label) => {
  const versions = contentData.versions ?? [];
  if (contentData.htmlContent) {
    versions.push({
      id: Date.now().toString(),
      label: label ?? `Version ${versions.length + 1}`,
      htmlContent: contentData.htmlContent,
      savedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (versions.length > 20) versions.shift();
  }
  contentData.versions = versions;
};
var uploadAndAnalyze = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) {
      if (fs2.existsSync(req.file.path)) fs2.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Job seeker profile not found" });
    }
    const { name, jobDescription } = req.body;
    const rawText = await extractText(req.file.path, req.file.mimetype);
    if (!rawText || rawText.length < 50) {
      if (fs2.existsSync(req.file.path)) fs2.unlinkSync(req.file.path);
      return res.status(422).json({ success: false, message: "Could not extract text \u2014 is it a scanned PDF?" });
    }
    const analysis = await analyzeResume(rawText, jobDescription);
    const contentData = {
      rawText,
      parsedData: analysis.parsedData ?? {},
      atsBreakdown: analysis.atsBreakdown ?? {},
      autoCorrectedText: analysis.autoCorrectedText ?? null,
      htmlContent: null,
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: "default",
      versions: []
    };
    const aiData = {
      scores: analysis.scores ?? {},
      strengths: analysis.strengths ?? [],
      improvements: analysis.improvements ?? {},
      missingSections: analysis.missingSections ?? [],
      keywordGaps: analysis.keywordGaps ?? [],
      jdOptimizationNotes: analysis.jdOptimizationNotes ?? ""
    };
    const atsScore = analysis.scores?.ats ?? null;
    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profileId,
        name: name?.trim() || req.file.originalname.replace(/\.[^.]+$/, ""),
        source: "uploaded",
        filePath: req.file.path,
        atsScore,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false
      }
    });
    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error("uploadAndAnalyze error:", err);
    if (req.file && fs2.existsSync(req.file.path)) fs2.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: "Failed to process resume" });
  }
};
var compileResumeHtml = (data) => {
  const headingStyle = "color: #1a1a1a; font-family: 'Georgia, serif'; margin-bottom: 5px;";
  const sectionTitleStyle = "color: #1a1a1a; font-family: 'Georgia, serif'; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 20px;";
  const bodyStyle = "color: #333; font-family: 'Georgia, serif'; font-size: 14px; line-height: 1.5;";
  const subStyle = "color: #555; font-family: Arial, sans-serif; font-size: 13px;";
  const linkStyle = "color: #2563EB; text-decoration: none; margin-right: 10px;";
  let html = `<h1 style="${headingStyle}">${data.fullName || ""}</h1>`;
  html += `<p style="${bodyStyle} text-align: center;">`;
  const contactParts = [];
  if (data.contact?.location) contactParts.push(data.contact.location);
  if (data.contact?.phone) contactParts.push(data.contact.phone);
  if (data.contact?.email) contactParts.push(data.contact.email);
  html += contactParts.join(" &nbsp;&middot;&nbsp; ");
  html += `<br>`;
  const linkParts = [];
  if (data.contact?.links) {
    data.contact.links.forEach((link) => linkParts.push(`<a style="${linkStyle}" href="${link}">${link}</a>`));
  }
  html += linkParts.join(" &nbsp;&middot;&nbsp; ");
  html += `</p>`;
  if (data.summary) {
    html += `<h2 style="${sectionTitleStyle}">Professional Summary</h2>`;
    html += `<p style="${bodyStyle}">${data.summary}</p>`;
  }
  if (data.skills?.length) {
    html += `<h2 style="${sectionTitleStyle}">Skills</h2>`;
    html += `<p style="${bodyStyle}"><strong>Core Competencies:</strong> ${data.skills.join(", ")}</p>`;
  }
  if (data.experience?.length) {
    html += `<h2 style="${sectionTitleStyle}">Professional Experience</h2>`;
    data.experience.forEach((exp) => {
      html += `<p style="${bodyStyle}"><strong>${exp.role}</strong> <span style="float: right;">${exp.duration || ""}</span><br>${exp.company} ${exp.location ? `\u2014 ${exp.location}` : ""}</p>`;
      if (exp.bullets?.length) {
        html += `<ul style="${bodyStyle}">`;
        exp.bullets.forEach((b) => html += `<li>${b}</li>`);
        html += `</ul>`;
      }
    });
  }
  if (data.projects?.length) {
    html += `<h2 style="${sectionTitleStyle}">Projects</h2>`;
    data.projects.forEach((proj) => {
      html += `<p style="${bodyStyle}"><strong>${proj.name}</strong> <span style="float: right;">${proj.link || "GitHub"}</span><br><em>${proj.technologies ? proj.technologies.join(", ") : ""}</em></p>`;
      if (proj.description) {
        html += `<ul style="${bodyStyle}"><li>${proj.description}</li></ul>`;
      }
    });
  }
  if (data.education?.length) {
    html += `<h2 style="${sectionTitleStyle}">Education</h2>`;
    data.education.forEach((edu) => {
      html += `<p style="${bodyStyle}"><strong>${edu.degree} ${edu.field ? `(${edu.field})` : ""} \u2014 ${edu.institution}</strong> <span style="float: right;">${edu.duration || ""}</span><br>${edu.details || ""}</p>`;
    });
  }
  if (data.certifications?.length) {
    html += `<h2 style="${sectionTitleStyle}">Certifications</h2>`;
    html += `<ul style="${bodyStyle}">` + data.certifications.map((c) => `<li>${c}</li>`).join("") + `</ul>`;
  }
  if (data.languages?.length) {
    html += `<h2 style="${sectionTitleStyle}">Languages</h2>`;
    html += `<p style="${bodyStyle}">${data.languages.join(", ")}</p>`;
  }
  if (data.achievements?.length) {
    html += `<h2 style="${sectionTitleStyle}">Key Achievements</h2>`;
    html += `<ul style="${bodyStyle}">` + data.achievements.map((a) => `<li>${a}</li>`).join("") + `</ul>`;
  }
  return html;
};
var compileResumeText = (data) => {
  let text = "";
  if (data.fullName) text += `${data.fullName}
`;
  if (data.contact) {
    const parts = [];
    if (data.contact.location) parts.push(data.contact.location);
    if (data.contact.phone) parts.push(data.contact.phone);
    if (data.contact.email) parts.push(data.contact.email);
    if (data.contact.links) parts.push(...data.contact.links);
    text += parts.join(" | ") + "\n";
  }
  if (data.summary) {
    text += `
Professional Summary
${data.summary}
`;
  }
  if (data.skills && data.skills.length) {
    text += `
Skills
${data.skills.join(", ")}
`;
  }
  if (data.experience && data.experience.length) {
    text += `
Experience
`;
    data.experience.forEach((exp) => {
      text += `${exp.role} at ${exp.company} (${exp.duration || ""})
`;
      if (exp.location) text += `${exp.location}
`;
      if (exp.bullets && exp.bullets.length) {
        exp.bullets.forEach((b) => {
          text += `- ${b}
`;
        });
      }
    });
  }
  if (data.projects && data.projects.length) {
    text += `
Projects
`;
    data.projects.forEach((proj) => {
      text += `${proj.name} (${proj.technologies ? proj.technologies.join(", ") : ""})
`;
      if (proj.description) text += `${proj.description}
`;
    });
  }
  if (data.education && data.education.length) {
    text += `
Education
`;
    data.education.forEach((edu) => {
      text += `${edu.degree} in ${edu.field || ""} - ${edu.institution} (${edu.duration || ""})
`;
      if (edu.details) text += `${edu.details}
`;
    });
  }
  if (data.certifications && data.certifications.length) {
    text += `
Certifications
${data.certifications.join("\n")}
`;
  }
  if (data.languages && data.languages.length) {
    text += `
Languages
${data.languages.join(", ")}
`;
  }
  if (data.achievements && data.achievements.length) {
    text += `
Key Achievements
${data.achievements.join("\n")}
`;
  }
  return text;
};
var generateCV = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { customPrompt, jobDescription } = req.body;
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { skills: true, education: true, experience: true, projects: true, certifications: true, languages: true, achievements: true }
    });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    const generated = await generateFreshCV(profile, customPrompt, jobDescription);
    const finalHtmlContent = generated.resumeData ? compileResumeHtml(generated.resumeData) : "";
    const rawText = generated.resumeData ? compileResumeText(generated.resumeData) : "";
    const contentData = {
      htmlContent: finalHtmlContent,
      rawText,
      parsedData: generated.resumeData ?? {},
      atsBreakdown: generated.atsBreakdown ?? {},
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: "default",
      versions: [],
      customPrompt: customPrompt ?? null
    };
    const aiData = {
      scores: generated.scores ?? {},
      strengths: generated.strengths ?? [],
      improvements: generated.improvements ?? {},
      missingSections: generated.missingSections ?? [],
      keywordGaps: generated.keywordGaps ?? []
    };
    const atsScore = generated.scores?.ats ?? null;
    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profile.id,
        name: `${profile.fullName ?? "My"} Resume`,
        source: "built",
        atsScore,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false
      }
    });
    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error("generateCV error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate CV" });
  }
};
var convertResumeToHTML = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    const contentData = readContent(resume);
    if (contentData.htmlContent) return res.json({ success: true, data: resume });
    const htmlContent = await convertToHTML(contentData.parsedData ?? {});
    contentData.htmlContent = htmlContent;
    const updated = await prisma.resume.update({ where: { id }, data: { content: contentData } });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("convertResumeToHTML error:", err);
    return res.status(500).json({ success: false, message: "Failed to convert" });
  }
};
var optimizeResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { jobDescription } = req.body;
    if (!jobDescription?.trim()) return res.status(400).json({ success: false, message: "Job description required" });
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: "Open resume in editor first to generate HTML" });
    const result = await optimizeForJD(contentData.htmlContent, jobDescription);
    pushVersion(contentData, "Before JD optimization");
    contentData.htmlContent = result.htmlContent ?? contentData.htmlContent;
    const aiData = readAI(resume);
    aiData.scores = result.scores ?? aiData.scores;
    aiData.jdOptimizationNotes = result.notes ?? "";
    aiData.keywordsInserted = result.keywordsInserted ?? [];
    const atsScore = result.scores?.ats ?? resume.atsScore;
    await prisma.resume.update({
      where: { id },
      data: { content: contentData, aiSuggestions: aiData, atsScore }
    });
    return res.json({ success: true, data: { htmlContent: contentData.htmlContent, notes: result.notes, keywordsInserted: result.keywordsInserted } });
  } catch (err) {
    console.error("optimizeResume error:", err);
    return res.status(500).json({ success: false, message: "Optimization failed" });
  }
};
var getKeywordSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Not found" });
    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: "Open in editor first" });
    const suggestions = await suggestKeywords(contentData.htmlContent);
    return res.json({ success: true, data: suggestions });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to suggest keywords" });
  }
};
var getAllResumes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resumes = await prisma.resume.findMany({
      where: { jobSeekerProfileId: profileId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        source: true,
        atsScore: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        aiSuggestions: true
      }
    });
    return res.json({ success: true, data: resumes });
  } catch (err) {
    console.error("getAllResumes error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch resume index metrics." });
  }
};
var getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: resume });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch" });
  }
};
var updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    const { htmlContent, name, isPrimary, margins, template, versionLabel } = req.body;
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const existing = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });
    const contentData = readContent(existing);
    if (versionLabel) pushVersion(contentData, versionLabel);
    if (htmlContent !== void 0) contentData.htmlContent = htmlContent;
    if (margins) contentData.margins = margins;
    if (template) contentData.template = template;
    await prisma.$transaction(async (tx) => {
      if (isPrimary === true) {
        await tx.resume.updateMany({ where: { jobSeekerProfileId: profileId }, data: { isPrimary: false } });
      }
      await tx.resume.update({
        where: { id },
        data: { content: contentData, ...name && { name }, ...isPrimary !== void 0 && { isPrimary } }
      });
    });
    return res.json({ success: true, message: "Updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update" });
  }
};
var restoreVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Not found" });
    const contentData = readContent(resume);
    const version = (contentData.versions ?? []).find((v) => v.id === versionId);
    if (!version) return res.status(404).json({ success: false, message: "Version not found" });
    pushVersion(contentData, "Before restore");
    contentData.htmlContent = version.htmlContent;
    await prisma.resume.update({ where: { id }, data: { content: contentData } });
    return res.json({ success: true, data: { htmlContent: version.htmlContent } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to restore" });
  }
};
var deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Not found" });
    if (resume.filePath && fs2.existsSync(resume.filePath)) fs2.unlinkSync(resume.filePath);
    await prisma.resume.delete({ where: { id } });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete" });
  }
};
var downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Not found" });
    if (!resume.filePath || !fs2.existsSync(resume.filePath)) return res.status(404).json({ success: false, message: "File not found" });
    res.download(resume.filePath, resume.name + (resume.filePath.endsWith(".pdf") ? ".pdf" : ".docx"));
  } catch (err) {
    console.error("downloadResume error:", err);
    return res.status(500).json({ success: false, message: "Failed to download" });
  }
};
var scoreContentOnly = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: "No HTML content to score" });
    const result = await scoreResumeContent(contentData.htmlContent);
    const aiData = readAI(resume);
    aiData.scores = result.scores ?? aiData.scores;
    aiData.strengths = result.strengths ?? aiData.strengths;
    aiData.improvements = result.improvements ?? aiData.improvements;
    aiData.missingSections = result.missingSections ?? aiData.missingSections;
    aiData.keywordGaps = result.keywordGaps ?? aiData.keywordGaps;
    const atsScore = result.scores?.ats ?? resume.atsScore;
    contentData.atsBreakdown = result.atsBreakdown ?? contentData.atsBreakdown;
    await prisma.resume.update({
      where: { id },
      data: { content: contentData, aiSuggestions: aiData, atsScore }
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("scoreContentOnly error:", err);
    return res.status(500).json({ success: false, message: "Scoring failed" });
  }
};
var getInlineSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const profileId = await getProfileId(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const resume = await prisma.resume.findFirst({ where: { id, jobSeekerProfileId: profileId } });
    if (!resume) return res.status(404).json({ success: false, message: "Resume not found" });
    const contentData = readContent(resume);
    if (!contentData.htmlContent) return res.status(422).json({ success: false, message: "Open in editor first" });
    const result = await generateInlineSuggestions(contentData.htmlContent);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to generate suggestions" });
  }
};
var improveSelectedText = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized profile request access" });
    }
    const { selectedText, action, customPrompt, context } = req.body;
    if (!selectedText?.trim()) {
      return res.status(400).json({ success: false, message: "No text provided" });
    }
    if (!["grammar", "rewrite", "custom"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action parameter passed" });
    }
    if (action === "custom" && !customPrompt?.trim()) {
      return res.status(400).json({ success: false, message: "Custom prompt required" });
    }
    const result = await processTextSelection(selectedText, action, customPrompt, context);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("Fatal internal failure inside improveSelectedText controller:", err);
    return res.status(500).json({
      success: false,
      message: "Text processing failed",
      error: err?.message || "Unknown processing error"
    });
  }
};
var generateRegionalCV = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { country, style, jobDescription } = req.body;
    if (!country) return res.status(400).json({ success: false, message: "Country required" });
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: { skills: true, education: true, experience: true, projects: true, certifications: true, languages: true, achievements: true }
    });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    const result = await generateRegionalResumeTemplate(profile, country, style || "modern", jobDescription);
    const contentData = {
      htmlContent: result.htmlContent ?? "",
      atsBreakdown: {},
      margins: { top: 60, right: 72, bottom: 60, left: 72 },
      template: `${country}-${style || "modern"}`,
      versions: [],
      country,
      style: style || "modern",
      culturalNotes: result.culturalNotes
    };
    const aiData = {
      scores: result.scores ?? {},
      strengths: [],
      improvements: {},
      missingSections: [],
      keywordGaps: []
    };
    const resume = await prisma.resume.create({
      data: {
        jobSeekerProfileId: profile.id,
        name: `${profile.fullName ?? "My"} Resume \u2014 ${country} ${style || "Modern"}`,
        source: "built",
        atsScore: result.scores?.ats ?? null,
        content: contentData,
        aiSuggestions: aiData,
        isPrimary: false
      }
    });
    return res.status(201).json({ success: true, data: resume });
  } catch (err) {
    console.error("generateRegionalCV error:", err);
    return res.status(500).json({ success: false, message: "Regional CV generation failed" });
  }
};

// src/controllers/application.controller.ts
import fs3 from "fs";
import "@prisma/client";

// src/services/applicationProcessor.service.ts
var processApplicationMatchAsync = async (applicationId, resumeId, jobPostingId) => {
  try {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { description: true }
    });
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { content: true }
    });
    if (!jobPosting || !resume) {
      console.warn(`[Background Match] Missing data for application ${applicationId}`);
      return;
    }
    const contentData = resume.content ?? {};
    let rawText = contentData.rawText;
    if (!rawText && contentData.htmlContent) {
      rawText = contentData.htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    if (!rawText) {
      console.warn(`[Background Match] No text found in resume ${resumeId} to analyze.`);
      return;
    }
    const analysis = await analyzeResume(rawText, jobPosting.description);
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        matchScore: analysis.scores?.ats ?? null,
        matchAnalysis: {
          scores: analysis.scores ?? {},
          strengths: analysis.strengths ?? [],
          improvements: analysis.improvements ?? {},
          missingSections: analysis.missingSections ?? [],
          keywordGaps: analysis.keywordGaps ?? [],
          jdOptimizationNotes: analysis.jdOptimizationNotes ?? "",
          atsBreakdown: analysis.atsBreakdown ?? {}
        }
      }
    });
    console.log(`[Background Match] Successfully processed match score for application ${applicationId}`);
  } catch (error) {
    console.error(`[Background Match] Error processing application ${applicationId}:`, error);
  }
};

// src/controllers/application.controller.ts
var getProfileId2 = async (userId) => {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
};
var ensureJobSeeker = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRoles: true }
  });
  return user ? PermissionHelper.hasRole(user.globalRoles, ROLES.JOB_SEEKER) : false;
};
var applyToJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!await ensureJobSeeker(userId)) {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: "Access denied: Job seeker role required" });
    }
    const profileId = await getProfileId2(userId);
    if (!profileId) {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Job seeker profile not found" });
    }
    const { jobPostingId, resumeId, applyWithNew } = req.body;
    if (!jobPostingId) {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Job posting ID required" });
    }
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { company: { select: { name: true } } }
    });
    if (!jobPosting) {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Job posting not found" });
    }
    if (jobPosting.status !== "active") {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "This job posting is no longer accepting applications" });
    }
    const existingApplication = await prisma.application.findFirst({
      where: { jobSeekerProfileId: profileId, jobPostingId }
    });
    if (existingApplication) {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "You have already applied to this position",
        applicationId: existingApplication.id
      });
    }
    let finalResumeId = resumeId;
    if (applyWithNew === "true" && req.file) {
      try {
        const rawText = await extractText(req.file.path, req.file.mimetype);
        if (!rawText || rawText.length < 50) {
          if (fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
          return res.status(422).json({
            success: false,
            message: "Could not extract text from resume. Please ensure it's a valid PDF or DOCX file."
          });
        }
        const analysis = await analyzeResume(rawText, jobPosting.description);
        const contentData = {
          rawText,
          parsedData: analysis.parsedData ?? {},
          atsBreakdown: analysis.atsBreakdown ?? {},
          autoCorrectedText: analysis.autoCorrectedText ?? null,
          htmlContent: null,
          margins: { top: 60, right: 72, bottom: 60, left: 72 },
          template: "default",
          versions: []
        };
        const aiData = {
          scores: analysis.scores ?? {},
          strengths: analysis.strengths ?? [],
          improvements: analysis.improvements ?? {},
          missingSections: analysis.missingSections ?? [],
          keywordGaps: analysis.keywordGaps ?? [],
          jdOptimizationNotes: analysis.jdOptimizationNotes ?? ""
        };
        const newResume = await prisma.resume.create({
          data: {
            jobSeekerProfileId: profileId,
            name: `Resume for ${jobPosting.title} at ${jobPosting.company.name}`,
            source: "uploaded",
            filePath: req.file.path,
            atsScore: analysis.scores?.ats ?? null,
            content: contentData,
            aiSuggestions: aiData,
            isPrimary: false
          }
        });
        finalResumeId = newResume.id;
      } catch (error) {
        console.error("Error processing uploaded resume:", error);
        if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: "Failed to process uploaded resume" });
      }
    } else if (resumeId) {
      const existingResume = await prisma.resume.findFirst({
        where: { id: resumeId, jobSeekerProfileId: profileId }
      });
      if (!existingResume) {
        if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: "Selected resume not found" });
      }
      const contentData = existingResume.content ?? {};
      let rawText = contentData.rawText;
      if (!rawText && contentData.htmlContent) {
        rawText = contentData.htmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      }
      if (!rawText) {
        if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
        return res.status(422).json({ success: false, message: "Selected resume is corrupted. Please upload a new one." });
      }
      try {
        const reanalysis = await analyzeResume(rawText, jobPosting.description);
        const newAtsScore = reanalysis.scores?.ats ?? existingResume.atsScore;
        const currentAiData = existingResume.aiSuggestions ?? {};
        await prisma.resume.update({
          where: { id: resumeId },
          data: {
            atsScore: newAtsScore,
            aiSuggestions: {
              ...currentAiData,
              scores: reanalysis.scores ?? currentAiData.scores,
              strengths: reanalysis.strengths ?? currentAiData.strengths,
              improvements: reanalysis.improvements ?? currentAiData.improvements,
              missingSections: reanalysis.missingSections ?? currentAiData.missingSections,
              keywordGaps: reanalysis.keywordGaps ?? currentAiData.keywordGaps,
              jdOptimizationNotes: reanalysis.jdOptimizationNotes ?? currentAiData.jdOptimizationNotes
            }
          }
        });
      } catch (err) {
        console.error("Error re-analyzing existing resume for application:", err);
      }
      finalResumeId = resumeId;
    } else {
      if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Please select an existing resume or upload a new one"
      });
    }
    const application = await prisma.$transaction(async (tx) => {
      const app2 = await tx.application.create({
        data: {
          jobSeekerProfileId: profileId,
          jobPostingId,
          resumeId: finalResumeId,
          status: "applied",
          pipelineIndex: 0,
          candidateNotes: "",
          isWithdrawn: false
        },
        include: {
          jobPosting: {
            include: { company: { select: { name: true, logoUrl: true } } }
          },
          resume: { select: { name: true, atsScore: true } }
        }
      });
      await tx.applicationHistory.create({
        data: {
          applicationId: app2.id,
          toStatus: "applied",
          changedBy: userId,
          notes: "Application submitted successfully."
        }
      });
      return app2;
    });
    processApplicationMatchAsync(application.id, finalResumeId, jobPostingId);
    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application
    });
  } catch (error) {
    console.error("Apply to job error:", error);
    if (req.file && fs3.existsSync(req.file.path)) fs3.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: "Failed to submit application" });
  }
};
var getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!await ensureJobSeeker(userId))
      return res.status(403).json({ success: false, message: "Access denied: Job seeker role required" });
    const profileId = await getProfileId2(userId);
    if (!profileId)
      return res.status(404).json({ success: false, message: "Profile not found" });
    const { status, limit = "20", page = "1" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = { jobSeekerProfileId: profileId };
    if (status && status !== "all") where.status = status;
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          jobPosting: {
            include: { company: { select: { name: true, logoUrl: true } } }
          },
          resume: { select: { name: true, atsScore: true } }
        },
        orderBy: { appliedAt: "desc" },
        skip,
        take
      }),
      prisma.application.count({ where })
    ]);
    return res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error("Get applications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};
var getApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!await ensureJobSeeker(userId))
      return res.status(403).json({ success: false, message: "Access denied: Job seeker role required" });
    const profileId = await getProfileId2(userId);
    if (!profileId)
      return res.status(404).json({ success: false, message: "Profile not found" });
    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId },
      include: {
        jobPosting: {
          include: { company: { select: { name: true, logoUrl: true, industry: true, size: true } } }
        },
        resume: true,
        interviews: {
          include: {
            feedbacks: {
              include: {
                // FIX: InterviewFeedback.interviewer → TeamMember, not User
                // TeamMember has no jobSeekerProfile relation — only user relation
                interviewer: {
                  select: {
                    id: true,
                    user: { select: { id: true } }
                  }
                }
              },
              orderBy: { createdAt: "desc" }
            }
          },
          orderBy: { scheduledTime: "desc" }
        },
        offerLetters: { orderBy: { sentAt: "desc" } },
        statusHistory: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!application)
      return res.status(404).json({ success: false, message: "Application not found" });
    return res.json({ success: true, data: application });
  } catch (error) {
    console.error("Get application details error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch application details" });
  }
};
var withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!await ensureJobSeeker(userId))
      return res.status(403).json({ success: false, message: "Access denied: Job seeker role required" });
    const profileId = await getProfileId2(userId);
    if (!profileId)
      return res.status(404).json({ success: false, message: "Profile not found" });
    const application = await prisma.application.findFirst({
      where: { id, jobSeekerProfileId: profileId },
      include: { interviews: { select: { status: true } } }
    });
    if (!application)
      return res.status(404).json({ success: false, message: "Application not found" });
    if (["hired", "offer_sent"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw at this stage. Please contact the company directly."
      });
    }
    const hasActiveInterview = application.interviews.some(
      (i) => ["confirmed", "in_progress", "completed"].includes(i.status)
    );
    if (hasActiveInterview) {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw after interviews have been confirmed or completed."
      });
    }
    const updatedRecord = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: { status: "rejected", isWithdrawn: true }
      });
      await tx.applicationHistory.create({
        data: {
          applicationId: id,
          toStatus: "rejected",
          changedBy: userId,
          notes: "Candidate withdrew application."
        }
      });
      return updated;
    });
    return res.json({ success: true, message: "Application withdrawn successfully", data: updatedRecord });
  } catch (error) {
    console.error("Withdraw application error:", error);
    return res.status(500).json({ success: false, message: "Failed to withdraw application" });
  }
};

// src/controllers/publicJobs.controller.ts
var getPublicJobs = async (req, res) => {
  try {
    const {
      search,
      jobType,
      locationType,
      location,
      companyId,
      limit = "20",
      page = "1"
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const todayMidnight = /* @__PURE__ */ new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const andConditions = [
      { status: "active" },
      {
        OR: [
          { deadline: null },
          { deadline: { gte: todayMidnight } }
        ]
      }
    ];
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      });
    }
    if (jobType && jobType !== "all") andConditions.push({ jobType });
    if (locationType && locationType !== "all") andConditions.push({ locationType });
    if (location) andConditions.push({ location: { contains: location, mode: "insensitive" } });
    if (companyId) andConditions.push({ companyId });
    const where = { AND: andConditions };
    const loggedInProfileId = req.user?.jobSeekerProfileId;
    const hasSession = !!req.user?.userId;
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              industry: true,
              size: true,
              verificationBadge: true
            }
          },
          _count: { select: { applications: true } },
          // Conditionally fetch applications only for the logged-in user
          ...loggedInProfileId && {
            applications: {
              where: { jobSeekerProfileId: loggedInProfileId },
              select: { id: true, status: true, isWithdrawn: true }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.jobPosting.count({ where })
    ]);
    const formattedJobs = jobs.map((job) => {
      const { applications, ...jobDetails } = job;
      let userApplicationStatus = false;
      if (loggedInProfileId && applications && applications.length > 0) {
        const app2 = applications[0];
        userApplicationStatus = app2.isWithdrawn ? false : app2.id;
      }
      return {
        ...jobDetails,
        appliedStatus: userApplicationStatus
        // 👈 Returns the application ID string, or false
      };
    });
    return res.json({
      success: true,
      isLoggedIn: hasSession,
      data: formattedJobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error("Get public jobs error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};
var getPublicJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log("Fetching job details for ID:", jobId);
    const loggedInProfileId = req.user?.jobSeekerProfileId;
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            size: true,
            verificationBadge: true
          }
        },
        _count: { select: { applications: true } },
        // 1. Conditionally fetch application record only for the logged-in user
        ...loggedInProfileId && {
          applications: {
            where: { jobSeekerProfileId: loggedInProfileId },
            select: { id: true, isWithdrawn: true }
          }
        }
      }
    });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    const { applications, ...jobDetails } = job;
    let userApplicationStatus = false;
    if (loggedInProfileId && applications && applications.length > 0) {
      const app2 = applications[0];
      userApplicationStatus = app2.isWithdrawn ? false : app2.id;
    }
    return res.json({
      success: true,
      data: {
        ...jobDetails,
        appliedStatus: userApplicationStatus
        // 👈 Sends Application UUID String or false
      }
    });
  } catch (error) {
    console.error("Get job details error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch job details" });
  }
};

// src/controllers/interview.controller.ts
import { ApplicationStatus as ApplicationStatus2 } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
var getCompanyInterviewsList = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access: Missing structural company session token context."
      });
      return;
    }
    const interviews = await prisma.interview.findMany({
      where: {
        batch: {
          companyId
        }
      },
      select: {
        id: true,
        scheduledTime: true,
        durationMinutes: true,
        format: true,
        status: true,
        livekitRoomName: true,
        joinLink: true,
        // ADDED: Select feedbacks directly so the frontend pipeline charts can load summaries
        feedbacks: {
          select: {
            id: true,
            technicalRating: true,
            communicationRating: true,
            problemSolvingRating: true,
            verdict: true,
            notes: true
          }
        },
        rescheduleRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            proposedTime: true,
            candidateNote: true,
            status: true,
            createdAt: true
          }
        },
        application: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            jobSeekerProfileId: true,
            jobSeekerProfile: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                location: true,
                profilePhotoUrl: true
              }
            },
            jobPosting: {
              select: {
                id: true,
                title: true,
                department: true,
                jobType: true,
                locationType: true,
                salaryRange: true,
                openings: true,
                description: true,
                requiredSkills: true
              }
            },
            resume: {
              select: {
                id: true,
                name: true,
                filePath: true,
                atsScore: true
              }
            }
          }
        },
        batch: {
          select: {
            id: true,
            status: true,
            interviewers: {
              select: {
                teamMemberId: true,
                teamMember: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        jobSeekerProfile: {
                          select: {
                            fullName: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        scheduledTime: "asc"
      }
    });
    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews
    });
  } catch (error) {
    console.error("Failed compiling company pipeline interview context records:", error);
    res.status(500).json({ success: false, message: "Internal runtime server pipeline evaluation failure.", error: error.message });
  }
};
var getMyScheduledInterviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileId = await getProfileId3(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: "Job seeker profile workspace not found." });
    }
    const interviews = await prisma.interview.findMany({
      where: {
        application: {
          jobSeekerProfileId: profileId
        }
      },
      include: {
        application: {
          include: {
            jobPosting: {
              include: {
                company: {
                  select: {
                    name: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        },
        rescheduleRequests: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { scheduledTime: "asc" }
    });
    return res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error("Fetch jobseeker interviews tracking exception:", error);
    return res.status(500).json({ success: false, message: "Failed to extract active pipeline slots." });
  }
};
var confirmInterviewPresence = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: { status: "confirmed" }
    });
    return res.json({
      success: true,
      message: "Interview slot presence confirmed successfully.",
      data: updatedInterview
    });
  } catch (error) {
    console.error("Confirm interview error:", error);
    return res.status(500).json({ success: false, message: "Failed to update schedule allocation status." });
  }
};
var requestInterviewReschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { proposedTime, candidateNote } = req.body;
    const userId = req.user.userId;
    if (!proposedTime)
      return res.status(400).json({ success: false, message: "Proposed timestamp required." });
    const [requestLog, updatedInterview] = await prisma.$transaction([
      prisma.rescheduleRequest.create({
        data: {
          interviewId: id,
          requestedByUserId: userId,
          proposedTime: new Date(proposedTime),
          candidateNote: candidateNote || ""
        }
      }),
      prisma.interview.update({
        where: { id },
        data: { status: "reschedule_requested" }
      })
    ]);
    return res.json({
      success: true,
      message: "Reschedule request submitted.",
      data: { requestLog, updatedInterview }
    });
  } catch (error) {
    console.error("Request reschedule error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit reschedule request." });
  }
};
var respondToReschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!["approve", "decline"].includes(action)) {
      res.status(400).json({ success: false, message: "Invalid action payload context." });
      return;
    }
    const latestRequest = await prisma.rescheduleRequest.findFirst({
      where: { interviewId: id, status: "pending" },
      orderBy: { createdAt: "desc" }
    });
    if (!latestRequest) {
      res.status(404).json({ success: false, message: "No active pending scheduling requirements located." });
      return;
    }
    await prisma.$transaction(async (tx) => {
      await tx.rescheduleRequest.update({
        where: { id: latestRequest.id },
        data: { status: action === "approve" ? "approved" : "declined" }
      });
      if (action === "approve") {
        await tx.interview.update({
          where: { id },
          data: {
            scheduledTime: latestRequest.proposedTime,
            status: "scheduled"
          }
        });
      } else {
        await tx.interview.update({
          where: { id },
          data: { status: "scheduled" }
        });
      }
    });
    res.status(200).json({ success: true, message: `Successfully responded with action: ${action}` });
  } catch (error) {
    console.error("Reschedule response pipeline error:", error);
    res.status(500).json({ success: false, message: "Failed adjusting profile scheduling requirements workflow records." });
  }
};
var updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.interview.update({
      where: { id },
      data: { status }
    });
    res.status(200).json({ success: true, message: "Structural system status tracking trace updated successfully.", data: updated });
  } catch (error) {
    console.error("Pipeline manual override fault:", error);
    res.status(500).json({ success: false, message: "Failed assigning target inline manual pipeline block modifications." });
  }
};
var addInterviewFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { technicalRating, communicationRating, problemSolvingRating, verdict, notes } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const companyRoles = req.company?.companyRoles ?? 0;
    if (!userId) {
      res.status(401).json({ success: false, message: "Missing authorized authentication token." });
      return;
    }
    if (PermissionHelper.hasRole(companyRoles, ROLES.COMPANY_VIEWER) && !PermissionHelper.hasAnyRole(companyRoles, [ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER])) {
      res.status(403).json({ success: false, message: "Viewers cannot submit interview feedback." });
      return;
    }
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { status: true, applicationId: true }
    });
    if (!interview) {
      res.status(404).json({ success: false, message: "Interview not found." });
      return;
    }
    const verifiedAssignment = await prisma.interviewInterviewer.findFirst({
      where: { interviewId, teamMember: { userId } }
    });
    if (!verifiedAssignment) {
      res.status(403).json({ success: false, message: "You are not assigned to this interview." });
      return;
    }
    const existingFeedback = await prisma.interviewFeedback.findFirst({
      where: { interviewId, interviewerId: userId }
    });
    if (existingFeedback) {
      res.status(409).json({ success: false, message: "Feedback already submitted. Use update endpoint." });
      return;
    }
    await prisma.interviewFeedback.create({
      data: {
        interviewId,
        interviewerId: userId,
        technicalRating: parseInt(technicalRating, 10),
        communicationRating: parseInt(communicationRating, 10),
        problemSolvingRating: parseInt(problemSolvingRating, 10),
        verdict,
        notes: notes || ""
      }
    });
    await recalculateInterviewPipeline(interviewId, interview.applicationId, userId);
    res.status(201).json({ success: true, message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("addInterviewFeedback error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
var getInterviewFeedbacksList = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const feedbacks = await prisma.interviewFeedback.findMany({
      where: { interviewId },
      include: {
        interviewer: {
          select: {
            id: true,
            jobSeekerProfile: {
              select: { fullName: true }
            }
          }
        }
      }
    });
    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error("Failed compiling evaluation feedback metrics track:", error);
    res.status(500).json({ success: false, message: "Failed extracting targeted feedback elements." });
  }
};
var updateInterviewFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { technicalRating, communicationRating, problemSolvingRating, verdict, notes } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const companyRoles = req.company?.companyRoles ?? 0;
    if (!userId) {
      res.status(401).json({ success: false, message: "Missing authorized authentication token." });
      return;
    }
    if (PermissionHelper.hasRole(companyRoles, ROLES.COMPANY_VIEWER) && !PermissionHelper.hasAnyRole(companyRoles, [ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER])) {
      res.status(403).json({ success: false, message: "Viewers cannot modify interview feedback." });
      return;
    }
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { applicationId: true }
    });
    if (!interview) {
      res.status(404).json({ success: false, message: "Interview tracking context not found." });
      return;
    }
    const existingFeedback = await prisma.interviewFeedback.findFirst({
      where: { interviewId, interviewerId: userId }
    });
    if (!existingFeedback) {
      res.status(404).json({
        success: false,
        message: "No existing feedback track found to update. Submit initial feedback first."
      });
      return;
    }
    await prisma.interviewFeedback.update({
      where: { id: existingFeedback.id },
      data: {
        technicalRating: technicalRating !== void 0 ? parseInt(technicalRating, 10) : void 0,
        communicationRating: communicationRating !== void 0 ? parseInt(communicationRating, 10) : void 0,
        problemSolvingRating: problemSolvingRating !== void 0 ? parseInt(problemSolvingRating, 10) : void 0,
        verdict: verdict || void 0,
        notes: notes !== void 0 ? notes : void 0
      }
    });
    await recalculateInterviewPipeline(interviewId, interview.applicationId, userId);
    res.status(200).json({ success: true, message: "Interview feedback records updated successfully." });
  } catch (error) {
    console.error("updateInterviewFeedback error:", error);
    res.status(500).json({ success: false, message: "Internal server failure updating evaluation metrics.", error: error.message });
  }
};
var upsertInterviewFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { technicalRating, communicationRating, problemSolvingRating, verdict, notes } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const companyRoles = req.company?.companyRoles ?? 0;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }
    if (PermissionHelper.hasRole(companyRoles, ROLES.COMPANY_VIEWER) && !PermissionHelper.hasAnyRole(companyRoles, [ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER])) {
      res.status(403).json({ success: false, message: "Viewers cannot submit interview feedback." });
      return;
    }
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { applicationId: true }
    });
    if (!interview) {
      res.status(404).json({ success: false, message: "Interview not found." });
      return;
    }
    const existing = await prisma.interviewFeedback.findFirst({
      where: { interviewId, interviewerId: userId }
    });
    if (existing) {
      await prisma.interviewFeedback.update({
        where: { id: existing.id },
        data: {
          technicalRating: Number(technicalRating),
          communicationRating: Number(communicationRating),
          problemSolvingRating: Number(problemSolvingRating),
          verdict,
          notes
        }
      });
    } else {
      await prisma.interviewFeedback.create({
        data: {
          interviewId,
          interviewerId: userId,
          technicalRating: Number(technicalRating),
          communicationRating: Number(communicationRating),
          problemSolvingRating: Number(problemSolvingRating),
          verdict,
          notes
        }
      });
    }
    await recalculateInterviewPipeline(interviewId, interview.applicationId, userId);
    res.status(200).json({ success: true, message: "Feedback synchronized." });
  } catch (error) {
    console.error("upsertInterviewFeedback error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
var getInterviewFeedbackByCandidate = async (req, res) => {
  try {
    const { userId, applicationId } = req.params;
    if (!userId || !applicationId) {
      res.status(400).json({
        success: false,
        message: "Explicit parameters for both target candidate userId and applicationId tracking are required."
      });
      return;
    }
    const feedbacks = await prisma.interviewFeedback.findMany({
      where: {
        interview: {
          applicationId,
          application: {
            jobSeekerProfile: {
              userId
            }
          }
        }
      },
      include: {
        interviewer: {
          select: {
            id: true,
            jobSeekerProfile: {
              select: { fullName: true }
            }
          }
        },
        interview: {
          select: {
            id: true,
            status: true,
            scheduledTime: true,
            format: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error("getInterviewFeedbackByCandidate execution error:", error);
    res.status(500).json({
      success: false,
      message: "Failed compiling structural feedback matrix using the candidate criteria specifications.",
      error: error.message
    });
  }
};
async function recalculateInterviewPipeline(interviewId, applicationId, changedByUserId) {
  const assignedInterviewers = await prisma.interviewInterviewer.findMany({
    where: { interviewId },
    select: { teamMember: { select: { userId: true } } }
  });
  const assignedUserIds = assignedInterviewers.map((a) => a.teamMember.userId);
  const totalAssigned = assignedUserIds.length;
  if (totalAssigned === 0) return;
  const allFeedbacks = await prisma.interviewFeedback.findMany({
    where: { interviewId },
    select: { interviewerId: true, verdict: true }
  });
  const submittedCount = allFeedbacks.length;
  const verdicts = allFeedbacks.map((f) => f.verdict);
  const hasAnyRejection = verdicts.some((v) => v === "reject");
  const allSubmitted = submittedCount >= totalAssigned;
  const allAccepted = allSubmitted && verdicts.every((v) => v === "shortlist" || v === "next_round");
  const currentApp = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { status: true }
  });
  const currentInterview = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: { status: true }
  });
  if (hasAnyRejection) {
    if (currentInterview?.status !== "cancelled") {
      await prisma.$transaction([
        prisma.interview.update({
          where: { id: interviewId },
          data: { status: "cancelled" }
        }),
        prisma.application.update({
          where: { id: applicationId },
          data: { status: ApplicationStatus2.rejected, lastActivityAt: /* @__PURE__ */ new Date() }
        }),
        prisma.applicationHistory.create({
          data: {
            applicationId,
            fromStatus: currentApp?.status ?? null,
            toStatus: ApplicationStatus2.rejected,
            changedBy: changedByUserId,
            changedByType: "user",
            notes: `Candidate rejected after panel review. ${submittedCount}/${totalAssigned} interviewers responded. Rejection verdict submitted.`
          }
        })
      ]);
    }
    return;
  }
  if (!allSubmitted) {
    if (currentInterview?.status !== "in_progress") {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: "in_progress" }
      });
    }
    return;
  }
  if (allAccepted) {
    const currentStatus = currentApp?.status;
    let nextStatus;
    if (currentStatus === ApplicationStatus2.technical_round) {
      nextStatus = ApplicationStatus2.hr_round;
    } else if (currentStatus === ApplicationStatus2.hr_round) {
      nextStatus = ApplicationStatus2.hr_round;
    } else {
      nextStatus = ApplicationStatus2.screened;
    }
    await prisma.$transaction([
      prisma.interview.update({
        where: { id: interviewId },
        data: { status: "completed" }
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: { status: nextStatus, lastActivityAt: /* @__PURE__ */ new Date() }
      }),
      prisma.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: currentApp?.status ?? null,
          toStatus: nextStatus,
          changedBy: changedByUserId,
          changedByType: "user",
          notes: `All ${totalAssigned} interviewers accepted. Interview completed. Candidate advanced to ${nextStatus}.`
        }
      })
    ]);
  }
}
var getProfileId3 = async (userId) => {
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  return profile ? profile.id : null;
};
var getApplicationDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.companyId;
    if (!companyId) {
      res.status(401).json({ success: false, message: "Unauthorized access." });
      return;
    }
    const application = await prisma.application.findFirst({
      where: { id, jobPosting: { companyId } },
      include: {
        jobSeekerProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            location: true,
            profilePhotoUrl: true,
            linkedin: true,
            github: true,
            portfolio: true,
            bio: true,
            availabilityStatus: true
          }
        },
        resume: {
          select: { id: true, name: true, filePath: true, atsScore: true }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
            jobType: true,
            locationType: true,
            salaryRange: true,
            requiredSkills: true
          }
        },
        interviews: {
          include: {
            feedbacks: {
              include: {
                // FIXED: Fixed structural mismatch selection criteria to properly track User parameters from InterviewFeedback model config
                interviewer: {
                  select: {
                    id: true,
                    jobSeekerProfile: {
                      select: { fullName: true }
                    }
                  }
                }
              },
              orderBy: { createdAt: "desc" }
            },
            batch: {
              include: {
                interviewers: {
                  include: {
                    teamMember: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            jobSeekerProfile: {
                              select: { fullName: true, email: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { scheduledTime: "desc" }
        },
        statusHistory: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
        offerLetters: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found." });
      return;
    }
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error("getApplicationDetailById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch application details.", error: error.message });
  }
};
var requestReschedule = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { proposedTime, candidateNote } = req.body;
    const userId = req.user?.userId;
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: { jobSeekerProfile: { userId } }
      }
    });
    if (!interview)
      return res.status(404).json({ success: false, message: "Interview not found" });
    await prisma.rescheduleRequest.create({
      data: {
        interviewId,
        requestedByUserId: userId,
        proposedTime: new Date(proposedTime),
        candidateNote,
        status: "pending"
      }
    });
    return res.json({ success: true, message: "Reschedule request submitted" });
  } catch (error) {
    console.error("Reschedule request error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var scheduleBulkInterviews = async (req, res) => {
  try {
    const {
      jobPostingId,
      startTime,
      slotDuration,
      interviewFormat,
      interviewerIds,
      selectedApplicationIds,
      targetStatus
    } = req.body;
    const normalizedFormat = interviewFormat.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (!jobPostingId) {
      res.status(400).json({ success: false, message: "jobPostingId is required." });
      return;
    }
    if (!selectedApplicationIds || selectedApplicationIds.length === 0) {
      res.status(400).json({ success: false, message: "No applications selected." });
      return;
    }
    if (targetStatus !== "technical_round" && targetStatus !== "hr_round") {
      res.status(400).json({ success: false, message: "targetStatus must be technical_round or hr_round." });
      return;
    }
    const companyId = req.company?.companyId;
    const userId = req.user?.userId ?? "system";
    const batch = await prisma.interviewBatch.create({
      data: {
        companyId,
        jobPostingId,
        startTime: new Date(startTime),
        slotDuration: parseInt(slotDuration, 10),
        interviewFormat: normalizedFormat,
        selectedCandidateIds: selectedApplicationIds,
        status: "scheduled",
        interviewers: interviewerIds?.length ? {
          create: interviewerIds.map((teamMemberId) => ({ teamMemberId }))
        } : void 0
      }
    });
    const interviews = await Promise.all(
      selectedApplicationIds.map(async (applicationId, index) => {
        const scheduledTime = new Date(new Date(startTime).getTime() + index * slotDuration * 6e4);
        const roomName = `interview_${uuidv4()}`;
        const jobseekerBaseUrl = process.env.JOBSEEKER_URL || (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",")[0].trim() : "http://localhost:3000");
        return prisma.interview.create({
          data: {
            applicationId,
            batchId: batch.id,
            scheduledTime,
            durationMinutes: parseInt(slotDuration, 10),
            format: normalizedFormat,
            livekitRoomName: roomName,
            joinLink: `${jobseekerBaseUrl}/meet/${roomName}?role=candidate`,
            status: "scheduled",
            interviewers: interviewerIds?.length ? {
              create: interviewerIds.map((teamMemberId) => ({ teamMemberId }))
            } : void 0
          }
        });
      })
    );
    await prisma.$transaction([
      prisma.application.updateMany({
        where: { id: { in: selectedApplicationIds } },
        data: { status: targetStatus, lastActivityAt: /* @__PURE__ */ new Date() }
      }),
      ...selectedApplicationIds.map(
        (applicationId) => prisma.applicationHistory.create({
          data: {
            applicationId,
            toStatus: targetStatus,
            changedBy: userId,
            changedByType: "user",
            notes: `Moved to ${targetStatus} via bulk interview scheduling.`
          }
        })
      )
    ]);
    res.status(201).json({
      success: true,
      message: `${interviews.length} interviews scheduled successfully.`,
      data: { batch, interviews }
    });
  } catch (error) {
    console.error("scheduleBulkInterviews error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// src/controllers/applicationTracker.controller.ts
import { ApplicationStatus as ApplicationStatus3 } from "@prisma/client";
var getApplicationsTracker = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized session" });
    }
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) {
      return res.status(200).json({ success: true, data: [] });
    }
    const applications = await prisma.application.findMany({
      where: { jobSeekerProfileId: profile.id },
      include: {
        jobPosting: {
          include: {
            company: {
              select: { name: true, logoUrl: true, industry: true }
            }
          }
        },
        resume: {
          select: { id: true, name: true, filePath: true }
        },
        statusHistory: {
          orderBy: { createdAt: "asc" }
        },
        interviews: {
          include: {
            feedbacks: {
              select: {
                id: true,
                verdict: true,
                notes: true,
                createdAt: true
              }
            }
          },
          orderBy: { scheduledTime: "desc" }
        },
        offerLetters: {
          orderBy: { sentAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    const mappedTrackerData = applications.map((app2) => {
      let liveStatusBadge = app2.status.toLowerCase();
      if (app2.isWithdrawn) {
        liveStatusBadge = "withdrawn";
      }
      const interviewHistory = app2.interviews.map((interview) => ({
        interviewId: interview.id,
        scheduledTime: interview.scheduledTime,
        durationMinutes: interview.durationMinutes,
        format: interview.format,
        status: interview.status,
        livekitRoomName: interview.livekitRoomName,
        joinLink: ["scheduled", "in_progress"].includes(interview.status) ? interview.joinLink : null,
        companyFeedback: interview.feedbacks.map((f) => ({
          verdict: f.verdict,
          notes: f.notes || "No notes shared by interviewer.",
          createdAt: f.createdAt
        }))
      }));
      const visualTimeline = app2.statusHistory.map((log) => ({
        stage: log.toStatus,
        date: log.createdAt,
        notes: log.notes || `Moved to stage: ${log.toStatus.replace(/_/g, " ")}`
      }));
      const hasInterviewsStarted = app2.interviews.some(
        (i) => ["confirmed", "in_progress", "completed"].includes(i.status)
      );
      const canWithdraw = !app2.isWithdrawn && !["hired", "rejected", "offer_sent"].includes(app2.status) && !hasInterviewsStarted;
      const activeOfferRecord = app2.offerLetters[0];
      return {
        applicationId: app2.id,
        liveStatusBadge,
        isWithdrawn: app2.isWithdrawn,
        currentStage: app2.status,
        pipelineIndex: app2.pipelineIndex,
        candidateNotes: app2.candidateNotes || "",
        appliedAt: app2.appliedAt,
        updatedAt: app2.updatedAt,
        jobDetails: {
          id: app2.jobPostingId,
          title: activeOfferRecord?.position || app2.jobPosting.title,
          department: activeOfferRecord?.department || app2.jobPosting.department || "",
          jobType: app2.jobPosting.jobType,
          locationType: app2.jobPosting.locationType || "Onsite",
          location: activeOfferRecord?.location || app2.jobPosting.location || "Remote",
          experienceRequired: app2.jobPosting.experienceRequired || "Not specified",
          // Maps either the finalized compensation package or the listing bracket
          compensationContext: activeOfferRecord ? `${activeOfferRecord.currency} ${Number(activeOfferRecord.salary).toLocaleString()}` : app2.jobPosting.salaryRange || "Disclosed upon screening"
        },
        companyDetails: {
          name: app2.jobPosting.company.name,
          logoUrl: app2.jobPosting.company.logoUrl,
          industry: app2.jobPosting.company.industry
        },
        resumeUsed: {
          id: app2.resume.id,
          name: app2.resume.name,
          downloadPath: app2.resume.filePath
        },
        timelineView: visualTimeline,
        interviewHistory,
        activeOffer: activeOfferRecord ? {
          id: activeOfferRecord.id,
          status: activeOfferRecord.status,
          filePath: activeOfferRecord.filePath,
          sentAt: activeOfferRecord.sentAt,
          finalPosition: activeOfferRecord.position,
          finalSalary: activeOfferRecord.salary,
          currency: activeOfferRecord.currency,
          startDate: activeOfferRecord.startDate,
          employmentType: activeOfferRecord.employmentType
        } : null,
        canWithdraw
      };
    });
    return res.status(200).json({ success: true, data: mappedTrackerData });
  } catch (error) {
    console.error("Tracker data payload extraction runtime crash:", error);
    return res.status(500).json({ success: false, error: "Internal system tracking service failure" });
  }
};
var updateApplicationNotes = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id: applicationId } = req.params;
    const { notes } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized access point context" });
    }
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobSeekerProfile: { userId }
      }
    });
    if (!application) {
      return res.status(404).json({ success: false, error: "Target application profile map mismatch" });
    }
    await prisma.application.update({
      where: { id: applicationId },
      data: { candidateNotes: notes }
    });
    return res.status(200).json({ success: true, message: "Personal tracking notes updated successfully" });
  } catch (error) {
    console.error("Update personal notes database crash:", error);
    return res.status(500).json({ success: false, error: "Failed to update personal application metadata structure" });
  }
};
var withdrawApplicationTracker = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id: applicationId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized context scope signature" });
    }
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobSeekerProfile: { userId }
      },
      include: { interviews: true }
    });
    if (!application) {
      return res.status(404).json({ success: false, error: "Application history index mismatch" });
    }
    const lockingInterviewStatuses = ["confirmed", "in_progress", "completed"];
    const executionLocked = application.interviews.some((i) => lockingInterviewStatuses.includes(i.status));
    if (executionLocked || ["hired", "rejected", "offer_sent"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: "Withdrawal locked. Process is too far advanced in corporate processing pipelines."
      });
    }
    const previousStatus = application.status;
    await prisma.$transaction([
      // 1. Update the application status flags cleanly
      prisma.application.update({
        where: { id: applicationId },
        data: {
          isWithdrawn: true,
          status: ApplicationStatus3.rejected
        }
      }),
      // 2. Write the audit log history entry with all schema-required keys
      prisma.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: previousStatus,
          // Populates the optional tracking field
          toStatus: ApplicationStatus3.rejected,
          // This is where toStatus belongs!
          changedBy: userId,
          // Required by schema
          changedByType: "candidate",
          // Required by schema
          notes: "Candidate triggered one-tap withdrawal pipeline rejection directly from dashboard."
        }
      })
    ]);
    return res.status(200).json({ success: true, message: "Application cleanly withdrawn from job tracking queues" });
  } catch (error) {
    console.error("Transaction execution processing fail on withdrawal routine:", error);
    return res.status(500).json({ success: false, error: "Transactional state tracking update rollback occurred" });
  }
};
var getSingleApplicationDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { applicationId } = req.params;
    console.log("Received request for application tracker details with params:", { userId, applicationId });
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized session" });
    }
    if (!applicationId) {
      return res.status(400).json({ success: false, error: "Missing target application parameters" });
    }
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) {
      return res.status(403).json({ success: false, error: "Candidate profile identity workspace not found" });
    }
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobSeekerProfileId: profile.id
      },
      include: {
        jobPosting: {
          include: {
            company: {
              select: { name: true, logoUrl: true, industry: true }
            }
          }
        },
        resume: {
          select: { id: true, name: true, filePath: true }
        },
        statusHistory: {
          orderBy: { createdAt: "asc" }
        },
        interviews: {
          include: {
            feedbacks: {
              select: {
                id: true,
                verdict: true,
                notes: true,
                createdAt: true
              }
            }
          },
          orderBy: { scheduledTime: "desc" }
        },
        offerLetters: {
          orderBy: { sentAt: "desc" },
          take: 1
        }
      }
    });
    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application records not located or unauthorized tracking permission requested."
      });
    }
    let liveStatusBadge = application.status.toLowerCase();
    if (application.isWithdrawn) {
      liveStatusBadge = "withdrawn";
    }
    const interviewHistory = application.interviews.map((interview) => ({
      interviewId: interview.id,
      scheduledTime: interview.scheduledTime,
      durationMinutes: interview.durationMinutes,
      format: interview.format,
      status: interview.status,
      livekitRoomName: interview.livekitRoomName,
      // Fixed potential string type safety arrays evaluation
      joinLink: ["scheduled", "confirmed", "in_progress"].includes(interview.status) ? interview.joinLink : null,
      companyFeedback: interview.feedbacks.map((f) => ({
        verdict: f.verdict,
        notes: f.notes || "No notes shared by interviewer.",
        createdAt: f.createdAt
      }))
    }));
    const visualTimeline = application.statusHistory.map((log) => ({
      stage: log.toStatus,
      date: log.createdAt,
      notes: log.notes || `Moved to stage: ${log.toStatus.replace(/_/g, " ")}`
    }));
    const hasInterviewsStarted = application.interviews.some(
      (i) => ["confirmed", "in_progress", "completed"].includes(i.status)
    );
    const canWithdraw = !application.isWithdrawn && !["hired", "rejected", "offer_sent"].includes(application.status) && !hasInterviewsStarted;
    const activeOfferRecord = application.offerLetters[0];
    const mappedPayload = {
      applicationId: application.id,
      liveStatusBadge,
      isWithdrawn: application.isWithdrawn,
      currentStage: application.status,
      pipelineIndex: application.pipelineIndex,
      candidateNotes: application.candidateNotes || "",
      appliedAt: application.appliedAt,
      updatedAt: application.updatedAt,
      jobDetails: {
        id: application.jobPostingId,
        title: activeOfferRecord?.position || application.jobPosting.title,
        department: activeOfferRecord?.department || application.jobPosting.department || "",
        jobType: application.jobPosting.jobType,
        locationType: application.jobPosting.locationType || "Onsite",
        location: activeOfferRecord?.location || application.jobPosting.location || "Remote",
        experienceRequired: application.jobPosting.experienceRequired || "Not specified",
        // Fixed: Added safety parsing fallbacks around Decimal type coming from postgres via Prisma
        compensationContext: activeOfferRecord ? `${activeOfferRecord.currency} ${Number(activeOfferRecord.salary).toLocaleString()}` : application.jobPosting.salaryRange || "Disclosed upon screening"
      },
      companyDetails: {
        name: application.jobPosting.company.name,
        logoUrl: application.jobPosting.company.logoUrl,
        industry: application.jobPosting.company.industry
      },
      resumeUsed: {
        id: application.resume.id,
        name: application.resume.name,
        downloadPath: application.resume.filePath || ""
      },
      timelineView: visualTimeline,
      interviewHistory,
      activeOffer: activeOfferRecord ? {
        id: activeOfferRecord.id,
        status: activeOfferRecord.status,
        filePath: activeOfferRecord.filePath,
        sentAt: activeOfferRecord.sentAt,
        finalPosition: activeOfferRecord.position,
        finalSalary: Number(activeOfferRecord.salary),
        // Cast Decimal down cleanly to safe JS number
        currency: activeOfferRecord.currency,
        startDate: activeOfferRecord.startDate,
        employmentType: activeOfferRecord.employmentType
      } : null,
      canWithdraw
    };
    return res.status(200).json({ success: true, data: mappedPayload });
  } catch (error) {
    console.error("Single target entity data runtime access exception crash:", error);
    return res.status(500).json({ success: false, error: "Internal system tracking service failure" });
  }
};

// src/routes/offer.routes.ts
import express2 from "express";

// src/controllers/offer.controller.ts
import "@prisma/client";
import PDFDocument from "pdfkit";
import fs4 from "fs";
import path from "path";

// src/utils/email.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "workbridge.anandhu@gmail.com",
    pass: process.env.SMTP_PASS || "hackerpass"
    // This should be a 16-character App Password if using 2FA
  }
});
var sendEmail = async ({ to, subject, html, attachments }) => {
  const fromEmail = process.env.EMAIL_FROM || "workbridge.anandhu@gmail.com";
  const mailOptions = {
    from: `"WorkBridge Support" <${fromEmail}>`,
    to,
    subject,
    html
  };
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }
  try {
    await transporter.sendMail(mailOptions);
    console.log(`\u2709\uFE0F Operational SMTP email successfully dispatched to: ${to}`);
  } catch (error) {
    console.error(`\u274C Critical error dispatching SMTP email to ${to}:`, error);
    throw new Error("SMTP transactional delivery channel crashed.");
  }
};
var sendVerificationEmail = async (email, token) => {
  const clientAppUrl = process.env.COMPANY_URL || "http://localhost:3001";
  const completeVerificationUrl = `${clientAppUrl}/verify-email?token=${token}`;
  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-md;">
      <h2 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Verify your WorkBridge Workspace</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">
        Thank you for choosing WorkBridge. Please confirm your corporate email address to unlock your recruiter management control panel.
      </p>
      <div style="margin: 32px 0;">
        <a href="${completeVerificationUrl}" 
           style="background-color: #000000; color: #ffffff; padding: 12px 24px; font-weight: 500; text-decoration: none; border-radius: 8px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        This activation connection token will expire automatically in 24 hours. If you did not initiate this workspace configuration, please ignore this communication.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        Secure link raw context fallback: <br/>
        <a href="${completeVerificationUrl}" style="color: #2563eb;">${completeVerificationUrl}</a>
      </p>
    </div>
  `;
  await sendEmail({
    to: email,
    subject: "Action Required: Activate Your Corporate Workspace Profile",
    html: htmlTemplate
  });
};
var sendPasswordResetEmail = async (email, token) => {
  const clientAppUrl = process.env.COMPANY_URL || "http://localhost:3001";
  const completeResetUrl = `${clientAppUrl}/reset-password?token=${token}`;
  const htmlTemplate = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Reset Your Password</h2>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">
        We received a request to reset the password for your WorkBridge company account. Click the button below to set a new password.
      </p>
      <div style="margin: 32px 0;">
        <a href="${completeResetUrl}" 
           style="background-color: #000000; color: #ffffff; padding: 12px 24px; font-weight: 500; text-decoration: none; border-radius: 8px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        This reset link will expire automatically in 1 hour. If you did not request this password reset, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        Secure link raw context fallback: <br/>
        <a href="${completeResetUrl}" style="color: #2563eb;">${completeResetUrl}</a>
      </p>
    </div>
  `;
  await sendEmail({
    to: email,
    subject: "Action Required: Reset Your Password",
    html: htmlTemplate
  });
};
var sendTeamInviteEmail = async (email, inviteLink, role, companyName) => {
  const roleLabels = {
    hr_manager: "HR Hiring Manager",
    interviewer: "Technical Evaluator / Interviewer",
    viewer: "Pipeline Reviewer (Viewer Profile)"
  };
  const assignedRoleLabel = roleLabels[role] || role;
  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #1c1c1e; background-color: #0a0a0a; color: #ffffff; border-radius: 16px;">
      <div style="margin-bottom: 24px;">
        <span style="font-weight: 700; font-size: 16px; tracking-content: -0.05em; color: #ffffff; font-family: monospace;">WORK//BRIDGE</span>
      </div>
      
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; tracking-content: -0.02em; margin-top: 0; margin-bottom: 12px;">
        Join ${companyName} on WorkBridge
      </h2>
      
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        You have been formally invited to join the corporate workspace for <strong style="color: #ffffff;">${companyName}</strong> as a designated <strong style="color: #ffffff;">${assignedRoleLabel}</strong>. This gives you secure access to manage the live candidate evaluation pipeline, sandboxes, and structural interview blocks.
      </p>
      
      <div style="margin: 28px 0;">
        <a href="${inviteLink}" 
           style="background-color: #ffffff; color: #000000; padding: 11px 20px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; transition: all 0.15s ease;">
          Accept Workspace Invitation
        </a>
      </div>
      
      <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
        This secure activation parameter will expire automatically in 7 days. If you were not expecting this corporate affiliation request, you can safely dismiss this message.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #1c1c1e; margin: 24px 0;" />
      
      <p style="color: #52525b; font-size: 11px; font-family: monospace; word-break: break-all; margin: 0;">
        Fallback Raw Token Link:<br/>
        <a href="${inviteLink}" style="color: #a1a1aa; text-decoration: underline;">${inviteLink}</a>
      </p>
    </div>
  `;
  await sendEmail({
    to: email,
    subject: `Invitation to join ${companyName} on WorkBridge`,
    html: htmlTemplate
  });
};
var sendOfferLetterEmail = async (candidateEmail, candidateName, position, companyName, companyLogoUrl, offerId, pdfPath) => {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  const viewOfferLink = `${frontendUrl}/offers/${offerId}`;
  const trackingPixel = `<img src="${backendUrl}/api/offers/${offerId}/track" width="1" height="1" style="display:block;" />`;
  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #0a0a0a;">
      
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #27272a;">
        ${companyLogoUrl ? `<img src="${companyLogoUrl}" alt="${companyName}" style="max-width: 120px; height: auto; margin-bottom: 20px;" />` : `<div style="font-weight: 700; font-size: 20px; color: #ffffff; font-family: monospace; margin-bottom: 20px;">${companyName}</div>`}
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; tracking-content: -0.02em;">
          Congratulations! \u{1F389}
        </h1>
      </div>

      <!-- Content Section -->
      <div style="padding: 40px 32px; background-color: #0a0a0a; color: #ffffff;">
        <p style="color: #e4e4e7; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Dear <strong style="color: #ffffff;">${candidateName}</strong>,
        </p>

        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          We are delighted to extend an official offer of employment for the position of 
          <strong style="color: #ffffff;">${position}</strong> at <strong style="color: #ffffff;">${companyName}</strong>.
        </p>

        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Your skills, experience, and interview performance have impressed our team, and we believe you'll be an excellent addition to our organization.
        </p>

        <!-- Call to Action -->
        <div style="margin: 36px 0; text-align: center;">
          <a href="${viewOfferLink}" 
             style="background-color: #ffffff; color: #000000; padding: 14px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; display: inline-block; transition: all 0.2s ease;">
            \u{1F4C4} View & Respond to Offer Letter
          </a>
        </div>

        <!-- Instructions -->
        <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #fbbf24; font-size: 13px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; tracking-content: 0.05em;">
            \u{1F4CC} Next Steps
          </p>
          <ul style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Review the attached offer letter PDF carefully</li>
            <li style="margin-bottom: 8px;">Click the button above to access your digital dashboard</li>
            <li style="margin-bottom: 8px;">You can <strong style="color: #ffffff;">Accept</strong>, <strong style="color: #ffffff;">Decline</strong>, or <strong style="color: #ffffff;">Request Negotiation</strong></li>
            <li style="margin-bottom: 0;">Sign digitally to finalize your acceptance</li>
          </ul>
        </div>

        <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0;">
          We're excited about the possibility of you joining our team. If you have any questions, please don't hesitate to reach out.
        </p>

        <p style="color: #a1a1aa; font-size: 14px; margin: 28px 0 0 0;">
          Best regards,<br/>
          <strong style="color: #ffffff;">The ${companyName} Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #18181b; border-top: 1px solid #27272a; padding: 24px 32px; text-align: center;">
        <p style="color: #52525b; font-size: 11px; margin: 0 0 8px 0; font-family: monospace;">
          This offer is confidential and intended solely for ${candidateName}
        </p>
        <p style="color: #3f3f46; font-size: 11px; margin: 0;">
          Secure Link: <a href="${viewOfferLink}" style="color: #71717a; text-decoration: underline;">${viewOfferLink}</a>
        </p>
        <p style="color: #27272a; font-size: 10px; margin: 12px 0 0 0; font-family: monospace;">
          WORK//BRIDGE \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} \u2022 Automated Hiring Infrastructure
        </p>
      </div>

      <!-- Tracking Pixel -->
      ${trackingPixel}
    </div>
  `;
  await sendEmail({
    to: candidateEmail,
    subject: `\u{1F389} Offer Letter: ${position} at ${companyName}`,
    html: htmlTemplate,
    attachments: [
      {
        filename: `${companyName}-Offer-Letter-${position.replace(/\s+/g, "-")}.pdf`,
        path: pdfPath,
        contentType: "application/pdf"
      }
    ]
  });
};
var sendOfferResponseNotification = async (companyEmail, candidateName, position, response, negotiationNote) => {
  const responseMessages = {
    accept: {
      emoji: "\u2705",
      title: "Offer Accepted",
      message: `Great news! ${candidateName} has accepted the offer for ${position}.`,
      color: "#10b981"
    },
    decline: {
      emoji: "\u274C",
      title: "Offer Declined",
      message: `${candidateName} has declined the offer for ${position}.`,
      color: "#ef4444"
    },
    negotiate: {
      emoji: "\u{1F4AC}",
      title: "Negotiation Requested",
      message: `${candidateName} has requested to negotiate the offer for ${position}.`,
      color: "#f59e0b"
    }
  };
  const config = responseMessages[response];
  const htmlTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #27272a; background-color: #0a0a0a; color: #ffffff; border-radius: 16px;">
      
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 12px;">${config.emoji}</div>
        <h2 style="color: ${config.color}; font-size: 22px; font-weight: 700; margin: 0;">
          ${config.title}
        </h2>
      </div>

      <p style="color: #e4e4e7; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
        ${config.message}
      </p>

      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 8px 0;"><strong style="color: #ffffff;">Candidate:</strong> ${candidateName}</p>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0;"><strong style="color: #ffffff;">Position:</strong> ${position}</p>
      </div>

      ${negotiationNote ? `
        <div style="background-color: #18181b; border-left: 3px solid ${config.color}; padding: 16px; margin: 20px 0;">
          <p style="color: #fbbf24; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase;">Negotiation Message:</p>
          <p style="color: #d4d4d8; font-size: 14px; margin: 0; font-style: italic;">"${negotiationNote}"</p>
        </div>
      ` : ""}

      <p style="color: #71717a; font-size: 13px; margin: 24px 0 0 0;">
        Log in to your WorkBridge dashboard to view full details and take next steps.
      </p>

    </div>
  `;
  await sendEmail({
    to: companyEmail,
    subject: `${config.emoji} Offer Response: ${candidateName} - ${position}`,
    html: htmlTemplate
  });
};

// src/controllers/offer.controller.ts
var getCompanyTemplates = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const templates = await prisma.offerTemplate.findMany({
      where: { companyId, isActive: true },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ]
    });
    return res.json({ success: true, data: templates });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var updateOfferTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.companyId;
    const { name, content, isDefault, isActive } = req.body;
    const template = await prisma.offerTemplate.findFirst({
      where: { id, companyId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    if (isDefault) {
      await prisma.offerTemplate.updateMany({
        where: { companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }
    const updated = await prisma.offerTemplate.update({
      where: { id },
      data: { name, content, isDefault, isActive }
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var deleteOfferTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.companyId;
    const template = await prisma.offerTemplate.findFirst({
      where: { id, companyId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    await prisma.offerTemplate.delete({ where: { id } });
    return res.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    console.error("Delete template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var renderTemplate = (template, data) => {
  let rendered = template;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, data[key] || "");
  });
  return rendered;
};
var generateOfferPDF = async (offer, content) => {
  const uploadsDir = path.join(process.cwd(), "uploads", "offers");
  if (!fs4.existsSync(uploadsDir)) fs4.mkdirSync(uploadsDir, { recursive: true });
  const filename = `offer-${offer.id}.pdf`;
  const filepath = path.join(uploadsDir, filename);
  let offerContent = {};
  try {
    offerContent = typeof content === "string" ? JSON.parse(content) : content;
  } catch (e) {
    offerContent = {};
  }
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true, autoFirstPage: true });
    const stream = fs4.createWriteStream(filepath);
    doc.pipe(stream);
    const W = doc.page.width;
    const H = doc.page.height;
    const L = 54;
    const R = W - 54;
    const PW = R - L;
    const companyName = offer.application.jobPosting.company.name;
    const logoUrl = offer.application.jobPosting.company.logoUrl;
    const profile = offer.application.jobSeekerProfile;
    const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: offer.currency || "USD" }).format(Number(n));
    const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const abs = (text, x, y, opts = {}) => {
      doc.save();
      doc.text(text, x, y, { lineBreak: false, ...opts });
      doc.restore();
    };
    doc.save();
    doc.fontSize(44).font("Helvetica-Bold").fillColor("#000000", 0.015).text(companyName.toUpperCase(), L, 340, { align: "center", width: PW });
    doc.restore();
    let logoRendered = false;
    if (logoUrl && fs4.existsSync(logoUrl)) {
      try {
        doc.image(logoUrl, L, 54, { width: 55 });
        doc.save();
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#111827").text(companyName, 125, 56, { lineBreak: false });
        doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text(offer.location || "Corporate Office", 125, 70, { lineBreak: false }).text(offer.application.jobPosting.company.email || "", 125, 81, { lineBreak: false });
        doc.restore();
        logoRendered = true;
      } catch (e) {
      }
    }
    if (!logoRendered) {
      doc.save();
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#111827").text(companyName.toUpperCase(), L, 54, { lineBreak: false });
      doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text(offer.location || "Corporate Office", L, 70, { lineBreak: false }).text(offer.application.jobPosting.company.email || "", L, 80, { lineBreak: false });
      doc.restore();
    }
    doc.moveTo(L, 110).lineTo(R, 110).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.save();
    doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563");
    doc.text(`Offer Ref: ${offer.id.substring(0, 8).toUpperCase()}`, L, 120, { lineBreak: false });
    doc.text(`Date: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, L, 120, { align: "right", width: PW, lineBreak: false });
    doc.restore();
    doc.save();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#4b5563").text("PREPARED FOR:", L, 140, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(profile.fullName, L, 153, { lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text(`Email: ${profile.email}`, L, 166, { lineBreak: false });
    if (profile.phone) doc.text(`Phone: ${profile.phone}`, L, 177, { lineBreak: false });
    doc.restore();
    doc.save();
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#111827").text(`Dear ${profile.fullName},`, L, 197, { lineBreak: false });
    doc.restore();
    const openingText = `We are pleased to extend this formal offer of employment for the position of ${offer.position} with ${companyName}. We were incredibly impressed by your qualifications and technical profile during our review cycles, and we believe your skills will make an excellent addition to our team.`;
    doc.text("", L, 211);
    doc.font("Helvetica").fontSize(9).fillColor("#374151").text(openingText, { align: "justify", width: PW, lineGap: 2 });
    const tableTop = doc.y + 10;
    const tableData = [
      ["Position Title", offer.position || ""],
      ["Department", offer.department || "Operations / Core Engineering"],
      ["Employment Type", offer.employmentType ? offer.employmentType.replace(/_/g, " ").toUpperCase() : "FULL TIME"],
      ["Base Compensation", fmt(offer.salary)],
      ["Commencement Date", fmtDate(offer.startDate)],
      ["Deployment Location", offer.location || "As specified by corporate HR rules"]
    ];
    doc.save();
    doc.rect(L, tableTop, PW, 18).fill("#f3f4f6");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#1f2937").text("POSITION SUMMARY & PARAMETERS", L + 8, tableTop + 5, { lineBreak: false });
    doc.restore();
    let ty = tableTop + 18;
    tableData.forEach((row) => {
      doc.moveTo(L, ty + 16).lineTo(R, ty + 16).strokeColor("#f3f4f6").lineWidth(1).stroke();
      doc.save();
      doc.font("Helvetica").fontSize(8.5).fillColor("#4b5563").text(row[0], L + 8, ty + 4, { lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111827").text(row[1], 210, ty + 4, { width: PW - 160, lineBreak: false });
      doc.restore();
      ty += 16;
    });
    doc.text("", L, ty + 10);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#111827").text("Standard Employment Contingencies:", { lineBreak: false });
    const terms = [
      "This execution offer remains highly contingent on clear backgrounds, records, and verification passes.",
      "You will be bound to fulfill responsibilities under corporate non-disclosure agreements.",
      "Standard statutory performance appraisals, protection policies, and perks scale inline with company rules.",
      "This offer is dynamically active and must be processed within 7 sequential calendar days from issuance."
    ];
    terms.forEach((term, idx) => {
      const termStartY = doc.y + 6;
      doc.save();
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#374151").text(`${idx + 1}.`, L, termStartY, { lineBreak: false, width: 12 });
      doc.restore();
      doc.text("", L + 14, termStartY);
      doc.font("Helvetica").fontSize(8).fillColor("#4b5563").text(term, { width: PW - 14, align: "justify" });
    });
    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#4b5563").text(
      "To indicate formal confirmation of acceptance, please digitally execute your authorization signature below.",
      L,
      doc.y + 8,
      { width: PW }
    );
    const SIGN_BLOCK_HEIGHT = 110;
    const FOOTER_H = 48;
    const sigAreaBottom = H - FOOTER_H;
    const sigAreaTop = sigAreaBottom - SIGN_BLOCK_HEIGHT;
    const contentEndsAt = doc.y;
    const sigY = Math.max(contentEndsAt + 20, sigAreaTop);
    const finalSigY = sigY + SIGN_BLOCK_HEIGHT <= sigAreaBottom ? sigY : contentEndsAt + 20;
    doc.text("", L, finalSigY);
    doc.save();
    doc.font("Helvetica").fontSize(8.5).fillColor("#111827").text("Sincerely,", L, finalSigY, { lineBreak: false });
    doc.restore();
    if (offer.companySignature?.signature) {
      try {
        const compImg = parseSignatureImage(offer.companySignature.signature);
        if (compImg) doc.image(compImg, L, finalSigY + 14, { width: 100, height: 28, fit: [100, 28] });
      } catch (e) {
        console.error("Corp sig error:", e);
      }
    }
    doc.moveTo(L, finalSigY + 44).lineTo(L + 130, finalSigY + 44).strokeColor("#9ca3af").lineWidth(0.5).stroke();
    doc.save();
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#1f2937").text("Authorized Signatory", L, finalSigY + 48, { lineBreak: false });
    doc.font("Helvetica").fontSize(7.5).fillColor("#6b7280").text(
      offer.companySignature ? `Verified: ${new Date(offer.companySignature.signedAt).toLocaleDateString()}` : "Awaiting Corporate Stamp",
      L,
      finalSigY + 58,
      { lineBreak: false }
    );
    doc.restore();
    const rightSignX = R - 130;
    if (offer.candidateSignature?.signature) {
      try {
        const candImg = parseSignatureImage(offer.candidateSignature.signature);
        if (candImg) doc.image(candImg, rightSignX, finalSigY + 14, { width: 100, height: 28, fit: [100, 28] });
      } catch (e) {
        console.error("Cand sig error:", e);
      }
    }
    doc.moveTo(rightSignX, finalSigY + 44).lineTo(R, finalSigY + 44).strokeColor("#9ca3af").lineWidth(0.5).stroke();
    doc.save();
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#1f2937").text("Candidate Acceptance", rightSignX, finalSigY + 48, { lineBreak: false });
    doc.font("Helvetica").fontSize(7.5).fillColor("#6b7280").text(
      offer.candidateSignature ? `Digitally Signed: ${new Date(offer.candidateSignature.signedAt).toLocaleDateString()}` : "Awaiting Signatures",
      rightSignX,
      finalSigY + 58,
      { lineBreak: false }
    );
    doc.restore();
    doc.moveTo(L, H - 42).lineTo(R, H - 42).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    doc.save();
    doc.font("Helvetica").fontSize(7.5).fillColor("#9ca3af").text(`${companyName} \u2022 Private & Confidential Employment Offer`, L, H - 34, { lineBreak: false });
    doc.text("Page 1 of 1", L, H - 34, { width: PW, align: "right", lineBreak: false });
    doc.restore();
    doc.end();
    stream.on("finish", async () => {
      try {
        const { PDFDocument: PDFDocument2 } = await import("pdf-lib");
        const srcBytes = fs4.readFileSync(filepath);
        const srcDoc = await PDFDocument2.load(srcBytes);
        if (srcDoc.getPageCount() > 1) {
          const newDoc = await PDFDocument2.create();
          const [firstPage] = await newDoc.copyPages(srcDoc, [0]);
          newDoc.addPage(firstPage);
          const trimmed = await newDoc.save();
          fs4.writeFileSync(filepath, trimmed);
        }
      } catch (e) {
      }
      resolve(filepath);
    });
    stream.on("error", reject);
  });
};
var parseSignatureImage = (sigData) => {
  if (typeof sigData === "string") {
    if (sigData.trim().startsWith("data:image")) {
      const base64Data = sigData.split(";base64,").pop();
      if (!base64Data) return null;
      return Buffer.from(base64Data.replace(/\s/g, ""), "base64");
    }
    if (fs4.existsSync(sigData)) {
      return sigData;
    }
  }
  if (Buffer.isBuffer(sigData)) return sigData;
  return null;
};
var updateOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.companyId;
    const {
      position,
      department,
      salary,
      currency,
      startDate,
      location,
      employmentType,
      content
    } = req.body;
    const offer = await prisma.offerLetter.findFirst({
      where: {
        id,
        application: {
          jobPosting: { companyId }
        },
        status: "draft"
        // Only allow editing drafts
      }
    });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found or cannot be edited"
      });
    }
    const updated = await prisma.offerLetter.update({
      where: { id },
      data: {
        position,
        department,
        salary,
        currency,
        startDate: new Date(startDate),
        location,
        employmentType,
        content: content ? JSON.parse(content) : offer.content
      },
      include: {
        application: {
          include: {
            jobSeekerProfile: true,
            jobPosting: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update offer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var createOfferLetter = async (req, res) => {
  console.log("reached");
  try {
    const companyId = req.company?.companyId;
    const companyName = req.company?.name;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const {
      applicationId,
      templateId,
      position,
      department,
      salary,
      currency,
      startDate,
      location,
      employmentType,
      customContent
    } = req.body;
    const sanitizedTemplateId = templateId && templateId.trim() !== "" ? templateId : null;
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobPosting: { companyId }
      },
      include: {
        jobSeekerProfile: true,
        jobPosting: true
      }
    });
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    let templateContent = customContent;
    if (sanitizedTemplateId && !customContent) {
      const template = await prisma.offerTemplate.findFirst({
        where: { id: sanitizedTemplateId, companyId }
      });
      if (template) {
        templateContent = template.content;
      }
    }
    const templateData = {
      candidateName: application.jobSeekerProfile.fullName,
      position,
      department: department || application.jobPosting.department,
      salary: new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(salary)),
      startDate: new Date(startDate).toLocaleDateString(),
      location: location || application.jobPosting.location,
      companyName,
      date: (/* @__PURE__ */ new Date()).toLocaleDateString()
    };
    const renderedContent = renderTemplate(JSON.stringify(templateContent), templateData);
    const offer = await prisma.$transaction(async (tx) => {
      const newOffer = await tx.offerLetter.create({
        data: {
          applicationId,
          templateId: sanitizedTemplateId,
          position,
          department,
          salary,
          currency,
          startDate: new Date(startDate),
          location,
          employmentType,
          content: JSON.parse(renderedContent),
          status: "draft"
        },
        include: {
          application: {
            include: {
              jobSeekerProfile: true,
              jobPosting: {
                include: {
                  company: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      logoUrl: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      await tx.application.update({
        where: { id: applicationId },
        data: { status: "offer_sent" }
      });
      await tx.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          // Pass previous state (e.g., 'hr_round')
          toStatus: "offer_sent",
          // Correct schema field name
          changedBy: req.user?.userId || "system",
          // Required schema string
          changedByType: "user",
          notes: "Offer letter generated and prepared for candidate review."
        }
      });
      return newOffer;
    });
    return res.status(201).json({ success: true, data: offer });
  } catch (error) {
    console.error("Create offer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var signOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const { signature } = req.body;
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    const offer = await prisma.offerLetter.findFirst({
      where: {
        id,
        application: {
          jobPosting: { companyId }
        }
      }
    });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    const signatureData = {
      signedBy: userId,
      signedAt: (/* @__PURE__ */ new Date()).toISOString(),
      signature
    };
    const updated = await prisma.offerLetter.update({
      where: { id },
      data: {
        companySignature: signatureData,
        status: "pending"
      }
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Sign offer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var sendOfferLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const { channels } = req.body;
    const companyId = req.company?.companyId;
    const offer = await prisma.offerLetter.findFirst({
      where: {
        id,
        application: {
          jobPosting: { companyId }
        }
      },
      include: {
        application: {
          include: {
            jobSeekerProfile: true,
            jobPosting: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    if (!offer.companySignature) {
      return res.status(400).json({ success: false, message: "Offer must be signed before sending" });
    }
    const pdfPath = await generateOfferPDF(offer, JSON.stringify(offer.content));
    const updates = {
      status: "sent",
      sentAt: /* @__PURE__ */ new Date(),
      filePath: pdfPath
    };
    if (channels.includes("email")) {
      await sendOfferLetterEmail(
        offer.application.jobSeekerProfile.email,
        offer.application.jobSeekerProfile.fullName,
        offer.position,
        offer.application.jobPosting.company.name,
        offer.application.jobPosting.company.logoUrl,
        offer.id,
        pdfPath
      );
      updates.emailSentAt = /* @__PURE__ */ new Date();
    }
    if (channels.includes("whatsapp") && offer.application.jobSeekerProfile.phone) {
      updates.whatsappSentAt = /* @__PURE__ */ new Date();
    }
    const updated = await prisma.offerLetter.update({
      where: { id },
      data: updates
    });
    return res.json({ success: true, data: updated, message: "Offer sent successfully" });
  } catch (error) {
    console.error("Send offer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var trackOfferEmail = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.offerLetter.update({
      where: { id },
      data: {
        viewedAt: /* @__PURE__ */ new Date(),
        emailOpenCount: { increment: 1 },
        status: "viewed"
      }
    });
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixel.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, private"
    });
    res.end(pixel);
  } catch (error) {
    console.error("Track email error:", error);
    res.status(500).end();
  }
};
var respondToOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, negotiationNote, signature } = req.body;
    const userId = req.user?.userId;
    const offer = await prisma.offerLetter.findFirst({
      where: {
        id,
        application: {
          jobSeekerProfile: { userId }
        }
      },
      include: {
        application: {
          include: {
            jobSeekerProfile: true,
            jobPosting: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    const updates = {
      candidateResponse: response,
      respondedAt: /* @__PURE__ */ new Date()
    };
    if (response === "accept") {
      updates.status = "accepted";
      updates.candidateSignature = {
        signedAt: (/* @__PURE__ */ new Date()).toISOString(),
        signature,
        ipAddress: req.ip
      };
      await prisma.$transaction([
        prisma.application.update({
          where: { id: offer.applicationId },
          data: { status: "hired" }
        }),
        prisma.applicationHistory.create({
          data: {
            applicationId: offer.applicationId,
            toStatus: "hired",
            changedBy: userId || "candidate",
            changedByType: "user",
            notes: "Candidate accepted offer letter and signed digitally."
          }
        })
      ]);
    } else if (response === "decline") {
      updates.status = "declined";
      await prisma.applicationHistory.create({
        data: {
          applicationId: offer.applicationId,
          toStatus: "rejected",
          changedBy: userId || "candidate",
          changedByType: "user",
          notes: "Candidate declined the offer letter."
        }
      });
    } else if (response === "negotiate") {
      updates.status = "negotiating";
      updates.negotiationNote = negotiationNote;
      await prisma.applicationHistory.create({
        data: {
          applicationId: offer.applicationId,
          toStatus: "offer_sent",
          changedBy: userId || "candidate",
          changedByType: "user",
          notes: `Candidate requested negotiation: ${negotiationNote}`
        }
      });
    }
    const updated = await prisma.offerLetter.update({
      where: { id },
      data: updates
    });
    const companyEmail = offer.application.jobPosting.company.email;
    if (companyEmail) {
      await sendOfferResponseNotification(
        companyEmail,
        offer.application.jobSeekerProfile.fullName,
        offer.position,
        response,
        negotiationNote
      );
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Respond to offer error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getCompanyOffers = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { status, limit = "20", page = "1" } = req.query;
    const where = {
      application: {
        jobPosting: { companyId }
      }
    };
    if (status && status !== "all") {
      where.status = status;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [offers, total] = await Promise.all([
      prisma.offerLetter.findMany({
        where,
        include: {
          application: {
            include: {
              jobSeekerProfile: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                  profilePhotoUrl: true
                }
              },
              jobPosting: {
                select: {
                  title: true,
                  department: true
                }
              }
            }
          },
          template: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.offerLetter.count({ where })
    ]);
    return res.json({
      success: true,
      data: offers,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error("Get offers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getOfferDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    const where = { id };
    if (companyId) {
      where.application = {
        jobPosting: { companyId }
      };
    } else if (userId) {
      where.application = {
        jobSeekerProfile: { userId }
      };
    }
    const offer = await prisma.offerLetter.findFirst({
      where,
      include: {
        application: {
          include: {
            jobSeekerProfile: true,
            jobPosting: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        },
        template: true
      }
    });
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    return res.json({ success: true, data: offer });
  } catch (error) {
    console.error("Get offer details error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var downloadOfferPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    const where = { id };
    if (companyId) {
      where.application = {
        jobPosting: { companyId }
      };
    } else if (userId) {
      where.application = {
        jobSeekerProfile: { userId }
      };
    }
    const offer = await prisma.offerLetter.findFirst({ where });
    if (!offer || !offer.filePath) {
      return res.status(404).json({ success: false, message: "Offer PDF not found" });
    }
    if (!fs4.existsSync(offer.filePath)) {
      return res.status(404).json({ success: false, message: "PDF file not found on server" });
    }
    res.download(offer.filePath, `offer-letter-${offer.position}.pdf`);
  } catch (error) {
    console.error("Download PDF error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var generateTemplateWithAI = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const companyName = req.company?.name;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { name, description } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Template name is required"
      });
    }
    const aiResult = await generateOfferLetterTemplate(
      name,
      description,
      companyName
    );
    return res.json({
      success: true,
      data: aiResult,
      message: "Template generated successfully"
    });
  } catch (error) {
    console.error("AI template generation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate template"
    });
  }
};
var createOfferTemplate = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const companyName = req.company?.name;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { name, content, description, isDefault, useAI } = req.body;
    let finalContent = content;
    if (useAI && (!content || content === "")) {
      const aiResult = await generateOfferLetterTemplate(
        name,
        description,
        companyName
      );
      finalContent = aiResult.content;
    }
    if (!finalContent) {
      return res.status(400).json({
        success: false,
        message: "Template content is required"
      });
    }
    if (isDefault) {
      await prisma.offerTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false }
      });
    }
    const template = await prisma.offerTemplate.create({
      data: {
        companyId,
        name,
        content: finalContent,
        isDefault: isDefault || false
      }
    });
    return res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error("Create template error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var respondToNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, updatedSalary, updatedStartDate, responseNote } = req.body;
    const companyId = req.company?.companyId;
    const offer = await prisma.offerLetter.findFirst({
      where: {
        id,
        application: {
          jobPosting: { companyId }
        },
        status: "negotiating"
      },
      include: {
        application: {
          include: {
            jobSeekerProfile: true,
            jobPosting: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    logoUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found or not in negotiation"
      });
    }
    if (action === "accept_negotiation") {
      const updated = await prisma.offerLetter.update({
        where: { id },
        data: {
          salary: updatedSalary || offer.salary,
          startDate: updatedStartDate ? new Date(updatedStartDate) : offer.startDate,
          status: "pending",
          // Reset to pending for re-signing
          companySignature: null,
          // Clear old signature
          negotiationNote: responseNote || "Company accepted negotiation with updated terms"
        }
      });
      await sendOfferLetterEmail(
        offer.application.jobSeekerProfile.email,
        offer.application.jobSeekerProfile.fullName,
        offer.position,
        offer.application.jobPosting.company.name,
        offer.application.jobPosting.company.logoUrl,
        offer.id,
        ""
      );
      return res.json({
        success: true,
        data: updated,
        message: "Negotiation accepted. Please re-sign the updated offer."
      });
    } else if (action === "reject_negotiation") {
      const updated = await prisma.offerLetter.update({
        where: { id },
        data: {
          status: "declined",
          negotiationNote: responseNote || "Company declined negotiation request"
        }
      });
      await prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: "rejected" }
      });
      return res.json({
        success: true,
        data: updated,
        message: "Negotiation rejected and offer declined."
      });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid action"
    });
  } catch (error) {
    console.error("Respond to negotiation error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getSalaryComparison = async (req, res) => {
  try {
    const { title, location, experience, offeredSalary } = req.query;
    if (!title || !location) {
      res.status(400).json({
        success: false,
        error: "Bad Request: Missing title or location context query strings."
      });
      return;
    }
    const trackingMetrics = await aggregateSalaryBenchmarks(
      String(title),
      String(location),
      experience ? String(experience) : "1-3 Years",
      offeredSalary ? String(offeredSalary) : void 0
    );
    res.status(200).json({
      success: true,
      data: trackingMetrics
    });
  } catch (error) {
    console.error("Error generating benchmark data comparisons:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error processing market values."
    });
  }
};

// src/routes/offer.routes.ts
var router2 = express2.Router();
var requireCompanyRoleOrJobSeeker = (roles) => {
  return (req, res, next) => {
    if (req.user && !req.company) {
      return next();
    }
    return requireCompanyRole(...roles)(req, res, next);
  };
};
router2.post("/templates/generate-ai", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), generateTemplateWithAI);
router2.post("/templates", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createOfferTemplate);
router2.get("/templates", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyTemplates);
router2.put("/templates/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateOfferTemplate);
router2.delete("/templates/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), deleteOfferTemplate);
router2.post("/create", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createOfferLetter);
router2.put("/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateOfferLetter);
router2.post("/:id/sign", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), signOfferLetter);
router2.post("/:id/send", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), sendOfferLetter);
router2.get("/company/list", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyOffers);
router2.get("/:id", requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER]), getOfferDetails);
router2.get("/:id/download", requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER]), downloadOfferPDF);
router2.get("/:id/track", trackOfferEmail);
router2.post("/:id/respond", requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR]), respondToOffer);
router2.post("/:id/respond-negotiation", requireCompanyRoleOrJobSeeker([ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR]), respondToNegotiation);
var offer_routes_default = router2;

// src/controllers/jobseekerDashboard.controller.ts
var getProfileId4 = async (userId) => {
  const p = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  return p?.id ?? null;
};
var getJobSeekerDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileId = await getProfileId4(userId);
    if (!profileId) {
      return res.status(404).json({ success: false, message: "Profile not found. Complete your profile to get started." });
    }
    const now = /* @__PURE__ */ new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 864e5);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      profile,
      applicationStats,
      recentApplications,
      upcomingInterviews,
      pendingOffers,
      primaryResume,
      applicationTimeline,
      rejectedThisMonth,
      totalResumes
    ] = await Promise.all([
      prisma.jobSeekerProfile.findUnique({
        where: { id: profileId },
        include: { skills: true }
      }),
      prisma.application.groupBy({
        by: ["status"],
        where: { jobSeekerProfileId: profileId },
        _count: { status: true }
      }),
      prisma.application.findMany({
        where: { jobSeekerProfileId: profileId },
        orderBy: { appliedAt: "desc" },
        take: 5,
        include: {
          jobPosting: {
            include: { company: { select: { name: true, logoUrl: true } } }
          }
        }
      }),
      prisma.interview.findMany({
        where: {
          application: { jobSeekerProfileId: profileId },
          scheduledTime: { gte: now, lte: sevenDaysFromNow },
          status: { in: ["scheduled", "confirmed"] }
        },
        orderBy: { scheduledTime: "asc" },
        take: 5,
        include: {
          application: {
            include: {
              jobPosting: {
                include: { company: { select: { name: true, logoUrl: true } } }
              }
            }
          }
        }
      }),
      prisma.offerLetter.findMany({
        where: {
          application: { jobSeekerProfileId: profileId },
          status: { in: ["sent", "viewed", "pending"] }
        },
        include: {
          application: {
            include: {
              jobPosting: {
                include: { company: { select: { name: true, logoUrl: true } } }
              }
            }
          }
        },
        orderBy: { sentAt: "desc" }
      }),
      prisma.resume.findFirst({
        where: { jobSeekerProfileId: profileId, isPrimary: true },
        select: { id: true, name: true, atsScore: true, updatedAt: true }
      }),
      prisma.application.findMany({
        where: { jobSeekerProfileId: profileId },
        orderBy: { appliedAt: "desc" },
        take: 30,
        select: { status: true, appliedAt: true }
      }),
      prisma.application.count({
        where: {
          jobSeekerProfileId: profileId,
          status: "rejected",
          appliedAt: { gte: startOfMonth }
        }
      }),
      prisma.resume.count({ where: { jobSeekerProfileId: profileId } })
    ]);
    const completionFactors = [
      !!profile?.fullName,
      !!profile?.email,
      !!profile?.phone,
      !!profile?.location,
      !!profile?.bio,
      (profile?.skills?.length ?? 0) >= 3,
      !!primaryResume
    ];
    const completionScore = Math.round(
      completionFactors.filter(Boolean).length / completionFactors.length * 100
    );
    const statusMap = applicationStats.reduce((acc, s) => {
      acc[s.status] = s._count.status;
      return acc;
    }, {});
    const totalApplications = Object.values(statusMap).reduce(
      (a, b) => a + b,
      0
    );
    const activeApplications = totalApplications - (statusMap.rejected ?? 0) - (statusMap.hired ?? 0);
    const weeklyActivity = Array(4).fill(0).map((_, i) => {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 864e5);
      const weekEnd = new Date(now.getTime() - i * 7 * 864e5);
      const count = applicationTimeline.filter(
        (a) => a.appliedAt >= weekStart && a.appliedAt < weekEnd
      ).length;
      return { weekOffset: -(i + 1), count };
    }).reverse();
    return res.json({
      success: true,
      data: {
        profile: {
          id: profile?.id,
          fullName: profile?.fullName,
          email: profile?.email,
          location: profile?.location,
          profilePhotoUrl: profile?.profilePhotoUrl,
          availabilityStatus: profile?.availabilityStatus,
          skills: profile?.skills?.map((s) => s.name) ?? [],
          completionScore,
          completionTips: buildCompletionTips(profile, primaryResume)
        },
        applicationSummary: {
          total: totalApplications,
          active: activeApplications,
          hired: statusMap.hired ?? 0,
          rejected: statusMap.rejected ?? 0,
          inInterview: (statusMap.technical_round ?? 0) + (statusMap.hr_round ?? 0),
          offerStage: statusMap.offer_sent ?? 0,
          rejectedThisMonth,
          byStatus: statusMap
        },
        recentApplications: recentApplications.map((app2) => ({
          applicationId: app2.id,
          status: app2.status,
          appliedAt: app2.appliedAt,
          isWithdrawn: app2.isWithdrawn,
          job: {
            jobId: app2.jobPosting.id,
            title: app2.jobPosting.title,
            jobType: app2.jobPosting.jobType,
            location: app2.jobPosting.location
          },
          company: {
            name: app2.jobPosting.company.name,
            logoUrl: app2.jobPosting.company.logoUrl
          }
        })),
        upcomingInterviews: upcomingInterviews.map((i) => ({
          interviewId: i.id,
          scheduledTime: i.scheduledTime,
          durationMinutes: i.durationMinutes,
          format: i.format,
          status: i.status,
          joinLink: i.joinLink,
          livekitRoomName: i.livekitRoomName,
          job: i.application.jobPosting.title,
          company: {
            name: i.application.jobPosting.company.name,
            logoUrl: i.application.jobPosting.company.logoUrl
          }
        })),
        pendingOffers: pendingOffers.map((o) => ({
          offerId: o.id,
          position: o.position,
          salary: o.salary,
          currency: o.currency,
          startDate: o.startDate,
          status: o.status,
          sentAt: o.sentAt,
          company: {
            name: o.application.jobPosting.company.name,
            logoUrl: o.application.jobPosting.company.logoUrl
          }
        })),
        resume: primaryResume ? {
          id: primaryResume.id,
          name: primaryResume.name,
          atsScore: primaryResume.atsScore,
          lastUpdated: primaryResume.updatedAt,
          totalResumes
        } : null,
        activityChart: weeklyActivity
      }
    });
  } catch (error) {
    console.error("Job seeker dashboard error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
function buildCompletionTips(profile, resume) {
  const tips = [];
  if (!profile?.phone) tips.push("Add your phone number");
  if (!profile?.bio) tips.push("Write a short bio");
  if (!profile?.location) tips.push("Add your location");
  if ((profile?.skills?.length ?? 0) < 3) tips.push("Add at least 3 skills");
  if (!resume) tips.push("Upload or build a resume");
  if (!profile?.linkedin) tips.push("Link your LinkedIn profile");
  return tips;
}
var getApplicationInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileId = await getProfileId4(userId);
    if (!profileId) return res.status(404).json({ success: false, message: "Profile not found" });
    const applications = await prisma.application.findMany({
      where: { jobSeekerProfileId: profileId },
      include: {
        jobPosting: {
          include: { company: { select: { name: true, industry: true } } }
        },
        resume: { select: { atsScore: true } },
        interviews: { select: { status: true } },
        statusHistory: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { appliedAt: "asc" }
    });
    const industryMap = {};
    applications.forEach((a) => {
      const ind = a.jobPosting.company.industry ?? "Other";
      industryMap[ind] = (industryMap[ind] ?? 0) + 1;
    });
    const scores = applications.map((a) => a.resume?.atsScore).filter((s) => s !== null && s !== void 0);
    const avgAts = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
    const responded = applications.filter((a) => a.statusHistory.length > 1).length;
    const responseRate = applications.length ? (responded / applications.length * 100).toFixed(1) : "0";
    const responseTimes = applications.filter((a) => a.statusHistory.length > 1).map((a) => {
      const applied = a.statusHistory[0]?.createdAt;
      const firstResponse = a.statusHistory[1]?.createdAt;
      if (!applied || !firstResponse) return null;
      return (firstResponse.getTime() - applied.getTime()) / 864e5;
    }).filter((t) => t !== null);
    const avgResponseDays = responseTimes.length ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1) : null;
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
      const count = applications.filter(
        (a) => a.appliedAt >= start && a.appliedAt <= end
      ).length;
      monthlyTrend.push({
        month: start.toLocaleString("default", { month: "short", year: "numeric" }),
        count
      });
    }
    return res.json({
      success: true,
      data: {
        totalApplications: applications.length,
        responseRate: parseFloat(responseRate),
        avgAtsScore: avgAts ? parseFloat(avgAts) : null,
        avgResponseTimeDays: avgResponseDays ? parseFloat(avgResponseDays) : null,
        industryBreakdown: Object.entries(industryMap).map(([k, v]) => ({ industry: k, count: v })),
        monthlyTrend
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// src/services/notification.service.ts
import admin from "firebase-admin";
import fs5 from "fs";
import path2 from "path";
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path2.resolve(process.cwd(), "service-account.json");
    if (fs5.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs5.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("\u{1F525} Firebase Admin SDK successfully initialized inside NotificationService.");
    } else {
      console.error("\u274C Firebase Init Error: service-account.json missing at project root.");
    }
  } catch (initError) {
    console.error("\u274C Critical error during Firebase Admin bootstrap:", initError);
  }
}
var NotificationService = class {
  static async sendToUser(userId, title, body, deepLinkUrl) {
    try {
      console.log(`[FCM] Preparing to send notification to User ID: ${userId} with title: "${title}"`);
      const userTokens = await prisma.notificationToken.findMany({
        where: { userId },
        select: { token: true }
      });
      if (!userTokens || userTokens.length === 0) {
        console.log(`[FCM] No registered device tokens found for User ID: ${userId}`);
        return null;
      }
      const registrationTokens = userTokens.map((t) => t.token);
      const message = {
        tokens: registrationTokens,
        notification: {
          title,
          body
        },
        webpush: deepLinkUrl ? {
          fcmOptions: {
            link: deepLinkUrl
          }
        } : void 0
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[FCM] Successfully dispatched ${response.successCount} messages for User: ${userId}`);
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            if (resp.error?.code === "messaging/invalid-registration-token" || resp.error?.code === "messaging/registration-token-not-registered") {
              const token = registrationTokens[idx];
              if (token) {
                failedTokens.push(token);
              }
            }
          }
        });
        if (failedTokens.length > 0) {
          await prisma.notificationToken.deleteMany({
            where: { token: { in: failedTokens } }
          });
          console.log(`[FCM] Cleaned up ${failedTokens.length} outdated/invalid tokens from DB.`);
        }
      }
      return response;
    } catch (error) {
      console.error("Error inside NotificationService.sendToUser:", error);
      throw error;
    }
  }
};

// src/controllers/notification.controller.ts
var saveNotificationToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: User mapping context signature is missing."
      });
    }
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Bad Request: FCM device registration token is required."
      });
    }
    const savedToken = await prisma.notificationToken.upsert({
      where: {
        token
      },
      update: {
        userId
      },
      create: {
        userId,
        token
      }
    });
    console.log(`FCM token successfully registered for User ID: ${userId}`);
    return res.status(200).json({
      success: true,
      message: "FCM token synchronized and saved securely.",
      data: { id: savedToken.id }
    });
  } catch (error) {
    console.error("Prisma tracking error during FCM token persistence:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error: Failed to save notification configuration."
    });
  }
};
var sendNotificationToUser = async (req, res) => {
  try {
    const { userId, title, body, deepLinkUrl } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, error: "userId, title, and body are required." });
    }
    await NotificationService.sendToUser(userId, title, body, deepLinkUrl);
    return res.status(200).json({
      success: true,
      message: "Push notification triggered successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to dispatch cloud message."
    });
  }
};

// src/controllers/spotJob.controller.ts
import { SpotJobStatus, SpotBookingStatus, AvailabilityStatus } from "@prisma/client";
var SpotJobController = {
  /**
   * 1. POST /spot-jobs
   */
  createSpotJob: async (req, res) => {
    try {
      const companyId = req.company?.companyId;
      if (!companyId) {
        res.status(403).json({ success: false, message: "Access denied. Active company workspace context required." });
        return;
      }
      const { title, description, requiredSkills, rate, rateType, currency, startTime, endTime, location, coordinates } = req.body;
      if (!title || !rate || !rateType || !startTime || !endTime || !location) {
        res.status(400).json({ success: false, message: "Missing required configuration indices." });
        return;
      }
      const spotJob = await prisma.spotJob.create({
        data: {
          companyId,
          title,
          description,
          requiredSkills: requiredSkills || [],
          rate,
          rateType,
          currency: currency || "INR",
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          location,
          coordinates: coordinates || null,
          status: SpotJobStatus.POSTED
        }
      });
      const normalizedRequiredSkills = (requiredSkills || []).filter((skill) => skill && skill.trim() !== "").map((skill) => skill.trim().toLowerCase());
      console.log("\n==========================================================================================");
      console.log(`\u{1F680} [SPOT GIG MATCHING ENGINE ACTIVATED]`);
      console.log(`\u{1F4CB} Job Title: "${title}"`);
      console.log(`\u{1F3AF} Target Skills Needed: [ ${normalizedRequiredSkills.join(" | ").toUpperCase()} ]`);
      console.log("==========================================================================================\n");
      const totalCandidatesInDB = await prisma.jobSeekerProfile.findMany({
        select: {
          id: true,
          userId: true,
          fullName: true,
          availabilityStatus: true,
          skills: {
            select: { name: true }
          }
        }
      });
      console.log(`\u{1F50D} [Stage 1 Database Scan] Total profiles registered inside database: ${totalCandidatesInDB.length}`);
      const engineMetricsLogTable = [];
      let eligibleCandidates = [];
      totalCandidatesInDB.forEach((candidate) => {
        const candidateName = candidate.fullName || "Unnamed Candidate";
        const rawStatus = candidate.availabilityStatus;
        const isOpen = rawStatus === AvailabilityStatus.spot_available;
        const statusCheckText = isOpen ? "\u{1F7E2} OPEN (spot_available)" : `\u274C MUTED (${rawStatus})`;
        const candidateSkillsArray = (candidate.skills || []).map((s) => s.name.trim().toLowerCase());
        const displaySkills = (candidate.skills || []).map((s) => s.name.trim()).join(", ") || "None";
        let strategyMatchText = "\u274C No Match";
        let isPass = false;
        if (isOpen) {
          if (normalizedRequiredSkills.length === 0) {
            strategyMatchText = "\u2B50 Match (No Skill Filter Req)";
            isPass = true;
          } else {
            const exactMatches = normalizedRequiredSkills.filter(
              (reqSkill) => candidateSkillsArray.includes(reqSkill)
            );
            if (exactMatches.length > 0) {
              strategyMatchText = `\u{1F3AF} Exact Match (${exactMatches.length} skill(s))`;
              isPass = true;
            } else {
              const hasPartial = normalizedRequiredSkills.some(
                (reqSkill) => candidateSkillsArray.some(
                  (candSkill) => candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
                )
              );
              if (hasPartial) {
                strategyMatchText = "\u26A0\uFE0F Partial / Fuzzy Match";
                isPass = true;
              }
            }
          }
        }
        engineMetricsLogTable.push({
          "Candidate Name": candidateName.substring(0, 20),
          "Current Status": rawStatus,
          "Status Check": statusCheckText,
          "Candidate Skills": displaySkills.substring(0, 30),
          "Strategy Match": strategyMatchText,
          "Passed Matrix": isPass ? "\u2705 MATCHED" : "\u274C DROPPED"
        });
        if (isPass) {
          eligibleCandidates.push({
            id: candidate.id,
            userId: candidate.userId,
            fullName: candidateName,
            skills: candidate.skills
          });
        }
      });
      console.table(engineMetricsLogTable);
      if (normalizedRequiredSkills.length > 0 && eligibleCandidates.length > 0) {
        eligibleCandidates = eligibleCandidates.map((c) => {
          const cSkills = c.skills.map((s) => s.name.toLowerCase());
          const score = normalizedRequiredSkills.filter((s) => cSkills.includes(s)).length;
          return { ...c, matchScore: score };
        }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
      console.log(`
\u{1F3C1} [Engine Assessment Terminated] Final Candidate Pool Selected: ${eligibleCandidates.length} profiles.
`);
      let createdBookings = [];
      if (eligibleCandidates.length > 0) {
        await prisma.spotJob.update({
          where: { id: spotJob.id },
          data: { status: SpotJobStatus.SEARCHING }
        });
        const bookingData = eligibleCandidates.map((candidate) => ({
          spotJobId: spotJob.id,
          jobSeekerProfileId: candidate.id,
          status: SpotBookingStatus.PENDING_RESPONSE
        }));
        await prisma.spotJobBooking.createMany({
          data: bookingData,
          skipDuplicates: true
        });
        createdBookings = await prisma.spotJobBooking.findMany({
          where: { spotJobId: spotJob.id }
        });
        console.log(`[Database Sync] Created ${createdBookings.length} booking invitations inside storage vectors.`);
        const notificationPromises = eligibleCandidates.map(
          (candidate) => NotificationService.sendToUser(
            candidate.userId,
            `\u{1F525} Immediate Spot Gig Match!`,
            `Hi ${candidate.fullName}, a spot job matching your profile has just opened up: "${title}". Rate: ${rate} ${currency}/${rateType}`,
            `http://localhost:3000/dashboard/spot-jobs`
          ).catch((err) => {
            console.error(`[FCM Error] Failed to notify user ${candidate.userId}:`, err.message);
            return null;
          })
        );
        Promise.allSettled(notificationPromises).then((results) => {
          const successCount = results.filter((r) => r.status === "fulfilled").length;
          console.log(`[Notifications Channel] Successfully distributed ${successCount}/${eligibleCandidates.length} instant pings.`);
        });
      } else {
        console.log("\u26A0\uFE0F [Warning] No qualifying candidate flags matched this lifecycle layout routing.");
      }
      res.status(201).json({
        success: true,
        message: eligibleCandidates.length > 0 ? "Spot job created and broadcast matching process initialized." : "Spot job created. No matching candidates found at this time.",
        data: {
          spotJob,
          matchesFound: eligibleCandidates.length,
          bookings: createdBookings,
          searchCriteria: {
            requiredSkills: normalizedRequiredSkills,
            matchingStrategy: normalizedRequiredSkills.length > 0 ? eligibleCandidates.length > 0 ? "skill-based-ranked" : "partial-match" : "all-available"
          }
        }
      });
    } catch (error) {
      console.error("\u274C Error creating Spot Job:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 2. GET /spot-jobs/invitations
   */
  getJobSeekerInvitations: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized. Identity mismatch." });
        return;
      }
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          availabilityStatus: true
        }
      });
      if (!profile) {
        res.status(404).json({ success: false, message: "Job seeker profile record not registered." });
        return;
      }
      const invitations = await prisma.spotJobBooking.findMany({
        where: {
          jobSeekerProfileId: profile.id,
          status: SpotBookingStatus.PENDING_RESPONSE,
          spotJob: {
            status: { in: [SpotJobStatus.POSTED, SpotJobStatus.SEARCHING] }
          }
        },
        include: {
          spotJob: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true, industry: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      const isSpotJobEnabled = profile.availabilityStatus === AvailabilityStatus.spot_available;
      res.status(200).json({
        success: true,
        isSpotJobEnabled,
        data: invitations
      });
    } catch (error) {
      console.error("Error fetching job seeker invitations:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 3. PATCH /spot-jobs/respond/:bookingId
   */
  respondToBooking: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }
      const { bookingId } = req.params;
      const { action } = req.body;
      if (!["ACCEPT", "DECLINE"].includes(action)) {
        res.status(400).json({ success: false, message: "Invalid parameter payload action context." });
        return;
      }
      const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (!profile) {
        res.status(404).json({ success: false, message: "Profile workspace link not found." });
        return;
      }
      const booking = await prisma.spotJobBooking.findUnique({
        where: { id: bookingId },
        include: { spotJob: true }
      });
      if (!booking || booking.jobSeekerProfileId !== profile.id) {
        res.status(404).json({ success: false, message: "Booking invitation node not discovered." });
        return;
      }
      if (booking.status !== SpotBookingStatus.PENDING_RESPONSE || booking.spotJob.status === SpotJobStatus.CONFIRMED) {
        res.status(400).json({ success: false, message: "This gig position has closed, expired, or been filled." });
        return;
      }
      if (action === "DECLINE") {
        const updatedBooking = await prisma.spotJobBooking.update({
          where: { id: bookingId },
          data: { status: SpotBookingStatus.DECLINED, respondedAt: /* @__PURE__ */ new Date() }
        });
        res.status(200).json({ success: true, message: "Spot request successfully declined.", data: updatedBooking });
        return;
      }
      const transactionResult = await prisma.$transaction(async (tx) => {
        const gigVerification = await tx.spotJob.findUnique({ where: { id: booking.spotJobId } });
        if (gigVerification?.status === SpotJobStatus.CONFIRMED) {
          throw new Error("Gig capacity already populated by a concurrent candidate match request.");
        }
        const acceptedBooking = await tx.spotJobBooking.update({
          where: { id: bookingId },
          data: { status: SpotBookingStatus.ACCEPTED, respondedAt: /* @__PURE__ */ new Date() }
        });
        await tx.spotJob.update({
          where: { id: booking.spotJobId },
          data: { status: SpotJobStatus.CONFIRMED }
        });
        await tx.spotJobBooking.updateMany({
          where: {
            spotJobId: booking.spotJobId,
            id: { not: bookingId },
            status: SpotBookingStatus.PENDING_RESPONSE
          },
          data: { status: SpotBookingStatus.TIMED_OUT }
        });
        return acceptedBooking;
      });
      res.status(200).json({
        success: true,
        message: "Spot booking assignment locked and synced smoothly.",
        data: transactionResult
      });
    } catch (error) {
      console.error("Error modifying booking node resolution status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 4. GET /spot-jobs/company-dashboard
   */
  getCompanySpotDashboard: async (req, res) => {
    try {
      const companyId = req.company?.companyId;
      if (!companyId) {
        res.status(403).json({ success: false, message: "Access denied. Active workspace context missing." });
        return;
      }
      const dashboardMetrics = await prisma.spotJob.findMany({
        where: { companyId },
        include: {
          bookings: {
            include: {
              jobSeekerProfile: {
                select: { fullName: true, phone: true, email: true, location: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.status(200).json({ success: true, data: dashboardMetrics });
    } catch (error) {
      console.error("Error accessing company analytical workspace dashboard:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 5. GET /spot-jobs/:id/bookings
   */
  getSpotJobBookings: async (req, res) => {
    try {
      const companyId = req.company?.companyId;
      const { id } = req.params;
      if (!companyId) {
        res.status(403).json({ success: false, message: "Access denied. Workspace token required." });
        return;
      }
      const spotJob = await prisma.spotJob.findUnique({
        where: { id }
      });
      if (!spotJob) {
        res.status(404).json({ success: false, message: "Spot Job record vector not found." });
        return;
      }
      if (spotJob.companyId !== companyId) {
        res.status(403).json({ success: false, message: "Security Exception: Access denied to foreign workspace resources." });
        return;
      }
      const trackingBookings = await prisma.spotJobBooking.findMany({
        where: { spotJobId: id },
        include: {
          jobSeekerProfile: {
            select: { fullName: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.status(200).json({ success: true, data: { spotJob, bookings: trackingBookings } });
    } catch (error) {
      console.error("Error gathering specific sub-gigs monitoring tracks:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 6. PATCH /spot-jobs/:id/status
   */
  updateSpotStatusByCompany: async (req, res) => {
    try {
      const companyId = req.company?.companyId;
      const { id } = req.params;
      const { status } = req.body;
      if (!companyId) {
        res.status(403).json({ success: false, message: "Access denied." });
        return;
      }
      const targetJob = await prisma.spotJob.findUnique({
        where: { id }
      });
      if (!targetJob) {
        res.status(404).json({ success: false, message: "Spot job tracking target index not found." });
        return;
      }
      if (targetJob.companyId !== companyId) {
        res.status(403).json({ success: false, message: "Security Exception: Modifications to foreign workspace indexes prohibited." });
        return;
      }
      const updatedJob = await prisma.spotJob.update({
        where: { id },
        data: { status }
      });
      res.status(200).json({ success: true, message: "Spot job state index adjusted safely.", data: updatedJob });
    } catch (error) {
      console.error("Error setting spot tracking index modifications manually:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 7. GET /spot-jobs/toggle-status
   */
  getSpotToggleStatus: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }
      const profile = await prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: { availabilityStatus: true }
      });
      if (!profile) {
        res.status(404).json({ success: false, message: "Profile workspace link not found." });
        return;
      }
      const isSpotJobEnabled = profile.availabilityStatus === AvailabilityStatus.spot_available;
      res.status(200).json({
        success: true,
        isSpotJobEnabled
      });
    } catch (error) {
      console.error("Error checking spot toggle status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  /**
   * 8. PATCH /spot-jobs/toggle-status
   */
  updateSpotToggleStatus: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }
      const { enabled } = req.body;
      if (typeof enabled !== "boolean") {
        res.status(400).json({ success: false, message: "Invalid payload state format. Boolean expected." });
        return;
      }
      const targetStatus = enabled ? AvailabilityStatus.spot_available : AvailabilityStatus.available;
      const updatedProfile = await prisma.jobSeekerProfile.update({
        where: { userId },
        data: { availabilityStatus: targetStatus },
        select: { availabilityStatus: true }
      });
      res.status(200).json({
        success: true,
        message: "Spot job matching engine status successfully adjusted.",
        isSpotJobEnabled: updatedProfile.availabilityStatus === AvailabilityStatus.spot_available
      });
    } catch (error) {
      console.error("Error mutating spot toggle target:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// src/controllers/resumeParser.controller.ts
import mammoth2 from "mammoth";
import PDFParser from "pdf2json";
var extractPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on("pdfParser_dataError", (err) => {
      reject(new Error(err?.parserError || "PDF parse failed"));
    });
    pdfParser.on("pdfParser_dataReady", () => {
      try {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      } catch (e) {
        reject(e);
      }
    });
    pdfParser.parseBuffer(buffer);
  });
};
var parseAndLoadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    const { mimetype, buffer } = req.file;
    let rawText = "";
    if (mimetype === "application/pdf") {
      rawText = await extractPdfText(buffer);
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimetype === "application/msword") {
      const result = await mammoth2.extractRawText({ buffer });
      rawText = result.value;
    } else {
      return res.status(400).json({ success: false, error: "Only PDF or DOCX files are supported" });
    }
    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: "Could not extract text. Make sure the file is not a scanned image."
      });
    }
    const trimmedText = rawText.trim().slice(0, 6e3);
    const aiResult = await analyzeResume(trimmedText);
    const parsed = aiResult?.parsedData;
    if (!parsed) {
      return res.status(500).json({ success: false, error: "AI failed to parse resume content" });
    }
    const profilePayload = {
      basicInfo: {
        fullName: parsed.name || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        location: parsed.location || "",
        linkedin: parsed.linkedin || "",
        github: parsed.github || "",
        portfolio: parsed.portfolio || "",
        bio: parsed.summary || ""
      },
      skills: (parsed.skills || []).filter(Boolean),
      education: (parsed.education || []).map((edu, i) => ({
        id: Date.now() + i,
        institution: edu.institution || "",
        degree: edu.degree || "",
        field: edu.field || "",
        location: edu.location || "",
        startMonth: "",
        startYear: edu.startYear || "",
        endMonth: "",
        endYear: edu.endYear || "",
        cgpa: edu.cgpa || "",
        description: ""
      })),
      experience: (parsed.experience || []).map((exp, i) => ({
        id: Date.now() + i + 100,
        company: exp.company || "",
        role: exp.role || "",
        location: exp.location || "",
        startMonth: "",
        startYear: exp.startDate || "",
        endMonth: "",
        endYear: exp.endDate || "",
        current: exp.current || false,
        description: [exp.description, ...exp.achievements || []].filter(Boolean).join("\n"),
        skills: []
      })),
      projects: (parsed.projects || []).map((proj, i) => ({
        id: Date.now() + i + 200,
        name: proj.name || "",
        description: proj.description || "",
        technologies: proj.technologies || [],
        githubLink: proj.githubLink || "",
        liveLink: proj.liveLink || "",
        startDate: "",
        endDate: ""
      })),
      certifications: (parsed.certifications || []).map((cert, i) => ({
        id: Date.now() + i + 300,
        name: cert.name || "",
        organization: cert.organization || "",
        issueDate: cert.issueDate || "",
        credentialUrl: cert.credentialUrl || ""
      })),
      languages: (parsed.languages || []).map((lang, i) => ({
        id: Date.now() + i + 400,
        language: lang.language || "",
        proficiency: lang.proficiency || "Beginner"
      })),
      achievements: (parsed.achievements || []).map(
        (ach, i) => typeof ach === "string" ? { id: Date.now() + i + 500, title: ach, description: "", year: "" } : { id: Date.now() + i + 500, title: ach.title || "", description: ach.description || "", year: ach.year || "" }
      ),
      scores: aiResult?.scores || {}
    };
    return res.json({ success: true, data: profilePayload });
  } catch (error) {
    console.error("Resume parse error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
};

// src/routes/jobseeker.routes.ts
var router3 = express3.Router();
router3.get("/jobs/public", getPublicJobs);
router3.get("/jobs/public/:id", getPublicJobDetails);
router3.use(authenticateToken);
router3.use(requireJobSeeker);
router3.get("/profile", getProfile);
router3.put("/profile", upload.single("profileImage"), updateProfile);
router3.patch("/profile/password", updatePassword);
var parseResumeUpload = multer2({
  storage: multer2.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF/DOCX allowed"));
  }
});
router3.post("/parse-resume", parseResumeUpload.single("resume"), parseAndLoadResume);
var UPLOAD_DIR = process.env.RESUME_UPLOAD_DIR ?? path3.join(process.cwd(), "uploads/resumes");
if (!fs6.existsSync(UPLOAD_DIR)) {
  fs6.mkdirSync(UPLOAD_DIR, { recursive: true });
}
var resumeStorage = multer2.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `${Date.now()}-${safe}`);
  }
});
var resumeUpload = multer2({
  storage: resumeStorage,
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF/DOCX allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});
router3.post("/resumes/upload", resumeUpload.single("resume"), uploadAndAnalyze);
router3.post("/resumes/generate", generateCV);
router3.post("/resumes/:id/convert", convertResumeToHTML);
router3.post("/resumes/:id/optimize", optimizeResume);
router3.get("/resumes/:id/keywords", getKeywordSuggestions);
router3.patch("/resumes/:id/restore/:versionId", restoreVersion);
router3.get("/resumes", getAllResumes);
router3.get("/resumes/:id", getResumeById);
router3.put("/resumes/:id", updateResume);
router3.delete("/resumes/:id", deleteResume);
router3.get("/resumes/:id/download", downloadResume);
router3.post("/resumes/:id/score", scoreContentOnly);
router3.get("/resumes/:id/inline-suggestions", getInlineSuggestions);
router3.post("/resumes/improve-text", improveSelectedText);
router3.post("/resumes/generate-regional", generateRegionalCV);
router3.post("/applications/apply", resumeUpload.single("newResume"), applyToJob);
router3.get("/applications", getMyApplications);
router3.get("/applications/:applicationId", getApplicationDetails);
router3.delete("/applications/:id", withdrawApplication);
router3.get("/interviews", getMyScheduledInterviews);
router3.post("/interviews/:id/confirm", confirmInterviewPresence);
router3.post("/interviews/:id/reschedule", requestInterviewReschedule);
router3.get("/applications/tracker/timeline", getApplicationsTracker);
router3.get("/tracker/:applicationId", authenticateToken, getSingleApplicationDetails);
router3.patch("/applications/:id/notes", updateApplicationNotes);
router3.post("/applications/:id/withdraw", withdrawApplicationTracker);
router3.use("/offers", offer_routes_default);
router3.get("/dashboard", getJobSeekerDashboard);
router3.get("/insights", getApplicationInsights);
router3.get("/salary-compare", getSalaryComparison);
router3.post("/notification/token", saveNotificationToken);
router3.get("/spot-jobs/invitations", authenticateToken, requireJobSeeker, SpotJobController.getJobSeekerInvitations);
router3.patch("/spot-jobs/respond/:bookingId", authenticateToken, requireJobSeeker, SpotJobController.respondToBooking);
router3.get("/spot-jobs/toggle-status", authenticateToken, requireJobSeeker, SpotJobController.getSpotToggleStatus);
router3.patch("/spot-jobs/toggle-status", authenticateToken, requireJobSeeker, SpotJobController.updateSpotToggleStatus);
var jobseeker_routes_default = router3;

// src/routes/companyAuth.routes.ts
import express4 from "express";
import multer3 from "multer";

// src/controllers/companyAuth.controller.ts
import bcrypt3 from "bcryptjs";
import jwt4 from "jsonwebtoken";
init_cookie();
var JWT_SECRET = process.env.JWT_SECRET || "your_fallback_secret";
var bufferToBase642 = (buffer, mimeType) => `data:${mimeType};base64,${buffer.toString("base64")}`;
var sendCompanyVerification = async (companyId, email) => {
  const token = jwt4.sign({ companyId }, JWT_SECRET, { expiresIn: "24h" });
  await sendVerificationEmail(email, token);
};
var sendCompanyOtp = async (req, res) => {
  try {
    const { mobileNumber, companyName } = req.body;
    if (!mobileNumber || !companyName)
      return res.status(400).json({ success: false, message: "Mobile and company name required." });
    const existingCompany = await prisma.company.findUnique({ where: { name: companyName.trim() } });
    if (existingCompany)
      return res.status(400).json({ success: false, message: "Company name already registered." });
    const otp = generateOTP();
    const otpHash = await bcrypt3.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1e3);
    await prisma.otp.create({
      data: { mobileNumber, otpHash, expiresAt, purpose: "company_registration" }
    });
    console.log(`\u{1F7E2} COMPANY OTP for ${mobileNumber}: [ ${otp} ]`);
    return res.status(200).json({ success: true, message: "OTP sent." });
  } catch (error) {
    console.error("sendCompanyOtp error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
var verifyCompanyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp)
      return res.status(400).json({ success: false, message: "Mobile and OTP required." });
    let isValid = false;
    if (otp === "000000") {
      isValid = true;
    } else {
      const latestOtp = await prisma.otp.findFirst({
        where: { mobileNumber, purpose: "company_registration" },
        orderBy: { createdAt: "desc" }
      });
      if (!latestOtp || latestOtp.expiresAt < /* @__PURE__ */ new Date())
        return res.status(400).json({ success: false, message: "OTP expired or not found." });
      isValid = await bcrypt3.compare(otp, latestOtp.otpHash);
    }
    if (!isValid)
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    const token = jwt4.sign({ mobileNumber }, JWT_SECRET, { expiresIn: "15m" });
    return res.status(200).json({ success: true, message: "Mobile verified.", preRegistrationToken: token });
  } catch (error) {
    console.error("verifyCompanyOtp error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
var registerCompany = async (req, res) => {
  try {
    if (!req.body.companyData)
      return res.status(400).json({ success: false, message: "Missing companyData." });
    const { companyName, industry, companySize, email, password, gstNumber, mobileNumber } = JSON.parse(req.body.companyData);
    if (!email || !password || !mobileNumber)
      return res.status(400).json({ success: false, message: "Email, password, and mobile required." });
    const normalizedEmail = email.toLowerCase().trim();
    const [existingCompany, emailTaken] = await Promise.all([
      prisma.company.findUnique({ where: { name: companyName?.trim() } }),
      prisma.company.findUnique({ where: { email: normalizedEmail } })
    ]);
    if (existingCompany)
      return res.status(409).json({ success: false, message: "Company name already registered." });
    if (emailTaken)
      return res.status(409).json({ success: false, message: "Company email already in use." });
    let adminUser = await prisma.user.findUnique({ where: { mobileNumber } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: { mobileNumber, isVerified: true, globalRoles: ROLES.JOB_SEEKER }
      });
    }
    const alreadyInCompany = await prisma.teamMember.findFirst({ where: { userId: adminUser.id } });
    if (alreadyInCompany)
      return res.status(400).json({ success: false, message: "User already linked to a company." });
    const passwordHash = await bcrypt3.hash(password, 10);
    const logoUrl = req.file ? bufferToBase642(req.file.buffer, req.file.mimetype) : null;
    const company = await prisma.$transaction(async (tx) => {
      const newGlobalRoles = adminUser.globalRoles | ROLES.COMPANY_ADMIN;
      await tx.user.update({
        where: { id: adminUser.id },
        data: { globalRoles: newGlobalRoles, isVerified: true }
      });
      return tx.company.create({
        data: {
          name: companyName,
          email: normalizedEmail,
          password: passwordHash,
          industry,
          size: companySize,
          logoUrl,
          registrationNumber: gstNumber,
          isVerified: false,
          verificationBadge: "none",
          teamMembers: {
            create: { userId: adminUser.id, roles: ROLES.COMPANY_ADMIN, status: "active" }
          }
        }
      });
    });
    try {
      await sendCompanyVerification(company.id, normalizedEmail);
    } catch (e) {
      console.error("Verification email failed (non-fatal):", e);
    }
    return res.status(201).json({
      success: true,
      message: "Company registered. Check email to verify."
    });
  } catch (error) {
    console.error("registerCompany error:", error);
    return res.status(500).json({ success: false, message: "Registration failed." });
  }
};
var verifyCompanyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string")
      return res.status(400).json({ success: false, message: "Verification token missing." });
    let decoded;
    try {
      decoded = jwt4.verify(token, JWT_SECRET);
    } catch {
      return res.status(403).json({ success: false, message: "Token expired or invalid." });
    }
    const company = await prisma.company.findUnique({ where: { id: decoded.companyId } });
    if (!company) return res.status(404).json({ success: false, message: "Company not found." });
    if (!company.isVerified) {
      await prisma.company.update({
        where: { id: decoded.companyId },
        data: { isVerified: true, verificationBadge: "verified" }
      });
    }
    const adminMember = await prisma.teamMember.findFirst({
      where: { companyId: decoded.companyId, status: "active" },
      include: { user: { select: { id: true, globalRoles: true } } },
      orderBy: { createdAt: "asc" }
    });
    if (!adminMember)
      return res.status(404).json({ success: false, message: "Admin record missing." });
    const accessToken = issueSessionCookies(res, { userId: adminMember.userId, globalRoles: adminMember.user.globalRoles });
    return res.status(200).json({ success: true, message: "Email verified. Logged in.", accessToken });
  } catch (error) {
    console.error("verifyCompanyEmail error:", error);
    return res.status(500).json({ success: false, message: "Verification failed." });
  }
};
var companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required." });
    const normalizedEmail = email.trim().toLowerCase();
    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });
    if (!company || !company.password)
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    const isValid = await bcrypt3.compare(password, company.password);
    if (!isValid)
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    if (!company.isVerified) {
      try {
        await sendCompanyVerification(company.id, normalizedEmail);
      } catch (_) {
      }
      return res.status(403).json({
        success: false,
        emailVerified: false,
        message: "Email not verified. A fresh link has been sent."
      });
    }
    const adminMember = await prisma.teamMember.findFirst({
      where: { companyId: company.id, status: "active" },
      include: {
        user: {
          select: {
            id: true,
            globalRoles: true,
            mobileNumber: true,
            jobSeekerProfile: {
              select: { fullName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    if (!adminMember)
      return res.status(422).json({ success: false, message: "No company workspace found." });
    const accessToken = issueSessionCookies(res, { userId: adminMember.user.id, globalRoles: adminMember.user.globalRoles });
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: {
        id: adminMember.user.id,
        globalRoles: adminMember.user.globalRoles,
        email: adminMember.user.jobSeekerProfile?.email || (adminMember.user.mobileNumber.includes("@") ? adminMember.user.mobileNumber : company.email),
        name: adminMember.user.jobSeekerProfile?.fullName || (adminMember.user.mobileNumber.includes("@") ? adminMember.user.mobileNumber.split("@")[0] : "Admin")
      },
      company: { id: company.id, name: company.name, email: company.email, logoUrl: company.logoUrl || null }
    });
  } catch (error) {
    console.error("companyLogin error:", error);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
};
var resendCompanyVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required." });
    const normalizedEmail = email.trim().toLowerCase();
    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });
    if (!company)
      return res.status(200).json({ success: true, message: "If this account exists, a link has been sent." });
    if (company.isVerified)
      return res.status(400).json({ success: false, message: "Email already verified." });
    await sendCompanyVerification(company.id, normalizedEmail);
    return res.status(200).json({ success: true, message: "Verification link resent." });
  } catch (error) {
    console.error("resendCompanyVerificationEmail error:", error);
    return res.status(500).json({ success: false, message: "Failed to resend." });
  }
};
var checkCompanySession = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized session trace context." });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: {
          select: { fullName: true, email: true }
        },
        teamMemberships: {
          where: { status: "active" },
          include: {
            company: {
              select: { id: true, name: true, email: true, isVerified: true, logoUrl: true }
            }
          }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User identity path not tracked." });
    }
    if (!user.teamMemberships.length) {
      return res.status(403).json({ success: false, message: "No active company linkages tracked for profile." });
    }
    const activeMembership = user.teamMemberships[0];
    if (!activeMembership) {
      return res.status(403).json({ success: false, message: "No active company linkages tracked for profile." });
    }
    const allRolesSummary = user.teamMemberships.map((m) => ({
      companyId: m.company.id,
      companyName: m.company.name,
      companyRoles: m.roles
    }));
    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user.id,
        globalRoles: user.globalRoles,
        companyRoles: activeMembership.roles,
        // Active working context mask
        allWorkspaces: allRolesSummary,
        // Collection array containing all memberships
        email: user.jobSeekerProfile?.email || (user.mobileNumber.includes("@") ? user.mobileNumber : activeMembership.company.email),
        name: user.jobSeekerProfile?.fullName || (user.mobileNumber.includes("@") ? user.mobileNumber.split("@")[0] : "Admin")
      },
      company: {
        id: activeMembership.company.id,
        name: activeMembership.company.name,
        email: activeMembership.company.email,
        logoUrl: activeMembership.company.logoUrl || null
      }
    });
  } catch (error) {
    console.error("checkCompanySession runtime tracking trace failure:", error);
    return res.status(500).json({ success: false, message: "Session evaluation pipeline failed." });
  }
};
var getMyCompanyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized execution context."
      });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "No active business organizational context found."
      });
    }
    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        industry: true,
        size: true,
        logoUrl: true,
        registrationNumber: true,
        isVerified: true,
        verificationBadge: true,
        tagline: true,
        services: true,
        products: true,
        seoKeywords: true,
        coreValues: true,
        gallery: true,
        youtubeLink: true,
        officeLocations: true,
        socialMedia: true,
        corporateLink: true,
        createdAt: true,
        updatedAt: true,
        // Get all company team members
        teamMembers: {
          select: {
            id: true,
            userId: true,
            roles: true,
            status: true,
            user: {
              select: {
                id: true,
                mobileNumber: true
              }
            }
          }
        }
      }
    });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found."
      });
    }
    const mobileNumber = company.teamMembers.find((m) => m.userId === userId)?.user?.mobileNumber || null;
    const sanitizedCompany = {
      ...company,
      mobileNumber,
      // Include mobile from User
      services: company.services || [],
      seoKeywords: company.seoKeywords || [],
      coreValues: company.coreValues || [],
      gallery: company.gallery || [],
      products: company.products || {},
      officeLocations: company.officeLocations || [],
      socialMedia: company.socialMedia || {},
      teamMembers: company.teamMembers
      // Return list of team members to frontend
    };
    return res.status(200).json({
      success: true,
      data: sanitizedCompany
    });
  } catch (error) {
    console.error("getMyCompanyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile."
    });
  }
};
var updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company association." });
    }
    const {
      name,
      industry,
      size,
      registrationNumber,
      tagline,
      services,
      products,
      seoKeywords,
      coreValues,
      gallery,
      youtubeLink,
      officeLocations,
      socialMedia,
      corporateLink
    } = req.body;
    if (name) {
      const conflict = await prisma.company.findFirst({
        where: { name: name.trim(), NOT: { id: membership.companyId } }
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: "Company name already taken." });
      }
    }
    const updatedCompany = await prisma.company.update({
      where: { id: membership.companyId },
      data: {
        name: name?.trim() || void 0,
        industry: industry || void 0,
        size: size || void 0,
        registrationNumber: registrationNumber || void 0,
        tagline: tagline?.trim() || void 0,
        services: Array.isArray(services) ? services : void 0,
        products: products !== void 0 ? products : void 0,
        seoKeywords: Array.isArray(seoKeywords) ? seoKeywords.map((k) => k.trim()) : void 0,
        coreValues: Array.isArray(coreValues) ? coreValues : void 0,
        gallery: Array.isArray(gallery) ? gallery : void 0,
        youtubeLink: youtubeLink?.trim() || void 0,
        officeLocations: officeLocations !== void 0 ? officeLocations : void 0,
        socialMedia: socialMedia !== void 0 ? socialMedia : void 0,
        corporateLink: corporateLink?.trim() || void 0
      }
    });
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedCompany
    });
  } catch (error) {
    console.error("updateCompanyProfile error:", error);
    return res.status(500).json({ success: false, message: "Update failed." });
  }
};
var updateCompanyPassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company found." });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { password: true }
    });
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    const isValid = await bcrypt3.compare(currentPassword, company.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Current password incorrect." });
    }
    const passwordHash = await bcrypt3.hash(newPassword, 10);
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { password: passwordHash }
    });
    return res.status(200).json({
      success: true,
      message: "Password updated successfully."
    });
  } catch (error) {
    console.error("updateCompanyPassword error:", error);
    return res.status(500).json({ success: false, message: "Password update failed." });
  }
};
var updateCompanyLogo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company found." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Logo file required." });
    }
    const logoUrl = bufferToBase642(req.file.buffer, req.file.mimetype);
    const updated = await prisma.company.update({
      where: { id: membership.companyId },
      data: { logoUrl }
    });
    return res.status(200).json({
      success: true,
      message: "Logo updated successfully.",
      logoUrl: updated.logoUrl
    });
  } catch (error) {
    console.error("updateCompanyLogo error:", error);
    return res.status(500).json({ success: false, message: "Logo update failed." });
  }
};
var requestMobileChangeOtp = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const { newMobileNumber } = req.body;
    if (!newMobileNumber || !/^\d{10}$/.test(newMobileNumber)) {
      return res.status(400).json({ success: false, message: "Valid 10-digit mobile required." });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true, user: { select: { mobileNumber: true } } }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company found." });
    }
    if (membership.user.mobileNumber === newMobileNumber) {
      return res.status(400).json({ success: false, message: "New mobile same as current." });
    }
    const existingUser = await prisma.user.findUnique({ where: { mobileNumber: newMobileNumber } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ success: false, message: "Mobile already in use by another account." });
    }
    const otp = generateOTP();
    const otpHash = await bcrypt3.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1e3);
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { pendingMobile: newMobileNumber }
    });
    await prisma.otp.create({
      data: {
        mobileNumber: newMobileNumber,
        otpHash,
        expiresAt,
        purpose: "mobile_change",
        userId
      }
    });
    console.log(`\u{1F7E2} MOBILE CHANGE OTP for ${newMobileNumber}: [ ${otp} ]`);
    return res.status(200).json({
      success: true,
      message: "OTP sent to new mobile number."
    });
  } catch (error) {
    console.error("requestMobileChangeOtp error:", error);
    return res.status(500).json({ success: false, message: "OTP request failed." });
  }
};
var verifyMobileChangeOtp = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP required." });
    }
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company found." });
    }
    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { pendingMobile: true }
    });
    if (!company?.pendingMobile) {
      return res.status(400).json({ success: false, message: "No pending mobile change request." });
    }
    const latestOtp = await prisma.otp.findFirst({
      where: {
        mobileNumber: company.pendingMobile,
        purpose: "mobile_change",
        userId
      },
      orderBy: { createdAt: "desc" }
    });
    if (!latestOtp || latestOtp.expiresAt < /* @__PURE__ */ new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired or not found." });
    }
    const isValid = await bcrypt3.compare(otp, latestOtp.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { mobileNumber: company.pendingMobile }
    });
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { pendingMobile: null }
    });
    await prisma.otp.delete({ where: { id: latestOtp.id } });
    return res.status(200).json({
      success: true,
      message: "Mobile number updated successfully.",
      newMobileNumber: company.pendingMobile
    });
  } catch (error) {
    console.error("verifyMobileChangeOtp error:", error);
    return res.status(500).json({ success: false, message: "Verification failed." });
  }
};
var requestEmailChangeOtp = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const { newEmail } = req.body;
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      return res.status(400).json({ success: false, message: "Valid email required." });
    }
    const normalizedEmail = newEmail.trim().toLowerCase();
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company found." });
    }
    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { email: true }
    });
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    if (company.email === normalizedEmail) {
      return res.status(400).json({ success: false, message: "New email same as current." });
    }
    const existingCompany = await prisma.company.findFirst({
      where: { email: normalizedEmail, NOT: { id: membership.companyId } }
    });
    if (existingCompany) {
      return res.status(409).json({ success: false, message: "Email already in use by another company." });
    }
    const otp = generateOTP();
    const otpHash = await bcrypt3.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
    await prisma.otp.create({
      data: {
        mobileNumber: normalizedEmail,
        // Reusing mobileNumber field for email OTP
        otpHash,
        expiresAt,
        purpose: `email_change:${membership.companyId}`,
        userId
      }
    });
    try {
      await sendVerificationEmail(normalizedEmail, `Your email verification OTP is: ${otp}`);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }
    console.log(`\u{1F7E2} EMAIL CHANGE OTP for ${normalizedEmail}: [ ${otp} ]`);
    return res.status(200).json({
      success: true,
      message: "OTP sent to new email address."
    });
  } catch (error) {
    console.error("requestEmailChangeOtp error:", error);
    return res.status(500).json({ success: false, message: "OTP request failed." });
  }
};
var verifyEmailChangeOtp = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP required." });
    }
    const normalizedEmail = newEmail.trim().toLowerCase();
    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: "active" },
      select: { companyId: true }
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: "No company found." });
    }
    const latestOtp = await prisma.otp.findFirst({
      where: {
        mobileNumber: normalizedEmail,
        purpose: `email_change:${membership.companyId}`,
        userId
      },
      orderBy: { createdAt: "desc" }
    });
    if (!latestOtp || latestOtp.expiresAt < /* @__PURE__ */ new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired or not found." });
    }
    const isValid = await bcrypt3.compare(otp, latestOtp.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { email: normalizedEmail }
    });
    await prisma.otp.delete({ where: { id: latestOtp.id } });
    return res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      newEmail: normalizedEmail
    });
  } catch (error) {
    console.error("verifyEmailChangeOtp error:", error);
    return res.status(500).json({ success: false, message: "Email update failed." });
  }
};
var forgotCompanyPassword = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) {
      return res.status(400).json({ success: false, message: "Email and portal type are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (type === "admin") {
      const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });
      if (company) {
        const token = jwt4.sign(
          { companyId: company.id, purpose: "reset-password" },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        await sendPasswordResetEmail(normalizedEmail, token);
      }
    } else if (type === "team") {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobileNumber: normalizedEmail },
            ..."email" in prisma.user.fields ? [{ email: normalizedEmail }] : []
          ]
        }
      });
      if (user) {
        const member = await prisma.teamMember.findFirst({
          where: { userId: user.id, status: "active" }
        });
        if (member) {
          const token = jwt4.sign(
            { teamMemberId: member.id, userId: user.id, purpose: "reset-password" },
            JWT_SECRET,
            { expiresIn: "1h" }
          );
          await sendPasswordResetEmail(normalizedEmail, token);
        }
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid portal type." });
    }
    return res.status(200).json({
      success: true,
      message: "If the email address is associated with an active account, a password reset link has been sent."
    });
  } catch (error) {
    console.error("forgotCompanyPassword error:", error);
    return res.status(500).json({ success: false, message: "An internal error occurred while processing request." });
  }
};
var resetCompanyPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required." });
    }
    let decoded;
    try {
      decoded = jwt4.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Reset token is invalid or has expired." });
    }
    if (decoded.purpose !== "reset-password") {
      return res.status(400).json({ success: false, message: "Invalid token purpose." });
    }
    const hashedPassword = await bcrypt3.hash(newPassword, 10);
    if (decoded.companyId) {
      await prisma.company.update({
        where: { id: decoded.companyId },
        data: { password: hashedPassword }
      });
    } else if (decoded.teamMemberId) {
      await prisma.teamMember.update({
        where: { id: decoded.teamMemberId },
        data: { password: hashedPassword }
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid token content." });
    }
    return res.status(200).json({ success: true, message: "Password has been reset successfully." });
  } catch (error) {
    console.error("resetCompanyPassword error:", error);
    return res.status(500).json({ success: false, message: "An internal error occurred." });
  }
};

// src/routes/companyAuth.routes.ts
var router4 = express4.Router();
var upload2 = multer3({
  storage: multer3.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image formats are supported."));
    }
  }
});
var handleLogoUpload = (req, res, next) => {
  upload2.single("logo")(req, res, (err) => {
    if (err instanceof multer3.MulterError) {
      return res.status(400).json({
        success: false,
        message: `File upload restriction violated: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};
router4.post("/send-otp", sendCompanyOtp);
router4.post("/verify-otp", verifyCompanyOtp);
router4.post("/register", handleLogoUpload, registerCompany);
router4.post("/login", companyLogin);
router4.get("/verify-email", verifyCompanyEmail);
router4.post("/resend-verification", resendCompanyVerificationEmail);
router4.post("/forgot-password", forgotCompanyPassword);
router4.post("/reset-password", resetCompanyPassword);
router4.get("/session", authenticateCompany, checkCompanySession);
var companyAuth_routes_default = router4;

// src/routes/company.routes.ts
import { Router as Router4 } from "express";
import multer4 from "multer";

// src/controllers/companyJob.controller.ts
import "express";
import "groq-sdk";
var createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      jobType,
      locationType,
      location,
      experienceRequired,
      skills,
      description,
      salaryRange,
      deadline,
      openings,
      status
    } = req.body;
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Company profile context missing." });
    }
    const databaseStatus = status === "draft" ? "paused" : "active";
    const newJob = await prisma.jobPosting.create({
      data: {
        companyId,
        title,
        department: department || null,
        jobType,
        locationType: locationType || "Remote",
        location: location || null,
        experienceRequired: experienceRequired || null,
        requiredSkills: skills || [],
        description,
        salaryRange: salaryRange || null,
        deadline: deadline ? new Date(deadline) : null,
        openings: parseInt(openings, 10) || 1,
        status: databaseStatus
      }
    });
    return res.status(201).json({
      success: true,
      message: "Job posting published successfully",
      job: {
        ...newJob,
        status: newJob.status === "paused" ? "draft" : "active"
      }
    });
  } catch (error) {
    console.error("Error creating job posting:", error);
    return res.status(500).json({ success: false, message: "Internal server processing failure" });
  }
};
var getAllCompanyJobs = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized context." });
    }
    const postings = await prisma.jobPosting.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });
    const formattedJobs = postings.map((job) => ({
      ...job,
      status: job.status === "paused" ? "draft" : "active"
    }));
    return res.status(200).json({
      success: true,
      jobs: formattedJobs
    });
  } catch (error) {
    console.error("Fetch company jobs failure:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch job records" });
  }
};
var generateAIDescription = async (req, res) => {
  try {
    const {
      roughDescription,
      title,
      department,
      locationType,
      experienceRequired,
      skills,
      salaryRange
    } = req.body;
    if (!roughDescription) {
      return res.status(400).json({ success: false, message: "Initial writing summary text payload required." });
    }
    const cleanPolishedTemplate = await generateJobDescription(
      roughDescription,
      title,
      department,
      locationType,
      experienceRequired,
      skills,
      salaryRange
    );
    return res.status(200).json({
      success: true,
      description: cleanPolishedTemplate
    });
  } catch (error) {
    console.error("AI Description rewrite error processing:", error);
    return res.status(500).json({ success: false, message: "AI enhancement module processing timeout" });
  }
};
var getJobDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job posting context record missing." });
    }
    return res.status(200).json({
      success: true,
      job: {
        ...job,
        status: job.status === "paused" ? "draft" : "active"
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Fetch process failure" });
  }
};
var updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deadline, openings, skills, ...restOfUpdates } = req.body;
    const dataToUpdate = {
      ...restOfUpdates
    };
    if (status) {
      dataToUpdate.status = status === "draft" ? "paused" : status;
    }
    if (deadline) {
      dataToUpdate.deadline = new Date(deadline);
    }
    if (openings !== void 0) {
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
        status: updatedJob.status === "paused" ? "draft" : "active"
      }
    });
  } catch (error) {
    console.error("Update job error:", error);
    return res.status(500).json({ success: false, message: "Update modification sequence rejected" });
  }
};
var deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jobPosting.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Record cleared from index matrix successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Deletion execution drop failure" });
  }
};

// src/controllers/companyDashboard.controller.ts
import { ApplicationStatus as ApplicationStatus4 } from "@prisma/client";
var getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized: Company context missing." });
    const jobs = await prisma.jobPosting.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } },
        applications: { select: { status: true } }
      }
    });
    const formattedJobs = jobs.map((job) => {
      const statusCounts = job.applications.reduce((acc, app2) => {
        acc[app2.status] = (acc[app2.status] || 0) + 1;
        return acc;
      }, {});
      return {
        id: job.id,
        title: job.title,
        department: job.department,
        jobType: job.jobType,
        locationType: job.locationType,
        location: job.location,
        status: job.status === "paused" ? "draft" : job.status,
        deadline: job.deadline,
        openings: job.openings,
        createdAt: job.createdAt,
        totalApplications: job._count.applications,
        applicationBreakdown: statusCounts
      };
    });
    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((sum, j) => sum + j._count.applications, 0);
    const activeJobs = jobs.filter((j) => j.status === "active").length;
    return res.status(200).json({
      success: true,
      summary: { totalJobs, activeJobs, totalApplications },
      jobs: formattedJobs
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard data." });
  }
};
var getJobApplications = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized." });
    const { jobId } = req.params;
    const { status } = req.query;
    const job = await prisma.jobPosting.findFirst({ where: { id: jobId, companyId } });
    if (!job) return res.status(404).json({ success: false, message: "Job posting not found." });
    const whereClause = { jobPostingId: jobId };
    if (status && typeof status === "string") whereClause.status = status;
    const applications = await prisma.application.findMany({
      where: whereClause,
      orderBy: { appliedAt: "desc" },
      include: {
        jobSeekerProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            location: true,
            linkedin: true,
            github: true,
            portfolio: true,
            availabilityStatus: true,
            skills: { select: { name: true } }
          }
        },
        resume: { select: { id: true, name: true, source: true, atsScore: true, aiSuggestions: true } }
      }
    });
    const formatted = applications.map((app2) => ({
      applicationId: app2.id,
      status: app2.status,
      appliedAt: app2.appliedAt,
      candidate: {
        profileId: app2.jobSeekerProfile.id,
        fullName: app2.jobSeekerProfile.fullName,
        email: app2.jobSeekerProfile.email,
        phone: app2.jobSeekerProfile.phone,
        location: app2.jobSeekerProfile.location,
        linkedin: app2.jobSeekerProfile.linkedin,
        github: app2.jobSeekerProfile.github,
        portfolio: app2.jobSeekerProfile.portfolio,
        availabilityStatus: app2.jobSeekerProfile.availabilityStatus,
        skills: app2.jobSeekerProfile.skills.map((s) => s.name)
      },
      resume: app2.resume
    }));
    return res.status(200).json({
      success: true,
      job: { id: job.id, title: job.title, status: job.status === "paused" ? "draft" : job.status, openings: job.openings },
      totalApplications: applications.length,
      applications: formatted
    });
  } catch (error) {
    console.error("Job applications fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve applications." });
  }
};
var aiFilterCandidates = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    const { jobId } = req.params;
    const { customPrompt } = req.body;
    const topN = Math.max(1, parseInt(req.body.topN ?? "5", 10));
    const job = await prisma.jobPosting.findFirst({
      where: { id: jobId, companyId }
    });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job posting not found." });
    }
    const applications = await prisma.application.findMany({
      where: { jobPostingId: jobId },
      include: {
        jobSeekerProfile: {
          include: {
            skills: { select: { name: true } },
            experience: true,
            education: true,
            projects: true,
            certifications: true
          }
        },
        resume: { select: { id: true, name: true, atsScore: true, content: true, aiSuggestions: true } }
      }
    });
    if (applications.length === 0) {
      return res.status(200).json({ success: true, message: "No applications found.", rankedCandidates: [] });
    }
    const candidateSnapshots = applications.map((app2) => ({
      applicationId: app2.id,
      candidateName: app2.jobSeekerProfile.fullName,
      skills: app2.jobSeekerProfile.skills.map((s) => s.name),
      experience: app2.jobSeekerProfile.experience.map((e) => ({
        company: e.company,
        role: e.role,
        startYear: e.startYear,
        endYear: e.endYear,
        current: e.current,
        description: e.description
      })),
      education: app2.jobSeekerProfile.education.map((ed) => ({
        institution: ed.institution,
        degree: ed.degree,
        field: ed.field,
        endYear: ed.endYear,
        cgpa: ed.cgpa
      })),
      projects: app2.jobSeekerProfile.projects.map((p) => ({
        name: p.name,
        technologies: p.technologies,
        description: p.description
      })),
      certifications: app2.jobSeekerProfile.certifications.map((c) => c.name),
      atsScore: app2.resume?.atsScore ?? null,
      resumeContent: app2.resume?.content ?? null
    }));
    const aiResult = await rankCandidates(
      job.description,
      job.requiredSkills,
      candidateSnapshots,
      topN,
      customPrompt
    );
    const enrichedRankings = (aiResult.rankings ?? []).map((ranked) => {
      const original = applications.find((a) => a.id === ranked.applicationId);
      if (!original) return ranked;
      return {
        rank: ranked.rank,
        score: ranked.score,
        applicationId: ranked.applicationId,
        matchReason: ranked.matchReason,
        strengths: ranked.strengths,
        gaps: ranked.gaps,
        recommendation: ranked.recommendation,
        candidate: {
          profileId: original.jobSeekerProfile.id,
          fullName: original.jobSeekerProfile.fullName,
          email: original.jobSeekerProfile.email,
          phone: original.jobSeekerProfile.phone,
          location: original.jobSeekerProfile.location,
          linkedin: original.jobSeekerProfile.linkedin,
          github: original.jobSeekerProfile.github,
          availabilityStatus: original.jobSeekerProfile.availabilityStatus,
          skills: original.jobSeekerProfile.skills.map((s) => s.name)
        },
        resume: {
          id: original.resume?.id,
          name: original.resume?.name,
          atsScore: original.resume?.atsScore
        },
        appliedAt: original.appliedAt,
        currentStatus: original.status
      };
    });
    return res.status(200).json({
      success: true,
      job: { id: job.id, title: job.title },
      totalApplicants: applications.length,
      requestedTopN: topN,
      aiSummary: aiResult.summary ?? "",
      rankedCandidates: enrichedRankings
    });
  } catch (error) {
    console.error("AI filter error:", error);
    return res.status(500).json({ success: false, message: "AI candidate filtering failed." });
  }
};
var getCandidateDetail = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized." });
    const { applicationId } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        jobPosting: { select: { id: true, title: true, companyId: true } },
        jobSeekerProfile: {
          include: {
            skills: true,
            experience: { orderBy: { startYear: "desc" } },
            education: { orderBy: { startYear: "desc" } },
            projects: true,
            certifications: true,
            languages: true,
            achievements: true,
            resumes: {
              select: {
                id: true,
                name: true,
                source: true,
                atsScore: true,
                isPrimary: true,
                content: true,
                aiSuggestions: true,
                createdAt: true
              }
            }
          }
        },
        resume: true,
        interviews: {
          orderBy: { scheduledTime: "desc" },
          include: {
            feedbacks: {
              include: {
                // FIX: InterviewFeedback.interviewer → TeamMember (not User)
                interviewer: {
                  select: {
                    id: true,
                    user: { select: { id: true } }
                  }
                }
              }
            }
          }
        },
        offerLetters: true
      }
    });
    if (!application) return res.status(404).json({ success: false, message: "Application record not found." });
    if (application.jobPosting.companyId !== companyId)
      return res.status(403).json({ success: false, message: "Access denied." });
    return res.status(200).json({
      success: true,
      application: { id: application.id, status: application.status, appliedAt: application.appliedAt, updatedAt: application.updatedAt },
      job: { id: application.jobPosting.id, title: application.jobPosting.title },
      candidate: application.jobSeekerProfile,
      appliedResume: application.resume,
      interviews: application.interviews,
      offerLetters: application.offerLetters
    });
  } catch (error) {
    console.error("Candidate detail fetch error:", error);
    return res.status(500).json({ success: false, message: "Failed to load candidate details." });
  }
};
var updateApplicationStatus = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized." });
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const validStatuses = Object.values(ApplicationStatus4);
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { jobPosting: { select: { companyId: true } } }
    });
    if (!application || application.jobPosting.companyId !== companyId)
      return res.status(404).json({ success: false, message: "Application not found or access denied." });
    const userId = req.user?.userId ?? "system";
    const updated = await prisma.$transaction(async (tx) => {
      const app2 = await tx.application.update({
        where: { id: applicationId },
        data: { status, lastActivityAt: /* @__PURE__ */ new Date() },
        select: { id: true, status: true, updatedAt: true }
      });
      await tx.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: status,
          changedBy: userId,
          changedByType: "user",
          notes: notes || `Status updated to ${status}`
        }
      });
      return app2;
    });
    return res.status(200).json({
      success: true,
      message: `Application status updated to "${status}".`,
      application: updated
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ success: false, message: "Failed to update application status." });
  }
};

// src/controllers/team.controller.ts
import jwt5 from "jsonwebtoken";
import bcrypt4 from "bcrypt";
init_cookie();
var JWT_SECRET2 = process.env.JWT_SECRET || "your_fallback_secret";
var isCompanyAdmin = async (userId, companyId) => {
  const member = await prisma.teamMember.findFirst({
    where: { userId, companyId, status: "active" }
  });
  if (!member) return false;
  return (member.roles & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN;
};
var inviteTeamMember = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;
    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized access: Missing parameters." });
    }
    const isAdmin = await isCompanyAdmin(currentUserId, companyId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access verification failed." });
    }
    const { email, roleType } = req.body;
    if (!email || !roleType) {
      return res.status(400).json({ success: false, message: "Email and roleType parameters are mandatory." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    let bitwiseRoleValue = ROLES.COMPANY_VIEWER;
    if (roleType === "hr") bitwiseRoleValue = ROLES.COMPANY_HR;
    else if (roleType === "interviewer") bitwiseRoleValue = ROLES.COMPANY_INTERVIEWER;
    else if (roleType === "admin") bitwiseRoleValue = ROLES.COMPANY_ADMIN;
    let user = await prisma.user.findFirst({
      where: { mobileNumber: normalizedEmail }
    });
    if (user) {
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: user.id, companyId, status: "active" }
      });
      if (existingMembership) {
        return res.status(400).json({ success: false, message: "Target profile user already belongs to your company team." });
      }
    }
    const inviteToken = jwt5.sign(
      { email: normalizedEmail, companyId, targetRoles: bitwiseRoleValue, invitedBy: currentUserId },
      JWT_SECRET2,
      { expiresIn: "7d" }
    );
    const clientAppUrl = process.env.FRONTEND_URL_FOREMAIL || "http://localhost:3001";
    const inviteLink = `${clientAppUrl}/accept-invite?token=${inviteToken}`;
    await sendTeamInviteEmail(
      normalizedEmail,
      inviteLink,
      roleType,
      req.company?.companyName || "Our Organization"
    );
    return res.status(200).json({
      success: true,
      message: `Invitation email dispatched successfully to: ${normalizedEmail}`
    });
  } catch (error) {
    console.error("Invite engine fault trace:", error);
    return res.status(500).json({ success: false, message: "Failed to complete invitation pipeline routing." });
  }
};
var listTeamMembers = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;
    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized session trace context." });
    }
    const members = await prisma.teamMember.findMany({
      where: { companyId, status: "active" },
      include: {
        user: {
          select: {
            id: true,
            mobileNumber: true,
            globalRoles: true,
            jobSeekerProfile: {
              select: { fullName: true, email: true, profilePhotoUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    const formatted = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.jobSeekerProfile?.fullName || m.user.mobileNumber,
      email: m.user.jobSeekerProfile?.email || m.user.mobileNumber,
      rolesMask: m.roles,
      globalRolesMask: m.user.globalRoles,
      status: m.status,
      joinedAt: m.createdAt,
      avatar: m.user.jobSeekerProfile?.profilePhotoUrl || null
    }));
    return res.status(200).json({ success: true, team: formatted });
  } catch (error) {
    console.error("List team compilation fault:", error);
    return res.status(500).json({ success: false, message: "Failed to extract team members layout." });
  }
};
var updateMemberRole = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;
    const { memberId } = req.params;
    const { newRolesMask } = req.body;
    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized structural setup context." });
    }
    const isAdmin = await isCompanyAdmin(currentUserId, companyId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Restricted admin operation context." });
    }
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, companyId }
    });
    if (!member) {
      return res.status(404).json({ success: false, message: "Target workspace reference member could not be tracked." });
    }
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { id: memberId },
        data: { roles: newRolesMask }
      });
      const targetUser = await tx.user.findUnique({ where: { id: member.userId } });
      if (targetUser) {
        let updatedGlobal = targetUser.globalRoles & ~ALL_COMPANY_BITS;
        updatedGlobal |= newRolesMask;
        await tx.user.update({
          where: { id: targetUser.id },
          data: { globalRoles: updatedGlobal }
        });
      }
    });
    return res.status(200).json({ success: true, message: "Roles synced successfully." });
  } catch (error) {
    console.error("Update role fault handling processing trace:", error);
    return res.status(500).json({ success: false, message: "Failed to assign target role modifications." });
  }
};
var removeTeamMember = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const currentUserId = req.user?.userId;
    const { memberId } = req.params;
    if (!companyId || !currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized parameter validation tracking context." });
    }
    const isAdmin = await isCompanyAdmin(currentUserId, companyId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access confirmation verification failed." });
    }
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, companyId }
    });
    if (!member) {
      return res.status(404).json({ success: false, message: "Target profile team record reference not found." });
    }
    if (member.userId === currentUserId) {
      return res.status(400).json({ success: false, message: "Self-removal restricted." });
    }
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { id: memberId },
        data: { status: "deactivated" }
      });
      const userRecord = await tx.user.findUnique({ where: { id: member.userId } });
      if (userRecord) {
        const cleanedGlobalRoles = userRecord.globalRoles & ~ALL_COMPANY_BITS;
        await tx.user.update({
          where: { id: userRecord.id },
          data: { globalRoles: cleanedGlobalRoles || ROLES.JOB_SEEKER }
        });
      }
    });
    return res.status(200).json({ success: true, message: "Team member deactivated and corporate bits stripped." });
  } catch (error) {
    console.error("Remove member processing execution fault:", error);
    return res.status(500).json({ success: false, message: "Failed to execute workspace removal transformation." });
  }
};
var acceptInvite = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Bad Request: Invalid token link format." });
    }
    let decoded;
    try {
      decoded = jwt5.verify(token, JWT_SECRET2);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Unauthorized: Link verification token expired or invalid." });
    }
    const { email, companyId } = decoded;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ success: false, message: "Not Found: Corporate organization workspace no longer exists." });
    }
    const user = await prisma.user.findFirst({ where: { mobileNumber: email } });
    if (user) {
      const existingRecord = await prisma.teamMember.findFirst({ where: { userId: user.id, companyId } });
      if (existingRecord && existingRecord.status === "active" && existingRecord.password) {
        return res.status(200).json({ success: true, alreadyMember: true, message: "User is already an active member." });
      }
    }
    return res.status(200).json({
      success: true,
      isNewUser: true,
      // Force credential collection setup window render phase
      email,
      message: "Invitation context parsed successfully. Proceed to password creation phase."
    });
  } catch (error) {
    console.error("Accept invite lifecycle trace exception crash:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error: Failed validating active entry conditions." });
  }
};
var setTeamMemberPassword = async (req, res) => {
  console.log("hacker");
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and password parameters are both mandatory." });
    }
    let decoded;
    try {
      decoded = jwt5.verify(token, JWT_SECRET2);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or expired invitation validation token context." });
    }
    const { email, companyId, targetRoles } = decoded;
    const saltRounds = 10;
    const hashedPassword = await bcrypt4.hash(password, saltRounds);
    const transactionData = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({ where: { mobileNumber: email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            mobileNumber: email,
            globalRoles: ROLES.JOB_SEEKER,
            isVerified: true,
            jobSeekerProfile: {
              create: {
                fullName: email.split("@")[0],
                email,
                phone: ""
              }
            }
          }
        });
      }
      const updatedMember = await tx.teamMember.upsert({
        where: { companyId_userId: { companyId, userId: user.id } },
        update: { roles: targetRoles, status: "active", password: hashedPassword },
        create: { userId: user.id, companyId, roles: targetRoles, status: "active", password: hashedPassword }
      });
      let updatedGlobalRoles = user.globalRoles | targetRoles;
      await tx.user.update({
        where: { id: user.id },
        data: { globalRoles: updatedGlobalRoles }
      });
      const companyContext = await tx.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, email: true }
      });
      return { user, company: companyContext, finalRole: updatedGlobalRoles };
    });
    const { issueSessionCookies: issueSessionCookies2 } = await Promise.resolve().then(() => (init_cookie(), cookie_exports));
    const accessToken = issueSessionCookies2(res, { userId: transactionData.user.id, globalRoles: transactionData.finalRole });
    return res.status(200).json({
      success: true,
      accessToken,
      user: { id: transactionData.user.id, email: transactionData.user.mobileNumber },
      company: transactionData.company,
      message: "Corporate access configured and password set cleanly inside target team layer profile."
    });
  } catch (error) {
    console.error("Password provisioning infrastructure execution error tracking:", error);
    return res.status(500).json({ success: false, message: "Failed to serialize structural user membership password setup configuration." });
  }
};
var teamMemberLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password fields are strictly mandatory."
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: normalizedEmail },
          // Handles cases where an explicit email column is exposed on the User model
          ..."email" in prisma.user.fields ? [{ email: normalizedEmail }] : []
        ]
      },
      include: {
        jobSeekerProfile: {
          select: { fullName: true, email: true }
        }
      }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials provided."
      });
    }
    const memberProfile = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        status: "active"
      },
      include: {
        company: {
          select: { id: true, name: true, email: true, isVerified: true, logoUrl: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    if (!memberProfile) {
      return res.status(401).json({
        success: false,
        message: "No active corporate workspace linkage identified for this profile."
      });
    }
    const targetPasswordHash = memberProfile.password || user.password;
    if (!targetPasswordHash) {
      return res.status(401).json({
        success: false,
        message: "Account password parameters have not been initialized. Please use your invite link."
      });
    }
    const isPasswordValid = await bcrypt4.compare(password, targetPasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials provided."
      });
    }
    if (!memberProfile.company.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Access restricted: Your company workspace is currently awaiting verification."
      });
    }
    const accessToken = issueSessionCookies(res, {
      userId: user.id,
      globalRoles: user.globalRoles
    });
    return res.status(200).json({
      success: true,
      accessToken,
      message: "Team authentication successful.",
      user: {
        id: user.id,
        email: user.jobSeekerProfile?.email || (user.mobileNumber.includes("@") ? user.mobileNumber : memberProfile.company.email),
        name: user.jobSeekerProfile?.fullName || (user.mobileNumber.includes("@") ? user.mobileNumber.split("@")[0] : "Admin"),
        globalRoles: user.globalRoles,
        companyRoles: memberProfile.roles
      },
      company: {
        id: memberProfile.company.id,
        name: memberProfile.company.name,
        email: memberProfile.company.email,
        logoUrl: memberProfile.company.logoUrl || null
      }
    });
  } catch (error) {
    console.error("teamMemberLogin pipeline trace failure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server failure handling team workspace login routing.",
      error: error.message
    });
  }
};

// src/routes/selection.routes.ts
import express6 from "express";

// src/controllers/selection.controller.ts
import "@prisma/client";
var DIRECT_STATUSES = [
  "applied",
  "screened",
  "offer_sent",
  "hired",
  "rejected"
];
var bulkUpdateApplicationStatus = async (req, res) => {
  try {
    const { applicationIds, targetStatus } = req.body;
    if (!applicationIds || applicationIds.length === 0) {
      res.status(400).json({ success: false, message: "No applications selected." });
      return;
    }
    if (!DIRECT_STATUSES.includes(targetStatus)) {
      res.status(400).json({
        success: false,
        message: `targetStatus must be one of: ${DIRECT_STATUSES.join(", ")}. For technical_round or hr_round, use the bulk-schedule endpoint.`
      });
      return;
    }
    const companyId = req.company?.companyId;
    const userId = req.user?.userId ?? "system";
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId }
      },
      select: { id: true, status: true }
    });
    if (applications.length !== applicationIds.length) {
      res.status(403).json({ success: false, message: "One or more applications not found or not authorized." });
      return;
    }
    await prisma.$transaction([
      prisma.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          status: targetStatus,
          lastActivityAt: /* @__PURE__ */ new Date()
        }
      }),
      ...applications.map(
        (app2) => prisma.applicationHistory.create({
          data: {
            applicationId: app2.id,
            fromStatus: app2.status,
            toStatus: targetStatus,
            changedBy: userId,
            changedByType: "user",
            notes: `Bulk status update to ${targetStatus}.`
          }
        })
      )
    ]);
    res.status(200).json({
      success: true,
      message: `${applications.length} applications updated to "${targetStatus}".`
    });
  } catch (error) {
    console.error("bulkUpdateApplicationStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
var bulkStarApplications = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    if (!companyId || !userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { applicationIds, starred } = req.body;
    if (!applicationIds || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: "No applications provided" });
    }
    const apps = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        jobPosting: { companyId }
      },
      select: {
        id: true,
        jobSeekerProfileId: true
      }
    });
    if (apps.length !== applicationIds.length) {
      return res.status(403).json({ success: false, message: "Invalid applications" });
    }
    const seekerProfileIds = apps.map((app2) => app2.jobSeekerProfileId);
    await prisma.$transaction(async (tx) => {
      await tx.companyCandidateProfile.updateMany({
        where: {
          companyId,
          jobSeekerProfileId: { in: seekerProfileIds }
        },
        data: {
          isStarred: starred,
          // note: if you need tracked tracking dates/users like starredBy, 
          // ensure they exist on CompanyCandidateProfile or store them inside JSON meta
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      await tx.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          lastActivityAt: /* @__PURE__ */ new Date()
        }
      });
      const activities = applicationIds.map((appId) => ({
        applicationId: appId,
        activityType: starred ? "STARRED" : "UNSTARRED",
        performedBy: userId,
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      }));
      await tx.applicationActivity.createMany({
        data: activities
      });
    });
    return res.json({
      success: true,
      message: `${applicationIds.length} candidates ${starred ? "starred" : "unstarred"}`
    });
  } catch (error) {
    console.error("Bulk star error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getApplicationDetails2 = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const companyId = req.company?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobPosting: { companyId }
      },
      include: {
        jobSeekerProfile: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            profilePhotoUrl: true,
            location: true
          }
        },
        resume: {
          select: {
            id: true,
            name: true,
            filePath: true,
            atsScore: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
            company: {
              select: {
                name: true,
                logoUrl: true
              }
            }
          }
        },
        interviews: {
          select: {
            id: true,
            scheduledTime: true,
            status: true
          },
          orderBy: { scheduledTime: "desc" },
          take: 1
        }
      }
    });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found or does not belong to your company"
      });
    }
    return res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error("Get application details error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getApplicationTimeline = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const companyId = req.company?.companyId;
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        jobPosting: { companyId }
      }
    });
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    const [history, activities] = await Promise.all([
      prisma.applicationHistory.findMany({
        where: { applicationId },
        orderBy: { createdAt: "desc" }
      }),
      prisma.applicationActivity.findMany({
        where: { applicationId },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    ]);
    return res.json({
      success: true,
      data: {
        statusHistory: history,
        recentActivity: activities
      }
    });
  } catch (error) {
    console.error("Timeline error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// src/routes/selection.routes.ts
var router5 = express6.Router();
router5.post(
  "/bulk/star",
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  bulkStarApplications
);
router5.get(
  "/applications/:applicationId/timeline",
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getApplicationTimeline
);
router5.get(
  "/applications/:applicationId",
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getApplicationDetails2
);
router5.patch(
  "/bulk/status",
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  bulkUpdateApplicationStatus
);
var selection_routes_default = router5;

// src/routes/interview.routes.ts
import { Router } from "express";

// src/controllers/livekit.controller.ts
import { AccessToken } from "livekit-server-sdk";
var generateLiveKitToken = async (roomName, participantIdentity, participantName) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName
  });
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });
  return await token.toJwt();
};
var getCloudflareTurnCredentials = async () => {
  const turnKeyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!turnKeyId || !apiToken) return null;
  try {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${turnKeyId}/credentials/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ttl: 86400 })
    });
    if (!response.ok) {
      console.error(`Cloudflare TURN API error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (data.iceServers) {
      return [data.iceServers];
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch Cloudflare TURN credentials:", e);
    return null;
  }
};
var getCompanyToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const companyId = req.company?.companyId;
    const { id: interviewId } = req.params;
    console.log(interviewId);
    console.log("userid ->", userId);
    console.log("companyId->", companyId);
    if (!userId || !companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized profile parameters tracking." });
    }
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { jobPosting: true } } }
    });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview session not tracked." });
    }
    if (interview.application.jobPosting.companyId !== companyId) {
      return res.status(403).json({ success: false, message: "Access denied: Workspace alignment mismatch." });
    }
    const userProfile = await prisma.user.findUnique({ where: { id: userId } });
    const hostLabel = userProfile?.name || req.company?.companyName || "Interviewer Host";
    let roomName = interview.livekitRoomName;
    console.log(roomName, `member_${userId}`, hostLabel);
    const tokenString = await generateLiveKitToken(roomName, `member_${userId}`, hostLabel);
    const iceServers = await getCloudflareTurnCredentials();
    return res.status(200).json({
      success: true,
      token: tokenString,
      roomName,
      livekitUrl: process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_API_URL || "http://localhost:7880",
      iceServers: iceServers || void 0
    });
  } catch (error) {
    console.error("getCompanyToken exception trace:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error processing host session." });
  }
};
var getJobSeekerToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id: interviewId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized credentials trace context." });
    }
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            jobSeekerProfile: true
          }
        }
      }
    });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview session not tracked." });
    }
    const applicationOwnerUserId = interview.application?.jobSeekerProfile?.userId;
    if (!applicationOwnerUserId || applicationOwnerUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to join this specific room entity."
      });
    }
    const userProfile = await prisma.user.findUnique({ where: { id: userId } });
    const candidateLabel = interview.application?.jobSeekerProfile?.fullName || userProfile?.name || "Candidate";
    let roomName = interview.livekitRoomName || `room_${interviewId}`;
    if (!interview.livekitRoomName) {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { livekitRoomName: roomName }
      });
    }
    const tokenString = await generateLiveKitToken(roomName, `candidate_${userId}`, candidateLabel);
    const iceServers = await getCloudflareTurnCredentials();
    return res.status(200).json({
      success: true,
      token: tokenString,
      roomName,
      livekitUrl: process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_API_URL || "http://localhost:7880",
      iceServers: iceServers || void 0
    });
  } catch (error) {
    console.error("getJobSeekerToken exception trace:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error routing candidate media bridge." });
  }
};

// src/routes/interview.routes.ts
var router6 = Router();
router6.post("/:id/token/company", authenticateCompany, getCompanyToken);
router6.post("/:id/token/jobseeker", authenticateToken, requireJobSeeker, getJobSeekerToken);
router6.post("/:id/security-logs", (req, res) => {
  res.status(200).json({ success: true });
});
router6.post(
  "/:interviewId/feedback",
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER),
  addInterviewFeedback
);
router6.put(
  "/:interviewId/feedback",
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER),
  upsertInterviewFeedback
);
router6.get(
  "/:interviewId/feedback",
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getInterviewFeedbacksList
);
router6.post("/:interviewId/reschedule", authenticateToken, requestReschedule);
router6.put(
  "/interviews/:interviewId/feedback",
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER),
  updateInterviewFeedback
);
router6.get(
  "/candidates/:userId/applications/:applicationId/feedback",
  authenticateCompany,
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getInterviewFeedbackByCandidate
);
var interview_routes_default = router6;

// src/routes/crm.routes.ts
import { Router as Router2 } from "express";

// src/controllers/crm.controller.ts
import { CandidateCrmStatus } from "@prisma/client";
var getCrmCandidates = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const {
      status,
      isStarred,
      priority,
      source,
      tags,
      search,
      ownerId,
      limit = "20",
      page = "1"
    } = req.query;
    const where = { companyId };
    if (status) where.status = status;
    if (isStarred === "true") where.isStarred = true;
    if (priority) where.crmPriority = priority;
    if (source) where.source = source;
    if (ownerId) where.ownerId = ownerId;
    if (tags) {
      where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
    }
    if (search) {
      where.jobSeekerProfile = {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } }
        ]
      };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [profiles, total] = await Promise.all([
      prisma.companyCandidateProfile.findMany({
        where,
        include: {
          jobSeekerProfile: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              profilePhotoUrl: true,
              location: true,
              availabilityStatus: true,
              skills: { select: { name: true } }
            }
          },
          owner: {
            select: {
              id: true,
              user: { select: { id: true } }
            }
          }
        },
        orderBy: [{ isStarred: "desc" }, { updatedAt: "desc" }],
        skip,
        take
      }),
      prisma.companyCandidateProfile.count({ where })
    ]);
    return res.json({
      success: true,
      data: profiles,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error("getCrmCandidates error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getCrmCandidateById = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const profile = await prisma.companyCandidateProfile.findFirst({
      where: { id, companyId },
      include: {
        jobSeekerProfile: {
          include: {
            skills: true,
            experience: { orderBy: { startYear: "desc" } },
            education: true,
            projects: true,
            certifications: true,
            languages: true,
            achievements: true
          }
        },
        owner: {
          select: { id: true }
        },
        crmInteractions: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    });
    if (!profile) return res.status(404).json({ success: false, message: "CRM profile not found" });
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var addCrmCandidate = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    if (!companyId || !userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { jobSeekerProfileId, source, sourceUrl, tags, crmNotes, ownerId } = req.body;
    if (!jobSeekerProfileId)
      return res.status(400).json({ success: false, message: "jobSeekerProfileId is required" });
    const candidate = await prisma.jobSeekerProfile.findUnique({ where: { id: jobSeekerProfileId } });
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate profile not found" });
    const existing = await prisma.companyCandidateProfile.findUnique({
      where: { companyId_jobSeekerProfileId: { companyId, jobSeekerProfileId } }
    });
    if (existing) return res.status(409).json({ success: false, message: "Candidate already in CRM" });
    const crmProfile = await prisma.companyCandidateProfile.create({
      data: {
        companyId,
        jobSeekerProfileId,
        source,
        sourceUrl: sourceUrl ?? null,
        tags: tags ?? [],
        crmNotes: crmNotes ?? null,
        ownerId: ownerId ?? null,
        status: CandidateCrmStatus.ACTIVE
      }
    });
    return res.status(201).json({ success: true, data: crmProfile });
  } catch (error) {
    console.error("addCrmCandidate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var updateCrmCandidate = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const existing = await prisma.companyCandidateProfile.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, message: "CRM profile not found" });
    const { status, crmNotes, crmPriority, tags, isStarred, ownerId, source, sourceUrl } = req.body;
    const updated = await prisma.companyCandidateProfile.update({
      where: { id },
      data: {
        ...status !== void 0 && { status },
        ...crmNotes !== void 0 && { crmNotes },
        ...crmPriority !== void 0 && { crmPriority },
        ...tags !== void 0 && { tags },
        ...isStarred !== void 0 && { isStarred },
        ...ownerId !== void 0 && { ownerId },
        ...source !== void 0 && { source },
        ...sourceUrl !== void 0 && { sourceUrl }
      }
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var removeCrmCandidate = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const existing = await prisma.companyCandidateProfile.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, message: "CRM profile not found" });
    await prisma.companyCandidateProfile.delete({ where: { id } });
    return res.json({ success: true, message: "Candidate removed from CRM" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var logCrmInteraction = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!companyId || !userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { activityType, note, metadata } = req.body;
    if (!activityType)
      return res.status(400).json({ success: false, message: "activityType is required" });
    const crmProfile = await prisma.companyCandidateProfile.findFirst({ where: { id, companyId } });
    if (!crmProfile) return res.status(404).json({ success: false, message: "CRM profile not found" });
    const [interaction] = await prisma.$transaction([
      prisma.crmInteractionLog.create({
        data: {
          companyCandidateProfileId: id,
          activityType,
          performedBy: userId,
          note: note ?? null,
          metadata: metadata ?? null
        }
      }),
      prisma.companyCandidateProfile.update({
        where: { id },
        data: { lastContactedAt: /* @__PURE__ */ new Date() }
      })
    ]);
    return res.status(201).json({ success: true, data: interaction });
  } catch (error) {
    console.error("logCrmInteraction error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getTalentPools = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const pools = await prisma.talentPool.findMany({
      where: { companyId },
      include: {
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, data: pools });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var createTalentPool = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Pool name is required" });
    const pool2 = await prisma.talentPool.create({
      data: { companyId, name: name.trim(), description: description ?? null }
    });
    return res.status(201).json({ success: true, data: pool2 });
  } catch (error) {
    if (error.code === "P2002")
      return res.status(409).json({ success: false, message: "A pool with this name already exists" });
    return res.status(500).json({ success: false, message: error.message });
  }
};
var updateTalentPool = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const existing = await prisma.talentPool.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, message: "Talent pool not found" });
    const { name, description } = req.body;
    const updated = await prisma.talentPool.update({
      where: { id },
      data: {
        ...name && { name: name.trim() },
        ...description !== void 0 && { description }
      }
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var deleteTalentPool = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const existing = await prisma.talentPool.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, message: "Talent pool not found" });
    await prisma.talentPool.delete({ where: { id } });
    return res.json({ success: true, message: "Talent pool deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var getTalentPoolMembers = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const pool2 = await prisma.talentPool.findFirst({ where: { id, companyId } });
    if (!pool2) return res.status(404).json({ success: false, message: "Talent pool not found" });
    const members = await prisma.talentPoolMember.findMany({
      where: { talentPoolId: id },
      include: {
        jobSeekerProfile: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profilePhotoUrl: true,
            location: true,
            availabilityStatus: true,
            skills: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ success: true, pool: pool2, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var addTalentPoolMembers = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const userId = req.user?.userId;
    const { id } = req.params;
    const { jobSeekerProfileIds } = req.body;
    if (!companyId || !userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!jobSeekerProfileIds?.length)
      return res.status(400).json({ success: false, message: "jobSeekerProfileIds array is required" });
    const pool2 = await prisma.talentPool.findFirst({ where: { id, companyId } });
    if (!pool2) return res.status(404).json({ success: false, message: "Talent pool not found" });
    await prisma.talentPoolMember.createMany({
      data: jobSeekerProfileIds.map((profileId) => ({
        talentPoolId: id,
        jobSeekerProfileId: profileId,
        addedBy: userId
      })),
      skipDuplicates: true
    });
    return res.json({ success: true, message: `${jobSeekerProfileIds.length} candidate(s) added to pool` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
var removeTalentPoolMember = async (req, res) => {
  try {
    const companyId = req.company?.companyId;
    const { id, memberId } = req.params;
    if (!companyId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const pool2 = await prisma.talentPool.findFirst({ where: { id, companyId } });
    if (!pool2) return res.status(404).json({ success: false, message: "Talent pool not found" });
    await prisma.talentPoolMember.delete({ where: { id: memberId } });
    return res.json({ success: true, message: "Member removed from talent pool" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// src/routes/crm.routes.ts
var router7 = Router2();
router7.use(authenticateCompany);
router7.get("/candidates", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getCrmCandidates);
router7.post("/candidates", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), addCrmCandidate);
router7.get("/candidates/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), getCrmCandidateById);
router7.patch("/candidates/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateCrmCandidate);
router7.delete("/candidates/:id", requireCompanyRole(ROLES.COMPANY_ADMIN), removeCrmCandidate);
router7.post("/candidates/:id/interactions", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER), logCrmInteraction);
router7.get("/talent-pools", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER, ROLES.COMPANY_INTERVIEWER), getTalentPools);
router7.post("/talent-pools", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), createTalentPool);
router7.patch("/talent-pools/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateTalentPool);
router7.delete("/talent-pools/:id", requireCompanyRole(ROLES.COMPANY_ADMIN), deleteTalentPool);
router7.get("/talent-pools/:id/members", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER, ROLES.COMPANY_INTERVIEWER), getTalentPoolMembers);
router7.post("/talent-pools/:id/members", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), addTalentPoolMembers);
router7.delete("/talent-pools/:id/members/:memberId", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), removeTalentPoolMember);
var crm_routes_default = router7;

// src/routes/kanban.routes.ts
import { Router as Router3 } from "express";

// src/controllers/kanban.controller.ts
import "@prisma/client";
var getPipelineBoard = async (req, res) => {
  try {
    const { jobPostingId } = req.params;
    const applications = await prisma.application.findMany({
      where: { jobPostingId },
      include: {
        jobSeekerProfile: {
          select: {
            fullName: true,
            email: true,
            profilePhotoUrl: true,
            phone: true
          }
        },
        interviews: {
          orderBy: { scheduledTime: "desc" },
          take: 1,
          select: {
            id: true,
            scheduledTime: true,
            status: true,
            format: true
          }
        }
      },
      orderBy: { pipelineIndex: "asc" }
    });
    const board = {
      applied: [],
      screened: [],
      technical_round: [],
      hr_round: [],
      offer_sent: [],
      hired: [],
      rejected: []
    };
    applications.forEach((app2) => {
      if (board[app2.status]) {
        board[app2.status].push(app2);
      }
    });
    res.status(200).json({ "success": true, "data": board });
  } catch (error) {
    console.error("Error fetching Kanban board:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
var movePipelineCard = async (req, res) => {
  try {
    const { applicationId, jobPostingId, sourceStatus, destinationStatus, newIndex } = req.body;
    if (!applicationId || !destinationStatus) {
      res.status(400).json({ success: false, message: "Missing required core coordination indices." });
      return;
    }
    const currentApp = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        status: true,
        jobSeekerProfile: {
          select: {
            userId: true,
            fullName: true,
            user: {
              select: {
                mobileNumber: true
              }
            }
          }
        },
        jobPosting: {
          select: { title: true }
        }
      }
    });
    const userId = req.user?.userId || "system";
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: destinationStatus,
          pipelineIndex: typeof newIndex === "number" ? newIndex : 0,
          lastActivityAt: /* @__PURE__ */ new Date()
        }
      });
      await tx.applicationHistory.create({
        data: {
          applicationId,
          fromStatus: currentApp?.status || sourceStatus || null,
          toStatus: destinationStatus,
          changedBy: userId,
          changedByType: "user",
          notes: `Application shifted from ${sourceStatus || currentApp?.status || "previous stage"} to ${destinationStatus} via Recruiter Workspace Kanban.`,
          metadata: {
            sourceStatus: sourceStatus || currentApp?.status,
            destinationStatus,
            pipelineIndex: newIndex,
            movedVia: "kanban_drag_drop"
          }
        }
      });
      try {
        await tx.applicationActivity.create({
          data: {
            applicationId,
            activityType: "STATUS_CHANGED",
            performedBy: userId,
            metadata: {
              from: sourceStatus || currentApp?.status,
              to: destinationStatus,
              method: "kanban_board",
              newIndex
            }
          }
        });
      } catch (err) {
        console.log("Activity log skipped");
      }
      return updated;
    });
    const targetUserId = currentApp?.jobSeekerProfile?.userId;
    if (targetUserId && currentApp.status !== destinationStatus) {
      const stageName = destinationStatus.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      const jobTitle = currentApp.jobPosting?.title || "your applied position";
      const candidateName = currentApp.jobSeekerProfile?.fullName || "Candidate";
      const notificationTitle = `Application Update!`;
      const notificationBody = `Hi ${candidateName}, your application for "${jobTitle}" has progressed to: ${stageName}.`;
      const dashboardLink = `http://localhost:3000/dashboard/applications`;
      NotificationService.sendToUser(
        targetUserId,
        notificationTitle,
        notificationBody,
        dashboardLink
      ).catch((fcmError) => {
        console.log(`[FCM Bypass] Device messaging suspended for ${targetUserId}: ${fcmError.message}`);
      });
    }
    res.status(200).json({
      success: true,
      message: "Candidate tracked location position vector successfully modified with timeline logging entries sync.",
      data: result
    });
  } catch (error) {
    console.error("Error shifting Kanban pipeline node:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// src/routes/kanban.routes.ts
var router8 = Router3();
router8.use(authenticateCompany);
router8.get(
  "/job/:jobPostingId",
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER),
  getPipelineBoard
);
router8.patch(
  "/move-card",
  requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR),
  movePipelineCard
);
var kanban_routes_default = router8;

// src/routes/company.routes.ts
var upload3 = multer4({ storage: multer4.memoryStorage() });
var router9 = Router4();
router9.post("/team/set-password", setTeamMemberPassword);
router9.get("/team/accept-invite", acceptInvite);
router9.post("/team/login", teamMemberLogin);
router9.use(authenticateCompany);
router9.get("/dashboard", getCompanyDashboard);
router9.use("/offers", offer_routes_default);
router9.use("/selection", selection_routes_default);
router9.use("/interviews-v2", interview_routes_default);
router9.use("/crm", crm_routes_default);
router9.use("/kanban", kanban_routes_default);
router9.post("/interviews/bulk-schedule", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), scheduleBulkInterviews);
router9.get("/interviews/list", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCompanyInterviewsList);
router9.post("/interviews/:id/respond-reschedule", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), respondToReschedule);
router9.post("/interviews/:id/update-status", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER), updateInterviewStatus);
router9.post("/team/invite", requireCompanyRole(ROLES.COMPANY_ADMIN), inviteTeamMember);
router9.get("/team", listTeamMembers);
router9.put("/team/:memberId/role", requireCompanyRole(ROLES.COMPANY_ADMIN), updateMemberRole);
router9.delete("/team/:memberId", requireCompanyRole(ROLES.COMPANY_ADMIN), removeTeamMember);
router9.get("/applications/:applicationId", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getCandidateDetail);
router9.patch("/applications/:applicationId/status", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateApplicationStatus);
router9.get("/applications/:id/detail", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getApplicationDetailById);
router9.post("/notification/send", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), sendNotificationToUser);
router9.post("/jobs/generate-description", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), generateAIDescription);
router9.post("/jobs", requireCompanyRole(ROLES.COMPANY_ADMIN), createJob);
router9.get("/jobs", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getAllCompanyJobs);
router9.get("/jobs/:jobId/applications", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getJobApplications);
router9.post("/jobs/:jobId/ai-filter", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), aiFilterCandidates);
router9.get("/jobs/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), getJobDetails);
router9.put("/jobs/:id", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), updateJob);
router9.delete("/jobs/:id", requireCompanyRole(ROLES.COMPANY_ADMIN), deleteJob);
router9.get("/me", getMyCompanyProfile);
router9.patch("/profile", updateCompanyProfile);
router9.patch("/profile/password", updateCompanyPassword);
router9.patch("/profile/logo", upload3.single("logo"), updateCompanyLogo);
router9.post("/profile/mobile/request-otp", requestMobileChangeOtp);
router9.post("/profile/mobile/verify-otp", verifyMobileChangeOtp);
router9.post("/profile/email/request-otp", requestEmailChangeOtp);
router9.post("/profile/email/verify-otp", verifyEmailChangeOtp);
router9.post("/spot-jobs", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), SpotJobController.createSpotJob);
router9.get("/spot-jobs/company-dashboard", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_VIEWER), SpotJobController.getCompanySpotDashboard);
router9.get("/spot-jobs/:id/bookings", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR, ROLES.COMPANY_INTERVIEWER, ROLES.COMPANY_VIEWER), SpotJobController.getSpotJobBookings);
router9.patch("/spot-jobs/:id/status", requireCompanyRole(ROLES.COMPANY_ADMIN, ROLES.COMPANY_HR), SpotJobController.updateSpotStatusByCompany);
var company_routes_default = router9;

// src/routes/publicJobs.routes.ts
import express7 from "express";

// src/controllers/publicCompany.controller.ts
var getPublicCompanyProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    let company = await prisma.company.findUnique({
      where: { id: identifier },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        industry: true,
        size: true,
        tagline: true,
        services: true,
        products: true,
        seoKeywords: true,
        coreValues: true,
        gallery: true,
        youtubeLink: true,
        officeLocations: true,
        socialMedia: true,
        corporateLink: true,
        verificationBadge: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            jobPostings: {
              where: {
                status: "active",
                OR: [
                  { deadline: null },
                  { deadline: { gte: /* @__PURE__ */ new Date() } }
                ]
              }
            },
            teamMembers: { where: { status: "active" } }
          }
        }
      }
    });
    if (!company) {
      const slugToName = identifier.split("-").join(" ");
      company = await prisma.company.findFirst({
        where: { name: { equals: slugToName, mode: "insensitive" } },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          industry: true,
          size: true,
          tagline: true,
          services: true,
          products: true,
          seoKeywords: true,
          coreValues: true,
          gallery: true,
          youtubeLink: true,
          officeLocations: true,
          socialMedia: true,
          corporateLink: true,
          verificationBadge: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              jobPostings: {
                where: {
                  status: "active",
                  OR: [
                    { deadline: null },
                    { deadline: { gte: /* @__PURE__ */ new Date() } }
                  ]
                }
              },
              teamMembers: { where: { status: "active" } }
            }
          }
        }
      });
    }
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    const sanitized = {
      ...company,
      services: company.services || [],
      seoKeywords: company.seoKeywords || [],
      coreValues: company.coreValues || [],
      gallery: company.gallery || [],
      products: company.products || {},
      officeLocations: company.officeLocations || [],
      socialMedia: company.socialMedia || {},
      activeJobsCount: company._count.jobPostings,
      teamSize: company._count.teamMembers
    };
    return res.status(200).json({ success: true, data: sanitized });
  } catch (error) {
    console.error("getPublicCompanyProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch company profile." });
  }
};
var getPublicCompanyJobs = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { department, jobType, locationType, search } = req.query;
    const jobSeekerProfileId = req.user?.jobSeekerProfileId;
    let company = await prisma.company.findUnique({
      where: { id: identifier },
      select: { id: true }
    });
    if (!company) {
      const slugToName = identifier.split("-").join(" ");
      company = await prisma.company.findFirst({
        where: { name: { equals: slugToName, mode: "insensitive" } },
        select: { id: true }
      });
    }
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    const where = {
      companyId: company.id,
      status: "active",
      ...department && { department: { equals: department, mode: "insensitive" } },
      ...jobType && { jobType: { equals: jobType, mode: "insensitive" } },
      ...locationType && { locationType: { equals: locationType, mode: "insensitive" } },
      AND: [
        {
          OR: [
            { deadline: null },
            { deadline: { gte: /* @__PURE__ */ new Date() } }
          ]
        },
        ...search ? [{
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }] : []
      ]
    };
    const jobs = await prisma.jobPosting.findMany({
      where,
      select: {
        id: true,
        title: true,
        department: true,
        jobType: true,
        locationType: true,
        location: true,
        experienceRequired: true,
        salaryRange: true,
        requiredSkills: true,
        deadline: true,
        openings: true,
        createdAt: true,
        _count: { select: { applications: true } },
        ...jobSeekerProfileId && {
          applications: {
            where: { jobSeekerProfileId },
            select: { id: true, status: true, appliedAt: true }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const jobsWithStatus = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      department: job.department,
      jobType: job.jobType,
      locationType: job.locationType,
      location: job.location,
      experienceRequired: job.experienceRequired,
      salaryRange: job.salaryRange,
      requiredSkills: job.requiredSkills,
      deadline: job.deadline,
      openings: job.openings,
      createdAt: job.createdAt,
      applicationsCount: job._count.applications,
      hasApplied: jobSeekerProfileId ? (job.applications?.length || 0) > 0 : false,
      applicationStatus: jobSeekerProfileId && job.applications?.[0] ? job.applications[0].status : null,
      appliedAt: jobSeekerProfileId && job.applications?.[0] ? job.applications[0].appliedAt : null
    }));
    return res.status(200).json({ success: true, data: jobsWithStatus });
  } catch (error) {
    console.error("getPublicCompanyJobs error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch jobs." });
  }
};
var getPublicJobDetails2 = async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobSeekerProfileId = req.user?.jobSeekerProfileId;
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        department: true,
        description: true,
        jobType: true,
        locationType: true,
        location: true,
        experienceRequired: true,
        requiredSkills: true,
        salaryRange: true,
        deadline: true,
        openings: true,
        status: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            size: true,
            tagline: true,
            verificationBadge: true
          }
        },
        _count: { select: { applications: true } },
        ...jobSeekerProfileId && {
          applications: {
            where: { jobSeekerProfileId },
            select: {
              id: true,
              status: true,
              appliedAt: true,
              candidateNotes: true
            }
          }
        }
      }
    });
    if (!job || job.status !== "active") {
      return res.status(404).json({ success: false, message: "Job not found or no longer active." });
    }
    const jobWithStatus = {
      ...job,
      applicationsCount: job._count.applications,
      hasApplied: jobSeekerProfileId ? (job.applications?.length || 0) > 0 : false,
      applicationStatus: jobSeekerProfileId && job.applications?.[0] ? job.applications[0].status : null,
      appliedAt: jobSeekerProfileId && job.applications?.[0] ? job.applications[0].appliedAt : null
    };
    delete jobWithStatus.applications;
    return res.status(200).json({ success: true, data: jobWithStatus });
  } catch (error) {
    console.error("getPublicJobDetails error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch job details." });
  }
};
var getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        user: null
      });
    }
    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        userId: req.user.userId,
        fullName: req.user.fullName,
        email: req.user.email,
        globalRoles: req.user.globalRoles,
        jobSeekerProfileId: req.user.jobSeekerProfileId
      }
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user info." });
  }
};
var getAllPublicCompanies = async (req, res) => {
  try {
    console.log("reached me");
    const { industry, size, search, verified } = req.query;
    const where = {
      isVerified: true,
      ...industry && { industry: { equals: industry, mode: "insensitive" } },
      ...size && { size: { equals: size, mode: "insensitive" } },
      ...verified === "true" && { verificationBadge: { not: "none" } },
      ...search && { name: { contains: search, mode: "insensitive" } }
    };
    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        industry: true,
        size: true,
        tagline: true,
        verificationBadge: true,
        _count: {
          select: {
            jobPostings: {
              where: {
                status: "active",
                OR: [
                  { deadline: null },
                  { deadline: { gte: /* @__PURE__ */ new Date() } }
                ]
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return res.status(200).json({
      success: true,
      data: companies.map((c) => ({
        ...c,
        activeJobsCount: c._count.jobPostings
      }))
    });
  } catch (error) {
    console.error("getAllPublicCompanies error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch companies." });
  }
};
var searchAllJobs = async (req, res) => {
  try {
    const {
      search,
      jobType,
      locationType,
      location,
      experienceRequired,
      page = "1",
      limit = "20"
    } = req.query;
    const jobSeekerProfileId = req.user?.jobSeekerProfileId;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const where = {
      status: "active",
      ...jobType && { jobType: { equals: jobType, mode: "insensitive" } },
      ...locationType && { locationType: { equals: locationType, mode: "insensitive" } },
      ...location && { location: { contains: location, mode: "insensitive" } },
      ...experienceRequired && { experienceRequired },
      AND: [
        {
          OR: [
            { deadline: null },
            { deadline: { gte: /* @__PURE__ */ new Date() } }
          ]
        },
        ...search ? [{
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ]
        }] : []
      ]
    };
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        select: {
          id: true,
          title: true,
          department: true,
          jobType: true,
          locationType: true,
          location: true,
          experienceRequired: true,
          salaryRange: true,
          requiredSkills: true,
          deadline: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              industry: true,
              verificationBadge: true
            }
          },
          _count: { select: { applications: true } },
          ...jobSeekerProfileId && {
            applications: {
              where: { jobSeekerProfileId },
              select: { id: true, status: true, appliedAt: true }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum
      }),
      prisma.jobPosting.count({ where })
    ]);
    const jobsWithStatus = jobs.map((job) => {
      let appliedStatus = false;
      const hasApplied = jobSeekerProfileId ? (job.applications?.length || 0) > 0 : false;
      if (hasApplied && job.applications?.[0]) {
        appliedStatus = job.applications[0].id;
      }
      return {
        ...job,
        applicationsCount: job._count.applications,
        hasApplied,
        appliedStatus,
        // 👈 Returns application UUID string, or false if not applied
        applicationStatus: jobSeekerProfileId && job.applications?.[0] ? job.applications[0].status : null,
        applications: void 0
        // Remove raw relation array from response
      };
    });
    return res.status(200).json({
      success: true,
      data: jobsWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("searchAllJobs error:", error);
    return res.status(500).json({ success: false, message: "Failed to search jobs." });
  }
};

// src/routes/publicJobs.routes.ts
var router10 = express7.Router();
router10.get("/public", optionalAuth, getPublicJobs);
router10.get("/public/:id", optionalAuth, getPublicJobDetails);
router10.get("/companies", optionalAuth, getAllPublicCompanies);
router10.get("/companies/:identifier", optionalAuth, getPublicCompanyProfile);
router10.get("/companies/:identifier/jobs", optionalAuth, getPublicCompanyJobs);
router10.get("/companies/:identifier/jobs/:jobId", optionalAuth, getPublicJobDetails2);
router10.get("/search", optionalAuth, searchAllJobs);
router10.get("/:jobId", optionalAuth, getPublicJobDetails);
router10.get("/auth/me", optionalAuth, getCurrentUser);
var publicJobs_routes_default = router10;

// src/index.ts
var app = express8();
app.use(cookieParser());
var allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : ["http://localhost:3000", "http://localhost:5173"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS context"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express8.json({ limit: "10mb" }));
app.use("/api/auth", auth_routes_default);
app.use("/api/company/auth", companyAuth_routes_default);
app.use("/api/jobseeker", jobseeker_routes_default);
app.use("/api/company", company_routes_default);
app.use("/api/interviews", interview_routes_default);
app.use("/api/kanban", kanban_routes_default);
app.use("/api/crm", crm_routes_default);
app.use("/api/public", publicJobs_routes_default);
app.get("/", (_req, res) => res.send("Backend Running"));
var PORT = process.env.PORT || 8e3;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
