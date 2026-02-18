-- Warehouse Service Database Migration
-- Run this for warehouse_db

USE warehouse_db;

-- Add JSON column to warehouses table
ALTER TABLE warehouses
ADD COLUMN warehouse_attributes JSON NULL AFTER storage_capacity;

-- Verify column was added
DESCRIBE warehouses;
