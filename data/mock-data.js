// Тестовые данные для разработки
window.mockData = {
  products: [
    {
      id: 1,
      name: "Пицца Маргарита",
      price: 450,
      unit: "piece",
      image: null,
      category: "Пиццы",
      description: "Классическая итальянская пицца"
    },
    {
      id: 2,
      name: "Цезарь с курицей",
      price: 320,
      unit: "piece",
      image: null,
      category: "Салаты",
      description: "Салат с курицей и соусом цезарь"
    },
    {
      id: 3,
      name: "Кофе Латте",
      price: 180,
      unit: "piece",
      image: null,
      category: "Напитки",
      description: "Ароматный кофе с молоком"
    },
    {
      id: 4,
      name: "Мясо для шашлыка",
      price: 890,
      unit: "weight",
      weightUnit: "kg",
      image: null,
      category: "Мясные блюда",
      description: "Свинная шея для шашлыка"
    },
    {
      id: 5,
      name: "Картофель фри",
      price: 150,
      unit: "piece",
      image: null,
      category: "Гарниры",
      description: "Хрустящий картофель"
    }
  ],

  orders: [
    {
      id: 1,
      date: "2024-01-15T12:30:00",
      total: 1200,
      items: [
        { productId: 1, quantity: 2, price: 450 },
        { productId: 3, quantity: 1, price: 180 },
        { productId: 5, quantity: 2, price: 150 }
      ]
    },
    {
      id: 2,
      date: "2024-01-15T13:45:00",
      total: 890,
      items: [
        { productId: 4, quantity: 1, price: 890 }
      ]
    },
    {
      id: 3,
      date: "2024-01-15T14:20:00",
      total: 770,
      items: [
        { productId: 2, quantity: 1, price: 320 },
        { productId: 1, quantity: 1, price: 450 }
      ]
    }
  ],

  categories: ["Пиццы", "Салаты", "Напитки", "Мясные блюда", "Гарниры"]
};

console.log('Mock data loaded successfully');