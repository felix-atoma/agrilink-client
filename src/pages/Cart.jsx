import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';

// Lazy load components with error boundaries
const PaymentMethodSelector = React.lazy(() => import('../components/buyer/PaymentMethodSelector')
  .catch(() => ({ default: () => <div>Payment options unavailable</div> })));

const AddressForm = React.lazy(() => import('../components/buyer/AddressForm')
  .catch(() => ({ default: () => <div>Address form unavailable</div> })));

const CartItemsList = React.lazy(() => import('../components/buyer/CartItemsList')
  .catch(() => ({ default: () => <div>Cart items unavailable</div> })));

const CartSummary = React.lazy(() => import('../components/buyer/CartSummary')
  .catch(() => ({ default: () => <div>Order summary unavailable</div> })));

const Cart = () => {
  const { t } = useTranslation();
  const {
    cart,
    cartTotal,
    loading: cartLoading,
    createOrder,
    clearCart
  } = useCart();
  const navigate = useNavigate();

  // Form state
  const [formState, setFormState] = useState({
    address: {
      street: '',
      city: '',
      country: '',
      postalCode: ''
    },
    paymentMethod: 'cash',
    cardDetails: {
      cardNumber: '',
      expiry: '',
      cvv: ''
    },
    mobileDetails: {
      provider: '',
      phone: ''
    }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [componentError, setComponentError] = useState(null);

  // Handle form changes
  const handleChange = (section, field, value) => {
    setFormState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!cart || cart.length === 0) {
      toast.error(t('cart.empty') || 'Your cart is empty');
      return false;
    }

    const { street, city, country } = formState.address;
    if (!street || !city || !country) {
      toast.error(t('checkout.addressIncomplete') || 'Please complete your shipping address');
      return false;
    }

    if (formState.paymentMethod === 'card') {
      const { cardNumber, expiry, cvv } = formState.cardDetails;
      if (!cardNumber || !expiry || !cvv) {
        toast.error(t('checkout.cardIncomplete') || 'Please complete card details');
        return false;
      }
    }

    if (formState.paymentMethod === 'mobile') {
      const { provider, phone } = formState.mobileDetails;
      if (!provider || !phone) {
        toast.error(t('checkout.mobileIncomplete') || 'Please complete mobile payment details');
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const products = cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        variantId: item.variantId || undefined,
        name: item.product.name,
        image: item.product.image || ''
      }));

      const orderData = {
        products,
        shippingAddress: formState.address,
        paymentMethod: formState.paymentMethod,
        totalAmount: cartTotal,
        ...(formState.paymentMethod === 'card' && { 
          paymentDetails: formState.cardDetails 
        }),
        ...(formState.paymentMethod === 'mobile' && {
          paymentDetails: formState.mobileDetails
        })
      };

      const result = await createOrder(orderData);

      if (result.success) {
        toast.success(t('checkout.success') || 'Order placed successfully!');
        clearCart();
        setTimeout(() => navigate("/order-success"), 1500);
      } else {
        throw new Error(result.message || t('checkout.error') || 'Order failed');
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || t('checkout.error') || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load components with error handling
  useEffect(() => {
    const loadComponents = async () => {
      try {
        // Preload components
        await Promise.all([
          import('../components/buyer/PaymentMethodSelector'),
          import('../components/buyer/AddressForm'),
          import('../components/buyer/CartItemsList'),
          import('../components/buyer/CartSummary')
        ]);
      } catch (error) {
        console.error('Component loading error:', error);
        setComponentError('Some features may not work properly');
      }
    };

    loadComponents();
  }, []);

  if (cartLoading) return <Spinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {t('cart.title') || 'Your Shopping Cart'}
      </h1>

      {componentError && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded mb-4">
          {componentError}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded">
          <p>{t('cart.empty') || 'Your cart is currently empty'}</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t('cart.continueShopping') || 'Continue Shopping'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <React.Suspense fallback={<Spinner />}>
              <CartItemsList items={cart} />
            </React.Suspense>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {t('checkout.shipping') || 'Shipping Information'}
              </h2>
              <React.Suspense fallback={<Spinner />}>
                <AddressForm 
                  address={formState.address} 
                  onChange={(field, value) => handleChange('address', field, value)} 
                />
              </React.Suspense>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {t('checkout.payment') || 'Payment Method'}
              </h2>
              <React.Suspense fallback={<Spinner />}>
                <PaymentMethodSelector
                  method={formState.paymentMethod}
                  onMethodChange={(value) => handleChange('', 'paymentMethod', value)}
                  cardDetails={formState.cardDetails}
                  onCardChange={(field, value) => handleChange('cardDetails', field, value)}
                  mobileDetails={formState.mobileDetails}
                  onMobileChange={(field, value) => handleChange('mobileDetails', field, value)}
                />
              </React.Suspense>
            </div>
          </div>

          <div>
            <React.Suspense fallback={<Spinner />}>
              <CartSummary
                total={cartTotal}
                itemCount={cart.reduce((count, item) => count + item.quantity, 0)}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                onClearCart={clearCart}
              />
            </React.Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;