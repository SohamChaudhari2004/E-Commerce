import express from 'express';
import { protectRoute,adminRoute } from '../middleware/auth.middleware.js';
import { getAllProducts, getFeaturedProducts,createProduct,deleteProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.get("/", protectRoute , adminRoute, getAllProducts);// for admin should be able to see all the products
router.get("/featured", getFeaturedProducts);// for admin should be able to see all the products
router.get("/create",protectRoute,adminRoute, createProduct);// for admin should be able to see all the products
router.delete("/:id",protectRoute,adminRoute, deleteProduct);

export default router;