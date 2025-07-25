import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../utils/toast';
import { ShoppingCartIcon } from '@heroicons/react/24/solid';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { success, error } = useToast();

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  // ✅ Updated image URL logic
  const getImageUrl = () => {
    if (imageError) return 'https://res.cloudinary.com/demo/image/upload/v1699999999/placeholder.jpg';

    const imageObj = product.images?.[0];

    if (imageObj?.url?.startsWith('http')) {
      return imageObj.url;
    }

    // fallback to Cloudinary using public ID (rare case if URL not stored)
    if (imageObj?.publicId) {
      return `https://res.cloudinary.com/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload/${imageObj.publicId}`;
    }

    return 'https://res.cloudinary.com/demo/image/upload/v1699999999/placeholder.jpg';
  };

  const handleAddToCart = () => {
    try {
      if (!product?._id) {
        error(t('product.invalid') || 'Invalid product');
        return;
      }

      if (quantity < 1 || quantity > 100) {
        error(t('cart.invalid_quantity') || 'Quantity must be between 1-100');
        return;
      }

      if (product.variants?.length > 0 && !selectedVariant) {
        error(t('product.select_variant') || 'Please select a variant');
        return;
      }

      addToCart(
        {
          ...product,
          variantId: selectedVariant,
          variantName: selectedVariant,
        },
        quantity
      );

      success(t('cart.added') || 'Product added to cart');
    } catch (err) {
      error(t('cart.error') || 'Failed to add to cart');
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="relative aspect-square mb-3">
        <img
          src={getImageUrl()}
          alt={product.name}
          className="w-full h-full object-cover rounded"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>

      <div className="flex flex-col flex-grow">
        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
          {product.name}
        </h2>
        <p className="text-gray-600 mb-2 mt-1">
          ${product.price?.toFixed(2)}
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through ml-2">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </p>

        {product.variants?.length > 0 && (
          <select
            className="mb-2 w-full border rounded px-2 py-1 text-sm"
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            required
          >
            <option value="">{t('product.select_variant')}</option>
            {product.variants.map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => {
              const val = Math.min(100, Math.max(1, Number(e.target.value) || 1));
              setQuantity(val);
            }}
            className="w-16 border rounded px-2 py-1 text-center"
          />

          <button
            onClick={handleAddToCart}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
            aria-label={t('cart.add')}
            disabled={product.stock <= 0}
          >
            <ShoppingCartIcon className="w-5 h-5" />
          </button>
        </div>
        {product.stock <= 0 && (
          <p className="text-red-500 text-xs mt-1">
            {t('product.out_of_stock')}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
