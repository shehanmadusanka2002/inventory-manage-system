# Manufacturing Product Form Component

A clean, industrial-styled React form component for creating manufacturing items in an inventory system.

## 🎯 Features

- **Separation of Concerns**: Focuses on item definition and initial stock only (no WIP/production fields)
- **Two-Card Layout**: 
  - Card 1: Item Details (Part Number, Name, Type, UOM, Cost, etc.)
  - Card 2: Initial Stock (Optional warehouse and stock info)
- **Dynamic Fields**: 
  - Shows "Supplier" field for Raw Materials
  - Shows "Sales Price" field for Finished Goods
- **Form Validation**: Client-side validation with helpful error messages
- **Industrial Design**: Clean, professional styling with Lucide icons
- **Responsive**: Works on desktop and mobile devices

## 📦 Installation

First, install lucide-react if not already installed:

```bash
npm install lucide-react
```

## 🚀 Usage

### Basic Example

```jsx
import { useState } from 'react';
import ManufacturingProductForm from './components/ManufacturingProductForm';

function MyComponent() {
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (formData) => {
    console.log('Form data:', formData);
    // Send to backend API
    // await productService.create(formData);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <button onClick={() => setShowForm(true)}>
        Create New Item
      </button>

      {showForm && (
        <ManufacturingProductForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
```

### Demo Page

Run the demo page to see the form in action:

```jsx
import ManufacturingProductFormDemo from './pages/ManufacturingProductFormDemo';

// Add to your router
<Route path="/demo" element={<ManufacturingProductFormDemo />} />
```

## 📋 Form Data Structure

The form returns the following data structure:

```javascript
{
  // Card 1: Item Details
  partNumber: "MFG-001",           // Required
  itemName: "Steel Sheet 2mm",      // Required
  itemType: "RAW_MATERIAL",         // Required: RAW_MATERIAL | SUB_ASSEMBLY | FINISHED_GOOD
  uom: "PCS",                       // Required: PCS | KG | LBS | M | FT | L | GAL | BOX | ROLL | SHEET
  standardCost: "150.50",           // Required
  minimumStockLevel: "100",         // Required
  
  // Conditional Fields
  supplier: "ABC Metals Inc",       // Required if itemType is RAW_MATERIAL
  salesPrice: "250.00",             // Required if itemType is FINISHED_GOOD
  
  // Card 2: Initial Stock (All Optional)
  warehouse: "MAIN_WH",             // Optional
  binLocation: "A-01-05",           // Optional
  lotNumber: "LOT-2026-001",        // Optional
  quantity: "500"                   // Optional (required if warehouse is filled)
}
```

## 🎨 Customization

### Warehouse Options

Edit the warehouse dropdown in `ManufacturingProductForm.jsx`:

```jsx
<option value="YOUR_WH_CODE">Your Warehouse Name</option>
```

### UOM Options

Add or modify units of measure:

```jsx
const uomOptions = [
  'PCS', 'KG', 'LBS', 'M', 'FT', 'L', 'GAL', 'BOX', 'ROLL', 'SHEET',
  'YOUR_CUSTOM_UNIT'
];
```

### Styling

All styles are in `ManufacturingProductForm.css`. Key CSS variables you can customize:

- Primary color gradient: `.mfg-form-header` and `.btn-submit`
- Card background: `.mfg-card`
- Input borders: `input, select`

## 🔍 Validation Rules

### Required Fields (Card 1)
- Part Number (SKU)
- Item Name
- Standard Cost (must be > 0)
- Minimum Stock Level (must be >= 0)

### Conditional Required Fields
- **Raw Material**: Supplier is required
- **Finished Good**: Sales Price is required

### Initial Stock Validation
- If any stock field is filled, Warehouse and Quantity become required
- Quantity must be > 0 when provided

## 🎯 Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | function | Yes | Callback when form is submitted with valid data |
| `onCancel` | function | Yes | Callback when cancel button is clicked |

## 📱 Responsive Behavior

- **Desktop (>768px)**: Two-column form layout
- **Mobile (<768px)**: Single-column stacked layout

## ♿ Accessibility

- All form fields have proper labels
- Required fields are marked with asterisks
- Error messages are clear and descriptive
- Keyboard navigation supported
- Focus states clearly visible

## 🐛 Troubleshooting

### Icons not showing
```bash
npm install lucide-react
```

### Styling issues
Make sure `ManufacturingProductForm.css` is imported in the component.

### Form not closing
Ensure the `onCancel` callback properly updates your state to hide the form.

## 📄 License

MIT

## 👥 Author

Senior Frontend Developer - Inventory System Team
