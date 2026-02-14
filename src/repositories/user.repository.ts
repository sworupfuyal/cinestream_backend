import { UserModel, IUser } from "../models/user.model";
export interface IUserRepository {
    getUserByEmail(email: string): Promise<IUser | null>;
    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserById(id: string): Promise<IUser | null>;
     updateProfile(
        userId: string,
        updatedData: Partial<IUser>
      ): Promise<IUser| null>
}
export class UserRepository implements IUserRepository {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData); 
        return await user.save();
    }
    async getUserByEmail(email: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ "email": email })
        return user;
    }
   

    async getUserById(id: string): Promise<IUser | null> {
        // UserModel.findOne({ "_id": id });
        const user = await UserModel.findById(id);
        return user;
    }
     async updateProfile(
        id: string,
        updatedData: Partial<IUser>
      ): Promise<IUser | null> {
      const user = await UserModel.findByIdAndUpdate(id, updatedData, { new: true });
        return user;
      }
   

}
