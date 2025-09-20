import express, { type Express, type RequestHandler } from "express";
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
  } else if (userType === 'student') {
    req.user = {
      claims: {
        sub: "dev-user-456"
      }
    };
  } else if (userType === 'staff') {
    req.user = {
      claims: {
        sub: "dev-user-789"
      }
    };
  } else {
    // Default to student for any other case
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

    // Also create a staff user for testing
    const staffUser = {
      id: "dev-user-789",
      email: "staff@university.edu",
      firstName: "Staff",
      lastName: "Member",
      role: "staff" as "staff",
      profileImageUrl: null,
      departmentId: null, // Will be set later when departments are created
      studentId: null,
    };
    
    try {
      await storage.upsertUser(staffUser);
      console.log("Created development staff user");
    } catch (err) {
      // User might already exist, that's fine
      console.log("Staff user might already exist:", err);
    }
    
    // Create sample departments
    const departments = [
      {
        name: "Computer Science",
        description: "Department of Computer Science and Engineering"
      },
      {
        name: "Electrical Engineering", 
        description: "Department of Electrical and Electronics Engineering"
      },
      {
        name: "Mechanical Engineering",
        description: "Department of Mechanical Engineering"
      },
      {
        name: "Civil Engineering",
        description: "Department of Civil Engineering"
      },
      {
        name: "Student Affairs",
        description: "Office of Student Affairs and Campus Life"
      },
      {
        name: "Academic Affairs",
        description: "Office of Academic Affairs and Curriculum"
      },
      {
        name: "Administration",
        description: "General Administration and Management"
      },
      {
        name: "IT Services",
        description: "Information Technology and Digital Services"
      },
      {
        name: "Library Services",
        description: "Central Library and Information Resources"
      },
      {
        name: "Hostel Management",
        description: "Student Housing and Accommodation Services"
      },
      {
        name: "Food Services",
        description: "Cafeteria and Dining Services Management"
      },
      {
        name: "Sports & Recreation",
        description: "Sports Complex and Recreational Activities"
      }
    ];

    for (const dept of departments) {
      try {
        const department = await storage.createDepartment(dept);
        console.log(`Created department: ${dept.name}`);
        
        // Assign staff member to Computer Science department as head
        if (dept.name === "Computer Science") {
          try {
            // Update staff user to be assigned to Computer Science department
            await storage.upsertUser({
              id: "dev-user-789",
              email: "staff@university.edu",
              firstName: "Staff",
              lastName: "Member",
              role: "staff" as "staff",
              profileImageUrl: null,
              departmentId: department.id,
              studentId: null,
            });
            console.log("Assigned staff member to Computer Science department");
          } catch (err) {
            console.log("Error assigning staff to department:", err);
          }
        }
      } catch (err) {
        // Department might already exist, that's fine
      }
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
    const userType = req.query.userType || 'student';
    // Redirect to home with userType in query param
    res.redirect(`/?userType=${userType}`);
  });

  // Handle POST login requests
  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body;
    let userType = 'student';
    
    if (email === 'admin@university.edu') {
      userType = 'admin';
    } else if (email === 'staff@university.edu') {
      userType = 'staff';
    } else if (email === 'student@university.edu') {
      userType = 'student';
    }
    
    // Return success response
    res.json({ success: true, userType });
  });
  
  // Mock user data endpoint
  app.get('/api/auth/user', (req: any, res) => {
    const userType = req.query.userType || 'student';
    
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
    } else if (userType === 'staff') {
      res.json({
        id: "dev-user-789",
        email: "staff@university.edu",
        firstName: "Staff",
        lastName: "Member",
        role: "staff",
        profileImageUrl: null,
        departmentId: "dept-cs-001", // Assign to Computer Science department
        studentId: null,
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