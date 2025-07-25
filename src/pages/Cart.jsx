import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/shared/Spinner';

// Components
const PaymentMethodSelector = React.lazy(() => import('../components/buyer/PaymentMethodSelector'));
const AddressForm = React.lazy(() => import('../components/buyer/AddressForm'));
const CartItemsList = React.lazy(() => import('../components/buyer/CartItemsList'));
const CartSummary = React.lazy(() => import('../components/buyer/CartSummary'));

const Cart = () => {
  const { t } = useTranslation();
  const { cart, cartTotal, loading: cartLoading, createOrder, clearCart } = useCart();
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

  // Handle address form changes specifically
  const handleAddressChange = (field, value) => {
    handleChange('address', field, value);
  };

  // Validate form
  const validateForm = () => {
    if (!cart || cart.length === 0) {
      toast.error(t('cart.empty') || 'Your cart is empty');
      return false;
    }

    const { street, city, country } = formState.address;
    if (!street?.trim() || !city?.trim() || !country?.trim()) {
      toast.error(t('checkout.addressIncomplete') || 'Please complete your shipping address');
      return false;
    }

    if (formState.paymentMethod === 'card') {
      const { cardNumber, expiry, cvv } = formState.cardDetails;
      if (!cardNumber?.trim() || !expiry?.trim() || !cvv?.trim()) {
        toast.error(t('checkout.cardIncomplete') || 'Please complete card details');
        return false;
      }
    }

    if (formState.paymentMethod === 'mobile') {
      const { provider, phone } = formState.mobileDetails;
      if (!provider?.trim() || !phone?.trim()) {
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
      const orderData = {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
          variantId: item.variantId || undefined,
          name: item.product.name,
          image: item.product.images?.[0]?.url || ''
        })),
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
        navigate("/order-success", { state: { orderId: result.orderId } });
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
        await Promise.allSettled([
          import('../components/buyer/PaymentMethodSelector'),
          import('../components/buyer/AddressForm'),
          import('../components/buyer/CartItemsList'),
          import('../components/buyer/CartSummary')
        ]);
      } catch (error) {
        console.error('Component loading error:', error);
        setComponentError(t('errors.componentLoad') || 'Some features may not work properly');
      }
    };

    loadComponents();
  }, [t]);

  if (cartLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner className="h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {t('cart.title') || 'Your Shopping Cart'}
      </h1>

      {componentError && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded mb-4">
          {componentError}
        </div>
      )}

      {cart.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded max-w-2xl">
          <p className="mb-4">{t('cart.empty') || 'Your cart is currently empty'}</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            {t('cart.continueShopping') || 'Continue Shopping'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <React.Suspense fallback={<Spinner />}>
              <CartItemsList items={cart} editable />
            </React.Suspense>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {t('checkout.shipping') || 'Shipping Information'}
              </h2>
              <React.Suspense fallback={<Spinner />}>
                <AddressForm 
                  address={formState.address} 
                  onChange={handleAddressChange} 
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

          <div className="sticky top-4 h-fit">
            <React.Suspense fallback={<Spinner />}>
              <CartSummary
                total={cartTotal}
                itemCount={cart.reduce((count, item) => count + item.quantity, 0)}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                shippingAddress={formState.address}
                paymentMethod={formState.paymentMethod}
              />
            </React.Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;