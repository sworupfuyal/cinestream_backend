import mongoose, { Document, Schema } from "mongoose";
import { UserListType } from "../types/user.list.type";

const UserListSchema: Schema = new Schema<UserListType>(
    {
        userId: { 
            type: String, 
            required: true,
            ref: 'User'
        },
        movieId: { 
            type: String, 
            required: true,
            ref: 'Movie'
        },
        listType: { 
            type: String, 
            enum: ['favorite', 'watchlater'],
            required: true 
        },
    },
    {
        timestamps: true,
    }
);

// Create compound index to ensure user can't add same movie twice to same list
UserListSchema.index({ userId: 1, movieId: 1, listType: 1 }, { unique: true });

export interface IUserList extends UserListType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const UserListModel = mongoose.model<IUserList>('UserList', UserListSchema);