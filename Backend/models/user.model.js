import mongoose, { Schema } from "mongoose";
import bcrypt  from "bcryptjs";
const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please provide a username'],

    },
    email:{
        type:String,
        required:[true,'Please provide a email'],
        unique:true,
        lowercase : true,
        trim: true,

    },
    password:{
        type:String,
        required:[true,'Please provide a password'],
        minlength:[6,'Password must be at least 6 characters'],
    },
    cartItems:[
        {
            quantity:{
                type:Number,
                default:1,
            },
            product:{
                type: Schema.Types.ObjectId,
                ref: 'Product',

            }
        }
    ],
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    }

}, {timestamps: true});



// pre save hook to hash passwords
UserSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);
        next();
    } catch (error) {
        next(error);
        
    }
})

UserSchema.methods.comparePasswords = async function(password){ 
    return bcrypt.compare(password, this.password);
}
const User = mongoose.model("User", UserSchema) 

export default User;