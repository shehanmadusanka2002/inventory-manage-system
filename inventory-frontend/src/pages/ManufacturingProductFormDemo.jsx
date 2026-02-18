import { useState } from 'react';
import ManufacturingProductForm from '../components/ManufacturingProductForm';
import './ManufacturingProductFormDemo.css';

function ManufacturingProductFormDemo() {
  const [showForm, setShowForm] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleSubmit = (formData) => {
    console.log('Form submitted:', formData);
    setSubmittedData(formData);
    setShowForm(false);
    
    // Here you would typically send the data to your backend
    // Example: await productService.create(formData);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>Manufacturing Product Form Demo</h1>
        <p>Click the button below to open the form</p>
      </div>

      <button 
        className="demo-open-btn"
        onClick={() => setShowForm(true)}
      >
        Open Manufacturing Product Form
      </button>

      {submittedData && (
        <div className="demo-result">
          <h3>Last Submitted Data:</h3>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}

      {showForm && (
        <ManufacturingProductForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default ManufacturingProductFormDemo;
