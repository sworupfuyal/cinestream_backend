// src/__tests__/integration/admin.test.ts

import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { UserModel } from "../../models/user.model";
import { UserProfileModel } from "../../models/user.profile.model";

let adminToken: string;
let createdUserId: string;

describe("Admin Integration Tests (Authenticated)", () => {
  beforeAll(async () => {
    // Connect to DB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI as string);
    }

    // Clean up both users AND profiles
    await UserModel.deleteMany({ 
      email: { $in: ["admin@example.com", "testuser@example.com"] } 
    });
    await UserProfileModel.deleteMany({ 
      email: { $in: ["admin@example.com", "testuser@example.com"] } 
    });

    // Register admin user
    await request(app)
      .post("/api/auth/register")
      .send({
        fullname: "Admin User",
        email: "admin@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

    // Update user role to admin
    await UserModel.updateOne(
      { email: "admin@example.com" },
      { $set: { role: "admin" } }
    );

    // Login as admin to get JWT token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ 
        email: "admin@example.com", 
        password: "password123" 
      });

    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await UserModel.deleteMany({ 
      email: { $in: ["admin@example.com", "testuser@example.com"] } 
    });
    await UserProfileModel.deleteMany({ 
      email: { $in: ["admin@example.com", "testuser@example.com"] } 
    });
    await mongoose.connection.close();
  });

  describe("POST /api/admin/users", () => {
    it("should create a new user with profile", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullname", "Test User")
        .field("email", "testuser@example.com")
        .field("password", "password123")
        .field("confirmPassword", "password123")
        .field("role", "user");

      // Debug output on failure
      if (res.status !== 201) {
        console.error("❌ Create user failed:");
        console.error("Status:", res.status);
        console.error("Response:", JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.email).toBe("testuser@example.com");
      expect(res.body.data.fullname).toBe("Test User");
      expect(res.body.data.role).toBe("user");
      expect(res.body.data.password).toBeUndefined(); // Password should not be returned

      createdUserId = res.body.data._id;

      // Verify user was created in database
      const user = await UserModel.findById(createdUserId);
      expect(user).toBeDefined();
      expect(user?.email).toBe("testuser@example.com");

      // Verify profile was created with correct email
      const profile = await UserProfileModel.findOne({ userId: createdUserId });
      expect(profile).toBeDefined();
      expect(profile?.email).toBe("testuser@example.com");
      expect(profile?.fullName).toBe("Test User");
    });

    it("should not create user with duplicate email", async () => {
      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullname", "Duplicate User")
        .field("email", "testuser@example.com") // Same email as previous test
        .field("password", "password123")
        .field("confirmPassword", "password123")
        .field("role", "user");

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });

    it("should create user with optional profile fields", async () => {
      // Clean up first
      await UserModel.deleteMany({ email: "userwithlocation@example.com" });
      await UserProfileModel.deleteMany({ email: "userwithlocation@example.com" });

      const res = await request(app)
        .post("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullname", "User With Location")
        .field("email", "userwithlocation@example.com")
        .field("password", "password123")
        .field("confirmPassword", "password123")
        .field("role", "user")
        .field("phoneNumber", "+1234567890")
        .field("userLocation", "New York, USA");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const userId = res.body.data._id;

      // Verify profile has the additional fields
      const profile = await UserProfileModel.findOne({ userId });
      expect(profile?.phoneNumber).toBe("+1234567890");
      expect(profile?.userLocation).toBe("New York, USA");

      // Cleanup
      await UserModel.deleteOne({ _id: userId });
      await UserProfileModel.deleteOne({ userId });
    });
  });

  describe("GET /api/admin/users", () => {
    it("should fetch all users with pagination", async () => {
      const res = await request(app)
        .get("/api/admin/users?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.currentPage).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/admin/users?role=admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // All returned users should have admin role
      res.body.data.forEach((user: any) => {
        expect(user.role).toBe("admin");
      });
    });

    it("should search users by email or fullname", async () => {
      const res = await request(app)
        .get("/api/admin/users?search=test")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/admin/users/:id", () => {
    it("should fetch user by id with profile", async () => {
      if (!createdUserId) {
        console.warn("⚠️ Skipping: createdUserId is undefined");
        return;
      }

      const res = await request(app)
        .get(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Debug output on failure
      if (res.status !== 200) {
        console.error("❌ Fetch user by ID failed:");
        console.error("Status:", res.status);
        console.error("Response:", JSON.stringify(res.body, null, 2));
        console.error("UserId:", createdUserId);
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(createdUserId);
      expect(res.body.data.email).toBe("testuser@example.com");
      expect(res.body.data.password).toBeUndefined();
      // Profile should be included
      expect(res.body.data.profile).toBeDefined();
    });

    it("should return 400 for invalid user id", async () => {
      const res = await request(app)
        .get("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/admin/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not found");
    });
  });

  describe("PUT /api/admin/users/:id", () => {
    it("should update user fullname", async () => {
      if (!createdUserId) {
        console.warn("⚠️ Skipping: createdUserId is undefined");
        return;
      }

      const res = await request(app)
        .put(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullname", "Updated Test User");

      // Debug output on failure
      if (res.status !== 200) {
        console.error("❌ Update user failed:");
        console.error("Status:", res.status);
        console.error("Response:", JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullname).toBe("Updated Test User");
      expect(res.body.data.password).toBeUndefined();

      // Verify in database
      const user = await UserModel.findById(createdUserId);
      expect(user?.fullname).toBe("Updated Test User");

      // Verify profile was also updated
      const profile = await UserProfileModel.findOne({ userId: createdUserId });
      expect(profile?.fullName).toBe("Updated Test User");
    });

    it("should update user email", async () => {
      if (!createdUserId) {
        console.warn("⚠️ Skipping: createdUserId is undefined");
        return;
      }

      const newEmail = "newemail@example.com";

      const res = await request(app)
        .put(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("email", newEmail);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newEmail);

      // Verify both user and profile have updated email
      const user = await UserModel.findById(createdUserId);
      const profile = await UserProfileModel.findOne({ userId: createdUserId });
      
      expect(user?.email).toBe(newEmail);
      expect(profile?.email).toBe(newEmail);

      // Cleanup - change email back for other tests
      await UserModel.findByIdAndUpdate(createdUserId, { email: "testuser@example.com" });
      await UserProfileModel.findOneAndUpdate(
        { userId: createdUserId },
        { email: "testuser@example.com" }
      );
    });

    it("should update user password", async () => {
      if (!createdUserId) {
        console.warn("⚠️ Skipping: createdUserId is undefined");
        return;
      }

      const res = await request(app)
        .put(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("password", "newpassword123")
        .field("confirmPassword", "newpassword123");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify password was hashed and updated
      const user = await UserModel.findById(createdUserId);
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe("newpassword123"); // Should be hashed
    });

    it("should update profile fields", async () => {
      if (!createdUserId) {
        console.warn("⚠️ Skipping: createdUserId is undefined");
        return;
      }

      const res = await request(app)
        .put(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("phoneNumber", "+9876543210")
        .field("userLocation", "Los Angeles, USA");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify profile was updated
      const profile = await UserProfileModel.findOne({ userId: createdUserId });
      expect(profile?.phoneNumber).toBe("+9876543210");
      expect(profile?.userLocation).toBe("Los Angeles, USA");
    });

    it("should return 400 for invalid user id", async () => {
      const res = await request(app)
        .put("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullname", "Test");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/admin/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullname", "Test");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("should delete user and profile", async () => {
      if (!createdUserId) {
        console.warn("⚠️ Skipping: createdUserId is undefined");
        return;
      }

      const res = await request(app)
        .delete(`/api/admin/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Debug output on failure
      if (res.status !== 200) {
        console.error("❌ Delete user failed:");
        console.error("Status:", res.status);
        console.error("Response:", JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("deleted successfully");

      // Verify user is deleted
      const deletedUser = await UserModel.findById(createdUserId);
      expect(deletedUser).toBeNull();

      // Verify profile is also deleted
      const deletedProfile = await UserProfileModel.findOne({ userId: createdUserId });
      expect(deletedProfile).toBeNull();
    });

    it("should return 400 for invalid user id", async () => {
      const res = await request(app)
        .delete("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Authorization Tests", () => {
    

   

    it("should reject requests from non-admin users", async () => {
      // Create a regular user
      await request(app)
        .post("/api/auth/register")
        .send({
          fullname: "Regular User",
          email: "regular@example.com",
          password: "password123",
          confirmPassword: "password123",
        });

      // Login as regular user
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "regular@example.com",
          password: "password123",
        });

      const regularToken = loginRes.body.token;

      // Try to access admin endpoint
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Cleanup
      await UserModel.deleteOne({ email: "regular@example.com" });
      await UserProfileModel.deleteOne({ email: "regular@example.com" });
    });
  });
});