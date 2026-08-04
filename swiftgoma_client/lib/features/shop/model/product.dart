import 'package:equatable/equatable.dart';

class Product extends Equatable {
  const Product({
    required this.id,
    required this.name,
    required this.price,
    this.description = '',
    this.sizes = const ['XS', 'S', 'M', 'L', 'XL'],
    this.colors = const ['Black', 'Grey', 'Silver', 'White'],
  });

  final String id;
  final String name;
  final double price;
  final String description;
  final List<String> sizes;
  final List<String> colors;

  @override
  List<Object?> get props => [id];

  static const String defaultDescription =
      'The perfect T-shirt for when you want to feel comfortable but still stylish. Amazing for all ocasions. Made of 100% cotton fabric in four colours. Its modern style gives a lighter look to the outfit. Perfect for the warmest days.';

  static const List<Product> samples = [
    Product(
      id: 'p1',
      name: 'Amazing T-shirt',
      price: 12,
      description: defaultDescription,
    ),
    Product(
      id: 'p2',
      name: 'Faboulous Pants',
      price: 15,
      description: defaultDescription,
    ),
    Product(
      id: 'p3',
      name: 'Spectacular Dress',
      price: 20,
      description: defaultDescription,
    ),
    Product(
      id: 'p4',
      name: 'Stunning Jacket',
      price: 18,
      description: defaultDescription,
    ),
    Product(
      id: 'p5',
      name: 'Wonderful Shoes',
      price: 18,
      description: defaultDescription,
    ),
    Product(
      id: 'p6',
      name: 'Beautiful Hat',
      price: 10,
      description: defaultDescription,
    ),
  ];
}
