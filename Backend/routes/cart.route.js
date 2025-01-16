import express from 'express';
import { protectRoute } from '../middleware/auth.middleware';
import { addToCart, getCartProducts, removeAllFromCart, updateQuantity } from '../controllers/cart.controller';
const router = express.Router();


router.post('/', protectRoute ,addToCart)
router.delete('/', protectRoute ,removeAllFromCart)
router.put('/:id' , protectRoute , updateQuantity)
router.get('/:id' , protectRoute , getCartProducts)


export default router;