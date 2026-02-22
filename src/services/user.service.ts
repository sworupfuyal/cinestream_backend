import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs";
import { sendEmail } from "../configs/email";
import { UserProfileRepository } from "../repositories/user.profile.respository";

let userRepository = new UserRepository();
let userProfileRepository = new UserProfileRepository();

const CLIENT_URL = process.env.CLIENT_URL as string;

export class UserService {
  async createUser(data: CreateUserDTO) {
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if (emailCheck) {
      throw new HttpError(403, "Email already in use");
    }
    const hashedPassword = await bcryptjs.hash(data.password, 10);
    data.password = hashedPassword;
    const newUser = await userRepository.createUser(data);
    return newUser;
  }

  async loginUser(data: LoginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const validPassword = await bcryptjs.compare(data.password, user.password);
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }
    const payload = {
      id: user._id,
      email: user.email,
      fullName: user.fullname,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
    return { token, user };
  }

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;

    // ✅ Updated: includes both web link and raw token for mobile app users
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #ffffff; border-radius: 12px; overflow: hidden;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1px;">🎬 CineStream</h1>
        <p style="margin: 8px 0 0; color: #aaaaaa; font-size: 13px;">Password Reset Request</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="color: #cccccc; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hi <strong style="color: #ffffff;">${user.fullname}</strong>,<br/>
          We received a request to reset your password. Choose your platform below.
        </p>

        <!-- Web -->
        <div style="background: #1a1a1a; border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid #2a2a2a;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">🌐 For Web</p>
          <p style="margin: 0 0 16px; color: #cccccc; font-size: 14px;">Click the button below to reset your password:</p>
          <a href="${resetLink}"
            style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none;
                   padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">
            Reset Password
          </a>
        </div>

        <!-- Mobile -->
        <div style="background: #1a1a1a; border-radius: 10px; padding: 20px; border: 1px solid #2a2a2a;">
          <p style="margin: 0 0 12px; font-size: 13px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">📱 For CineStream Mobile App</p>
          <p style="margin: 0 0 12px; color: #cccccc; font-size: 14px;">
            Open the app → Forgot Password → paste this token:
          </p>
          <div style="background: #0a0a0a; border: 1px dashed #3b82f6; border-radius: 8px; padding: 14px; text-align: center;">
            <p style="margin: 0 0 6px; font-size: 11px; color: #666666; letter-spacing: 1px;">YOUR RESET TOKEN</p>
            <code style="font-size: 13px; color: #60a5fa; word-break: break-all; letter-spacing: 0.5px;">${token}</code>
          </div>
          <p style="margin: 12px 0 0; font-size: 12px; color: #666666;">
            Tap and hold the token above to copy it.
          </p>
        </div>

        <!-- Expiry warning -->
        <div style="margin-top: 20px; padding: 12px 16px; background: #2a1a1a; border-left: 3px solid #ef4444; border-radius: 4px;">
          <p style="margin: 0; font-size: 13px; color: #f87171;">
            ⏱ This link and token will expire in <strong>1 hour</strong>.
          </p>
        </div>

        <p style="margin: 24px 0 0; font-size: 13px; color: #666666; line-height: 1.5;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not be changed.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 16px 24px; text-align: center; border-top: 1px solid #1a1a1a;">
        <p style="margin: 0; font-size: 12px; color: #444444;">© CineStream. All rights reserved.</p>
      </div>

    </div>
    `;

    await sendEmail(user.email, "Reset Your CineStream Password", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateProfile(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError(400, "Invalid or expired token");
    }
  }
}