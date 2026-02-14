import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { UserProfileModel } from "../../models/user.profile.model";

describe("Authentication Integration Tests", () => {
  const testUser = {
    fullname: "Test User", // must match DTO
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
    role: "user",
  };

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await UserProfileModel.deleteMany({ email: testUser.email });
  });

  // ========================= REGISTER =========================
  describe("POST /api/auth/register", () => {

    test("should register a new user and create profile", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "User Created");
      expect(response.body.data).toHaveProperty("email", testUser.email);

      // Verify user stored in User collection
      const userInDb = await UserModel.findOne({ email: testUser.email });
      expect(userInDb).not.toBeNull();

      // Verify profile created in UserProfile collection
      const profileInDb = await UserProfileModel.findOne({
        email: testUser.email,
      });
      expect(profileInDb).not.toBeNull();
    });

    test("should not register with same email", async () => {
      await request(app).post("/api/auth/register").send(testUser);

      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should fail if password mismatch", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          confirmPassword: "wrongPassword",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should not register with empty body", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({});

      expect(response.status).toBe(400);
    });

    test("should fail with invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
    });
  });

  // ========================= LOGIN =========================
  describe("POST /api/auth/login", () => {

    beforeEach(async () => {
      await UserModel.deleteMany({ email: testUser.email });
      await UserProfileModel.deleteMany({ email: testUser.email });

      await request(app).post("/api/auth/register").send(testUser);
    });

    test("should login registered user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("email", testUser.email);
    });

    test("should not login with wrong email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "wrong@email.com",
          password: "password123",
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
    });

    test("should not login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongPassword",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
    });
  });
});
