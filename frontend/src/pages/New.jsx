import React from 'react';

export default function New(){
  return (
    <div className="container" role="main" style={styles.container}>
      <h1 style={styles.heading}>New</h1>
      <p style={styles.text}>Welcome to the New page!</p>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  heading: {
    fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
    marginBottom: '1rem',
    color: '#333',
  },
  text: {
    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
    color: '#666',
    lineHeight: '1.6',
  },
};
