import React from 'react';

export const Navbar: React.FC = () => (
  <nav className='navbar'>
    <div className='navbar-content'>
      <div className='logo'>YourCompany</div>
      <ul className='nav-links'>
        <li>
          <a href='#home'>Home</a>
        </li>
        <li>
          <a href='#products'>Products</a>
        </li>
        <li>
          <a href='#about'>About</a>
        </li>
        <li>
          <a href='#contact'>Contact</a>
        </li>
      </ul>
    </div>
  </nav>
);

export const MainContent: React.FC = () => (
  <main className='main-content'>
    <h1>Welcome to YourCompany</h1>
    <p>We offer the best products for your needs.</p>
    <div className='product-list'>
      <div className='product'>
        <h2>Product A</h2>
        <p>Description of Product A</p>
        <button>Buy Now</button>
      </div>
      <div className='product'>
        <h2>Product B</h2>
        <p>Description of Product B</p>
        <button>Buy Now</button>
      </div>
    </div>
  </main>
);

export const UserProfile: React.FC = () => (
  <aside className='user-profile'>
    <h2>User Profile</h2>
    <div className='user-info'>
      <p>
        <strong>Name:</strong> John Doe
      </p>
      <p>
        <strong>Email:</strong> john.doe@example.com
      </p>
      <p>
        <strong>Member Since:</strong> January 1, 2023
      </p>
    </div>
  </aside>
);

export const Footer: React.FC = () => (
  <footer className='footer'>
    <div className='footer-content'>
      <p>&copy; 2024 YourCompany. All rights reserved.</p>
      <ul className='footer-links'>
        <li>
          <a href='#privacy'>Privacy Policy</a>
        </li>
        <li>
          <a href='#terms'>Terms of Service</a>
        </li>
      </ul>
    </div>
  </footer>
);
