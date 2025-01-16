import express from 'express';
import { protectRoute,adminRoute } from '../middleware/auth.middleware.js';
import { getAllProducts, getFeaturedProducts,toggleFeaturedProduct,getProductsByCategory,getRecommendedProducts,createProduct,deleteProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.get("/", protectRoute , adminRoute, getAllProducts);// for admin should be able to see all the products
router.get("/featured", getFeaturedProducts);// for admin should be able to see all the products
router.get("/recommendations", getRecommendedProducts);
router.get("/category/:category", getProductsByCategory);
router.post("/",protectRoute,adminRoute, createProduct);
router.patch("/:id",protectRoute,adminRoute, toggleFeaturedProduct);
router.delete("/:id",protectRoute,adminRoute, deleteProduct);

export default router;