const SPECIALTY_COFFEE_DRINKS = [
  'Latte',
  'Mocha Latte',
  'White Mocha Latte',
  'White Chocolate Raspberry Latte',
  'Bold Chai Latte',
  'Churro Latte',
  'Caramel Macchiato',
  'Milky Way',
  'Cappuccino',
  'Iced Coffee',
  'Americano',
];
const NON_COFFEE_DRINKS = [
  'Velvet Steamer',
  'Hot Chocolate',
  'White Hot Chocolate',
  'White Raspberry Hot Chocolate',
  'London Fog',
  'London Gardens',
  'Chai Latte',
];
const DRINKS = [...SPECIALTY_COFFEE_DRINKS, ...NON_COFFEE_DRINKS];
const SIZES = ['Small', 'Medium', 'Large'];
const MILKS = ['Whole', 'Skim', 'Oat', 'Almond', 'Soy', 'None'];
const SYRUPS = ['Vanilla', 'Caramel', 'Hazelnut', 'Cinnamon', 'Lavender', 'Coconut', 'Spiced Brown Sugar'];
const PASTRIES = ['Apple Caramel Turnover', 'Biscotti', 'Muffins'];
const TEMPERATURES = ['Hot', 'Iced'];
const STATUSES = ['pending', 'in-progress', 'completed'];
const MAX_EXTRA_SHOTS = 4;

const DRINK_DESCRIPTIONS = {
  'Latte': 'Espresso combined with steamed milk and topped with a small amount of foam.',
  'Mocha Latte': 'Espresso and steamed milk blended with rich chocolate, topped with whipped cream and chocolate drizzle.',
  'White Mocha Latte': 'Espresso and steamed milk blended with rich white chocolate, topped with whipped cream and white chocolate drizzle.',
  'White Chocolate Raspberry Latte': 'Espresso and steamed milk blended with rich white chocolate and raspberry, topped with whipped cream and white chocolate drizzle.',
  'Bold Chai Latte': 'Spiced chai tea blended with steamed milk and a shot of espresso.',
  'Churro Latte': 'Espresso and steamed milk blended with spiced brown sugar, topped with whipped cream and a dusting of cinnamon and sugar.',
  'Caramel Macchiato': 'Espresso layered with steamed milk and vanilla, finished with a rich caramel drizzle.',
  'Milky Way': 'Espresso blended with steamed milk, white and dark chocolate, topped with whipped cream and caramel drizzle.',
  'Cappuccino': 'Espresso and lightly steamed milk topped with a thick, airy layer of foam.',
  'Iced Coffee': 'Espresso poured over ice for a bold, smooth, and refreshing coffee.',
  'Americano': 'Hot water added to a double shot of espresso for a lighter, yet bold coffee.',
  'Velvet Steamer': 'Steamed milk blended with your choice of flavor.',
  'Hot Chocolate': 'Rich and creamy hot chocolate topped with whipped cream.',
  'White Hot Chocolate': 'Rich and creamy white hot chocolate, topped with whipped cream.',
  'White Raspberry Hot Chocolate': 'Rich and creamy white hot chocolate blended with raspberry, topped with whipped cream and white chocolate drizzle.',
  'London Fog': 'Earl grey tea blended with steamed milk and a touch of vanilla, creating a smooth and comforting classic.',
  'London Gardens': 'Lavender earl grey tea blended with steamed milk and a touch of vanilla, creating a smooth, floral taste.',
  'Chai Latte': 'Spiced chai tea blended with steamed milk, topped with whipped cream.',
};

const PASTRY_DESCRIPTIONS = {
  'Apple Caramel Turnover': 'Flaky, golden pastry filled with warm caramel apples.',
  'Biscotti': "Handcrafted, homemade biscotti by Terri. A simple, delicious treat that's even better with coffee.",
  'Muffins': 'An assortment of freshly baked muffins in seasonal and classic flavors — lightly sweet and perfect with a hot cup of coffee.',
};

module.exports = {
  SPECIALTY_COFFEE_DRINKS,
  NON_COFFEE_DRINKS,
  DRINKS,
  SIZES,
  MILKS,
  SYRUPS,
  PASTRIES,
  TEMPERATURES,
  STATUSES,
  MAX_EXTRA_SHOTS,
  DRINK_DESCRIPTIONS,
  PASTRY_DESCRIPTIONS,
};
