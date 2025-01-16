// addToCart, getCartProducts, removeAllFromCart, updateQuantity 



export const addToCart = async (req, res) => {
    try {
        const {productId } = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.product == productId);
        if(existingItem){
            existingItem.quantity = existingItem.quantity + 1;

        }
        else{
            user.cartItems.push(productId);
        }
        
        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in addToCart controller", error.message);
        res.status(500).json({ message: error.message });
        
    }
}