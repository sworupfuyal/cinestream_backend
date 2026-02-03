import {connectDatabase} from '../database/mongodb';
import mongoose from "mongoose";

// before all test starts
beforeAll(async () => {
    await connectDatabase();
});

// after all tests are done
afterAll(async () => {
    await mongoose.connection.close();
});