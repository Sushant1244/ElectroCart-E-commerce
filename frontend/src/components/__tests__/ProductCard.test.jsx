import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  it('renders name, price placeholder when missing, and image', () => {
    const p = { _id: 't1', name: 'Test Product', images: [], price: null, slug: 't1' };
    render(<ProductCard p={p} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/Rs —/)).toBeInTheDocument();
    // image alt should be present
    const img = screen.getByAltText('Test Product');
    expect(img).toBeInTheDocument();
  });
});
