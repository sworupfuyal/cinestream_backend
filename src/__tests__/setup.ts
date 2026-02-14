import mongoose from "mongoose";
import { connectDatabase } from "../database/mongodb";


// before all test starts
beforeAll(async () => {
    // can connect to test database or other test engines
    await connectDatabase();
});

// after all tests are done
afterAll(async () => {
    await mongoose.connection.close();
});

