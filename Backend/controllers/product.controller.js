import { redis } from "../Lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../Lib/cloudinary.js";


export const getAllProducts= async (req,res)=>{
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error("Error in getAllProducts controller",error.message);
        res.send(500).json({message:error.message}, "server error");
    }
}

export const getFeaturedProducts = async (req,res)=>{
    try {
        let featuredProducts = await redis.get("featuredProducts");
        if(featuredProducts){
            return res.status(200).json(JSON.parse(featuredProducts));
        }

        featuredProducts = await Product.find({isFeatured:true}).lean();// lean() is used to convert mongoose object to plain javascript object
        // good for performance
        if(!featuredProducts){
            return res.status(404).json({message:"No featured products found"});
        }
        res.status(200).json(featuredProducts);
        await redis.set("featuredProducts",JSON.stringify(featuredProducts)); // store featured data in redis for faster access
        
        res.json(featuredProducts);
    } catch (error) {
        console.error("Error in getFeaturedProducts controller",error.message);
        res.send(500).json({message:error.message}, "server error");
    }
}

export const createProduct = async(req,res)=>{
    try {
        const {name  , description , price , image , category} = req.body;

        let cloudinaryResponse = null ;

        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image,{
                folder:"products"
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image:cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category,
        })

        res.status(201).json(product);

    } catch (error) {
        console.error("Error in createProduct controller",error.message);
        res.send(500).json({message:error.message}, "server error");
    }
}

export const deleteProduct = async(req,res)=>{
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0]; // get the public id of the image
            try {
                await cloudinary.uploader.destroy(publicId);
                console.log("Image deleted from cloudinary");
            } catch (error) {
                console.error("Error in deleting image from cloudinary",error.message);
            }            
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({message:"Product deleted successfully"});

    } catch (error) {
        console.error("Error in deleteProduct controller",error.message);
        res.send(500).json({message:error.message}, "server error");
    }
}

export const getRecommendedProducts= async (req,res)=>{
    try {
        // aggregation pipeline from moongoDb

        const products = await Product.aggregate([
            {
                $sample:{
                    size:3
                },
                
            },
            {
                $project:{
                    _id :1,
                    name:1,
                    description:1,
                    image:1,
                    price:1,
                }
            }
        ]);

        res.json({products})
        
    } catch (error) {
        console.error("Error in getRecommendedProducts controller",error.message);
        res.send(500).json({message:error.message}, "server error");
        
    }
}

export const getProductsByCategory = async(req,res)=>{
    
    const {category} = req.params;
    try {
    const products = await Product.find({category});
    res.json({products});

    } catch (error) {
        console.error("Error in getProductsByCategory controller",error.message);
        res.send(500).json({message:error.message}, "server error");
        
    }
}


export const toggleFeaturedProduct= async(req,res)=>{ 
    
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updatedFeaturedProductsCache();
            res.json(updatedProduct);
        }
        else{
            res.status(404).json({message:"Product not found"});
        }
        
    } catch (error) {
        console.error("Error in toggleFeaturedProduct controller",error.message);
        res.send(500).json({message:error.message}, "server error");
        
    }
}

async function updatedFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({isFeatured:true}).lean();
        await redis.set("featured_Products",JSON.stringify(featuredProducts));        
    } catch (error) {
        console.error("Error in updatedFeaturedProductsCache function",error.message);
        res.send(500).json({message:error.message}, "server error");       
    }
} 