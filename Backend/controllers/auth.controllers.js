import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../Lib/redis.js";

const generateTokens = async (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

const storeRefeshToken = async (userId, refreshToken) => {
    // Store the refresh token
    await redis.set(`refreshToken:${userId}`, refreshToken);

    // Set expiration time to 7 days (in seconds)
    await redis.expire(`refreshToken:${userId}`, 60 * 60 * 24 * 7);
};

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 15, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
};

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        const user = await User.create({ name, email, password });

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateTokens(user._id);
        await storeRefeshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "User created successfully",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email})

        if(user && (await user.comparePasswords(password) )){
            const {accessToken,refreshToken}= generateTokens(user._id)
            await storeRefeshToken(user._id, refreshToken);
            setCookies(res, accessToken, refreshToken);

            res.json({_id: user._id, name: user.name, email: user.email, role: user.role});
        }
        else{
            res.status(401).json({error: "Invalid email or password" , message: "Invalid email or password"})
        }

    } catch (error) {
        res.status(500).json({ error: error.message , message: "Server error while logging in(login controller)"});
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log("decoded")
            await redis.del(`refreshToken:${decoded.userId}`);
            console.log("deleted")
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message, message: "Server error" });
    }
};

// this will refresh the access token after 15 mins
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                error: "Unauthenticated",
                message: "No refresh token provided",
            });
        }

        let decoded;
        try {
            // Verify the refresh token
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({
                error: "Unauthenticated",
                message: "Invalid or expired refresh token",
            });
        }

        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);

        if (!storedToken || storedToken !== refreshToken) {
            return res.status(401).json({
                error: "Unauthenticated",
                message: "Invalid refresh token",
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        // Set the new access token in a cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 15, // 15 minutes
        });

        res.json({ message: "Access token refreshed" });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            message: "Server error (refresh token controller)",
        });
    }
};
