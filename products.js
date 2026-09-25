// Seed product data for GhorerBazar.
// Swap this out for a MongoDB collection later — the shape below
// (id, title, price, oldPrice, image, badge, category, rating, stock)
// maps 1:1 onto a Mongoose Product schema.

module.exports = [
  {
    id: "p1",
    title: "Non-Stick Frying Pan (28cm)",
    price: 890,
    oldPrice: 1200,
    image: "https://images.unsplash.com/photo-1584990347449-a15d29e5bcf2?w=500&q=60",
    badge: "Best Selling",
    category: "Kitchen",
    rating: 4.6,
    stock: 24
  },
  {
    id: "p2",
    title: "Bamboo Cutting Board Set (3pc)",
    price: 650,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1594385208974-6e9b8c5da6f2?w=500&q=60",
    badge: "New Arrival",
    category: "Kitchen",
    rating: 4.8,
    stock: 40
  },
  {
    id: "p3",
    title: "Cotton Bedsheet Set (King)",
    price: 1450,
    oldPrice: 1800,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=60",
    badge: "Best Selling",
    category: "Home",
    rating: 4.5,
    stock: 15
  },
  {
    id: "p4",
    title: "LED Desk Lamp with USB Port",
    price: 990,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=60",
    badge: null,
    category: "Electronics",
    rating: 4.3,
    stock: 32
  },
  {
    id: "p5",
    title: "Stainless Steel Water Bottle 1L",
    price: 420,
    oldPrice: 550,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=60",
    badge: "New Arrival",
    category: "Home",
    rating: 4.7,
    stock: 60
  },
  {
    id: "p6",
    title: "Wall Clock - Minimal Wood",
    price: 780,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=500&q=60",
    badge: null,
    category: "Home",
    rating: 4.4,
    stock: 18
  },
  {
    id: "p7",
    title: "Wireless Earbuds - Pro Bass",
    price: 1650,
    oldPrice: 2100,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=60",
    badge: "Best Selling",
    category: "Electronics",
    rating: 4.2,
    stock: 22
  },
  {
    id: "p8",
    title: "Ceramic Coffee Mug Set (4pc)",
    price: 560,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=60",
    badge: null,
    category: "Kitchen",
    rating: 4.9,
    stock: 50
  }
];
