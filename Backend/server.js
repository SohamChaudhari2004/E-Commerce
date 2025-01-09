import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import { connectDB } from './Lib/db.js';


dotenv.config();
const app = express()
const PORT  = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);





app.listen(PORT,(req,res)=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
    connectDB();
})