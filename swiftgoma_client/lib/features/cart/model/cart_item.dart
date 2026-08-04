import 'package:equatable/equatable.dart';
import 'package:swiftgoma_client/features/shop/model/product.dart';

class CartItem extends Equatable {
  const CartItem({
    required this.product,
    required this.size,
    required this.color,
    this.quantity = 1,
  });

  final Product product;
  final String size;
  final String color;
  final int quantity;

  double get total => product.price * quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(
      product: product,
      size: size,
      color: color,
      quantity: quantity ?? this.quantity,
    );
  }

  @override
  List<Object?> get props => [product, size, color];
}
