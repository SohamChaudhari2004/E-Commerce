import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {redis} from "../Lib/redis.js"

const generateTokens = async (userId)=>{    
    const accessToken = jwt.sign({userId} , process.env.ACCESS_TOKEN_SECRET, {expiresIn:"15m"});
    const refreshToken = jwt.sign({userId} , process.env.REFRESH_TOKEN_SECRET, {expiresIn:"7d"});
    return {accessToken,refreshToken}
}

const storeRefeshToken = async (userId,refreshToken)=>{
    await redis.set(`refreshToken:${userId}`,refreshToken)
    redis.expire(`refreshToken:${userId}`,refreshToken,"EX" , 1000*60*60*24*7) // expire redis refresh token in 7 days
}

const setCookies = (res,accessToken,refreshToken)=>{
    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite : "strict",// prevents CSRF attacks which is cross site request forgery
        maxAge: 1000*60*15
    })
    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite : "strict",// prevents CSRF attacks which is cross site request forgery
        maxAge: 1000*60*60*24*7 // 7 days
    })
}

export const signup = async(req,res)=>{
    const {email,password,name} = req.body;
    try {
        const userExists = await User.findOne({email})
    if(userExists){
        return res.status(400).json({error:"User already exists"})
    }            
    
    const user = await User.create({name ,email,password})

    // authenticate the user access token and refresh token
    const {accessToken,refreshToken} = await generateTokens(user._id);
    await storeRefeshToken(user._id,refreshToken);
    setCookies(res, accessToken,refreshToken);

    res.status(201).json({user:{
        _id: user._id,
        name:user.name,
        email:user.email,
        role:user.role,
    },message : "User created Successfully"})

        
    
    } catch (error) {
        res.status(500).json({error:error.message})
    }

}


export const login = async(req,res)=>{

}


export const logout = async(req,res)=>{

}