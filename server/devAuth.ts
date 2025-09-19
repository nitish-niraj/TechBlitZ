import type { Express, RequestHandler } from "express";
import express from "express";
import { storage } from "./storage";

// Mock session middleware for development
export function getSession() {
  return express.json(); // Just a placeholder middleware
}

// Mock authentication middleware for development
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // In development mode, always authenticate
  // Set up mock user for development
  const userType = req.query.userType || 'admin';
  
  if (userType === 'admin') {
    req.user = {
      claims: {
        sub: "dev-user-123"
      }
    };
  } else {
    req.user = {
      claims: {
        sub: "dev-user-456"
      }
    };
  }
  
  return next();
};

// Mock user setup - create admin user if doesn't exist
async function ensureDevUser() {
  try {
    // Try to create dev admin user
    const devUser = {
      id: "dev-user-123",
      email: "admin@university.edu",
      firstName: "Admin",
      lastName: "User",
      role: "admin" as "admin",
      profileImageUrl: null,
      departmentId: null,
      studentId: "ADMIN123",
    };
    
    // Add dev user to storage if possible
    try {
      await storage.upsertUser(devUser);
      console.log("Created development admin user");
    } catch (err) {
      // User might already exist, that's fine
      console.log("Admin user might already exist:", err);
    }
    
    // Also create a student user for testing
    const studentUser = {
      id: "dev-user-456",
      email: "student@university.edu",
      firstName: "Student",
      lastName: "User",
      role: "student" as "student",
      profileImageUrl: null,
      departmentId: null,
      studentId: "STUDENT456",
    };
    
    try {
      await storage.upsertUser(studentUser);
      console.log("Created development student user");
    } catch (err) {
      // User might already exist, that's fine
      console.log("Student user might already exist:", err);
    }
    
    // Create a sample department
    try {
      await storage.createDepartment({
        name: "Computer Science",
        description: "Department of Computer Science and Engineering",
      });
      console.log("Created sample department");
    } catch (err) {
      // Department might already exist, that's fine
    }
  } catch (err) {
    console.error("Error setting up development users:", err);
  }
}

// Setup auth-related routes and middleware for development
export async function setupAuth(app: Express) {
  console.log("Setting up development authentication system");
  
  // Create development users
  await ensureDevUser();
  
  // Setup routes for development auth
  app.get("/api/login", (req, res) => {
    const userType = req.query.userType || 'admin';
    // Redirect to home with userType in query param
    res.redirect(`/?userType=${userType}`);
  });
  
  // Mock user data endpoint
  app.get('/api/auth/user', (req: any, res) => {
    const userType = req.query.userType || 'admin';
    
    if (userType === 'admin') {
      res.json({
        id: "dev-user-123",
        email: "admin@university.edu",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        profileImageUrl: null,
        departmentId: null,
        studentId: "ADMIN123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      res.json({
        id: "dev-user-456",
        email: "student@university.edu",
        firstName: "Student",
        lastName: "User",
        role: "student",
        profileImageUrl: null,
        departmentId: null,
        studentId: "STUDENT456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  app.get("/api/logout", (req, res) => {
    // Simulate clearing session by sending no user data
    res.clearCookie && res.clearCookie('connect.sid'); // If using cookies
    // Optionally, you could set a flag in localStorage via frontend
    res.redirect("/?loggedOut=true"); // Redirect to landing page with a flag
  });
}