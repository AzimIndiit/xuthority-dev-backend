const { Software, Solution, Product } = require('../models');

exports.globalSearch = async (q) => {
  const regex = new RegExp(q, 'i');
  const [softwares, solutions, products] = await Promise.all([
    Software.find({ name: regex, status: 'active'}).limit(5),
    Solution.find({ name: regex, status: 'active'}).limit(5),
    Product.find({ name: regex , isActive: 'active'}).limit(5)
  ]);
  return { softwares, solutions, products };
}; 