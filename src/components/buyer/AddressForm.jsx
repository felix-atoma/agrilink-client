import React from 'react';
import { useTranslation } from 'react-i18next';

const AddressForm = ({ address = {}, onChange }) => {
  const { t } = useTranslation();

  // Initialize with default empty values if address is undefined
  const formData = {
    street: address?.street || '',
    city: address?.city || '',
    country: address?.country || '',
    postalCode: address?.postalCode || '',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...formData,
      [name]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
          {t('address.street') || 'Street Address'}
        </label>
        <input
          type="text"
          id="street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            {t('address.city') || 'City'}
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            {t('address.country') || 'Country'}
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">{t('address.selectCountry') || 'Select Country'}</option>
            <option value="Ghana">Ghana</option>
            <option value="Nigeria">Nigeria</option>
            <option value="South Africa">South Africa</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
          {t('address.postalCode') || 'Postal Code'}
        </label>
        <input
          type="text"
          id="postalCode"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
};

export default AddressForm;