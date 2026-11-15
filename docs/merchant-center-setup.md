# Google Merchant Center Setup Guide — Raajsi Jewels

This checklist guides the store owner through verifying and activating **Google Merchant Center** and **Free Product Listings (Surfaces across Google)** for [raajsijewels.com](https://www.raajsijewels.com).

---

## 1. Account Creation & Website Claiming
1. Sign in to [Google Merchant Center](https://merchants.google.com/) using the primary Google account associated with Raajsi Jewels.
2. Register the business:
   - **Business Name**: `Raajsi Jewels`
   - **Registered Country**: India
   - **Time Zone**: Indian Standard Time (IST / GMT+05:30)
3. Under **Settings > Business information > Website**:
   - Enter `https://www.raajsijewels.com`
   - Claim and verify using the existing HTML meta tag: `<meta name="google-site-verification" content="google2313616d507f1207" />` (already active in site head).

---

## 2. Business Information
Ensure business contact details match the website footer and `/contact`:
- **Address**: Jaipur, Rajasthan, 302001, India
- **Customer Support Phone**: `+91 98291 45129`
- **Customer Support Email**: `raajsiforms@gmail.com`

---

## 3. Shipping Settings
Navigate to **Settings > Shipping and returns > Shipping services**:
1. Add a shipping service:
   - **Service Name**: `Standard Delivery (India)`
   - **Country**: India
   - **Currency**: INR (₹)
2. **Delivery times**:
   - Order cutoff time: `17:00 IST`
   - Handling time: `1 - 3 business days` (Monday – Saturday)
   - Transit time: `3 - 7 business days` (Monday – Saturday)
3. **Shipping rates**:
   - Filter by order total:
     - Orders **₹999 and above**: `₹0.00` (Free Delivery)
     - Orders **below ₹999**: `₹99.00` (Flat Rate)

---

## 4. Return Policy Settings
Navigate to **Settings > Shipping and returns > Return policies**:
1. Add policy:
   - **Country**: India
   - **Return window**: `7 days` from the delivery date
   - **Return method**: By mail
   - **Return fees**: Free returns (customer receives prepaid pickup or return label)
   - **Return policy URL**: `https://www.raajsijewels.com/policies/returns`

---

## 5. Product Data Feed Configuration
The website automatically generates product feeds during the build step:
- **XML Feed**: `https://www.raajsijewels.com/feeds/google.xml`
- **CSV Feed**: `https://www.raajsijewels.com/feeds/google-shopping-feed.csv`

### How to Connect the Feed:
1. In Merchant Center, go to **Products > Feeds > Primary feeds > Add primary feed**.
2. **Target Country**: India
3. **Language**: English
4. **Feed Name**: `Raajsi Jewels Primary Feed`
5. **Input method**: Select **Scheduled fetch**.
6. Set the fetch URL to:
   ```
   https://www.raajsijewels.com/feeds/google.xml
   ```
7. Set fetch frequency: **Daily** at `04:00 AM IST`.
8. Attributes automatically included:
   - `id`: Unique product slug
   - `title`: Product name (<= 60 chars)
   - `description`: Clean product story / specifications
   - `link`: Absolute canonical URL (`https://www.raajsijewels.com/artworks/<slug>`)
   - `image_link`: High-res WebP image URL
   - `price`: INR formatted (e.g., `1499.00 INR`)
   - `availability`: `in_stock`
   - `condition`: `new`
   - `brand`: `Raajsi Jewels`
   - `google_product_category`: Subcategory mapping (e.g. `Apparel & Accessories > Jewelry > Earrings`)
   - `identifier_exists`: `no` (handmade artisan jewellery without GTIN/MPN)

---

## 6. Surfaces Across Google (Free Listings)
1. In Merchant Center, navigate to **Growth > Manage programs**.
2. Enable **Free product listings**.
3. Confirm that all diagnostic checks pass with green checkmarks:
   - [x] Website verified and claimed
   - [x] Shipping policy configured
   - [x] Return policy configured
   - [x] Product feed uploaded without critical errors
4. Monitor **Products > Diagnostics** weekly for any item disapproved warnings.
