import { Product } from '../components/product-card/product-card';

export const products: Product[] = [
  {
    id: 1,
    name: 'X-Burger Clássico',
    description: 'Hambúrguer artesanal, queijo, alface, tomate e molho especial',
    price: 25.90,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
    category: 'hamburgueres'
  },
  {
    id: 2,
    name: 'X-Bacon',
    description: 'Hambúrguer artesanal, bacon crocante, queijo e molho barbecue',
    price: 29.90,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
    category: 'hamburgueres'
  },
  {
    id: 3,
    name: 'X-Salada',
    description: 'Hambúrguer, queijo, alface, tomate, cebola e maionese',
    price: 27.90,
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop',
    category: 'hamburgueres'
  },
  {
    id: 4,
    name: 'Batata Frita',
    description: 'Porção de batatas fritas crocantes',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    category: 'extras'
  },
  {
    id: 5,
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
    category: 'extras'
  },
  {
    id: 6,
    name: 'Nuggets',
    description: '10 unidades de nuggets de frango',
    price: 16.90,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop',
    category: 'extras'
  },
  {
    id: 7,
    name: 'Coca-Cola 350ml',
    description: 'Refrigerante Coca-Cola lata',
    price: 5.90,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',
    category: 'bebidas'
  },
  {
    id: 8,
    name: 'Suco Natural',
    description: 'Suco natural de laranja 500ml',
    price: 8.90,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',
    category: 'bebidas'
  },
  {
    id: 9,
    name: 'Água Mineral',
    description: 'Água mineral sem gás 500ml',
    price: 3.90,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
    category: 'bebidas'
  }
];

export const categories = [
  { id: 'hamburgueres', name: 'Hambúrgueres' },
  { id: 'extras', name: 'Extras' },
  { id: 'bebidas', name: 'Bebidas' }
];
